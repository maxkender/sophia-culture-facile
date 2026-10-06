import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { currentPeriod } from "./ugc-pay";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

async function me(context: any) {
  const { data } = await context.supabase.from("creators").select("id, full_name, setup_guide_checks").eq("user_id", context.userId).maybeSingle();
  if (!data) throw new Error("Creator account not found.");
  return data;
}

async function encrypt(plain: string) {
  const secret = process.env["CREATOR_CRED_KEY"];
  if (!secret) throw new Error("Credential storage is not configured.");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
  return `${b64(iv)}.${b64(ct)}`;
}

const handle = z.string().trim().min(2).max(60).regex(/^@?[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots and underscores, without spaces.");

/** D.3 sub-steps: a email, b TikTok, c Instagram, d confirm. */
export const saveUgcAccountStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.discriminatedUnion("step", [
    z.object({ step: z.literal("email"), email: z.string().trim().email("Enter a complete email address, for example lea.creator@gmail.com.").max(200).refine((e) => /@(gmail|googlemail|outlook|hotmail|live)\./i.test(e), "Use a Gmail or Outlook address so it can be handed over."), password: z.string().min(6, "The password must have at least 6 characters.").max(200) }),
    z.object({ step: z.literal("tiktok"), handle }),
    z.object({ step: z.literal("instagram"), handle, creatorType: z.literal(true) }),
    z.object({ step: z.literal("confirm"), publicConfirmed: z.literal(true) }),
  ]).parse(d))
  .handler(async ({ data, context }) => {
    const c = await me(context);
    const a = await db();
    const now = new Date().toISOString();
    const checks = { ...(c.setup_guide_checks ?? {}) } as Record<string, string>;
    const at = (h: string) => (h.startsWith("@") ? h : `@${h}`);
    if (data.step === "email") {
      const appId = "00000000-0000-4000-8000-000000000001";
      const { data: row } = await a.from("creator_social_accounts").select("id").eq("creator_id", c.id).eq("app_id", appId).maybeSingle();
      const patch = { account_email: data.email.toLowerCase(), password_encrypted: await encrypt(data.password), updated_at: now };
      if (row) await a.from("creator_social_accounts").update(patch).eq("id", row.id);
      else await a.from("creator_social_accounts").insert({ creator_id: c.id, app_id: appId, handle: "", registered_at: now, ...patch });
      checks["acc_email"] = now;
      await a.from("creators").update({ setup_guide_checks: checks }).eq("id", c.id);
    } else if (data.step === "tiktok") {
      checks["acc_tiktok"] = now;
      await a.from("creators").update({ tiktok_handle: at(data.handle), social_handle: at(data.handle), setup_guide_checks: checks }).eq("id", c.id);
      await a.from("creator_social_accounts").update({ handle: at(data.handle) }).eq("creator_id", c.id).eq("app_id", "00000000-0000-4000-8000-000000000001");
    } else if (data.step === "instagram") {
      checks["acc_instagram"] = now;
      await a.from("creators").update({ instagram_handle: at(data.handle), setup_guide_checks: checks }).eq("id", c.id);
    } else {
      const { data: row } = await a.from("creators").select("tiktok_handle, instagram_handle, required_platforms, setup_guide_checks").eq("id", c.id).maybeSingle();
      if (!checks["acc_email"]) throw new Error("Register the Sophia email address first.");
      if (row.required_platforms !== "instagram" && !row.tiktok_handle) throw new Error("Register your TikTok handle first.");
      if (row.required_platforms !== "tiktok" && !row.instagram_handle) throw new Error("Register your Instagram handle first.");
      checks["acc_confirm"] = now;
      await a.from("creators").update({ accounts_confirmed_at: now, social_account_created_at: now, setup_guide_checks: checks }).eq("id", c.id);
    }
    return { ok: true };
  });

export const setWhatsappOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ optIn: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await me(context);
    await (await db()).from("creators").update({ whatsapp_opt_in: data.optIn }).eq("id", c.id);
    return { ok: true };
  });

export const touchCreatorSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("creators").select("id").eq("user_id", context.userId).maybeSingle();
    if (data) await (await db()).from("creators").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });

/** I. Declining an assigned brief requires a replacement from the library. */
export const declineAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ assignmentId: z.string().uuid(), replacementBriefId: z.string().uuid(), reason: z.string().trim().min(3, "Tell us briefly why.").max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await me(context);
    const a = await db();
    const { data: asg } = await a.from("brief_assignments").select("id, creator_id, brief_id, target_date, week_start").eq("id", data.assignmentId).maybeSingle();
    if (!asg || asg.creator_id !== c.id) throw new Error("Assignment not found.");
    if (asg.brief_id === data.replacementBriefId) throw new Error("Pick a different brief.");
    const { data: repl } = await context.supabase.from("briefs").select("id").eq("id", data.replacementBriefId).maybeSingle();
    if (!repl) throw new Error("That brief is not in your library.");
    const now = new Date().toISOString();
    const { data: newAsg } = await a.from("brief_assignments").insert({ brief_id: data.replacementBriefId, creator_id: c.id, target_date: asg.target_date, week_start: asg.week_start, published_at: now, replaces_assignment_id: asg.id }).select("id").single();
    await a.from("brief_assignments").update({ declined_at: now, decline_reason: data.reason, replacement_brief_id: data.replacementBriefId }).eq("id", asg.id);
    await a.from("activity_log").insert({ actor_id: null, entity: "brief_assignment", entity_id: asg.id, action: "brief_swapped", comment: `${c.full_name}: declined ${asg.brief_id} → picked ${data.replacementBriefId}. Reason: ${data.reason}` });
    return { ok: true, newAssignmentId: newAsg?.id };
  });

/** G. Live month for the Earnings page. */
export const myRunningMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = await me(context);
    const a = await db();
    const { computeCreatorMonth } = await import("./ugc-month.server");
    const period = currentPeriod();
    const { breakdown } = await computeCreatorMonth(a, c.id, period);
    const { data: s } = await a.from("ugc_settings").select("payday_day").eq("id", 1).maybeSingle();
    const { data: posts } = await a.from("external_posts").select("views, views_7d, posted_at").eq("creator_id", c.id).gte("posted_at", `${period}-01`);
    return { breakdown, paydayDay: s?.payday_day ?? 5, viewsSoFar: (posts ?? []).reduce((n: number, p: any) => n + Number(p.views_7d ?? p.views ?? 0), 0) };
  });

export const submitManualViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ externalPostId: z.string().uuid(), views: z.number().int().min(0).max(1e10), screenshotPath: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await me(context);
    const a = await db();
    const { data: p } = await a.from("external_posts").select("creator_id").eq("id", data.externalPostId).maybeSingle();
    if (p?.creator_id !== c.id) throw new Error("Post not found.");
    await a.from("external_posts").update({ manual_views_7d: data.views, manual_screenshot_path: data.screenshotPath, manual_submitted_at: new Date().toISOString() }).eq("id", data.externalPostId);
    return { ok: true };
  });

/** I. Network performance per brief for the creator library (no other creator's identity leaves the server). */
export const briefLibraryStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = await me(context);
    const a = await db();
    const { data: rows } = await a.from("external_posts").select("creator_id, brief_id, views_7d").not("views_7d", "is", null);
    const all = rows ?? [];
    const byCreator = new Map<string, number[]>();
    all.forEach((r: any) => byCreator.set(r.creator_id, [...(byCreator.get(r.creator_id) ?? []), Number(r.views_7d)]));
    const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
    const tier = (v: number) => (v < 5000 ? 1 : v < 50000 ? 2 : 3);
    const myTier = tier(avg(byCreator.get(c.id) ?? []));
    const stats: Record<string, { avg: number; posts: number; peerAvg: number; peerPosts: number }> = {};
    for (const r of all as any[]) {
      if (!r.brief_id) continue;
      const s = (stats[r.brief_id] ??= { avg: 0, posts: 0, peerAvg: 0, peerPosts: 0 });
      s.avg += Number(r.views_7d); s.posts++;
      if (tier(avg(byCreator.get(r.creator_id) ?? [])) === myTier) { s.peerAvg += Number(r.views_7d); s.peerPosts++; }
    }
    Object.values(stats).forEach((s) => { s.avg = s.posts ? s.avg / s.posts : 0; s.peerAvg = s.peerPosts ? s.peerAvg / s.peerPosts : 0; });
    return { stats, myTier };
  });
