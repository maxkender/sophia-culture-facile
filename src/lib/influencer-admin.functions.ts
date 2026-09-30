import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTier } from "@/i18n/influencers";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id as string;
}

/** Accept an influencer application: creates the influencers row, computes the tier, prepares an invite token. */
export const acceptInfluencerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid(), notes: z.string().max(4000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const adminId = await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("influencer_applications").select("*").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found");
    if (app.created_influencer_id) return { ok: true as const, influencerId: app.created_influencer_id };
    const { data: settings } = await supabaseAdmin.from("influencer_settings").select("tier_bounds").eq("id", 1).maybeSingle();
    const max = Math.max(app.tiktok_followers ?? 0, app.instagram_followers ?? 0, app.youtube_subscribers ?? 0);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    const { data: inf, error } = await supabaseAdmin
      .from("influencers")
      .insert({
        application_id: app.id, display_name: app.full_name, legal_name: app.full_name, email: app.email.toLowerCase(),
        phone: app.phone, country: app.country, city: app.city, languages: app.languages, niche_tags: app.niche_tags,
        tiktok_url: app.tiktok_url, tiktok_followers: app.tiktok_followers, tiktok_avg_views: app.tiktok_avg_views,
        instagram_url: app.instagram_url, instagram_followers: app.instagram_followers,
        youtube_url: app.youtube_url, youtube_subscribers: app.youtube_subscribers,
        tier: computeTier(max, (settings?.tier_bounds as any) ?? undefined),
        rate_tiktok: app.rate_tiktok, rate_reel: app.rate_reel, accepts_recurring: app.accepts_recurring,
        agency_name: app.agency_name, agency_contact: app.agency_contact, media_kit_path: app.media_kit_path, media_kit_url: app.media_kit_url,
        assigned_hm_id: app.assigned_hm_id, invite_token: token,
      })
      .select("id")
      .single();
    if (error || !inf) throw new Error("Could not create the influencer");
    await supabaseAdmin
      .from("influencer_applications")
      .update({ status: "accepted", decided_at: new Date().toISOString(), decided_by: adminId, created_influencer_id: inf.id, admin_notes: data.notes ?? app.admin_notes })
      .eq("id", app.id);
    return { ok: true as const, influencerId: inf.id };
  });
