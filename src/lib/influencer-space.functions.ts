import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidInternationalPhone } from "@/lib/creator-validation";
import { NICHES } from "@/i18n/influencers";

/** Influencer space: every write goes through here, after checking the caller owns the influencer row. */

type Ctx = { supabase: any; userId: string; claims?: { email?: string } };

async function me(context: Ctx) {
  const { data } = await context.supabase.from("influencers").select("*").eq("user_id", context.userId).maybeSingle();
  if (!data) throw new Error("No influencer account is linked to this login.");
  return data;
}
async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}
function reqMeta(ua?: string) {
  const h = getRequest()?.headers;
  const ip = h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { ip, ua: ua ?? h?.get("user-agent") ?? null };
}

/** Public: tells the sign-in screen whether an invite is fresh, used or invalid. */
export const checkInfluencerInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("influencers").select("user_id, invite_sent_at, created_at").eq("invite_token", data.token).maybeSingle();
    if (!row) return { state: "invalid" as const };
    if (row.user_id) return { state: "used" as const };
    const since = new Date(row.invite_sent_at ?? row.created_at).getTime();
    if (Date.now() - since > 30 * 86400e3) return { state: "expired" as const };
    return { state: "fresh" as const };
  });

export const claimInfluencerInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as Ctx;
    const db = await admin();
    const { data: user } = await db.auth.admin.getUserById(userId);
    const email = user?.user?.email?.toLowerCase();
    const { data: row } = await db.from("influencers").select("id, email, user_id").eq("invite_token", data.token).maybeSingle();
    if (!row) return { ok: false as const, error: "This invite link is not valid." };
    if (row.user_id && row.user_id !== userId) return { ok: false as const, error: "This invite was already used by another account." };
    if (!email || email !== row.email.toLowerCase()) return { ok: false as const, error: "Sign in with the email address the invite was sent to." };
    await db.from("influencers").update({ user_id: userId }).eq("id", row.id);
    return { ok: true as const };
  });

/** Fallback: links the influencer row whose email matches the signed-in, confirmed email. */
export const linkInfluencerByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const db = await admin();
    const { data: user } = await db.auth.admin.getUserById(userId);
    const email = user?.user?.email?.toLowerCase();
    if (!email || !user?.user?.email_confirmed_at) return { ok: false as const };
    const { data: row } = await db.from("influencers").select("id").is("user_id", null).ilike("email", email).maybeSingle();
    if (!row) return { ok: false as const };
    await db.from("influencers").update({ user_id: userId }).eq("id", row.id);
    return { ok: true as const };
  });

export const acceptInfluencerRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ accepted: z.literal(true) }).parse(d))
  .handler(async ({ context }) => {
    const inf = await me(context as Ctx);
    const db = await admin();
    if (!inf.rules_accepted_at) await db.from("influencers").update({ rules_accepted_at: new Date().toISOString() }).eq("id", inf.id);
    return { ok: true };
  });

export const signInfluencerAgreement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ signedName: z.string().trim().min(2).max(160), documentVersion: z.string().min(1).max(40), userAgent: z.string().max(400).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const inf = await me(context as Ctx);
    if (!inf.rules_accepted_at) throw new Error("Read and accept the rules first.");
    const db = await admin();
    const { data: doc } = await db.from("documents").select("id, current_version, published, title, content").eq("slug", "influencer-agreement").maybeSingle();
    if (!doc?.published) throw new Error("The agreement is not published yet.");
    if (String(doc.current_version) !== data.documentVersion) throw new Error("A new version was published. Reload the page.");
    const { data: existing } = await db.from("influencer_signatures").select("id").eq("influencer_id", inf.id).eq("kind", "master").maybeSingle();
    if (existing) return { alreadySigned: true };
    const { ip, ua } = reqMeta(data.userAgent);
    const { error } = await db.from("influencer_signatures").insert({
      influencer_id: inf.id, kind: "master", document_version: String(doc.current_version), signed_name: data.signedName,
      snapshot: { title: doc.title, content: doc.content, legal_name: inf.legal_name ?? inf.display_name, country: inf.country, email: inf.email },
      signature_ip: ip, user_agent: ua,
    });
    if (error) throw new Error("The signature could not be recorded.");
    await db.from("influencers").update({ agreement_signed_at: new Date().toISOString() }).eq("id", inf.id);
    return { alreadySigned: false };
  });

const payoutSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("invoice"),
    legal_entity: z.string().trim().min(2).max(200),
    address: z.string().trim().min(5).max(400),
    iban: z.string().trim().min(10).max(50),
    tax_id: z.string().trim().max(60).optional(),
  }),
  z.object({
    method: z.literal("agency"),
    agency_name: z.string().trim().min(2).max(200),
    billing_contact: z.string().trim().min(2).max(200),
    billing_email: z.string().trim().email().max(200),
    address: z.string().trim().min(5).max(400),
    iban: z.string().trim().min(10).max(50),
  }),
]);

/** Bank transfer against an invoice, or payment to the agency. Stripe goes through startInfluencerStripe. */
export const saveInfluencerPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => payoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const inf = await me(context as Ctx);
    const db = await admin();
    const { method, ...details } = data;
    await db.from("influencers").update({
      payout_method: method, payout_details: details, payee: method === "agency" ? "agency" : "influencer",
      payout_setup_at: new Date().toISOString(),
    }).eq("id", inf.id);
    return { ok: true };
  });

async function stripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe is not configured yet. Choose bank transfer for now.");
  if (key.startsWith("sk_live_") && process.env["STRIPE_ALLOW_LIVE"] !== "true") {
    throw new Error("Stripe payouts are not switched on yet. Choose bank transfer for now.");
  }
  const Stripe = (await import("stripe")).default;
  return new Stripe(key);
}

export const startInfluencerStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const inf = await me(context as Ctx);
    const s = await stripe();
    const db = await admin();
    let accountId = inf.stripe_account_id as string | null;
    if (!accountId) {
      const account = await s.accounts.create(
        { type: "express", email: inf.email, capabilities: { transfers: { requested: true } }, metadata: { influencer_id: inf.id } },
        { idempotencyKey: `influencer-account-${inf.id}` },
      );
      accountId = account.id;
      await db.from("influencers").update({ stripe_account_id: accountId, payout_method: "stripe", payee: "influencer" }).eq("id", inf.id);
    }
    const origin = process.env["SITE_URL"] ?? "https://sophia-culture.com";
    const link = await s.accountLinks.create({
      account: accountId, type: "account_onboarding",
      refresh_url: `${origin}/creators/influencer/app/profile`, return_url: `${origin}/creators/influencer/app/profile?stripe=return`,
    });
    return { url: link.url };
  });

export const syncInfluencerStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const inf = await me(context as Ctx);
    if (!inf.stripe_account_id) return { onboarded: false };
    const s = await stripe();
    const account = await s.accounts.retrieve(inf.stripe_account_id);
    const onboarded = Boolean(account.details_submitted && account.payouts_enabled);
    const db = await admin();
    await db.from("influencers").update({
      stripe_onboarded: onboarded, ...(onboarded ? { payout_method: "stripe", payout_setup_at: inf.payout_setup_at ?? new Date().toISOString() } : {}),
    }).eq("id", inf.id);
    return { onboarded };
  });

const optUrl = z.union([z.string().trim().url().max(500), z.literal("")]).optional();
const optNum = z.number().min(0).max(1_000_000_000).nullable().optional();

export const updateInfluencerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().trim().min(2).max(120),
      legal_name: z.string().trim().min(2).max(160),
      phone: z.string().trim().max(40).refine(isValidInternationalPhone),
      country: z.string().trim().min(2).max(80),
      city: z.string().trim().min(1).max(120),
      languages: z.array(z.string().max(20)).min(1).max(10),
      niche_tags: z.array(z.enum(NICHES)).min(1).max(4),
      tiktok_url: optUrl, tiktok_followers: optNum, tiktok_avg_views: optNum,
      instagram_url: optUrl, instagram_followers: optNum,
      youtube_url: optUrl, youtube_subscribers: optNum,
      rate_tiktok: optNum, rate_reel: optNum, rate_youtube: optNum,
      accepts_recurring: z.enum(["yes", "no", "depends"]),
      availability: z.enum(["available", "booked"]),
      booked_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      agency_name: z.string().trim().max(200).optional(),
      agency_contact: z.string().trim().max(300).optional(),
      media_kit_url: optUrl,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const inf = await me(context as Ctx);
    const db = await admin();
    const { error } = await db.from("influencers").update({
      ...data,
      tiktok_url: data.tiktok_url || null, instagram_url: data.instagram_url || null, youtube_url: data.youtube_url || null,
      media_kit_url: data.media_kit_url || null, agency_name: data.agency_name || null, agency_contact: data.agency_contact || null,
      booked_until: data.availability === "booked" ? data.booked_until ?? null : null,
    }).eq("id", inf.id);
    if (error) throw new Error("Your profile could not be saved.");
    return { ok: true };
  });

export const influencerMediaKitSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().max(200), size: z.number().int().positive() }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await me(context as Ctx);
    const m = data.name.toLowerCase().match(/\.(pdf|png|jpe?g|webp)$/);
    if (!m) return { ok: false as const, reason: "type" as const };
    if (data.size > 20 * 1024 * 1024) return { ok: false as const, reason: "size" as const };
    const db = await admin();
    const path = `influencers/${inf.id}/media-kit-${Date.now()}.${m[1]}`;
    const { data: slot, error } = await db.storage.from("influencer-files").createSignedUploadUrl(path);
    if (error || !slot) return { ok: false as const, reason: "server" as const };
    return { ok: true as const, path, signedUrl: slot.signedUrl };
  });

export const confirmInfluencerMediaKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await me(context as Ctx);
    if (!data.path.startsWith(`influencers/${inf.id}/`)) throw new Error("Forbidden");
    const db = await admin();
    await db.from("influencers").update({ media_kit_path: data.path }).eq("id", inf.id);
    return { ok: true };
  });

export const openInfluencerMediaKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const inf = await me(context as Ctx);
    if (!inf.media_kit_path) return { url: null };
    const db = await admin();
    const { data } = await db.storage.from("influencer-files").createSignedUrl(inf.media_kit_path, 600);
    return { url: data?.signedUrl ?? null };
  });

export const markInfluencerMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const inf = await me(context as Ctx);
    const db = await admin();
    await db.from("influencer_messages").update({ read_at: new Date().toISOString() }).eq("influencer_id", inf.id).eq("from_admin", true).is("read_at", null);
    return { ok: true };
  });
