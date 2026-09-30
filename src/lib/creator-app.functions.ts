import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WARMUP_REQUIRED } from "./creator-steps";
import { isValidInternationalPhone } from "./creator-validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

async function myCreator(supabase: Sb, userId: string) {
  const { data } = await supabase.from("creators").select("*").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Creator account not found.");
  return data;
}

async function adminProfile(supabase: Sb, userId: string) {
  const { data } = await supabase.from("profiles").select("id, role").eq("user_id", userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data as { id: string };
}

async function aesKey() {
  const secret = process.env["CREATOR_CRED_KEY"];
  if (!secret) throw new Error("Credential storage is not configured.");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(plain)));
  return `${b64(iv)}.${b64(ct)}`;
}
async function decrypt(value: string) {
  const [iv = "", ct = ""] = value.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(Buffer.from(iv, "base64")) }, await aesKey(), new Uint8Array(Buffer.from(ct, "base64")));
  return new TextDecoder().decode(pt);
}

export const acceptCreatorRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ version: z.number().int().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creators").update({ rules_accepted_at: new Date().toISOString(), rules_version: data.version }).eq("id", me.id);
    return { ok: true as const };
  });

export const toggleSetupGuideCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ key: z.string().regex(/^[1-7]$/), checked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const checks = { ...(me.setup_guide_checks ?? {}) } as Record<string, string>;
    if (data.checked) checks[data.key] = new Date().toISOString();
    else delete checks[data.key];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creators").update({ setup_guide_checks: checks }).eq("id", me.id);
    return { ok: true as const };
  });

export const registerSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      handle: z.string().trim().min(2).max(60).regex(/^@?[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots and underscores."),
       email: z.string().trim().email("Enter a complete email address, for example name@example.com.").max(255),
      password: z.string().min(1).max(200).optional(),
       phone: z.string().trim().max(40).refine((value) => value === "" || isValidInternationalPhone(value), "Enter a valid phone number with the country code.").optional().nullable(),
      device: z.string().trim().max(80).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const handle = data.handle.startsWith("@") ? data.handle : `@${data.handle}`;
    const { data: existing } = await supabaseAdmin.from("creator_social_accounts").select("id").eq("creator_id", me.id).maybeSingle();
    if (!existing && !data.password) throw new Error("Enter the account password.");
    const patch: any = { handle, account_email: data.email, phone: data.phone || null, device: data.device || null, updated_at: new Date().toISOString() };
    if (data.password) patch.password_encrypted = await encrypt(data.password);
    const { error } = existing
      ? await supabaseAdmin.from("creator_social_accounts").update(patch).eq("id", existing.id)
      : await supabaseAdmin.from("creator_social_accounts").insert({ creator_id: me.id, ...patch } as never);
    if (error) throw new Error("The account could not be saved.");
    await supabaseAdmin.from("creators").update({ social_handle: handle, social_account_created_at: me.social_account_created_at ?? new Date().toISOString() }).eq("id", me.id);
    return { ok: true as const };
  });

export const getMySocialAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("creator_social_accounts").select("handle, account_email, phone, device, registered_at").eq("creator_id", me.id).maybeSingle();
    return data ?? null;
  });

export const revealMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("creator_social_accounts").select("password_encrypted").eq("creator_id", me.id).maybeSingle();
    if (!data) throw new Error("No account registered.");
    return { password: await decrypt(data.password_encrypted) };
  });

export const tickWarmupDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
    .inputValidator((d) => z.object({ day: z.literal(1), checked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    if (!me.social_account_created_at) throw new Error("Register the account first.");
    const warmup = { ...(me.warmup ?? {}) } as Record<string, string>;
    if (data.checked) warmup[String(data.day)] = new Date().toISOString();
    else delete warmup[String(data.day)];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creators").update({ warmup }).eq("id", me.id);
    return { ok: true as const };
  });

export const markBriefSkipped = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ briefId: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { data: brief } = await context.supabase.from("briefs").select("title").eq("id", data.briefId).maybeSingle();
    if (!brief) throw new Error("Brief not found.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("brief_reads").upsert({ brief_id: data.briefId, creator_id: me.id, skipped_at: new Date().toISOString(), skip_reason: data.reason }, { onConflict: "brief_id,creator_id" });
    await supabaseAdmin.from("creator_messages").insert({ creator_id: me.id, from_admin: false, body: `Skipped brief "${brief.title}": ${data.reason}` });
    return { ok: true as const };
  });

export const reportPostViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      postId: z.string().uuid(),
      views: z.number().int().min(0).max(1_000_000_000),
      screenshotBase64: z.string().min(10).max(7_000_000),
      contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin.from("creator_posts").select("id, creator_id, posted_on").eq("id", data.postId).maybeSingle();
    if (!post || post.creator_id !== me.id) throw new Error("Post not found.");
    if (Date.now() - new Date(post.posted_on).getTime() < 7 * 86400000) throw new Error("Views can be reported 7 days after posting.");
    const path = `views/${me.id}/${post.id}.${data.contentType.split("/")[1]}`;
    const up = await supabaseAdmin.storage.from("creator-videos").upload(path, Buffer.from(data.screenshotBase64, "base64"), { contentType: data.contentType, upsert: true });
    if (up.error) throw new Error("The screenshot could not be uploaded.");
    await supabaseAdmin.from("creator_posts").update({ views: data.views, views_entered_at: new Date().toISOString(), views_screenshot_path: path }).eq("id", post.id);
    return { ok: true as const };
  });

export const markMyMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("creator_messages").update({ read_at: new Date().toISOString() }).eq("creator_id", me.id).eq("from_admin", true).is("read_at", null);
    q = data.postId ? q.eq("post_id", data.postId) : q.is("post_id", null);
    await q;
    return { ok: true as const };
  });

export const saveCreatorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      country: z.string().trim().max(80).nullable(),
       phone: z.string().trim().max(40).refine((value) => value === "" || isValidInternationalPhone(value), "Enter a valid phone number with the country code.").nullable(),
      platform: z.enum(["ios", "android"]).nullable(),
      photoBase64: z.string().max(7_000_000).optional(),
      photoType: z.enum(["image/png", "image/jpeg", "image/webp"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { country: data.country || null, phone: data.phone || null, platform: data.platform };
    if (data.photoBase64 && data.photoType) {
      const path = `photos/${me.id}.${data.photoType.split("/")[1]}`;
      const up = await supabaseAdmin.storage.from("creator-videos").upload(path, Buffer.from(data.photoBase64, "base64"), { contentType: data.photoType, upsert: true });
      if (up.error) throw new Error("The photo could not be uploaded.");
      patch.photo_path = path;
    }
    await supabaseAdmin.from("creators").update(patch).eq("id", me.id);
    return { ok: true as const };
  });

export const getMyPhotoUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await myCreator(context.supabase, context.userId);
    if (!me.photo_path) return { url: null as string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage.from("creator-videos").createSignedUrl(me.photo_path, 3600);
    return { url: data?.signedUrl ?? null };
  });

/** Posts are logged only once the three blocking onboarding steps are done. */
export const logPostChecked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    url: z.string().trim().url().max(500).refine((v) => v.startsWith("https://"), "Use a secure post link."),
    platform: z.enum(["tiktok", "instagram"]),
    briefId: z.string().uuid().nullable(),
    referenceVideoId: z.string().uuid().nullable(),
    postedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { data: sig } = await context.supabase.from("creator_signatures").select("id").eq("creator_id", me.id).maybeSingle();
    const warm = (me.warmup ?? {}) as Record<string, string>;
    if (!me.rules_accepted_at || !sig || !me.social_account_created_at || WARMUP_REQUIRED.some((d) => !warm[String(d)]))
      throw new Error("Finish onboarding steps 1 to 3 before logging posts.");
    const today = new Date().toISOString().slice(0, 10);
    if (data.postedOn > today) throw new Error("The date cannot be in the future.");
    if (data.briefId) {
      // RLS only returns briefs from apps the creator is actively enrolled in.
      const { data: visible } = await context.supabase.from("briefs").select("id").eq("id", data.briefId).maybeSingle();
      if (!visible) throw new Error("This brief is not available to you.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("creator_posts").insert({
      creator_id: me.id, url: data.url, platform: data.platform, brief_id: data.briefId,
      reference_video_id: data.referenceVideoId, posted_on: data.postedOn,
    });
    if (error) throw new Error("The post could not be logged.");
    await supabaseAdmin.from("creators").update({ status: "active", onboarding_completed_at: new Date().toISOString() }).eq("id", me.id).is("onboarding_completed_at", null);
    return { ok: true as const };
  });

/* ---------------- Admin ---------------- */

export const adminCreatorDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await adminProfile(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: account }, { data: sig }, { data: payout }] = await Promise.all([
      supabaseAdmin.from("creator_social_accounts").select("handle, account_email, phone, device, registered_at").eq("creator_id", data.creatorId).maybeSingle(),
      supabaseAdmin.from("creator_signatures").select("signed_at, variant, document_version, signed_name").eq("creator_id", data.creatorId).maybeSingle(),
      supabaseAdmin.from("creator_payout_profiles").select("method, stripe_onboarded, wise_email, paypal_email").eq("creator_id", data.creatorId).maybeSingle(),
    ]);
    return { account: account ?? null, signature: sig ?? null, payout: payout ?? null };
  });

export const adminRevealCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await adminProfile(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("creator_social_accounts").select("handle, account_email, password_encrypted").eq("creator_id", data.creatorId).maybeSingle();
    if (!row) throw new Error("No account registered.");
    await supabaseAdmin.from("activity_log").insert({ actor_id: admin.id, entity: "creator", entity_id: data.creatorId, action: "credentials_revealed", comment: row.handle });
    return { handle: row.handle, email: row.account_email, password: await decrypt(row.password_encrypted) };
  });

export const adminAssignCreatorCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creatorId: z.string().uuid(), platform: z.enum(["ios", "android"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await adminProfile(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: code } = await supabaseAdmin.from("access_codes").select("id, code, redeem_url").eq("state", "available").eq("platform", data.platform).is("assigned_to", null).is("assigned_creator_id", null).order("created_at").limit(1).maybeSingle();
    if (!code) throw new Error(`No ${data.platform === "ios" ? "Apple" : "Google"} code left in the pool.`);
    await supabaseAdmin.from("access_codes").update({ state: "assigned", assigned_creator_id: data.creatorId, assigned_at: new Date().toISOString() }).eq("id", code.id);
    await supabaseAdmin.from("creators").update({ access_code: code.code, access_redeem_url: code.redeem_url, platform: data.platform }).eq("id", data.creatorId);
    await supabaseAdmin.from("activity_log").insert({ actor_id: admin.id, entity: "creator", entity_id: data.creatorId, action: "access_code_assigned", comment: data.platform });
    return { ok: true as const };
  });
