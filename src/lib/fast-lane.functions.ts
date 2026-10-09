import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const originSchema = z.string().url().max(300).refine((v) => { const u = new URL(v); return u.protocol === "https:" || u.hostname === "localhost"; });
const num = z.number().min(0).max(100000).nullable();
export const paySchema = z.object({
  tier: z.enum(["trial", "active", "pro"]), perPost: num, rpm: num, cap: num,
  postsPerMonth: z.number().int().min(1).max(500).nullable(), platforms: z.enum(["tiktok", "instagram", "both"]),
  fixedMonthly: num, welcomeBonus: num,
});
const personSchema = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().max(80).nullable().optional(),
  email: z.string().trim().email().max(200), country: z.string().trim().max(80).nullable().optional(),
  language: z.enum(["fr", "en"]).nullable().optional(), platform: z.enum(["ios", "android"]).nullable().optional(),
  tiktok: z.string().trim().max(200).nullable().optional(), instagram: z.string().trim().max(200).nullable().optional(),
  source: z.enum(["va", "dm", "sideshift", "upwork", "referral", "other"]).nullable().optional(), notes: z.string().max(2000).nullable().optional(),
  ref: z.object({ kind: z.enum(["creator", "applicant", "prospect"]), id: z.string().uuid() }).nullable().optional(),
});
const token = z.string().regex(/^[a-f0-9]{48}$/);

async function assertAdmin(context: { supabase: Admin; userId: string }) {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id as string;
}
async function adminClient(): Promise<Admin> {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/* ---------------- admin ---------------- */

export const createFastLane = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appId: z.string().uuid(), jobId: z.string().uuid().nullable(), pay: paySchema, people: z.array(personSchema).min(1).max(200), origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { createFastLaneOne } = await import("./fast-lane.server");
    const results: { name: string; email: string; link: string | null; creatorId: string | null; error: string | null }[] = [];
    for (const p of data.people) {
      try { const r = await createFastLaneOne(a, p, data.pay, data.appId, data.jobId, data.origin); results.push({ ...r, error: null }); }
      catch (e) { results.push({ name: p.firstName, email: p.email, link: null, creatorId: null, error: (e as Error).message }); }
    }
    return { results };
  });

export const regenerateFastLane = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid(), origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { newToken, fastLink } = await import("./fast-lane.server");
    const t = newToken();
    const { error } = await a.from("creators").update({ fast_lane: true, fast_lane_token: t, fast_lane_expires_at: new Date(Date.now() + 14 * 86400_000).toISOString(), fast_lane_opened_at: null, fast_lane_entered_at: null, fast_lane_sent_at: null }).eq("id", data.creatorId);
    if (error) throw new Error("Could not regenerate the link.");
    return { link: fastLink(data.origin, t) };
  });

export const emailFastLane = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid(), origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    return (await import("./fast-lane.server")).sendFastLaneEmail(await adminClient(), data.creatorId, data.origin);
  });

export const saveCreatorPay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid(), pay: paySchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { payColumns } = await import("./fast-lane.server");
    const a = await adminClient();
    const { data: cur } = await a.from("creators").select("user_id").eq("id", data.creatorId).maybeSingle();
    const upd: Record<string, unknown> = payColumns(data.pay);
    if (!cur?.user_id) upd["tier"] = data.pay.tier;
    const { error } = await a.from("creators").update(upd).eq("id", data.creatorId);
    if (error) throw new Error("Could not save the pay.");
    return { ok: true };
  });

/* ---------------- public: the personal link ---------------- */

async function loadByToken(a: Admin, t: string) {
  const { data } = await a.from("creators").select("*").eq("fast_lane_token", t).maybeSingle();
  return data;
}
function stateOf(c: any): "ok" | "used" | "expired" | "invalid" {
  if (!c) return "invalid";
  if (c.fast_lane_entered_at) return "used";
  if (!c.fast_lane_expires_at || new Date(c.fast_lane_expires_at).getTime() < Date.now()) return "expired";
  return "ok";
}

export const resolveFastLane = createServerFn({ method: "GET" })
  .inputValidator((t: unknown) => token.parse(t))
  .handler(async ({ data }) => {
    const a = await adminClient();
    const c = await loadByToken(a, data);
    const state = stateOf(c);
    if (state !== "ok") return { state, language: (c?.language as string | null) ?? "fr", firstName: c ? String(c.full_name).split(/\s+/)[0] ?? "" : "" };
    if (!c.fast_lane_opened_at) await a.from("creators").update({ fast_lane_opened_at: new Date().toISOString() }).eq("id", c.id);
    const appId = c.fast_lane_app_id ?? "00000000-0000-4000-8000-000000000001";
    const tier = (c.starting_tier ?? c.tier ?? "trial") as string;
    const [{ data: t }, { data: app }, { data: doc }, { data: rules }] = await Promise.all([
      a.from("ugc_tiers").select("per_post, cpm, cap_per_post").eq("app_id", appId).eq("tier", tier).maybeSingle(),
      a.from("apps").select("name").eq("id", appId).maybeSingle(),
      a.from("documents").select("id, current_version, title, published").eq("slug", "creator-agreement").maybeSingle(),
      a.from("documents").select("id, current_version").eq("slug", "creator-rules").maybeSingle(),
    ]);
    const [{ data: v }, { data: rv }] = await Promise.all([
      a.from("document_versions").select("content").eq("document_id", doc?.id).eq("version", doc?.current_version).maybeSingle(),
      a.from("document_versions").select("content").eq("document_id", rules?.id).eq("version", rules?.current_version).maybeSingle(),
    ]);
    const n = (x: unknown) => (x == null ? null : Number(x));
    return {
      state, language: (c.language as string | null) ?? "fr", firstName: String(c.full_name).split(/\s+/)[0] ?? "", fullName: c.full_name as string, appName: (app?.name as string) ?? "Sophia",
      pay: {
        tier, perPost: n(c.per_post_override) ?? n(t?.per_post) ?? 0, rpm: n(c.rpm_override) ?? n(t?.cpm) ?? 0, cap: n(c.cap_override) ?? n(t?.cap_per_post) ?? 0,
        postsPerMonth: n(c.posts_per_month) ?? 20, platforms: c.required_platforms as string, fixedMonthly: n(c.fixed_monthly_override), welcomeBonus: n(c.welcome_bonus),
      },
      agreement: doc?.published ? { version: String(doc.current_version), title: doc.title as string, body: v?.content ?? [] } : null,
      rules: rv?.content ?? [],
    };
  });

export const enterFastLane = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token, signedName: z.string().trim().min(2).max(160), accepted: z.literal(true), documentVersion: z.string().max(10), userAgent: z.string().max(400).optional() }).parse(d))
  .handler(async ({ data }) => {
    const a = await adminClient();
    const c = await loadByToken(a, data.token);
    const state = stateOf(c);
    if (state !== "ok") return { ok: false as const, state };
    const [{ data: doc }, { data: rules }] = await Promise.all([
      a.from("documents").select("current_version, published").eq("slug", "creator-agreement").maybeSingle(),
      a.from("documents").select("current_version").eq("slug", "creator-rules").maybeSingle(),
    ]);
    if (!doc?.published || String(doc.current_version) !== data.documentVersion) return { ok: false as const, state: "reload" as const };
    const { sessionTokenFor } = await import("./fast-lane.server");
    const s = await sessionTokenFor(a, String(c.email).toLowerCase());
    if (c.user_id && c.user_id !== s.userId) return { ok: false as const, state: "mismatch" as const };
    if (!c.user_id) {
      const { data: other } = await a.from("creators").select("id").eq("user_id", s.userId).neq("id", c.id).maybeSingle();
      if (other) return { ok: false as const, state: "mismatch" as const };
    }
    const now = new Date().toISOString();
    const h = getRequest()?.headers;
    const fwd = h?.get("x-forwarded-for") ?? "";
    const ip = h?.get("cf-connecting-ip") ?? (fwd ? fwd.split(",")[0]?.trim() ?? null : null);
    const { error } = await a.from("creators").update({
      user_id: s.userId, rules_accepted_at: c.rules_accepted_at ?? now, rules_version: c.rules_version ?? rules?.current_version ?? 1,
      status: c.status === "invited" ? "onboarding" : c.status, fast_lane_entered_at: now, fast_lane_expires_at: now,
    }).eq("id", c.id);
    if (error) return { ok: false as const, state: "error" as const };
    const { data: sig } = await a.from("creator_signatures").select("id, document_version").eq("creator_id", c.id).maybeSingle();
    const sigRow = { creator_id: c.id, variant: "ugc", document_version: String(doc.current_version), signed_name: data.signedName, signature_ip: ip, user_agent: data.userAgent ?? h?.get("user-agent") ?? null, signed_at: now };
    if (!sig) await a.from("creator_signatures").insert(sigRow);
    else if (Number(sig.document_version) < Number(doc.current_version)) await a.from("creator_signatures").update(sigRow).eq("id", sig.id);
    if (Number(c.welcome_bonus) > 0) {
      const period = now.slice(0, 7);
      const { data: had } = await a.from("payout_adjustments").select("id").eq("creator_id", c.id).eq("reason", "Welcome bonus").maybeSingle();
      if (!had) await a.from("payout_adjustments").insert({ creator_id: c.id, period, amount: Number(c.welcome_bonus), reason: "Welcome bonus" });
    }
    if (c.fast_lane_job_id) {
      await a.from("job_invites").update({ accepted_at: now }).eq("creator_id", c.id).eq("job_id", c.fast_lane_job_id).is("accepted_at", null);
      const { data: ja } = await a.from("job_applications").select("id").eq("creator_id", c.id).eq("job_id", c.fast_lane_job_id).maybeSingle();
      if (!ja) await a.from("job_applications").insert({ job_id: c.fast_lane_job_id, creator_id: c.id, status: "accepted", contract_signed_at: now, decided_at: now, answers: { source: "fast_lane" } });
    }
    return { ok: true as const, tokenHash: s.tokenHash, type: s.type };
  });

/* ---------------- passwordless login ---------------- */

export const requestLoginLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(200), origin: originSchema, lang: z.enum(["fr", "en"]).default("fr") }).parse(d))
  .handler(async ({ data }) => {
    const a = await adminClient();
    const email = data.email.toLowerCase();
    const [{ data: c }, { data: p }] = await Promise.all([
      a.from("creators").select("id, full_name, user_id").ilike("email", email).limit(1).maybeSingle(),
      a.from("profiles").select("id").ilike("email", email).limit(1).maybeSingle(),
    ]);
    if (!c && !p) return { ok: true }; // same answer either way: no account enumeration
    const { sessionTokenFor } = await import("./fast-lane.server");
    const s = await sessionTokenFor(a, email);
    if (c && !c.user_id) {
      const { data: other } = await a.from("creators").select("id").eq("user_id", s.userId).maybeSingle();
      if (!other) await a.from("creators").update({ user_id: s.userId }).eq("id", c.id);
    }
    const link = `${data.origin.replace(/\/$/, "")}/creators/login?th=${encodeURIComponent(s.tokenHash)}&ty=${encodeURIComponent(s.type)}`;
    const en = data.lang === "en";
    const { buildEmailHtml, buildEmailText } = await import("./email-send.server");
    const { sendBrevoEmail } = await import("./brevo.server");
    const first = String(c?.full_name ?? "").split(/\s+/)[0] || (en ? "there" : "");
    const opts = {
      paragraphs: en ? [`Hi ${first},`, "Here is your sign-in link for the Sophia creator space. It works once and expires in one hour."] : [`Salut ${first},`, "Voici ton lien de connexion à l'espace créateur Sophia. Il marche une seule fois et expire dans une heure."],
      buttonLabel: en ? "Sign in" : "Me connecter", buttonUrl: link,
    };
    await sendBrevoEmail({ to: email, subject: en ? "Your sign-in link" : "Ton lien de connexion", html: buildEmailHtml(opts), text: buildEmailText(opts) });
    return { ok: true };
  });
