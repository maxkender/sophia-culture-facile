import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

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
  website: z.string().max(200).optional(), // honeypot
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
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
  consent: z.literal(true),
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
      submit_ip_hash: hash,
    });
    if (error) {
      console.error("creator application insert failed", error.message);
      return { ok: false as const, reason: "server" as const };
    }
    return { ok: true as const };
  });

const slideSchema = z.object({
  website: z.string().max(200).optional(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  country: z.string().trim().min(2).max(80),
  is_adult: z.literal(true),
  has_upwork: z.boolean(),
  upwork_profile_url: optUrl,
  referral_source: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
});

export const submitSlideshowApplication = createServerFn({ method: "POST" })
  .inputValidator((d) => slideSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const email = data.email.toLowerCase();
    const hash = await ipHash();
    if (await rateLimited("slideshow_applications", hash, email)) return { ok: false as const, reason: "rate" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("slideshow_applications").insert({
      full_name: data.full_name,
      email,
      phone: data.phone,
      country: data.country,
      is_adult: true,
      has_upwork: data.has_upwork,
      upwork_profile_url: data.has_upwork ? data.upwork_profile_url || null : null,
      referral_source: data.referral_source || null,
      submit_ip_hash: hash,
    });
    if (error) {
      console.error("slideshow application insert failed", error.message);
      return { ok: false as const, reason: "server" as const };
    }
    return { ok: true as const };
  });
