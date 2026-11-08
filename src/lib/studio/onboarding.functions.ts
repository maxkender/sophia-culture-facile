import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { APP_LANGS, creatorSlug, defaultDisplayName, uniqueSlug } from "./onboarding";

/**
 * Self sign-up: creates the author profile for a newly verified account (pending creator).
 * Invited professors already have a profile linked by the invite flow, so this is a no-op for them.
 * Accounts that belong to the creator/influencer programmes are never turned into authors.
 */
export const ensureStudioProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: own } = await context.supabase.from("profiles").select("id, onboarding_step").eq("user_id", context.userId).maybeSingle();
    if (own) return { ok: true as const, created: false, step: own.onboarding_step };

    const email = String((context.claims as Record<string, unknown>)["email"] ?? "").toLowerCase();
    const emailConfirmed = Boolean((context.claims as Record<string, unknown>)["email"]);
    if (!email || !emailConfirmed) return { ok: false as const, reason: "email" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: creator }, { data: influencer }] = await Promise.all([
      supabaseAdmin.from("creators").select("id").eq("user_id", context.userId).maybeSingle(),
      supabaseAdmin.from("influencers").select("id").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (creator || influencer) return { ok: false as const, reason: "other_space" as const };

    // A desk-created profile waiting for this email is linked through the invitation, never here.
    const { data: pendingInvite } = await supabaseAdmin.from("profiles").select("id").ilike("email", email).is("user_id", null).maybeSingle();
    if (pendingInvite) return { ok: false as const, reason: "invited" as const };

    const { data: created, error } = await supabaseAdmin
      .from("profiles")
      .insert({ user_id: context.userId, email, full_name: email.split("@")[0] ?? "Author", role: "author", self_registered: true, onboarding_step: "identity", activated_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error || !created) throw new Error("Your profile could not be created.");
    await supabaseAdmin.from("activity_log").insert({ actor_id: created.id, entity: "author", entity_id: created.id, action: "studio_signup", comment: "Self sign-up" });
    return { ok: true as const, created: true, step: "identity" };
  });

/** Step 1: names + writing language. Also gives the profile its creator slug the first time. */
export const saveIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      displayName: z.string().trim().max(160).optional(),
      writingLang: z.enum(APP_LANGS),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase.from("profiles").select("id, creator_slug, onboarding_step").eq("user_id", context.userId).maybeSingle();
    if (!profile) throw new Error("No author profile is linked to this account.");
    const displayName = data.displayName || defaultDisplayName(data.firstName, data.lastName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let slug = profile.creator_slug;
    if (!slug) {
      const base = creatorSlug(displayName);
      const { data: taken } = await supabaseAdmin.from("profiles").select("creator_slug").like("creator_slug", `${base}%`);
      slug = uniqueSlug(base, (taken ?? []).map((r) => r.creator_slug).filter(Boolean) as string[]);
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: displayName,
        full_name: defaultDisplayName(data.firstName, data.lastName),
        writing_lang: data.writingLang,
        creator_slug: slug,
        onboarding_step: profile.onboarding_step === "identity" || !profile.onboarding_step ? "credentials" : profile.onboarding_step,
      })
      .eq("id", profile.id);
    if (error) throw new Error("Your details could not be saved.");
    return { ok: true as const, slug };
  });

/** Desk: approve or suspend a creator; also edits the slug and the verified badge. */
export const setCreatorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid(), status: z.enum(["pending", "approved", "suspended"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: me } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Forbidden");
    const { error } = await context.supabase.from("profiles").update({ creator_status: data.status }).eq("id", data.profileId);
    if (error) throw new Error("The status could not be changed.");
    await context.supabase.from("activity_log").insert({ actor_id: me.id, entity: "author", entity_id: data.profileId, action: `creator_${data.status}`, comment: null });
    return { ok: true as const };
  });
