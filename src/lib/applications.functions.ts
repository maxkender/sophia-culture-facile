import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { newInviteToken } from "@/lib/portal";

const decisionSchema = z.object({
  applicationId: z.string().uuid(),
  origin: z.string().url().max(300),
  note: z.string().max(2000).optional(),
});

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("profiles").select("id, role").eq("user_id", userId).maybeSingle();
  if (!data || data.role !== "admin") throw new Error("forbidden");
  return supabaseAdmin;
}


/** Admin: accepts a candidature, creates the author record and emails the access link. */
export const approveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => decisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const { data: application } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!application) return { ok: false as const, reason: "missing" as const };

    const email = application.email.toLowerCase();
    const platform = (application.platform ?? "ios") as "ios" | "android";

    let profileId = application.created_profile_id as string | null;
    let inviteToken: string | null = null;

    if (profileId) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("invite_token")
        .eq("id", profileId)
        .maybeSingle();
      inviteToken = existing?.invite_token ?? null;
    }

    if (!profileId) {
      const { data: clash } = await supabaseAdmin.from("profiles").select("id, invite_token").eq("email", email).maybeSingle();
      if (clash) {
        profileId = clash.id;
        inviteToken = clash.invite_token;
      }
    }

    if (!inviteToken) {
      inviteToken = newInviteToken();
      if (profileId) {
        await supabaseAdmin.from("profiles").update({ invite_token: inviteToken, invited_at: new Date().toISOString() }).eq("id", profileId);
      }
    }

    if (!profileId) {
      const { data: codes } = await supabaseAdmin
        .from("access_codes")
        .select("*")
        .eq("state", "available")
        .eq("platform", platform)
        .order("code")
        .limit(1);
      const code = codes?.[0] ?? null;

      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          email,
          role: "author",
          full_name: application.full_name,
          institution: application.school,
          country: application.country,
          platform,
          bio: application.motivation,
          access_code: code?.code ?? null,
          access_redeem_url: code?.redeem_url ?? null,
          invite_token: inviteToken,
          invited_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error || !profile) return { ok: false as const, reason: "profile" as const };
      profileId = profile.id;

      if (code) {
        await supabaseAdmin
          .from("access_codes")
          .update({ state: "assigned", assigned_to: profile.id, assigned_at: new Date().toISOString() })
          .eq("id", code.id)
          .eq("state", "available");
      }
    }

    const inviteUrl = `${data.origin.replace(/\/$/, "")}/auteurs/invite?token=${encodeURIComponent(inviteToken)}`;


    await supabaseAdmin
      .from("applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        created_profile_id: profileId,
        admin_note: data.note ?? null,
      })
      .eq("id", application.id);

    return { ok: true as const, inviteUrl, profileId };
  });

/** Admin: declines a candidature. No email is sent. */
export const rejectApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ applicationId: z.string().uuid(), note: z.string().max(2000).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    await supabaseAdmin
      .from("applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), admin_note: data.note ?? null })
      .eq("id", data.applicationId);
    return { ok: true as const };
  });
