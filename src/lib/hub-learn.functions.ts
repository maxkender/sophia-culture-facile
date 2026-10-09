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
          format: { type: "string", enum: ["talking_head", "voiceover", "pov", "skit", "green_screen", "list"] },
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
  .inputValidator((d: unknown) => z.object({ count: z.number().int().min(1).max(10), appId: z.string().uuid(), language: z.enum(["fr", "en"]).default("fr") }).parse(d))
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
          instructions: `You write short-form video briefs (TikTok/Instagram Reels) for UGC creators promoting Sophia, a culture-in-5-minutes-a-day app that helps people learn instead of doom-scrolling. Write in ${data.language === "fr" ? "French" : "English"}. Each brief turns one surprising fact from the course into a 20-45 second video. Hooks must stop the scroll in under 2 seconds. The script is spoken, casual, first person, and ends by mentioning Sophia naturally. Never invent facts that are not in the course.`,
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
          title: b.title, hook: b.hooks[0], hooks: b.hooks, angle: b.angle, script: b.script, body: b.script, must_mention: b.must_mention,
          format: b.format, duration_target: `${b.duration_target}s`, difficulty: b.difficulty === "hard" ? 3 : b.difficulty === "medium" ? 2 : 1, status: "draft", app_id: data.appId,
          source_course_id: c.id, created_by: me.id, brief_type: "precise", platform: "both",
        });
        if (error) errors.push(`${c.title}: ${error.message}`); else created++;
      }
    }
    return { courses: pick.length, created, errors };
  });
