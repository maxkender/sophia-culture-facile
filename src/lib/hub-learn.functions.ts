import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const MODEL = "openai/gpt-6-astra";

const briefSchema = {
  type: "object", additionalProperties: false, required: ["briefs"],
  properties: {
    briefs: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "hooks", "angle", "script", "must_mention", "format", "duration_target", "difficulty"],
        properties: {
          title: { type: "string" },
          hooks: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
          angle: { type: "string" },
          script: { type: "string" },
          must_mention: { type: "string" },
          format: { type: "string", enum: ["talking_head", "pov", "reaction"] },
          duration_target: { type: "integer" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
      },
    },
  },
} as const;

/** "Generate from courses": drafts 3 briefs per course (status draft). Admin only, bounded to 10 courses per click. */
export const generateBriefsFromCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ count: z.number().int().min(1).max(20), appId: z.string().uuid(), language: z.enum(["fr", "en"]).default("fr") }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: Admin; userId: string };
    const { data: me } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Admins only");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The AI key is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const a = supabaseAdmin as Admin;
    const { data: used } = await a.from("briefs").select("source_course_id").not("source_course_id", "is", null);
    const usedIds = new Set((used ?? []).map((r: { source_course_id: string }) => r.source_course_id));
    const { data: courses } = await a.from("courses").select("id, title, subtitle, subject_area, did_you_know").in("status", ["published", "accepted"]).order("published_at", { ascending: false, nullsFirst: false }).limit(200);
    const pick = (courses ?? []).filter((c: { id: string }) => !usedIds.has(c.id)).slice(0, data.count);
    let created = 0;
    const errors: string[] = [];
    for (const c of pick) {
      const { data: screens } = await a.from("screens").select("screen_number, screen_title, body").eq("course_id", c.id).order("screen_number");
      const text = (screens ?? []).map((s: { screen_title: string | null; body: string | null }) => `## ${s.screen_title ?? ""}\n${s.body ?? ""}`).join("\n\n").slice(0, 8000);
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          reasoning: { effort: "low" },
          instructions: `You write short-form video briefs (TikTok/Instagram Reels) for UGC creators promoting Sophia, a culture-in-5-minutes-a-day app that helps people learn instead of doom-scrolling. Write in ${data.language === "fr" ? "French" : "English"}. Each brief turns one surprising fact from the course into a 20-45 second video. Hooks must stop the scroll in under 2 seconds. The script is spoken, casual, first person, 25-40 seconds (70-110 words), and ends by mentioning Sophia naturally. Formats: talking_head (face-cam), pov (POV screen), reaction. Never invent facts that are not in the course.`,
          input: `Course: ${c.title}${c.subtitle ? ` — ${c.subtitle}` : ""}\nSubject: ${c.subject_area ?? ""}\n\n${text}\n\nWrite exactly 3 different briefs.`,
          text: { format: { type: "json_schema", name: "briefs", strict: true, schema: briefSchema } },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 402) { errors.push("AI credits are used up. Add credits, then try again."); break; }
        if (res.status === 403) { errors.push("AI access is blocked for this workspace."); break; }
        if (res.status === 429) { errors.push("The AI is busy. Try again in a minute."); break; }
        errors.push(`${c.title}: AI error ${res.status} ${body.slice(0, 120)}`);
        continue;
      }
      const out = await res.json() as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
      const raw = out.output_text ?? out.output?.flatMap((o) => o.content ?? []).find((x) => x.type === "output_text")?.text ?? "";
      let parsed: { briefs: { title: string; hooks: string[]; angle: string; script: string; must_mention: string; format: string; duration_target: number; difficulty: string }[] };
      try { parsed = JSON.parse(raw); } catch { errors.push(`${c.title}: the AI reply could not be read`); continue; }
      for (const b of parsed.briefs) {
        const { error } = await a.from("briefs").insert({
          title: b.title, hook: b.hooks[0], hooks: b.hooks, angle: b.angle, script: b.script, body: b.script, must_mention: data.language === "fr" ? "Montre l'app à 5 s, dis le nom Sophia" : b.must_mention,
          format: b.format, duration_target: `${b.duration_target}s`, difficulty: b.difficulty === "hard" ? 3 : b.difficulty === "medium" ? 2 : 1, status: "draft", app_id: data.appId,
          source_course_id: c.id, created_by: me.id, brief_type: "precise", platform: "both",
        });
        if (error) errors.push(`${c.title}: ${error.message}`); else created++;
      }
    }
    return { courses: pick.length, created, errors };
  });

const variantSchema = {
  type: "object", additionalProperties: false, required: ["variants"],
  properties: {
    variants: {
      type: "array", minItems: 5, maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "hook_text", "oral_hook", "beats", "script"],
        properties: {
          title: { type: "string" }, hook_text: { type: "string" }, oral_hook: { type: "string" },
          beats: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } }, script: { type: "string" },
        },
      },
    },
  },
} as const;

/** "Générer 5 variantes": 5 ready-to-shoot draft briefs from one format (Sophia plugs real course facts; other apps vary number/situation/objection). */
export const generateFormatVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ formatId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: Admin; userId: string };
    const { data: me } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Admins only");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The AI key is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const a = supabaseAdmin as Admin;
    const { data: f } = await a.from("briefs").select("*, apps(slug, name, short_description)").eq("id", data.formatId).eq("brief_type", "format").maybeSingle();
    if (!f) throw new Error("Format not found");
    const isSophia = f.apps?.slug === "sophia";
    let facts = "";
    if (isSophia) {
      const { data: bank } = await a.from("briefs").select("title, script, body").eq("app_id", f.app_id).neq("brief_type", "format").not("source_course_id", "is", null).limit(200);
      const pick = (bank ?? []).sort(() => Math.random() - 0.5).slice(0, 5);
      facts = pick.map((b: { title: string; script: string | null; body: string | null }, i: number) => `Fact ${i + 1} — ${b.title}: ${(b.script ?? b.body ?? "").slice(0, 600)}`).join("\n\n");
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL, reasoning: { effort: "low" }, store: false,
        instructions: `You write ready-to-shoot short-form video variants (TikTok/Reels) in French for UGC creators promoting ${f.apps?.name} (${f.apps?.short_description ?? ""}). Keep the format's mechanic exactly: same structure, same 3 beats, same product moment. ${isSophia ? "Each variant plugs in exactly one of the given course facts (one fact per variant, never invent facts)." : "Each variant changes the number, the situation or the objection, keeping it believable and personal."} The hook_text is what is written on frame 1 (max 8 words). The script is spoken, casual, first person, 15-35 seconds.`,
        input: `Format: ${f.title}\nHook écrit: ${f.hook_text ?? ""}\nHook oral: ${f.oral_hook ?? ""}\nBeats: ${(f.beats ?? []).join(" / ")}\nProduct moment: ${f.product_moment ?? ""}\nVariations: ${f.variations ?? ""}\n\n${facts ? `Course facts:\n${facts}\n\n` : ""}Write exactly 5 different variants.`,
        text: { format: { type: "json_schema", name: "variants", strict: true, schema: variantSchema } },
      }),
    });
    if (!res.ok) {
      if (res.status === 402) throw new Error("AI credits are used up. Add credits, then try again.");
      if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
      if (res.status === 429) throw new Error("The AI is busy. Try again in a minute.");
      throw new Error(`AI error ${res.status}`);
    }
    const out = await res.json() as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
    const raw = out.output_text ?? out.output?.flatMap((o) => o.content ?? []).find((x) => x.type === "output_text")?.text ?? "";
    let parsed: { variants: { title: string; hook_text: string; oral_hook: string; beats: string[]; script: string }[] };
    try { parsed = JSON.parse(raw); } catch { throw new Error("The AI reply could not be read. Try again."); }
    const rows = parsed.variants.map((v) => ({
      title: `${f.title} — ${v.title}`, hook: v.hook_text, hooks: [v.hook_text], hook_text: v.hook_text, oral_hook: v.oral_hook, beats: v.beats,
      script: v.script, body: v.script, product_moment: f.product_moment, effort: f.effort, format: f.effort, status: "draft", app_id: f.app_id,
      parent_format_id: f.id, created_by: me.id, brief_type: "precise", platform: f.platform ?? "both",
    }));
    const { error } = await a.from("briefs").insert(rows);
    if (error) throw new Error("The variants could not be saved.");
    return { created: rows.length };
  });
