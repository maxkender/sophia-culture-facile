import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InviteState = "ok" | "invalid" | "used" | "expired";

export type InvitePreview = {
  state: InviteState;
  /** Who the link belonged to, when it has already been used to create an account. */
  usedProfile: { full_name: string; email: string | null } | null;
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    title: string | null;
    display_name: string | null;
    display_title: string | null;
    institution: string | null;
    country: string | null;
    bio: string | null;
    short_bio: string | null;
    orcid: string | null;
    personal_site: string | null;
    scholar_url: string | null;
    platform: string | null;
    photo_url: string | null;
  } | null;
  education: { degree: string | null; field: string | null; institution: string | null; year: string | null }[];
  courses: { id: string; title: string; subtitle: string | null; lot_code: string | null; lot_name: string | null; subject_area: string | null; due_date: string | null }[];
  hasAccount: boolean;
};

const tokenSchema = z.object({ token: z.string().min(4).max(200) });

async function loadInvite(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("invite_token", token)
    .maybeSingle();
  return { supabaseAdmin, profile };
}

/**
 * A consumed token is cleared from the profile, so returning authors clicking their
 * only link would otherwise get "invalid". We remember the token they used, and for
 * links consumed before that was recorded we recognise the seeded `inv_seed_NN_name`
 * shape by matching the first name of an already-activated author.
 */
async function loadConsumedInvite(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: recorded } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, activated_at")
    .eq("used_invite_token", token)
    .maybeSingle();
  if (recorded) return recorded;

  const seeded = /^inv_seed_\d+_([a-z-]+)$/i.exec(token.trim());
  if (!seeded) return null;
  const firstName = (seeded[1] ?? "").toLowerCase();
  if (firstName.length < 3) return null;
  const { data: candidates } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, activated_at")
    .not("activated_at", "is", null)
    .ilike("full_name", `${firstName} %`);
  if (!candidates || candidates.length !== 1) return null;
  return candidates[0];
}

function inviteState(
  profile: { activated_at: string | null; invite_expires_at: string | null; is_test?: boolean } | null,
): InviteState {
  if (!profile) return "invalid";
  // The internal test account keeps a reusable invite so the flow can be replayed.
  if (profile.is_test) return "ok";
  if (profile.activated_at) return "used";
  if (profile.invite_expires_at && new Date(profile.invite_expires_at).getTime() < Date.now()) return "expired";
  return "ok";
}

async function findUserByEmail(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return (data?.users ?? []).find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;
}

async function accountExists(email: string) {
  return Boolean(await findUserByEmail(email));
}

/** Public: shows the invited author the profile the desk already built for them. */
export const getInvite = createServerFn({ method: "POST" })
  .inputValidator((data) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<InvitePreview> => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") {
      const consumed = state === "expired" ? null : await loadConsumedInvite(data.token);
      const used = consumed ?? (profile && state === "used" ? profile : null);
      return {
        state: used ? "used" : state,
        usedProfile: used ? { full_name: used.full_name, email: used.email } : null,
        profile: null,
        courses: [],
        education: [],
        hasAccount: false,
      };
    }

    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("id, title, subtitle, lot_code, lot_name, subject_area, due_date")
      .eq("author_id", profile.id)
      .order("order_index");

    const { data: education } = await supabaseAdmin
      .from("education_records")
      .select("degree, field, institution, year")
      .eq("profile_id", profile.id)
      .order("order_index");

    let photo: string | null = null;
    if (profile.photo_url) {
      const { data: signed } = await supabaseAdmin.storage
        .from("author-photos")
        .createSignedUrl(profile.photo_url, 60 * 30);
      photo = signed?.signedUrl ?? null;
    }

    return {
      state: "ok",
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        title: profile.title,
        display_name: profile.display_name ?? profile.full_name,
        display_title: profile.display_title,
        institution: profile.institution,
        country: profile.country,
        bio: profile.bio,
        short_bio: profile.short_bio,
        orcid: profile.orcid,
        personal_site: profile.personal_site,
        scholar_url: profile.scholar_url,
        platform: profile.platform,
        photo_url: photo,
      },
      courses: courses ?? [],
      education: (education ?? []).map((row) => ({
        degree: row.degree,
        field: row.field,
        institution: row.institution,
        year: row.year,
      })),
      hasAccount: profile.email ? await accountExists(profile.email) : false,
    };
  });

/** The author may have been created without an email; they supply their own when claiming. */
async function resolveClaimEmail(
  profile: { id: string; email: string | null },
  provided: string | undefined,
): Promise<{ email: string } | { error: "missing" | "taken" }> {
  if (profile.email) return { email: profile.email.toLowerCase() };
  const email = (provided ?? "").trim().toLowerCase();
  if (!email) return { error: "missing" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: clash } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (clash && clash.id !== profile.id) return { error: "taken" };
  await supabaseAdmin.from("profiles").update({ email }).eq("id", profile.id);
  return { email };
}

/** Public: creates the auth account for an invited author and links it to their existing profile. */
export const claimInvite = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(4).max(200),
        password: z.string().min(8).max(200),
        email: z.string().email().max(200).optional(),
        declaration: z.literal(true),
        userAgent: z.string().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") return { ok: false as const, state };

    const resolved = await resolveClaimEmail(profile, data.email);
    if ("error" in resolved) return { ok: false as const, state: resolved.error };

    // An account may already exist for this address (test account, or a retried claim).
    // Reuse it — but never steal a login that already belongs to another author.
    const existingUser = await findUserByEmail(resolved.email);
    if (existingUser) {
      const { data: owner } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();
      if (owner && owner.id !== profile.id) return { ok: false as const, state: "taken" as const };
    }

    let userId: string;
    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: data.password,
        email_confirm: true,
      });
      if (updateError) return { ok: false as const, state: "account" as const };
      userId = existingUser.id;
    } else {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: resolved.email,
        password: data.password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        return { ok: false as const, state: "account" as const };
      }
      userId = created.user.id;
    }

    // The declaration is tied to the values the author actually declared, so snapshot them now.
    const { data: current } = await supabaseAdmin
      .from("profiles")
      .select("display_name, display_title, institution")
      .eq("id", profile.id)
      .maybeSingle();
    const { data: declaredEducation } = await supabaseAdmin
      .from("education_records")
      .select("degree, field, institution, year")
      .eq("profile_id", profile.id)
      .order("order_index");

    const headers = getRequest()?.headers;
    const forwarded = headers?.get("x-forwarded-for") ?? "";
    const declarationIp =
      headers?.get("cf-connecting-ip") ?? (forwarded ? forwarded.split(",")[0]?.trim() : null) ?? null;

    const now = new Date().toISOString();
    const query = supabaseAdmin
      .from("profiles")
      .update({
        user_id: userId,
        activated_at: now,
        declaration_accepted_at: now,
        declaration_ip: declarationIp,
        declaration_user_agent: data.userAgent ?? headers?.get("user-agent") ?? null,
        declaration_snapshot: {
          display_name: current?.display_name ?? profile.display_name ?? profile.full_name ?? null,
          display_title: current?.display_title ?? profile.display_title ?? null,
          institution: current?.institution ?? profile.institution ?? null,
          education: declaredEducation ?? [],
        },
        ...(profile.is_test ? {} : { invite_token: null, invite_expires_at: null }),
      })
      .eq("id", profile.id);
    const { error } = profile.is_test ? await query : await query.is("activated_at", null);
    if (error) return { ok: false as const, state: "used" as const };

    await supabaseAdmin.from("activity_log").insert({
      actor_id: profile.id,
      entity: "author",
      entity_id: profile.id,
      action: "invite_claimed",
      comment: "Password account created",
    });

    return { ok: true as const, email: resolved.email, state: "ok" as const };
  });

/** Public: makes sure an auth account exists so a magic link can be sent to an invited author. */
export const prepareMagicClaim = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ token: z.string().min(4).max(200), email: z.string().email().max(200).optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") return { ok: false as const, state };
    const resolved = await resolveClaimEmail(profile, data.email);
    if ("error" in resolved) return { ok: false as const, state: resolved.error };
    if (!(await accountExists(resolved.email))) {
      await supabaseAdmin.auth.admin.createUser({ email: resolved.email, email_confirm: true });
    }
    return { ok: true as const, email: resolved.email };
  });

/** Links a signed-in account to the invited profile (magic-link return path). */
export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => tokenSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    if (!profile) return { ok: false as const, reason: "invalid" as const };
    if (profile.invite_expires_at && new Date(profile.invite_expires_at).getTime() < Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }

    const claimEmail = String((context.claims as Record<string, unknown>)["email"] ?? "").toLowerCase();
    if (!profile.email && claimEmail) {
      const adopted = await resolveClaimEmail(profile, claimEmail);
      if ("error" in adopted) return { ok: false as const, reason: "taken" as const };
    } else if ((profile.email ?? "").toLowerCase() !== claimEmail) {
      return { ok: false as const, reason: "email" as const, expected: profile.email };
    }
    if (profile.user_id && profile.user_id !== context.userId) {
      return { ok: false as const, reason: "taken" as const };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        user_id: context.userId,
        activated_at: profile.activated_at ?? new Date().toISOString(),
        ...(profile.is_test ? {} : { invite_token: null, invite_expires_at: null }),
      })
      .eq("id", profile.id);
    if (error) throw new Error("The invite could not be activated.");

    await supabaseAdmin.from("activity_log").insert({
      actor_id: profile.id,
      entity: "author",
      entity_id: profile.id,
      action: "invite_claimed",
      comment: "Magic link",
    });

    return { ok: true as const };
  });

export const signAgreement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        signedName: z.string().min(2).max(160),
        documentVersion: z.string().min(1).max(40),
        userAgent: z.string().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const request = getRequest();
    const headers = request?.headers;
    const forwarded = headers?.get("x-forwarded-for") ?? "";
    const ip =
      headers?.get("cf-connecting-ip") ?? (forwarded ? forwarded.split(",")[0]?.trim() : null) ?? null;
    const userAgent = data.userAgent ?? headers?.get("user-agent") ?? null;

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profileError || !profile) throw new Error("No author record is linked to this account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // One signature per author: the database enforces it too.
    const { data: existing } = await supabaseAdmin
      .from("contracts")
      .select("signed_at")
      .eq("author_id", profile.id)
      .maybeSingle();
    if (existing) return { ok: true as const, alreadySigned: true, signedAt: existing.signed_at };

    const { error } = await supabaseAdmin.from("contracts").insert({
      author_id: profile.id,
      document_version: data.documentVersion,
      signed_name: data.signedName,
      signature_ip: ip,
      user_agent: userAgent,
    });
    if (error) throw new Error("The signature could not be recorded.");

    await supabaseAdmin.from("activity_log").insert({
      actor_id: profile.id,
      entity: "contract",
      entity_id: profile.id,
      action: "contract_signed",
      comment: `Version ${data.documentVersion}`,
    });

    return { ok: true as const, alreadySigned: false, signedAt: new Date().toISOString() };
  });

const platformSchema = z.enum(["ios", "android"]);

/**
 * Makes sure the author holds a code they can actually redeem: a code for the
 * wrong store goes back to the pool and a matching one is taken from it.
 */
async function applyPlatform(profileId: string, platform: "ios" | "android", isTest: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: held } = await supabaseAdmin
    .from("access_codes")
    .select("id, platform, code, redeem_url")
    .eq("assigned_to", profileId);

  const rows = held ?? [];
  const keep = rows.find((row) => row.platform === platform) ?? null;
  const wrong = rows.filter((row) => row.platform !== platform);
  if (wrong.length > 0) {
    await supabaseAdmin
      .from("access_codes")
      .update({ state: "available", assigned_to: null, assigned_at: null })
      .in(
        "id",
        wrong.map((row) => row.id),
      );
  }

  let code: { code: string; redeem_url: string | null } | null = keep
    ? { code: keep.code, redeem_url: keep.redeem_url }
    : null;

  // The internal test profile never holds a real store code.
  if (!code && !isTest) {
    const { data: free } = await supabaseAdmin
      .from("access_codes")
      .select("id, code, redeem_url")
      .eq("platform", platform)
      .eq("state", "available")
      .is("assigned_to", null)
      .limit(1)
      .maybeSingle();
    if (free) {
      await supabaseAdmin
        .from("access_codes")
        .update({ state: "assigned", assigned_to: profileId, assigned_at: new Date().toISOString() })
        .eq("id", free.id);
      code = { code: free.code, redeem_url: free.redeem_url };
    }
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      platform,
      access_code: code?.code ?? null,
      access_redeem_url: code?.redeem_url ?? null,
    })
    .eq("id", profileId);

  return { ok: true as const, code: code?.code ?? null, redeemUrl: code?.redeem_url ?? null };
}

/** Public: the invited author picks their store before claiming the profile. */
export const setInvitePlatform = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ token: z.string().min(4).max(200), platform: platformSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    const { profile } = await loadInvite(data.token);
    if (!profile || inviteState(profile) !== "ok") return { ok: false as const, code: null, redeemUrl: null };
    return applyPlatform(profile.id, data.platform, Boolean(profile.is_test));
  });

/** The author changes their store from their own space. */
export const setMyPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ platform: platformSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, is_test")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false as const, code: null, redeemUrl: null };
    return applyPlatform(profile.id, data.platform, Boolean(profile.is_test));
  });

/** Public: lets an invited author correct their own details before they claim the profile. */
export const updateInviteProfile = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(4).max(200),
        title: z.string().max(200).optional(),
        display_name: z.string().max(200).optional(),
        display_title: z.string().max(300).optional(),
        institution: z.string().max(200).optional(),
        country: z.string().max(120).optional(),
        bio: z.string().max(1200).optional(),
        short_bio: z.string().max(300).optional(),
        orcid: z.string().max(200).optional(),
        personal_site: z.string().max(300).optional(),
        scholar_url: z.string().max(300).optional(),
        education: z
          .array(
            z.object({
              degree: z.string().max(120).optional(),
              field: z.string().max(160).optional(),
              institution: z.string().max(200).optional(),
              year: z.string().max(20).optional(),
            }),
          )
          .max(12)
          .optional(),
        photo: z
          .object({ name: z.string().max(200), dataUrl: z.string().max(7_000_000) })
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    if (!profile || inviteState(profile) !== "ok") return { ok: false as const };

    const clean = (value: string | undefined) =>
      value === undefined ? undefined : value.trim() === "" ? null : value.trim();

    let photoPath: string | undefined;
    if (data.photo) {
      const base64 = data.photo.dataUrl.split(",")[1] ?? "";
      const type = data.photo.dataUrl.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg";
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const path = `${profile.id}/${Date.now()}-${data.photo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
      const { error } = await supabaseAdmin.storage
        .from("author-photos")
        .upload(path, bytes, { contentType: type, upsert: true });
      if (!error) photoPath = path;
    }

    const patch = {
      ...(data.title !== undefined ? { title: clean(data.title) ?? null } : {}),
      ...(data.display_name !== undefined ? { display_name: clean(data.display_name) ?? null } : {}),
      ...(data.short_bio !== undefined ? { short_bio: clean(data.short_bio) ?? null } : {}),
      ...(data.orcid !== undefined ? { orcid: clean(data.orcid) ?? null } : {}),
      ...(data.personal_site !== undefined ? { personal_site: clean(data.personal_site) ?? null } : {}),
      ...(data.scholar_url !== undefined ? { scholar_url: clean(data.scholar_url) ?? null } : {}),
      ...(data.display_title !== undefined ? { display_title: clean(data.display_title) ?? null } : {}),
      ...(data.institution !== undefined ? { institution: clean(data.institution) ?? null } : {}),
      ...(data.country !== undefined ? { country: clean(data.country) ?? null } : {}),
      ...(data.bio !== undefined ? { bio: clean(data.bio) ?? null } : {}),
      ...(photoPath ? { photo_url: photoPath } : {}),
    };

    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", profile.id);
    if (error) return { ok: false as const };

    // The education list is replaced wholesale: it is short and always sent complete.
    if (data.education) {
      const rows = data.education
        .filter((row) => (row.degree ?? "").trim() || (row.field ?? "").trim() || (row.institution ?? "").trim())
        .map((row, index) => ({
          profile_id: profile.id,
          degree: clean(row.degree) ?? null,
          field: clean(row.field) ?? null,
          institution: clean(row.institution) ?? null,
          year: clean(row.year) ?? null,
          order_index: index,
        }));
      await supabaseAdmin.from("education_records").delete().eq("profile_id", profile.id);
      if (rows.length > 0) await supabaseAdmin.from("education_records").insert(rows);
    }

    return { ok: true as const };
  });
