import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Team Slack — included verbatim in the acceptance email and in the onboarding checklist. */
export const SLACK_INVITE_URL = "https://join.slack.com/t/ugc-vikstudios/shared_invite/zt-4b6fwnseu-KrYV8Y0~IZ9C~7uo9HipbQ";
export const SLACK_INVITE_TEXT =
  "Travaillons ensemble dans UGC - Vik Studios sur Slack. Cette invitation n'a pas de date d'expiration :";
export const SLACK_INVITE_LABEL = "Join our Slack";

const originSchema = z.string().url().max(300).refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" || url.hostname === "localhost";
}, "Invalid site address");

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: profile } = await context.supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return profile.id as string;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const approveUgcApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ applicationId: z.string().uuid(), origin: originSchema, notes: z.string().trim().max(4000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const adminProfileId = await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: application } = await supabaseAdmin
      .from("creator_applications")
      .select("id, full_name, email, country, status, created_creator_id")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!application) throw new Error("Application not found.");

    let creatorId = application.created_creator_id;
    let inviteToken: string | null = null;
    if (creatorId) {
      const { data: existing } = await supabaseAdmin.from("creators").select("id, invite_token").eq("id", creatorId).maybeSingle();
      inviteToken = existing?.invite_token ?? null;
    }
    if (!creatorId) {
      const { data: existing } = await supabaseAdmin
        .from("creators")
        .select("id, invite_token")
        .eq("application_id", application.id)
        .maybeSingle();
      creatorId = existing?.id ?? null;
      inviteToken = existing?.invite_token ?? null;
    }
    if (!inviteToken) inviteToken = randomToken();

    if (!creatorId) {
      const { data: creator, error } = await supabaseAdmin
        .from("creators")
        .insert({
          application_id: application.id,
          track: "ugc",
          full_name: application.full_name,
          email: application.email.toLowerCase(),
          country: application.country,
          status: "onboarding",
          invite_token: inviteToken,
        })
        .select("id")
        .single();
      if (error || !creator) throw new Error("The creator account could not be prepared.");
      creatorId = creator.id;
    } else {
      await supabaseAdmin.from("creators").update({ invite_token: inviteToken, status: "onboarding" }).eq("id", creatorId);
    }

    await supabaseAdmin
      .from("creator_applications")
      .update({
        status: "approved",
        decided_at: new Date().toISOString(),
        decided_by: adminProfileId,
        admin_notes: data.notes || null,
        created_creator_id: creatorId,
      })
      .eq("id", application.id);

    const inviteUrl = `${data.origin.replace(/\/$/, "")}/creators/invite?token=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(application.email)}`;

    const { sendTemplated } = await import("./ugc-email.server");
    const send = await sendTemplated(supabaseAdmin, "ugc-welcome", application.email.toLowerCase(), application.full_name, inviteUrl);
    await supabaseAdmin.from("creator_applications").update({
      ...(send.sent ? { acceptance_email_sent_at: new Date().toISOString() } : {}),
      welcome_email_provider: send.provider, welcome_email_message_id: send.messageId, welcome_email_error: send.note,
    }).eq("id", application.id);
    // J. hand out an App Store code from the pool if the creator has none
    const { data: cr } = await supabaseAdmin.from("creators").select("access_code").eq("id", creatorId).maybeSingle();
    if (cr && !cr.access_code) {
      const { data: code } = await supabaseAdmin.from("access_codes").select("id, code, redeem_url").eq("state", "available").eq("platform", "ios").order("batch_label", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      if (code) {
        await supabaseAdmin.from("access_codes").update({ state: "assigned", assigned_creator_id: creatorId, assigned_at: new Date().toISOString() }).eq("id", code.id);
        await supabaseAdmin.from("creators").update({ access_code: code.code, access_redeem_url: code.redeem_url, platform: "ios" }).eq("id", creatorId);
      }
    }

    return { ok: true as const, creatorId, inviteUrl, emailSent: send.sent, emailReason: send.note ?? null, emailProvider: send.provider };
  });

export const saveCreatorEmailSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      subject: z.string().trim().min(1).max(160),
      intro: z.string().trim().min(1).max(3000),
      instructions: z.string().trim().min(1).max(5000),
      buttonLabel: z.string().trim().min(1).max(80),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const adminProfileId = await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("creator_email_settings").upsert({
      template_key: "ugc-acceptance",
      subject: data.subject,
      intro: data.intro,
      instructions: data.instructions,
      button_label: data.buttonLabel,
      updated_by: adminProfileId,
    }, { onConflict: "template_key" });
    if (error) throw new Error("Email settings could not be saved.");
    return { ok: true as const };
  });

export const completeSocialAccountStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      handle: z.string().trim().min(3).max(60).regex(/^@?[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots and underscores."),
      bio: z.string().trim().min(2).max(160),
      profilePictureConfirmed: z.literal(true),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: creator } = await context.supabase.from("creators").select("id").eq("user_id", context.userId).maybeSingle();
    if (!creator) throw new Error("Creator account not found.");
    const { data: signature } = await context.supabase.from("creator_signatures").select("id").eq("creator_id", creator.id).maybeSingle();
    if (!signature) throw new Error("Sign the agreement first.");
    const { error } = await supabaseAdmin.from("creators").update({
      social_handle: data.handle.startsWith("@") ? data.handle : `@${data.handle}`,
      social_bio: data.bio,
      profile_picture_confirmed: true,
      social_account_created_at: new Date().toISOString(),
      status: "first_post_pending",
    }).eq("id", creator.id);
    if (error) throw new Error("The account details could not be saved.");
    return { ok: true as const };
  });

export const logCreatorPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    url: z.string().trim().url().max(500).refine((value) => value.startsWith("https://"), "Use a secure post link."),
    platform: z.enum(["tiktok", "instagram", "youtube", "other"]),
    briefId: z.string().uuid().nullable(),
    referenceVideoId: z.string().uuid().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: creator } = await context.supabase
      .from("creators")
      .select("id, social_account_created_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!creator) throw new Error("Creator account not found.");
    if (!creator.social_account_created_at) throw new Error("Complete your Sophia account setup first.");
    const { error } = await supabaseAdmin.from("creator_posts").insert({
      creator_id: creator.id,
      url: data.url,
      platform: data.platform,
      brief_id: data.briefId,
      reference_video_id: data.referenceVideoId,
      posted_on: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error("The post could not be logged.");
    await supabaseAdmin.from("creators").update({ status: "active", onboarding_completed_at: new Date().toISOString() }).eq("id", creator.id).is("onboarding_completed_at", null);
    return { ok: true as const };
  });

export const joinCreatorSlack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: creator } = await context.supabase.from("creators").select("id").eq("user_id", context.userId).maybeSingle();
    if (!creator) throw new Error("Creator account not found.");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("creators").update({ slack_joined_at: now }).eq("id", creator.id);
    if (error) throw new Error("Slack step could not be recorded.");
    return { ok: true as const };
  });
