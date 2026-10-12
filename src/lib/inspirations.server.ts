// Server-only Inspiration pipeline: Apify fetch -> private storage -> ElevenLabs transcript -> AI analysis.
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Swap actors here. */
export const INSPIRATION_ACTORS = { tiktok: "clockworks~tiktok-scraper", instagram: "apify~instagram-scraper" };
const MODEL = "openai/gpt-6-astra";
/** ElevenLabs Scribe list price, used only for the cost note. */
const STT_USD_PER_HOUR = 0.4;
const MAX_ATTEMPTS = 3;
const BUCKET = "inspirations";

export function normalise(raw: string): { url: string; key: string; platform: "tiktok" | "instagram" } | null {
  const u = raw.trim().replace(/^["']|["',;]$/g, "");
  if (!/^https?:\/\//i.test(u)) return null;
  let p: URL; try { p = new URL(u); } catch { return null; }
  const host = p.hostname.replace(/^www\.|^m\./, "");
  if (host.endsWith("tiktok.com")) {
    const id = p.pathname.match(/\/(?:video|photo)\/(\d+)/)?.[1];
    if (id) return { url: `https://www.tiktok.com${p.pathname.replace(/\/$/, "")}`, key: `tiktok:${id}`, platform: "tiktok" };
    if (host.startsWith("vm.") || host.startsWith("vt.") || p.pathname.startsWith("/t/")) return { url: `https://${host}${p.pathname}`, key: `tiktok:short:${p.pathname.replace(/\//g, "")}`, platform: "tiktok" };
    return null;
  }
  if (host.endsWith("instagram.com")) {
    const code = p.pathname.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/)?.[1];
    if (code) return { url: `https://www.instagram.com/reel/${code}/`, key: `instagram:${code}`, platform: "instagram" };
  }
  return null;
}

/** Inserts new rows (dedup on norm_key). Returns counts and the ids of every row matching the links. */
export async function enqueue(a: Admin, links: string[], appId: string | null, by: string | null, batchId: string) {
  const seen = new Map<string, { url: string; key: string; platform: string }>(); let invalid = 0;
  for (const l of links) { const n = normalise(l); if (!n) { if (l.trim()) invalid++; continue; } seen.set(n.key, n); }
  const keys = [...seen.keys()];
  if (!keys.length) return { added: 0, duplicates: 0, invalid, ids: [] as string[] };
  const existing: { id: string; norm_key: string }[] = [];
  for (let i = 0; i < keys.length; i += 200) { const { data } = await a.from("inspirations").select("id, norm_key").in("norm_key", keys.slice(i, i + 200)); existing.push(...(data ?? [])); }
  const have = new Set(existing.map((e) => e.norm_key));
  const rows = keys.filter((k) => !have.has(k)).map((k) => { const n = seen.get(k)!; return { url: n.url, norm_key: k, platform: n.platform, app_id: appId, created_by: by, batch_id: batchId, status: "queued" }; });
  const ids = existing.map((e) => e.id);
  for (let i = 0; i < rows.length; i += 200) { const { data, error } = await a.from("inspirations").insert(rows.slice(i, i + 200)).select("id"); if (error) throw new Error("The links could not be saved."); ids.push(...(data ?? []).map((d: { id: string }) => d.id)); }
  if (rows.length) await a.rpc("inspiration_queue_arm");
  return { added: rows.length, duplicates: existing.length, invalid, ids };
}

export async function apifyRun(actor: string, input: unknown) {
  const token = process.env["APIFY_TOKEN"]; if (!token) throw new Error("APIFY_TOKEN missing");
  const t0 = Date.now();
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?waitForFinish=240`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 160)}`);
  let run = (await res.json()).data;
  for (let i = 0; i < 6 && !["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status); i++) {
    const r = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?waitForFinish=60`, { headers: { Authorization: `Bearer ${token}` } }); run = (await r.json()).data;
  }
  if (run.status !== "SUCCEEDED") throw new Error(`Apify run ${run.status}`);
  const it = await fetch(`https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?clean=true`, { headers: { Authorization: `Bearer ${token}` } });
  const items = (await it.json()) as any[];
  return { items: Array.isArray(items) ? items : [], runId: run.id as string, usd: Number(run.usageTotalUsd ?? 0), ms: Date.now() - t0 };
}

const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

async function store(a: Admin, path: string, url: string, type: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", ...headers } });
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = await r.arrayBuffer();
  if (buf.byteLength > 190 * 1024 * 1024) throw new Error("video over 190 MB");
  const { error } = await a.storage.from(BUCKET).upload(path, buf, { contentType: type, upsert: true });
  if (error) throw new Error(`storage: ${error.message}`);
  return buf;
}

async function fetchStage(a: Admin, row: any) {
  const token = process.env["APIFY_TOKEN"] ?? "";
  if (row.platform === "tiktok") {
    const r = await apifyRun(INSPIRATION_ACTORS.tiktok, { postURLs: [row.url], shouldDownloadVideos: true, shouldDownloadCovers: true, resultsPerPage: 1 });
    const i = r.items.find((x) => x && x.id && !x.error);
    if (!i) throw new Error("Vidéo privée ou supprimée (TikTok).");
    const videoSrc = (i.mediaUrls ?? [])[0] ?? i.videoMeta?.downloadAddr;
    const coverSrc = i.videoMeta?.originalCoverUrl ?? i.videoMeta?.coverUrl ?? (i.covers ?? [])[0];
    return {
      meta: { author_handle: i.authorMeta?.name ?? null, caption: i.text ?? null, hashtags: (i.hashtags ?? []).map((h: any) => h.name ?? h).filter(Boolean), duration_s: num(i.videoMeta?.duration), views: num(i.playCount), likes: num(i.diggCount), comments: num(i.commentCount), shares: num(i.shareCount), posted_at: i.createTimeISO ?? null, url: i.webVideoUrl ?? row.url, kind: i.isSlideshow || (i.slideshowImageLinks ?? []).length ? "slideshow" : "video" },
      videoSrc, coverSrc, apify: r, auth: videoSrc && String(videoSrc).includes("api.apify.com") ? { Authorization: `Bearer ${token}` } : {},
    };
  }
  const r = await apifyRun(INSPIRATION_ACTORS.instagram, { directUrls: [row.url], resultsType: "posts", resultsLimit: 1, addParentData: false });
  const i = r.items.find((x) => x && (x.shortCode || x.id) && !x.error);
  if (!i) throw new Error("Vidéo privée ou supprimée (Instagram).");
  return {
    meta: { author_handle: i.ownerUsername ?? null, caption: i.caption ?? null, hashtags: i.hashtags ?? [], duration_s: num(i.videoDuration), views: num(i.videoPlayCount ?? i.videoViewCount), likes: num(i.likesCount), comments: num(i.commentsCount), shares: null, posted_at: i.timestamp ?? null, kind: i.type === "Sidecar" ? "slideshow" : "video" },
    videoSrc: i.videoUrl, coverSrc: i.displayUrl, apify: r, auth: {},
  };
}

async function transcribe(buf: ArrayBuffer) {
  const key = process.env["ELEVENLABS_API_KEY"]; if (!key) throw new Error("ElevenLabs is not connected to this project.");
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "video/mp4" }), "video.mp4");
  fd.append("model_id", "scribe_v1");
  fd.append("timestamps_granularity", "word");
  fd.append("tag_audio_events", "true");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const j = await r.json() as { text?: string; language_code?: string; words?: { text: string; start: number; end: number; type?: string }[] };
  const words = (j.words ?? []).filter((w) => w.type !== "spacing").map((w) => ({ t: w.text, s: w.start, e: w.end, ...(w.type === "audio_event" ? { ev: true } : {}) }));
  return { text: j.text ?? "", language: j.language_code ?? null, words };
}

const S = { type: "string" } as const;
const obj = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
const STYLE_ENUM = ["reaction_demo", "broll_stickers", "sole_footage", "talked_hook_demo", "educational"];
const analysisSchema = obj({
  style: { type: "string", enum: STYLE_ENUM }, style_confidence: { type: "number" },
  hook: obj({ verbatim: S, on_screen: S, visual: S }),
  hook_type: { type: "string", enum: ["question", "claim", "confession", "pov", "shock", "list", "story", "challenge", "other"] },
  structure: { type: "array", items: obj({ start_s: { type: "number" }, end_s: { type: "number" }, seen: S, said: S, on_screen: S }) },
  cta: S, on_screen_text_style: S, audio: { type: "string", enum: ["voice", "music", "voice_and_music", "none"] }, audio_note: S,
  why_it_works: { type: "array", items: S }, score: { type: "integer" },
  app_fit: { type: "string", enum: ["sophia", "unswipe", "both", "none"] }, tags: { type: "array", items: S },
  notion_format: { type: "string", enum: ["Face caméra", "POV / lifestyle", "Démo app", "Storytime", "Sketch", "Slideshow", "Montage / edit", "Voix off", "Autre"] },
});
export type InspirationAnalysis = { style: string; style_confidence: number; hook: { verbatim: string; on_screen: string; visual: string }; hook_type: string; structure: { start_s: number; end_s: number; seen: string; said: string; on_screen: string }[]; cta: string; on_screen_text_style: string; audio: string; audio_note: string; why_it_works: string[]; score: number; app_fit: string; tags: string[]; notion_format?: string };

async function analyse(input: { caption: string; transcript: string; words: { t: string; s: number }[]; duration: number | null; coverUrl: string | null; platform: string; handle: string | null; kind: string; formatGuidance?: string }) {
  const key = process.env["LOVABLE_API_KEY"]; if (!key) throw new Error("The AI key is not configured.");
  const timed = input.words.length ? input.words.reduce<string[]>((acc, w, i) => { if (i % 12 === 0) acc.push(`[${w.s.toFixed(1)}s]`); acc.push(w.t); return acc; }, []).join(" ") : input.transcript;
  const text = `Analyse this ${input.platform} ${input.kind} by @${input.handle ?? "?"} (${input.duration ?? "?"} s).
Caption: ${input.caption || "(none)"}
Transcript with timestamps: ${timed || "(no speech — no usable audio track; analyse from the cover image and caption, audio = none)"}

The 5 UGC video formats (the style JSON key holds the format): reaction_demo = Reaction into demo (face reaction plan then phone/app demo); broll_stickers = B-roll + stickers storytelling, one visual per plan, talked; sole_footage = one single plan + music + text on screen, no talking; talked_hook_demo = talked personal-story hook then app demo; educational = face cam talking, teaching. Choose the closest of these five Hub formats; carousel or other content kinds belong in kind/tags, never as additional formats.
Owner format guidance: ${input.formatGuidance ?? "Use the five definitions above."}
Apps: Sophia = 5-minute daily culture/general-knowledge courses instead of doom-scrolling. UnSwipe = keeps social apps without Reels/For You/Shorts, reduces screen time.
Hook = first 3 seconds: verbatim from the transcript (empty if no speech) + what is on screen. Structure = plans with timecodes (seconds). why_it_works = exactly 3 short lines. score = virality /10. tags = 3-6 short lowercase tags. notion_format = the separate Notion classification among the 9 listed options; never confuse it with the five Hub video formats. Write analysis text in English; keep verbatim quotes in the original language.`;
  const content: unknown[] = [{ type: "input_text", text }];
  if (input.coverUrl) content.push({ type: "input_image", image_url: input.coverUrl });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, reasoning: { effort: "low" }, store: false, stream: true, instructions: "You are a short-form video strategist. Return only the JSON.", input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "inspiration", strict: true, schema: analysisSchema } } }),
  });
  if (!res.ok || !res.body) {
    const e = new Error(res.status === 402 ? "AI credits are used up." : res.status === 403 ? "AI access is blocked for this workspace." : res.status === 429 ? "The AI is busy." : `AI error ${res.status}`) as Error & { stop?: boolean };
    e.stop = res.status === 402 || res.status === 403; throw e;
  }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let out = ""; let usage: Record<string, number> = {};
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue; const p = line.slice(5).trim(); if (!p || p === "[DONE]") continue;
      try { const ev = JSON.parse(p); if (ev.type === "response.output_text.delta") out += ev.delta ?? ""; if (ev.type === "response.completed") usage = ev.response?.usage ?? {}; if (ev.type === "response.failed" || ev.type === "error") throw new Error("The AI could not answer."); } catch (e) { if ((e as Error).message.startsWith("The AI")) throw e; }
    }
  }
  const parsed = JSON.parse(out) as InspirationAnalysis;
  return { analysis: parsed, usage: { input_tokens: usage["input_tokens"] ?? 0, output_tokens: usage["output_tokens"] ?? 0 } };
}

async function signed(a: Admin, path: string | null, secs = 3600) {
  if (!path) return null; const { data } = await a.storage.from(BUCKET).createSignedUrl(path, secs); return data?.signedUrl ?? null;
}

async function set(a: Admin, id: string, patch: Record<string, unknown>) { await a.from("inspirations").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id); }

/** Runs the missing stages of one row. `from` forces a restart at a given stage (re-run analysis). */
export async function processRow(a: Admin, id: string, from?: "analyse") {
  const { data: row } = await a.from("inspirations").select("*").eq("id", id).maybeSingle();
  if (!row) return { id, status: "missing" };
  const cost = { ...(row.cost ?? {}) } as Record<string, unknown>;
  try {
    let buf: ArrayBuffer | null = null;
    if (!row.video_path && !row.cover_path && from !== "analyse") {
      await set(a, id, { status: "fetching", error: null });
      const f = await fetchStage(a, row);
      cost["apify_usd"] = f.apify.usd; cost["apify_run_id"] = f.apify.runId; cost["apify_ms"] = f.apify.ms;
      const base = `${row.app_id ?? "all"}/${id}`;
      let cover_path: string | null = null; let video_path: string | null = null;
      if (f.coverSrc) { try { await store(a, `${base}/cover.jpg`, f.coverSrc, "image/jpeg", String(f.coverSrc).includes("api.apify.com") ? f.auth : {}); cover_path = `${base}/cover.jpg`; } catch { /* cover optional */ } }
      if (f.videoSrc) { buf = await store(a, `${base}/video.mp4`, f.videoSrc, "video/mp4", f.auth); video_path = `${base}/video.mp4`; }
      else if (f.meta.kind !== "slideshow") throw new Error("No downloadable video in the post.");
      Object.assign(row, f.meta, { cover_path, video_path });
      await set(a, id, { ...f.meta, cover_path, video_path, cost });
    }
    if (row.video_path && row.transcript == null && from !== "analyse") {
      await set(a, id, { status: "transcribing" });
      if (!buf) { const { data: blob, error } = await a.storage.from(BUCKET).download(row.video_path); if (error) throw new Error("Stored video could not be read."); buf = await blob.arrayBuffer(); }
      let t: { text: string; language: string | null; words: { t: string; s: number; e: number; ev?: boolean }[] };
      try { t = await transcribe(buf!); }
      catch (e) {
        if (!/invalid_audio|corrupt/i.test((e as Error).message)) throw e;
        // Stored file unreadable as audio: fetch a fresh copy via Apify once, else treat the reel as silent.
        try {
          const f = await fetchStage(a, row);
          if (!f.videoSrc) throw new Error("no video");
          buf = await store(a, row.video_path, f.videoSrc, "video/mp4", f.auth);
          t = await transcribe(buf);
        } catch { t = { text: "", language: null, words: [] }; row.no_audio = true; await set(a, id, { no_audio: true }); }
      }
      cost["stt_minutes"] = Math.round(((row.duration_s ?? (t.words.at(-1)?.e ?? 0)) / 60) * 100) / 100;
      cost["stt_usd"] = Math.round((Number(cost["stt_minutes"]) / 60) * STT_USD_PER_HOUR * 10000) / 10000;
      Object.assign(row, { transcript: t.text, language: t.language, words: t.words });
      await set(a, id, { transcript: t.text, language: t.language, words: t.words, cost });
    }
    await set(a, id, { status: "analysing" });
    const { data: formats } = await a.from("ugc_formats").select("key, name_en, description, structure, tips").order("sort_order");
    const r = await analyse({ formatGuidance: JSON.stringify(formats ?? []), caption: row.caption ?? "", transcript: row.transcript ?? "", words: row.words ?? [], duration: row.duration_s, coverUrl: await signed(a, row.cover_path, 600), platform: row.platform, handle: row.author_handle, kind: row.kind });
    const an = r.analysis;
    cost["ai_input_tokens"] = r.usage.input_tokens; cost["ai_output_tokens"] = r.usage.output_tokens;
    await set(a, id, {
      status: "analyzed", error: null, analysis: an, proposed_style: an.style, style_confidence: Math.max(0, Math.min(1, an.style_confidence > 1 ? an.style_confidence / 100 : an.style_confidence)),
      hook_text: [an.hook.verbatim, an.hook.on_screen].filter(Boolean).join(" — ") || an.hook.visual, hook_type: an.hook_type, score: Math.max(0, Math.min(10, Math.round(an.score))),
      app_fit: row.app_fit ?? an.app_fit, tags: row.notion_page_id ? [...new Set([...(row.tags ?? []), ...an.tags.slice(0, 6).map((t) => t.toLowerCase())])] : row.tags?.length ? row.tags : an.tags.slice(0, 6).map((t) => t.toLowerCase()), notion_format: row.notion_format ?? an.notion_format ?? null, cost,
    });
    return { id, status: "analyzed" };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 300); const attempts = (row.attempts ?? 0) + 1;
    const final = attempts >= MAX_ATTEMPTS || (e as { stop?: boolean }).stop;
    await set(a, id, { status: final ? "error" : "queued", attempts, error: msg, cost, next_try_at: new Date(Date.now() + attempts * 2 * 60_000).toISOString() });
    if ((e as { stop?: boolean }).stop) throw e;
    return { id, status: final ? "error" : "retry", error: msg };
  }
}

/** Cron tick: re-queues stuck rows, then processes up to 5 queued rows in parallel. */
export async function runInspirationTick(a: Admin) {

  const stuck = new Date(Date.now() - 12 * 60_000).toISOString();
  await a.from("inspirations").update({ status: "queued" }).in("status", ["fetching", "transcribing", "analysing"]).lt("updated_at", stuck);
  const { data: rows } = await a.from("inspirations").select("id").eq("status", "queued").lte("next_try_at", new Date().toISOString()).order("created_at").limit(5);
  if (!rows?.length) {
    const { count } = await a.from("inspirations").select("id", { count: "exact", head: true }).in("status", ["queued", "fetching", "transcribing", "analysing"]);
    if (!count) await a.rpc("inspiration_queue_disarm");
    return { processed: 0, pending: count ?? 0 };
  }
  await a.from("inspirations").update({ status: "fetching", updated_at: new Date().toISOString() }).in("id", rows.map((r: { id: string }) => r.id));
  const t0 = Date.now();
  const out = await Promise.allSettled(rows.map((r: { id: string }) => processRow(a, r.id)));
  await a.from("sync_runs").insert({ job: "inspiration", status: "done", items: rows.length, cost_usd: 0, started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(), meta: { results: out.map((o) => (o.status === "fulfilled" ? o.value : { error: String(o.reason) })) } });
  return { processed: rows.length };
}

export { signed as signedInspirationUrl, fetchStage };
