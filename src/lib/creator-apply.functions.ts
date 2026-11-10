import { referralFields } from "./slideshow-referral";
import { createServerFn } from "@tanstack/react-start";
import { resolveAppId } from "./resolve-app.server";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isValidInternationalPhone } from "@/lib/creator-validation";
import { referralCodeSchema } from "./slideshow-referral-code";
import { attributionSchema, applicationSource } from "./slideshow-attribution";
import { marketingConsentSchema, validMarketingConsent } from "./slideshow-marketing-consent";

/** Public endpoints for the two creator application forms. Honeypot + rate limit. */

async function ipHash(): Promise<string> {
  const headers = getRequest()?.headers;
  const forwarded = headers?.get("x-forwarded-for") ?? "";
  const ip = headers?.get("cf-connecting-ip") ?? forwarded.split(",")[0]?.trim() ?? "unknown";
  const bytes = new TextEncoder().encode(`sophia-creators:${ip || "unknown"}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Table = "creator_applications" | "slideshow_applications";

async function rateLimited(table: Table, hash: string, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: byIp }, { count: byEmail }] = await Promise.all([
    supabaseAdmin.from(table).select("id", { count: "exact", head: true }).eq("submit_ip_hash", hash).gte("created_at", hourAgo),
    supabaseAdmin.from(table).select("id", { count: "exact", head: true }).ilike("email", email).gte("created_at", dayAgo),
  ]);
  return (byIp ?? 0) >= 5 || (byEmail ?? 0) >= 2;
}

const url = z.string().trim().max(500).url();
const optUrl = z.union([url, z.literal("")]).optional();

const VIDEO_TYPES = ["video/mp4", "video/quicktime"];

/** Signed upload slot for the UGC video (private bucket). */
export const createVideoUploadSlot = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ name: z.string().max(200), type: z.string().max(100), size: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }) => {
    const ext = data.name.toLowerCase().endsWith(".mov") ? "mov" : data.name.toLowerCase().endsWith(".mp4") ? "mp4" : null;
    if (!ext || (data.type && !VIDEO_TYPES.includes(data.type))) return { ok: false as const, reason: "type" as const };
    if (data.size > 200 * 1024 * 1024) return { ok: false as const, reason: "size" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { data: slot, error } = await supabaseAdmin.storage.from("creator-videos").createSignedUploadUrl(path);
    if (error || !slot) return { ok: false as const, reason: "server" as const };
    return { ok: true as const, path, signedUrl: slot.signedUrl };
  });

const ugcSchema = z.object({
  source: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/i).optional(),
  website: z.string().max(200).optional(), // honeypot
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email("Enter a complete email address, for example name@example.com.").max(200),
  phone: z.string().trim().max(40).refine(isValidInternationalPhone, "Enter a valid phone number with the country code."),
  country: z.string().trim().min(2).max(80),
  age: z.number().int().min(18).max(120),
  occupation: z.enum(["studying", "working", "both", "other"]),
  tiktok_url: optUrl,
  instagram_url: optUrl,
  other_links: z.string().trim().max(1000).optional(),
  meets_criteria: z.literal(true),
  video_url: optUrl,
  video_file_path: z.string().max(300).regex(/^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(mp4|mov)$/).optional(),
  referral_source: z.string().trim().min(1).max(1000),
  ref_handle: z.string().trim().regex(/^@?[A-Za-z0-9._]{1,40}$/).optional().or(z.literal("")),
  consent: z.literal(true),
  app: z.string().regex(/^[a-z0-9-]{2,40}$/).optional(),
});

export const submitUgcApplication = createServerFn({ method: "POST" })
  .inputValidator((d) => ugcSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    if (!data.video_url && !data.video_file_path) return { ok: false as const, reason: "video" as const };
    const email = data.email.toLowerCase();
    const hash = await ipHash();
    if (await rateLimited("creator_applications", hash, email)) return { ok: false as const, reason: "rate" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("creator_applications").insert({
      source: data.source?.toLowerCase() ?? null,
      app_id: await resolveAppId(data.app),
      full_name: data.full_name,
      email,
      phone: data.phone,
      country: data.country,
      age: data.age,
      occupation: data.occupation,
      tiktok_url: data.tiktok_url || null,
      instagram_url: data.instagram_url || null,
      other_links: data.other_links || null,
      meets_criteria: true,
      video_url: data.video_url || null,
      video_file_path: data.video_file_path || null,
      referral_source: data.referral_source,
      ref_handle: data.ref_handle ? data.ref_handle.replace(/^@/, "").toLowerCase() : null,
      submit_ip_hash: hash,
    });
    if (error) {
      console.error("creator application insert failed", error.message);
      return { ok: false as const, reason: "server" as const };
    }
    try {
      const { sendUgcAck, emailLang } = await import("./ugc-email.server");
      await sendUgcAck(email, data.full_name, emailLang(null, data.country.length === 2 ? data.country : null));
    } catch { /* saved either way */ }
    return { ok: true as const };
  });

const slideSchema = z.object({
  ...attributionSchema.shape,
  marketing_consent: marketingConsentSchema.nullish(),
  ref: referralCodeSchema.nullish(),
  website: z.string().max(200).optional(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email("Enter a complete email address, for example name@example.com.").max(200),
  phone: z.string().trim().max(40).optional(), // optional, any format accepted
  country: z.string().trim().min(2).max(80),
  is_adult: z.literal(true),
  has_upwork: z.boolean().optional(),
  upwork_profile_url: optUrl,
  referral_source: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
  app: z.string().regex(/^[a-z0-9-]{2,40}$/).optional(),
  deux_telephones: z.boolean().optional(),
  langue: z.enum(["fr", "en", "es", "it", "pt", "de"]),
  q_country_now: z.string().trim().max(120).optional(), // optional screening question
  q_hours_per_day: z.string().trim().max(120).optional(), // retired question; old answers stay stored
  q_tiktok_daily: z.string().trim().max(120).optional(), // optional screening question
  q_previous_content: z.string().trim().max(2000).optional(), // optional screening question
  referred: z.boolean().optional(),
  referral_name: z.string().trim().max(120).optional(),
}).superRefine((d, ctx) => {
  if (d.referred === true && !d.referral_name) ctx.addIssue({ code: "custom", path: ["referral_name"], message: "Referral name is required" });
});

export const submitSlideshowApplication = createServerFn({ method: "POST" })
  .inputValidator((d) => slideSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const email = data.email.toLowerCase();
    const hash = await ipHash();
    if (await rateLimited("slideshow_applications", hash, email)) return { ok: false as const, reason: "rate" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const marketing = getRequest().headers.get("sec-gpc") !== "1" && validMarketingConsent(data.marketing_consent);
    const parsedTracking = attributionSchema.parse(data);
    const tracking = { utm_source: parsedTracking.utm_source || null, utm_medium: parsedTracking.utm_medium || null, utm_campaign: parsedTracking.utm_campaign || null, utm_content: parsedTracking.utm_content || null, utm_term: parsedTracking.utm_term || null, fbclid: parsedTracking.fbclid || null, landing_url: parsedTracking.landing_url || null };
    if (!marketing) tracking.fbclid = null;
    const eventId = crypto.randomUUID();
    const { data: inserted, error } = await supabaseAdmin.from("slideshow_applications").insert({
      ...tracking,
      source: applicationSource({ ...tracking, ref: data.ref }),
      marketing_consent: data.marketing_consent ?? null,
      meta_event_id: eventId,
      ref: data.ref ?? null,
      app_id: await resolveAppId(data.app),
      full_name: data.full_name,
      email,
      phone: data.phone || null,
      country: data.country,
      is_adult: true,
      has_upwork: data.has_upwork ?? null,
      upwork_profile_url: data.has_upwork ? data.upwork_profile_url || null : null,
      referral_source: data.referral_source || null,
      submit_ip_hash: hash,
      deux_telephones: data.deux_telephones ?? null,
      langue: data.langue,
      q_country_now: data.q_country_now || null,
      q_hours_per_day: data.q_hours_per_day || null,
      q_tiktok_daily: data.q_tiktok_daily || null,
      q_previous_content: data.q_previous_content || null,
      ...referralFields(data),
    }).select("id,created_at,marketing_consent,landing_url,meta_event_id").single();
    if (error) {
      console.error("slideshow application insert failed", error.message);
      return { ok: false as const, reason: "server" as const };
    }
    if (marketing) {
      try {
        const { sendSlideshowMetaLead } = await import("./slideshow-meta.server");
        await sendSlideshowMetaLead({ id: eventId, created_at: inserted.created_at, marketing_consent: inserted.marketing_consent, landing_url: inserted.landing_url }, getRequest(), data.marketing_consent);
      } catch { /* Tracking cannot fail an application. */ }
    }
    const osSecret = process.env["OS_HUB_SECRET"];
    if (osSecret) {
      try {
        const { notifyOsApplication, runOsNotification } = await import("./os-referral.server");
        runOsNotification(getRequest(), notifyOsApplication(supabaseAdmin, email, data.ref ?? null, osSecret));
      } catch { /* OS attribution must never change application success. */ }
    }
    // The one automatic email: an acknowledgement in the applicant's language. Nothing else is sent by itself.
    try {
      const { posterEmails } = await import("./slideshow-emails.server");
      let kind: "open" | "closed" | "neutral" = "neutral";
      try {
        const { getOsZones } = await import("./slideshows.server");
        const { RUUL_BLOCKED } = await import("./ruul");
        const { countryCodeOf } = await import("@/config/countries");
        const z = process.env["OS_HUB_SECRET"] ? await getOsZones(supabaseAdmin) : { ok: false, ouverts: [] as { pays_code: string }[] };
        if (z.ok) { const code = countryCodeOf(data.country); kind = code && z.ouverts.some((o) => o.pays_code === code) && !RUUL_BLOCKED.includes(code) ? "open" : "closed"; }
      } catch { kind = "neutral"; }
      const r = await posterEmails.ack(email, data.full_name, data.langue, kind);
      if (r.sent) await supabaseAdmin.from("slideshow_applications").update({ ack_sent_at: new Date().toISOString() }).eq("id", inserted.id);
    } catch { /* the application is saved either way */ }
    return { ok: true as const, eventId };
  });
