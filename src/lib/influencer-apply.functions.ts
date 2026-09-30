import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isValidInternationalPhone } from "@/lib/creator-validation";
import { NICHES } from "@/i18n/influencers";

/** Public influencer application. Honeypot + rate limit, service role (table has no anon access). */

async function ipHash(): Promise<string> {
  const headers = getRequest()?.headers;
  const ip = headers?.get("cf-connecting-ip") ?? headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sophia-influencers:${ip}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const url = z.string().trim().max(500).url();
const optUrl = z.union([url, z.literal("")]).optional();
const optCount = z.number().int().min(0).max(1_000_000_000).nullable().optional();

export const createMediaKitUploadSlot = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().max(200), size: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const m = data.name.toLowerCase().match(/\.(pdf|png|jpe?g|webp)$/);
    if (!m) return { ok: false as const, reason: "type" as const };
    if (data.size > 20 * 1024 * 1024) return { ok: false as const, reason: "size" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `media-kits/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${m[1]}`;
    const { data: slot, error } = await supabaseAdmin.storage.from("influencer-files").createSignedUploadUrl(path);
    if (error || !slot) return { ok: false as const, reason: "server" as const };
    return { ok: true as const, path, signedUrl: slot.signedUrl };
  });

const schema = z
  .object({
    website: z.string().max(200).optional(),
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).refine(isValidInternationalPhone),
    country: z.string().trim().min(2).max(80),
    city: z.string().trim().min(1).max(120),
    age: z.number().int().min(18).max(120),
    tiktok_url: optUrl, tiktok_followers: optCount,
    instagram_url: optUrl, instagram_followers: optCount,
    youtube_url: optUrl, youtube_subscribers: optCount,
    niche_tags: z.array(z.enum(NICHES)).min(1).max(4),
    languages: z.array(z.string().max(20)).min(1).max(10),
    tiktok_avg_views: optCount,
    rate_tiktok: z.number().min(0).max(1_000_000),
    rate_reel: z.number().min(0).max(1_000_000).nullable().optional(),
    accepts_recurring: z.enum(["yes", "no", "depends"]),
    media_kit_path: z.string().regex(/^media-kits\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(pdf|png|jpe?g|webp)$/).optional(),
    media_kit_url: optUrl,
    proud_links: z.array(url).min(1).max(3),
    has_agency: z.boolean(),
    agency_name: z.string().trim().max(200).optional(),
    agency_contact: z.string().trim().max(300).optional(),
    referral_source: z.string().trim().max(1000).optional(),
    consent: z.literal(true),
  })
  .refine((d) => d.tiktok_url || d.instagram_url || d.youtube_url, "platform")
  .refine((d) => (!d.tiktok_url || d.tiktok_followers != null) && (!d.instagram_url || d.instagram_followers != null) && (!d.youtube_url || d.youtube_subscribers != null), "counts")
  .refine((d) => !d.tiktok_url || d.tiktok_avg_views != null, "views")
  .refine((d) => !d.has_agency || (d.agency_name && d.agency_contact), "agency");

export const submitInfluencerApplication = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const email = data.email.toLowerCase();
    const hash = await ipHash();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hourAgo = new Date(Date.now() - 3600e3).toISOString();
    const dayAgo = new Date(Date.now() - 86400e3).toISOString();
    const [{ count: byIp }, { count: byEmail }] = await Promise.all([
      supabaseAdmin.from("influencer_applications").select("id", { count: "exact", head: true }).eq("submit_ip_hash", hash).gte("created_at", hourAgo),
      supabaseAdmin.from("influencer_applications").select("id", { count: "exact", head: true }).ilike("email", email).gte("created_at", dayAgo),
    ]);
    if ((byIp ?? 0) >= 5 || (byEmail ?? 0) >= 2) return { ok: false as const, reason: "rate" as const };
    const { error } = await supabaseAdmin.from("influencer_applications").insert({
      full_name: data.full_name, email, phone: data.phone, country: data.country, city: data.city, age: data.age,
      tiktok_url: data.tiktok_url || null, tiktok_followers: data.tiktok_url ? data.tiktok_followers ?? null : null,
      instagram_url: data.instagram_url || null, instagram_followers: data.instagram_url ? data.instagram_followers ?? null : null,
      youtube_url: data.youtube_url || null, youtube_subscribers: data.youtube_url ? data.youtube_subscribers ?? null : null,
      niche_tags: data.niche_tags, languages: data.languages,
      tiktok_avg_views: data.tiktok_url ? data.tiktok_avg_views ?? null : null,
      rate_tiktok: data.rate_tiktok, rate_reel: data.rate_reel ?? null, accepts_recurring: data.accepts_recurring,
      media_kit_path: data.media_kit_path ?? null, media_kit_url: data.media_kit_url || null,
      proud_links: data.proud_links, has_agency: data.has_agency,
      agency_name: data.has_agency ? data.agency_name ?? null : null, agency_contact: data.has_agency ? data.agency_contact ?? null : null,
      referral_source: data.referral_source || null, submit_ip_hash: hash,
    });
    if (error) {
      console.error("influencer application insert failed", error.message);
      return { ok: false as const, reason: "server" as const };
    }
    return { ok: true as const };
  });
