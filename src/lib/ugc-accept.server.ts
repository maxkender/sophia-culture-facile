// Server-only: the one UGC acceptance flow (creator record, invite token, Brevo welcome email, access code).
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function acceptApplication(supabaseAdmin: Admin, applicationId: string, origin: string, decidedBy: string | null, notes?: string | null) {
    const { data: application } = await supabaseAdmin
      .from("creator_applications")
      .select("id, full_name, email, country, status, created_creator_id, ref_handle, app_id")
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
          ugc_status: "active",
          invite_token: inviteToken,
        })
        .select("id")
        .single();
      if (error || !creator) throw new Error("The creator account could not be prepared.");
      creatorId = creator.id;
    } else {
      await supabaseAdmin.from("creators").update({ invite_token: inviteToken, status: "onboarding", ugc_status: "active" }).eq("id", creatorId);
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

    // Every UGC creator works on every active app; enrolments become active only now.
    const appOf = (application as { app_id?: string | null }).app_id ?? "00000000-0000-4000-8000-000000000001";
    const { data: activeApps } = await supabaseAdmin.from("apps").select("id").eq("active", true);
    const allApps = [...new Set([appOf, ...((activeApps ?? []) as { id: string }[]).map((a) => a.id)])];
    await supabaseAdmin.from("creator_apps").upsert(allApps.map((app_id) => ({ creator_id: creatorId, app_id, status: "active" })), { onConflict: "creator_id,app_id" });

    // Affiliates: link the referrer named in ?ref=<handle> (never self-referral).
    const ref = String((application as { ref_handle?: string | null }).ref_handle ?? "").trim().replace(/^@/, "").toLowerCase();
    if (ref) {
      const { data: referrer } = await supabaseAdmin.from("creators").select("id")
        .or(`tiktok_handle.ilike.${ref},instagram_handle.ilike.${ref},tiktok_handle.ilike.@${ref},instagram_handle.ilike.@${ref}`).limit(1).maybeSingle();
      if (referrer && referrer.id !== creatorId) await supabaseAdmin.from("referrals").upsert({ referrer_creator_id: referrer.id, referee_creator_id: creatorId, ref_handle: ref }, { onConflict: "referee_creator_id", ignoreDuplicates: true });
    }

    const inviteUrl = `${origin.replace(/\/$/, "")}/creators/invite?token=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(application.email)}`;

    const { sendTemplated, emailLang } = await import("./ugc-email.server");
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

/** Admin "Add creator": same onboarding as Accept, for creators recruited outside the site (no application row). */
export async function inviteCreatorDirect(supabaseAdmin: Admin, input: { firstName: string; lastName: string; email: string; country: string | null; language: "fr" | "en"; tiktok: string | null; instagram: string | null; appIds: string[] }, origin: string) {
  const email = input.email.trim().toLowerCase();
  const { data: clash } = await supabaseAdmin.from("creators").select("id").eq("track", "ugc").ilike("email", email).maybeSingle();
  if (clash) return { ok: false as const, error: "A creator with this email already exists.", creatorId: clash.id as string };
  const inviteToken = randomToken();
  const { data: creator, error } = await supabaseAdmin.from("creators").insert({
    track: "ugc", full_name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(), email, country: input.country,
    language: input.language, tiktok_handle: input.tiktok, instagram_handle: input.instagram,
    status: "onboarding", ugc_status: "active", is_test: false, terms_visible: false, invite_token: inviteToken,
  }).select("id").single();
  if (error || !creator) return { ok: false as const, error: "The creator could not be created." };
  const creatorId = creator.id as string;
  const { data: activeApps } = await supabaseAdmin.from("apps").select("id").eq("active", true);
  const apps = input.appIds.length ? input.appIds : ((activeApps ?? []) as { id: string }[]).map((a) => a.id);
  if (apps.length) await supabaseAdmin.from("creator_apps").upsert(apps.map((app_id) => ({ creator_id: creatorId, app_id, status: "active" })), { onConflict: "creator_id,app_id" });
  const { assignAppCode } = await import("./access-codes.server");
  for (const appId of apps.length ? apps : [null]) await assignAppCode(supabaseAdmin, creatorId, appId);
  const send = await sendCreatorInvite(supabaseAdmin, creatorId, origin);
  return { ok: true as const, creatorId, emailSent: send.sent, emailReason: send.note ?? null };
}

/** (Re)sends the welcome email with the password link, in the creator's language. */
export async function sendCreatorInvite(supabaseAdmin: Admin, creatorId: string, origin: string) {
  const { data: c } = await supabaseAdmin.from("creators").select("id, full_name, email, country, language, invite_token").eq("id", creatorId).maybeSingle();
  if (!c) throw new Error("Creator not found.");
  let token = c.invite_token as string | null;
  if (!token) { token = randomToken(); await supabaseAdmin.from("creators").update({ invite_token: token }).eq("id", creatorId); }
  const url = `${origin.replace(/\/$/, "")}/creators/invite?token=${encodeURIComponent(token)}&email=${encodeURIComponent(c.email)}`;
  const { sendTemplated, emailLang } = await import("./ugc-email.server");
  return sendTemplated(supabaseAdmin, "ugc-welcome", String(c.email).toLowerCase(), c.full_name, url, emailLang(c.language, c.country));
}
