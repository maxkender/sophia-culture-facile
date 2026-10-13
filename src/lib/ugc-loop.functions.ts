import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WARMUP_REQUIRED } from "./creator-steps";

/* UGC loop: creator submits links → admin validates → tracked → J+7 freeze → Ready → approved into a payout. */
type Sb = any; // eslint-disable-line @typescript-eslint/no-explicit-any
async function admin(): Promise<Sb> { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }
async function assertAdmin(ctx: { supabase: Sb; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Admins only");
  return data.id as string;
}

/** Creator: several TikTok / Instagram links at once, optional brief, guidelines ticked. Duplicates are refused. */
export const submitPostLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ urls: z.array(z.string().trim().max(500)).min(1).max(20), briefId: z.string().uuid().nullable(), guidelines: z.array(z.string().uuid()).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: me } = await context.supabase.from("creators").select("*").eq("user_id", context.userId).maybeSingle();
    if (!me) throw new Error("Creator account not found.");
    const { data: sig } = await context.supabase.from("creator_signatures").select("id").eq("creator_id", me.id).maybeSingle();
    const warm = (me.warmup ?? {}) as Record<string, string>;
    if (!me.rules_accepted_at || !sig || !me.social_account_created_at || WARMUP_REQUIRED.some((x) => !warm[String(x)])) throw new Error("Finish onboarding steps 1 to 3 before adding links.");
    let appId: string | null = null;
    if (data.briefId) {
      const { data: b } = await context.supabase.from("briefs").select("id, app_id").eq("id", data.briefId).maybeSingle();
      if (!b) throw new Error("This brief is not available to you.");
      appId = b.app_id;
    }
    if (!appId) { const { data: en } = await context.supabase.from("creator_apps").select("app_id").eq("creator_id", me.id).limit(1).maybeSingle(); appId = en?.app_id ?? null; }
    const { normalise } = await import("./inspirations.server");
    const a = await admin();
    // Draft review: when required, links for a brief open only once a draft for it is validated.
    const { data: cfg } = await a.from("ugc_settings").select("draft_required").eq("id", 1).maybeSingle();
    let draftId: string | null = null;
    if (data.briefId) {
      const { data: dr } = await a.from("creator_drafts").select("id").eq("creator_id", me.id).eq("brief_id", data.briefId).eq("status", "validated").order("version", { ascending: false }).limit(1).maybeSingle();
      draftId = dr?.id ?? null;
    }
    if (cfg?.draft_required !== false) {
      if (!data.briefId) throw new Error("Choose the brief of this video first.");
      if (!draftId) throw new Error("Send your draft and wait for it to be validated before posting.");
    }
    const results: { url: string; ok: boolean; reason?: string }[] = [];
    for (const raw of data.urls) {
      const n = normalise(raw);
      if (!n) { results.push({ url: raw, ok: false, reason: "Not a TikTok or Instagram video link." }); continue; }
      const { data: dup } = await a.from("creator_posts").select("id").eq("url_key", n.key).maybeSingle();
      if (dup) { results.push({ url: raw, ok: false, reason: "Already submitted." }); continue; }
      const { error } = await a.from("creator_posts").insert({ creator_id: me.id, url: n.url, url_key: n.key, platform: n.platform, brief_id: data.briefId, posted_on: new Date().toISOString().slice(0, 10), status: "pending", submitted_at: new Date().toISOString(), guidelines_checked: data.guidelines, draft_id: draftId, ...(appId ? { app_id: appId } : {}) });
      results.push(error ? { url: raw, ok: false, reason: error.code === "23505" ? "Already submitted." : "Could not be saved." } : { url: raw, ok: true });
    }
    if (results.some((r) => r.ok)) await a.from("creators").update({ status: "active", onboarding_completed_at: new Date().toISOString() }).eq("id", me.id).is("onboarding_completed_at", null);
    return { results };
  });

/** Admin: Valider / Refuser (reason), one or many. */
export const decidePosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(200), decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context as never);
    if (data.decision === "reject" && !data.reason) throw new Error("Add the reason so the creator knows what to fix.");
    const a = await admin();
    const now = new Date().toISOString();
    const patch = data.decision === "approve" ? { status: "approved", validated_at: now, validated_by: me, feedback: null } : { status: "rejected", feedback: data.reason, validated_by: me };
    const { data: rows, error } = await a.from("creator_posts").update(patch).in("id", data.ids).eq("status", "pending").select("id, creator_id");
    if (error) throw new Error("That could not be saved.");
    // One in-app note + one email per creator, in their language, because the admin clicked.
    const ids = [...new Set((rows ?? []).map((r: { creator_id: string }) => r.creator_id))];
    const { data: people } = ids.length ? await a.from("creators").select("id, full_name, email, email_pending, language, country").in("id", ids) : { data: [] };
    const { emailLang, sendCreatorNote } = await import("./ugc-email.server");
    for (const c of (people ?? []) as { id: string; full_name: string; email: string; email_pending: boolean | null; language: string | null; country: string | null }[]) {
      const fr = emailLang(c.language, c.country) === "fr";
      const ok = data.decision === "approve";
      const line = ok ? (fr ? "Ton post a été validé ✅. Les vues seront relevées 7 jours après la validation." : "Your post was validated ✅. Views are recorded 7 days after validation.")
        : (fr ? `Ton lien a été refusé : ${data.reason}` : `Your link was refused: ${data.reason}`);
      await a.from("creator_notifications").insert({ creator_id: c.id, body: line });
      if (c.email && !c.email_pending) {
        const first = String(c.full_name ?? "").split(/\s+/)[0] || "";
        await sendCreatorNote(c.email, c.full_name ?? "", ok ? (fr ? "Post validé ✅" : "Post validated ✅") : (fr ? "Lien refusé" : "Link refused"), [fr ? `Salut ${first},` : `Hi ${first || "there"},`, line, fr ? "— L’équipe créateurs Sophia" : "— The Sophia creator team"]).catch(() => null);
      }
    }
    return { updated: (rows ?? []).length };
  });

/** Admin-only test switch: refresh views now and freeze as if J+7 had passed. */
export const simulateJ7 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    await assertAdmin(context as never);
    const a = await admin(); const { trackValidated, freezeDue } = await import("./ugc-j7.server");
    const t = await trackValidated(a, [data.postId]).catch((e: Error) => ({ tracked: 0, usd: 0, error: e.message }));
    const f = await freezeDue(a, { postId: data.postId, force: true });
    return { ...t, ...f };
  });

export const approveReadyPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    const me = await assertAdmin(context as never);
    const { approveReady } = await import("./ugc-j7.server");
    return approveReady(await admin(), data.creatorId, me);
  });
