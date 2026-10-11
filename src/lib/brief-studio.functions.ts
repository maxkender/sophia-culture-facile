import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* Brief Studio AI helpers, "brief depuis une vidéo", and signed asset links. Admin-only except assetLinks (RLS-checked). */

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const MODEL = "openai/gpt-6-astra";

async function assertAdmin(ctx: { supabase: Admin; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Admins only");
  return data.id as string;
}
async function adminClient(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Streams one Responses call and returns the parsed JSON output. */
async function aiJson<T>(instructions: string, content: unknown[], name: string, schema: object): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("The AI key is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: MODEL, reasoning: { effort: "low" }, store: false, stream: true, instructions, input: [{ role: "user", content }], text: { format: { type: "json_schema", name, strict: true, schema } } }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 402) throw new Error("AI credits are used up. Add credits, then try again.");
    if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
    if (res.status === 429) throw new Error("The AI is busy. Try again in a minute.");
    throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  const reader = res.body.getReader(); const dec = new TextDecoder();
  let buf = ""; let text = "";
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim(); if (!p || p === "[DONE]") continue;
      try { const ev = JSON.parse(p); if (ev.type === "response.output_text.delta") text += ev.delta ?? ""; if (ev.type === "error" || ev.type === "response.failed") throw new Error("The AI could not answer."); } catch (e) { if ((e as Error).message.startsWith("The AI")) throw e; }
    }
  }
  try { return JSON.parse(text) as T; } catch { throw new Error("The AI reply could not be read. Try again."); }
}

const S = { type: "string" } as const;
const obj = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
const briefShape = obj({ title: S, hook_text: S, oral_hook: S, hook_visual: S, beats: { type: "array", minItems: 3, maxItems: 3, items: S }, product_second: { type: "integer" }, product_gesture: S, effort: { type: "string", enum: ["pov", "reaction", "talking_head"] }, rules_do: { type: "array", items: S }, rules_dont: { type: "array", items: S } });
type AiBrief = { title: string; hook_text: string; oral_hook: string; hook_visual: string; beats: string[]; product_second: number; product_gesture: string; effort: string; rules_do: string[]; rules_dont: string[] };

async function appContext(a: Admin, appId: string) {
  const { data } = await a.from("apps").select("slug, name, short_description").eq("id", appId).maybeSingle();
  const unswipe = data?.slug === "unswipe";
  return {
    name: data?.name ?? "Sophia",
    about: unswipe
      ? "UnSwipe keeps Instagram, TikTok, X and YouTube without the part that keeps you there: no Reels, no For You, no Shorts, no infinite feed. Gestures: show the bottom bar without Reels, the end-of-feed screen, the screen-time curve dropping."
      : "Sophia is a culture-in-5-minutes-a-day app: short courses instead of doom-scrolling. Gestures: scroll a course, open the app, quiz, streak. Never invent facts.",
  };
}
const RULES = `Rules for every script: the hook starts mid-action (no greeting); one single fact or mechanic; a turn ("mais", "sauf que", "en fait") before 15 s; short spoken sentences; under 110 words across the 3 beats; the app name said exactly once, in beat 3; the ending loops back or asks a question. Beats are: 0-3 s hook, 3-20 s the fact/mechanic with the turn, 20-30 s payoff + app + ending. hook_text is written on frame 1, 5 words max.`;

const studioInput = z.object({
  mode: z.enum(["hooks", "shorter", "casual", "quick", "translate"]),
  appId: z.string().uuid(),
  idea: z.string().max(4000).optional(),
  formatId: z.string().uuid().nullable().optional(),
  brief: z.record(z.string(), z.unknown()).optional(),
});

/** Studio AI buttons: Suggest 3 hooks, Rewrite shorter / more casual, Brief rapide, Translate to EN. */
export const studioAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => studioInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const app = await appContext(a, data.appId);
    const b = data.brief ?? {};
    let fmt = "";
    if (data.formatId) {
      const { data: f } = await a.from("briefs").select("title, hook_text, oral_hook, beats, product_moment, effort").eq("id", data.formatId).maybeSingle();
      if (f) fmt = `Format to follow: ${f.title} — hook "${f.hook_text}" / oral "${f.oral_hook}" / beats ${(f.beats ?? []).join(" | ")} / product moment ${f.product_moment} / effort ${f.effort}`;
    }
    const base = `You write short-form UGC video briefs (TikTok, Reels, Shorts) for ${app.name}. ${app.about} ${RULES}`;
    const current = JSON.stringify({ hook_text: b["hook_text"], oral_hook: b["oral_hook"], hook_visual: b["hook_visual"], beats: b["beats"], title: b["title"] });
    if (data.mode === "hooks") {
      const r = await aiJson<{ hook_text: string; oral_hook: string; hook_visual: string }>(`${base} Write in French.`, [{ type: "input_text", text: `Suggest one strong hook set (on screen, oral first sentence, what we see on frame 1) for this brief.\n${fmt}\nBrief: ${current}\nIdea: ${data.idea ?? ""}` }], "hooks", obj({ hook_text: S, oral_hook: S, hook_visual: S }));
      return { patch: r };
    }
    if (data.mode === "shorter" || data.mode === "casual") {
      const how = data.mode === "shorter" ? "Rewrite the 3 beats shorter (target 80-100 words in total), keep the same fact and turn." : "Rewrite the 3 beats more casual, like an 18-25 year old talking to a friend, same fact and turn, under 110 words.";
      const r = await aiJson<{ beats: string[] }>(`${base} Write in French.`, [{ type: "input_text", text: `${how}\nBrief: ${current}` }], "beats", obj({ beats: { type: "array", minItems: 3, maxItems: 3, items: S } }));
      return { patch: r };
    }
    if (data.mode === "translate") {
      const r = await aiJson<{ title: string; hook_text: string; oral_hook: string; hook_visual: string; beats: string[]; rules_do: string[]; rules_dont: string[]; rules_text: string }>(
        "Translate this short-form video brief from French to natural, casual English for creators. Keep app names. Keep the hook on screen 5 words max.",
        [{ type: "input_text", text: JSON.stringify({ ...JSON.parse(current), rules_do: b["rules_do"], rules_dont: b["rules_dont"], rules_text: b["rules_text"] ?? "" }) }],
        "translation", obj({ title: S, hook_text: S, oral_hook: S, hook_visual: S, beats: { type: "array", minItems: 3, maxItems: 3, items: S }, rules_do: { type: "array", items: S }, rules_dont: { type: "array", items: S }, rules_text: S }),
      );
      return { patch: r };
    }
    let facts = "";
    if (app.name === "Sophia" && data.idea) {
      const q = data.idea.replace(/[%,()]/g, " ").split(/\s+/).filter((w) => w.length > 4).slice(0, 3);
      if (q.length) {
        const { data: c } = await a.from("courses").select("title, did_you_know").or(q.map((w) => `title.ilike.%${w}%`).join(",")).limit(2);
        facts = (c ?? []).map((x: { title: string; did_you_know: unknown }) => `Course: ${x.title} ${JSON.stringify(x.did_you_know ?? "")}`).join("\n");
      }
    }
    const r = await aiJson<AiBrief>(`${base} Write in French. Fill the whole brief.`, [{ type: "input_text", text: `Le fait / l'idée: ${data.idea ?? ""}\n${fmt}\n${facts}` }], "brief", briefShape);
    return { patch: r };
  });

const analysisShape = obj({
  hook_oral_verbatim: S, hook_text: S, hook_visual: S, promise: S, turn: S, turn_second: { type: "integer" },
  beats_with_timestamps: { type: "array", items: S }, duration_format_rhythm: S, product_appearance: S, ending: S, why_it_works: S,
  score: { type: "integer" }, title: S,
  adapted: { type: "array", minItems: 1, maxItems: 3, items: briefShape },
});
type Analysis = { hook_oral_verbatim: string; hook_text: string; hook_visual: string; promise: string; turn: string; turn_second: number; beats_with_timestamps: string[]; duration_format_rhythm: string; product_appearance: string; ending: string; why_it_works: string; score: number; title: string; adapted: AiBrief[] };

/** "Brief depuis une vidéo": analyses a link (oEmbed caption + thumbnail) or uploaded frames, saves it as a reference with its grid, drafts 1-3 adapted briefs. */
export const briefFromVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    appId: z.string().uuid(),
    url: z.string().url().max(500).nullable().optional(),
    frames: z.array(z.string().max(400_000)).max(6).optional(),
    caption: z.string().max(2000).optional(),
    storagePath: z.string().max(300).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context as never);
    const a = await adminClient();
    const app = await appContext(a, data.appId);
    const content: unknown[] = [];
    let thumb: string | null = null; let caption = data.caption ?? "";
    if (data.url) {
      if (/tiktok\.com\//.test(data.url)) {
        try {
          const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(data.url)}`, { signal: AbortSignal.timeout(8000) });
          if (r.ok) { const j = await r.json() as { thumbnail_url?: string; title?: string; author_name?: string }; thumb = j.thumbnail_url ?? null; caption = `${j.author_name ?? ""}: ${j.title ?? ""}`; }
        } catch { /* no oEmbed */ }
      }
      if (thumb) content.push({ type: "input_image", image_url: thumb });
    }
    for (const f of data.frames ?? []) if (f.startsWith("data:image/")) content.push({ type: "input_image", image_url: f });
    if (!content.length && !caption) throw new Error("This video could not be read. Upload the file instead.");
    content.unshift({ type: "input_text", text: `Analyse this short-form video${data.url ? ` (${data.url})` : ""}. Caption/author: ${caption || "unknown"}. ${data.frames?.length ? "Images are frames in order." : "The image is the cover frame."} Where audio is not available, infer carefully from frames and caption, and say "(déduit)" for guessed verbatim. Fill the 10-line grid in French, give a /10 score for how well it would work for ${app.name}, then write 1 to 3 adapted briefs keeping the structure but using a ${app.name} fact or mechanic with new hooks.` });
    const r = await aiJson<Analysis>(`You are a short-form video strategist. ${app.about} ${RULES}`, content, "analysis", analysisShape);
    const { adapted, score, title, ...grid } = r;
    const platform = data.url?.includes("instagram") ? "instagram" : "tiktok";
    const { data: ref, error } = await a.from("reference_videos").insert({
      url: data.url ?? `upload:${data.storagePath ?? "file"}`, platform, app_id: data.appId, title, thumbnail_url: thumb,
      why_it_works: grid.why_it_works, format_notes: grid.duration_format_rhythm, analysis: grid, score: Math.max(0, Math.min(10, score)), active: true,
    }).select("id").single();
    if (error) throw new Error("The reference could not be saved.");
    const rows = adapted.slice(0, 3).map((x) => ({
      title: x.title, hook_text: x.hook_text, hook: x.hook_text, hooks: [x.hook_text], oral_hook: x.oral_hook, hook_visual: x.hook_visual, beats: x.beats,
      product_second: Math.min(15, Math.max(3, x.product_second)), product_gesture: x.product_gesture, effort: x.effort, format: x.effort,
      rules_do: x.rules_do, rules_dont: x.rules_dont, body: [x.hook_text, x.oral_hook, ...x.beats].join("\n\n"), script: x.beats.join("\n"),
      status: "draft", app_id: data.appId, brief_type: "precise", platform: "both", created_by: me, source_reference_id: ref.id, reference_video_ids: [ref.id],
    }));
    const { data: made } = await a.from("briefs").insert(rows).select("id");
    return { referenceId: ref.id as string, score, grid, briefIds: (made ?? []).map((m: { id: string }) => m.id) };
  });

/** Signed download links for assets the caller can see (RLS decides: admin = all, creator = own apps' ready assets). */
export const assetLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: Admin };
    const { data: visible } = await ctx.supabase.from("assets").select("id, storage_path, title, mime").in("id", data.ids);
    const a = await adminClient();
    const out: Record<string, string> = {};
    for (const v of visible ?? []) {
      if (!v.storage_path) continue;
      const name = `${String(v.title).replace(/[^\w\- ]+/g, "").trim() || "fichier"}${v.storage_path.match(/\.[a-z0-9]+$/i)?.[0] ?? ""}`;
      const { data: s } = await a.storage.from("creator-assets").createSignedUrl(v.storage_path, 3600, { download: name });
      if (s?.signedUrl) out[v.id] = s.signedUrl;
    }
    return { urls: out };
  });

/** Signed upload slot for the admin asset library (files up to 200 MB go straight to storage). */
export const assetUploadSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appId: z.string().uuid(), name: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const ext = data.name.match(/\.[a-z0-9]{1,6}$/i)?.[0]?.toLowerCase() ?? "";
    const path = `${data.appId}/${crypto.randomUUID()}${ext}`;
    const { data: slot, error } = await a.storage.from("creator-assets").createSignedUploadUrl(path);
    if (error || !slot) throw new Error("Upload could not start.");
    return { path, token: slot.token as string };
  });
