import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InviteState = "ok" | "invalid" | "used" | "expired";

export type InvitePreview = {
  state: InviteState;
  profile: {
    id: string;
    full_name: string;
    email: string;
    title: string | null;
    institution: string | null;
    country: string | null;
    bio: string | null;
    platform: string | null;
    photo_url: string | null;
  } | null;
  courses: { id: string; title: string; subtitle: string | null; lot_code: string | null; subject_area: string | null; due_date: string | null }[];
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

function inviteState(profile: { activated_at: string | null; invite_expires_at: string | null } | null): InviteState {
  if (!profile) return "invalid";
  if (profile.activated_at) return "used";
  if (profile.invite_expires_at && new Date(profile.invite_expires_at).getTime() < Date.now()) return "expired";
  return "ok";
}

async function accountExists(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return (data?.users ?? []).some((user) => (user.email ?? "").toLowerCase() === email.toLowerCase());
}

/** Public: shows the invited author the profile the desk already built for them. */
export const getInvite = createServerFn({ method: "POST" })
  .inputValidator((data) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<InvitePreview> => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") {
      return { state, profile: null, courses: [], hasAccount: false };
    }

    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("id, title, subtitle, lot_code, subject_area, due_date")
      .eq("author_id", profile.id)
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
        institution: profile.institution,
        country: profile.country,
        bio: profile.bio,
        platform: profile.platform,
        photo_url: photo,
      },
      courses: courses ?? [],
      hasAccount: await accountExists(profile.email),
    };
  });

/** Public: creates the auth account for an invited author and links it to their existing profile. */
export const claimInvite = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ token: z.string().min(4).max(200), password: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") return { ok: false as const, state };

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      password: data.password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      return { ok: false as const, state: "account" as const };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        user_id: created.user.id,
        activated_at: new Date().toISOString(),
        invite_token: null,
        invite_expires_at: null,
      })
      .eq("id", profile.id)
      .is("activated_at", null);
    if (error) return { ok: false as const, state: "used" as const };

    await supabaseAdmin.from("activity_log").insert({
      actor_id: profile.id,
      entity: "author",
      entity_id: profile.id,
      action: "invite_claimed",
      comment: "Password account created",
    });

    return { ok: true as const, email: profile.email, state: "ok" as const };
  });

/** Public: makes sure an auth account exists so a magic link can be sent to an invited author. */
export const prepareMagicClaim = createServerFn({ method: "POST" })
  .inputValidator((data) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin, profile } = await loadInvite(data.token);
    const state = inviteState(profile);
    if (!profile || state !== "ok") return { ok: false as const, state };
    if (!(await accountExists(profile.email))) {
      await supabaseAdmin.auth.admin.createUser({ email: profile.email, email_confirm: true });
    }
    return { ok: true as const, email: profile.email };
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
    if (profile.email.toLowerCase() !== claimEmail) {
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
        invite_token: null,
        invite_expires_at: null,
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
