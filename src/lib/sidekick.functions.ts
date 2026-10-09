import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const MODEL = "openai/gpt-6-astra";
const SOPHIA = "00000000-0000-4000-8000-000000000001";

export type Cited = { name: string; kind: "creator" | "applicant" | "prospect" };

const filters = {
  type: "object", additionalProperties: false,
  required: ["kind", "country", "platform", "niche", "status", "tier", "min_followers", "max_followers"],
  properties: {
    kind: { type: "string", enum: ["creator", "applicant", "prospect"] },
    country: { type: ["string", "null"], description: "ISO-2 code, e.g. FR" },
    platform: { type: ["string", "null"], enum: ["tiktok", "instagram", null] },
    niche: { type: ["string", "null"] },
    status: { type: ["string", "null"] },
    tier: { type: ["string", "null"], enum: ["trial", "active", "pro", null] },
    min_followers: { type: ["integer", "null"] },
    max_followers: { type: ["integer", "null"] },
  },
};
const rangeP = { type: "object", additionalProperties: false, required: ["days"], properties: { days: { type: "integer", description: "Look-back window in days, e.g. 7 for this week" } } };
const fn = (name: string, description: string, parameters: object) => ({ type: "function", name, description, parameters, strict: true });
const TOOLS = [
  fn("count_people", "Count creators, applicants or prospects matching filters.", filters),
  fn("list_people", "List up to 20 creators, applicants or prospects matching filters.", { ...filters, required: [...filters.required, "limit"], properties: { ...filters.properties, limit: { type: "integer" } } }),
  fn("campaign_stats", "Campaigns, jobs and applicant counts.", { type: "object", additionalProperties: false, required: [], properties: {} }),
  fn("post_stats", "Posts and views over the last N days.", rangeP),
  fn("top_posts", "Best posts by views over the last N days, with creator names.", { type: "object", additionalProperties: false, required: ["days", "limit"], properties: { days: { type: "integer" }, limit: { type: "integer" } } }),
  fn("payout_summary", "What is owed / paid for a month (YYYY-MM).", { type: "object", additionalProperties: false, required: ["month"], properties: { month: { type: "string" } } }),
  fn("funnel", "Creator funnel: signed up, account created, first post, 10 posts, active tier.", { type: "object", additionalProperties: false, required: [], properties: {} }),
  fn("find_briefs", "Search existing briefs by words in title, hook or script.", { type: "object", additionalProperties: false, required: ["query"], properties: { query: { type: "string" } } }),
  fn("draft_brief", "Return a draft brief for a topic. Not saved. Call this when asked to draft a brief, then write the brief yourself in the answer as JSON in a ```brief block with keys title, hooks (3), angle, script, must_mention, format, duration_target.", { type: "object", additionalProperties: false, required: ["topic"], properties: { topic: { type: "string" } } }),
  fn("create_fast_lane", "Create a pre-validated creator record and return their personal one-time fast-lane link. Only call when the admin explicitly asks to create a fast-lane link. Pay fields are optional overrides; null keeps the tier value. Never invent an email: ask for it if missing.", { type: "object", additionalProperties: false, required: ["first_name", "email", "handle", "country", "source", "tier", "per_post", "rpm", "cap", "posts_per_month"], properties: { first_name: { type: "string" }, email: { type: "string" }, handle: { type: ["string", "null"] }, country: { type: ["string", "null"] }, source: { type: ["string", "null"], enum: ["va", "dm", "sideshift", "upwork", "referral", "other", null] }, tier: { type: ["string", "null"], enum: ["trial", "active", "pro", null] }, per_post: { type: ["number", "null"] }, rpm: { type: ["number", "null"] }, cap: { type: ["number", "null"] }, posts_per_month: { type: ["integer", "null"] } } }),
  fn("draft_message", "Get the saved DM/email/reply templates to base a message on. Then write the message yourself.", { type: "object", additionalProperties: false, required: ["kind", "name", "context"], properties: { kind: { type: "string", enum: ["dm", "email", "reply"] }, name: { type: "string" }, context: { type: "string" } } }),
];

type F = { kind: "creator" | "applicant" | "prospect"; country: string | null; platform: string | null; niche: string | null; status: string | null; tier: string | null; min_followers: number | null; max_followers: number | null; limit?: number };

async function people(a: Admin, app: string, f: F, limit: number) {
  if (f.kind === "creator") {
    const { data: ids } = await a.from("creator_apps").select("creator_id").eq("app_id", app);
    let q = a.from("creators").select("id, full_name, country, tier, ugc_status, status, tiktok_handle, instagram_handle, track", { count: "exact" }).in("id", (ids ?? []).map((r: any) => r.creator_id)).not("email", "ilike", "%test%");
    if (f.country) q = q.ilike("country", f.country);
    if (f.tier) q = q.eq("tier", f.tier);
    if (f.status) q = q.or(`status.eq.${f.status.replace(/[^a-z_]/gi, "")},ugc_status.eq.${f.status.replace(/[^a-z_]/gi, "")}`);
    if (f.platform === "tiktok") q = q.not("tiktok_handle", "is", null);
    if (f.platform === "instagram") q = q.not("instagram_handle", "is", null);
    const { data, count } = await q.limit(limit);
    return { count: count ?? 0, rows: (data ?? []).map((c: any) => ({ name: c.full_name, country: c.country, tier: c.tier, status: c.ugc_status ?? c.status, tiktok: c.tiktok_handle, instagram: c.instagram_handle })) };
  }
  if (f.kind === "applicant") {
    let q = a.from("creator_applications").select("id, full_name, country, status, tiktok_url, instagram_url, created_at", { count: "exact" }).eq("app_id", app).not("email", "ilike", "%test%");
    if (f.country) q = q.ilike("country", f.country);
    if (f.status) q = q.eq("status", f.status);
    if (f.platform === "tiktok") q = q.not("tiktok_url", "is", null);
    if (f.platform === "instagram") q = q.not("instagram_url", "is", null);
    const { data, count } = await q.order("created_at", { ascending: false }).limit(limit);
    return { count: count ?? 0, rows: (data ?? []).map((c: any) => ({ name: c.full_name, country: c.country, status: c.status, applied: String(c.created_at).slice(0, 10) })) };
  }
  let q = a.from("creator_prospects").select("id, name, country, platform, niche, status, followers", { count: "exact" }).or(`target_app_id.eq.${app},target_app_id.is.null`);
  if (f.country) q = q.ilike("country", f.country);
  if (f.platform) q = q.eq("platform", f.platform);
  if (f.niche) q = q.ilike("niche", `%${f.niche}%`);
  if (f.status) q = q.eq("status", f.status);
  if (f.min_followers != null) q = q.gte("followers", f.min_followers);
  if (f.max_followers != null) q = q.lte("followers", f.max_followers);
  const { data, count } = await q.order("followers", { ascending: false, nullsFirst: false }).limit(limit);
  return { count: count ?? 0, rows: (data ?? []).map((c: any) => ({ name: c.name, country: c.country, platform: c.platform, niche: c.niche, status: c.status, followers: c.followers })) };
}

async function runTool(a: Admin, app: string, name: string, args: any, cited: Cited[]) {
  const since = (days: number) => new Date(Date.now() - Math.max(1, Math.min(365, days)) * 86400_000).toISOString().slice(0, 10);
  switch (name) {
    case "create_fast_lane": {
      const email = String(args.email ?? "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "A valid email is needed." };
      const tierName = ["trial", "active", "pro"].includes(args.tier) ? args.tier : "trial";
      const { data: t } = await a.from("ugc_tiers").select("per_post, cpm, cap_per_post").eq("app_id", app).eq("tier", tierName).maybeSingle();
      const { data: job } = await a.from("jobs").select("id").eq("app_id", app).eq("status", "active").order("open", { ascending: false }).limit(1).maybeSingle();
      const h = (await import("@tanstack/react-start/server")).getRequest()?.headers;
      const origin = h?.get("origin") ?? "https://sophia-culture.com";
      const { createFastLaneOne, defaultLanguage } = await import("./fast-lane.server");
      const r = await createFastLaneOne(a, { firstName: String(args.first_name ?? "").slice(0, 80) || "Creator", email, tiktok: args.handle ?? null, country: args.country ?? null, language: defaultLanguage(args.country), source: args.source ?? "other" },
        { tier: tierName, perPost: args.per_post ?? (t ? Number(t.per_post) : null), rpm: args.rpm ?? (t ? Number(t.cpm) : null), cap: args.cap ?? (t ? Number(t.cap_per_post) : null), postsPerMonth: args.posts_per_month ?? 20, platforms: "both", fixedMonthly: null, welcomeBonus: null }, app, job?.id ?? null, origin);
      cited.push({ name: r.name, kind: "creator", id: r.creatorId } as never);
      return { created: true, name: r.name, email: r.email, link: r.link, note: "No email was sent." };
    }
    case "count_people": return { count: (await people(a, app, args, 1)).count };
    case "list_people": {
      const r = await people(a, app, args, Math.max(1, Math.min(20, args.limit ?? 10)));
      for (const p of r.rows) if (p.name) cited.push({ name: p.name, kind: args.kind });
      return r;
    }
    case "campaign_stats": {
      const [c, j, ja] = await Promise.all([
        a.from("campaigns").select("name, status, monthly_budget").eq("app_id", app),
        a.from("jobs").select("id, title, status, open").eq("app_id", app),
        a.from("job_applications").select("status, jobs!inner(app_id)").eq("jobs.app_id", app),
      ]);
      const by: Record<string, number> = {}; for (const x of ja.data ?? []) by[x.status] = (by[x.status] ?? 0) + 1;
      return { campaigns: c.data ?? [], jobs: j.data ?? [], applications_by_status: by };
    }
    case "post_stats": {
      const { data } = await a.from("creator_posts").select("status, views, platform").eq("app_id", app).gte("posted_on", since(args.days));
      const rows = data ?? []; const by: Record<string, number> = {};
      for (const p of rows) by[p.status] = (by[p.status] ?? 0) + 1;
      return { days: args.days, posts: rows.length, by_status: by, views: rows.reduce((s: number, p: any) => s + Number(p.views ?? 0), 0) };
    }
    case "top_posts": {
      const { data } = await a.from("creator_posts").select("url, views, likes, posted_on, creators(full_name)").eq("app_id", app).gte("posted_on", since(args.days)).order("views", { ascending: false, nullsFirst: false }).limit(Math.max(1, Math.min(20, args.limit ?? 5)));
      const rows = (data ?? []).map((p: any) => ({ creator: p.creators?.full_name, url: p.url, views: p.views, likes: p.likes, posted_on: p.posted_on }));
      for (const r of rows) if (r.creator) cited.push({ name: r.creator, kind: "creator" });
      return { rows };
    }
    case "payout_summary": {
      const month = /^\d{4}-\d{2}$/.test(args.month) ? args.month : new Date().toISOString().slice(0, 7);
      const { data } = await a.from("payout_items").select("status, amount, amount_usd, currency").eq("app_id", app).eq("period", month);
      const by: Record<string, number> = {}; for (const p of data ?? []) by[p.status] = (by[p.status] ?? 0) + Number(p.amount ?? p.amount_usd ?? 0);
      const { data: adj } = await a.from("payout_adjustments").select("amount").eq("period", month);
      return { month, lines: data?.length ?? 0, total_by_status_eur: by, adjustments_eur: (adj ?? []).reduce((s: number, x: any) => s + Number(x.amount), 0), note: (data?.length ?? 0) === 0 ? "No payout lines generated for this month yet (they are computed on the 1st)." : undefined };
    }
    case "funnel": {
      const { data: ids } = await a.from("creator_apps").select("creator_id").eq("app_id", app);
      const list = (ids ?? []).map((r: any) => r.creator_id);
      const { data: cs } = await a.from("creators").select("id, social_account_created_at, tier, email").in("id", list);
      const real = (cs ?? []).filter((c: any) => !/test/i.test(c.email ?? ""));
      const { data: posts } = await a.from("creator_posts").select("creator_id").eq("app_id", app).eq("status", "approved");
      const n: Record<string, number> = {}; for (const p of posts ?? []) n[p.creator_id] = (n[p.creator_id] ?? 0) + 1;
      return { signed_up: real.length, account_created: real.filter((c: any) => c.social_account_created_at).length, first_post: real.filter((c: any) => (n[c.id] ?? 0) >= 1).length, ten_posts: real.filter((c: any) => (n[c.id] ?? 0) >= 10).length, active_or_pro: real.filter((c: any) => ["active", "pro"].includes(c.tier)).length };
    }
    case "find_briefs": {
      const qq = String(args.query ?? "").replace(/[%,()]/g, " ").trim().slice(0, 60);
      const { data } = await a.from("briefs").select("title, hook, status, format").eq("app_id", app).or(`title.ilike.%${qq}%,hook.ilike.%${qq}%,script.ilike.%${qq}%`).limit(10);
      return { rows: data ?? [] };
    }
    case "draft_brief": {
      const { data } = await a.from("briefs").select("title, hooks, angle, script, must_mention, format, duration_target").eq("app_id", app).neq("status", "archived").order("created_at", { ascending: false }).limit(2);
      return { topic: args.topic, examples_of_our_format: data ?? [], must_mention_default: "Montre l'app à 5 s, dis le nom Sophia", formats: ["talking_head", "pov", "reaction"] };
    }
    case "draft_message": {
      const { data } = await a.from("saved_templates").select("kind, name, subject, body").eq("kind", args.kind).limit(10);
      return { templates: data ?? [], for: args.name, context: args.context };
    }
    default: return { error: "Unknown tool" };
  }
}

const MODES = { balanced: "low", precise: "medium", creative: "low" } as const;

export const askSidekick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid().nullable(), message: z.string().trim().min(1).max(2000), mode: z.enum(["balanced", "precise", "creative"]).default("balanced"), appId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: Admin; userId: string };
    const { data: me } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Admins only");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The AI key is not configured.");
    const app = data.appId ?? SOPHIA;
    let threadId = data.threadId;
    if (!threadId) {
      const { data: t, error } = await ctx.supabase.from("sidekick_threads").insert({ profile_id: me.id, app_id: app, title: data.message.slice(0, 60) }).select("id").single();
      if (error) throw new Error("Could not start a new chat.");
      threadId = t.id as string;
    }
    const { data: hist } = await ctx.supabase.from("sidekick_messages").select("role, content").eq("thread_id", threadId).order("created_at").limit(30);
    await ctx.supabase.from("sidekick_messages").insert({ thread_id: threadId, role: "user", content: data.message });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const a = supabaseAdmin as Admin;
    const { data: appRow } = await a.from("apps").select("name").eq("id", app).maybeSingle();
    const style = data.mode === "precise" ? "Be terse and exact." : data.mode === "creative" ? "For drafts, be bold and playful; numbers stay exact." : "Be short and clear.";
    const instructions = `You are Sidekick, the assistant inside the creator Hub admin for the app "${appRow?.name ?? "Sophia"}". Answer in the admin's language. ${style} Every number must come from a tool result in this conversation — never estimate or invent figures, names, emails or handles. The only action you may take is create_fast_lane, and only when explicitly asked. If a tool returns nothing, say so. Keep answers under 120 words unless drafting. Today is ${new Date().toISOString().slice(0, 10)}.`;
    const input: any[] = [...(hist ?? []).map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: data.message }];
    const cited: Cited[] = [];
    let answer = "";
    for (let round = 0; round < 6; round++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, reasoning: { effort: MODES[data.mode] }, instructions, input, tools: TOOLS }),
      });
      if (!res.ok) {
        if (res.status === 402) throw new Error("AI credits are used up. Add credits, then try again.");
        if (res.status === 429) throw new Error("Sidekick is busy. Try again in a minute.");
        throw new Error(`Sidekick could not answer (error ${res.status}).`);
      }
      const out = await res.json() as { output?: any[]; output_text?: string };
      const calls = (out.output ?? []).filter((o) => o.type === "function_call");
      if (!calls.length) {
        answer = out.output_text ?? (out.output ?? []).flatMap((o) => o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("\n");
        break;
      }
      input.push(...(out.output ?? []));
      for (const c of calls) {
        let args: any = {}; try { args = JSON.parse(c.arguments || "{}"); } catch { /* empty args */ }
        const result = await runTool(a, app, c.name, args, cited).catch((e) => ({ error: (e as Error).message }));
        input.push({ type: "function_call_output", call_id: c.call_id, output: JSON.stringify(result).slice(0, 12000) });
      }
    }
    if (!answer) answer = "I could not finish that one. Try asking more simply.";
    const uniq = [...new Map(cited.map((c) => [c.name, c])).values()].slice(0, 20);
    await ctx.supabase.from("sidekick_messages").insert({ thread_id: threadId, role: "assistant", content: answer, data: { cited: uniq } });
    await ctx.supabase.from("sidekick_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    return { threadId, answer, cited: uniq };
  });
