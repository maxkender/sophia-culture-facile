// Server-only: the one UGC acceptance flow (creator record, invite token, Brevo welcome email, access code).
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function acceptApplication(supabaseAdmin: Admin, applicationId: string, origin: string, decidedBy: string | null, notes?: string | null) {
    const { data: application } = await supabaseAdmin
      .from("creator_applications")
      .select("id, full_name, email, country, status, created_creator_id, ref_handle")
      .eq("id", applicationId)
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
        decided_by: decidedBy,
        admin_notes: notes || null,
        created_creator_id: creatorId,
      })
      .eq("id", application.id);

    // Affiliates: link the referrer named in ?ref=<handle> (never self-referral).
    const ref = String((application as { ref_handle?: string | null }).ref_handle ?? "").trim().replace(/^@/, "").toLowerCase();
    if (ref) {
      const { data: referrer } = await supabaseAdmin.from("creators").select("id")
        .or(`tiktok_handle.ilike.${ref},instagram_handle.ilike.${ref},tiktok_handle.ilike.@${ref},instagram_handle.ilike.@${ref}`).limit(1).maybeSingle();
      if (referrer && referrer.id !== creatorId) await supabaseAdmin.from("referrals").upsert({ referrer_creator_id: referrer.id, referee_creator_id: creatorId, ref_handle: ref }, { onConflict: "referee_creator_id", ignoreDuplicates: true });
    }

    const inviteUrl = `${origin.replace(/\/$/, "")}/creators/invite?token=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(application.email)}`;

    const { sendTemplated } = await import("./ugc-email.server");
    const send = await sendTemplated(supabaseAdmin, "ugc-welcome", application.email.toLowerCase(), application.full_name, inviteUrl, emailLang((application as { language?: string | null }).language, (application as { country?: string | null }).country));
    await supabaseAdmin.from("creator_applications").update({
      ...(send.sent ? { acceptance_email_sent_at: new Date().toISOString() } : {}),
      welcome_email_provider: send.provider, welcome_email_message_id: send.messageId, welcome_email_error: send.note,
    }).eq("id", application.id);
    // J. hand out the store code of each app the creator works on (Sophia by default), never another app's code.
    const { assignAppCode } = await import("./access-codes.server");
    const { data: enrolled } = await supabaseAdmin.from("creator_apps").select("app_id").eq("creator_id", creatorId).eq("status", "active");
    const appIds = (enrolled ?? []).map((e: { app_id: string }) => e.app_id);
    for (const appId of appIds.length ? appIds : [null]) await assignAppCode(supabaseAdmin, creatorId, appId);

    return { ok: true as const, creatorId, inviteUrl, emailSent: send.sent, emailReason: send.note ?? null, emailProvider: send.provider };
}
