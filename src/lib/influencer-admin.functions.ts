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

/** Emails (or re-emails) the invite link to the influencer space. Returns the link so the admin can copy it. */
export const sendInfluencerInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ influencerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inf } = await supabaseAdmin.from("influencers").select("id, email, display_name, invite_token, user_id").eq("id", data.influencerId).maybeSingle();
    if (!inf) throw new Error("Influencer not found");
    if (inf.user_id) return { url: null, sent: false, reason: "already_linked" };
    let token = inf.invite_token;
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
      await supabaseAdmin.from("influencers").update({ invite_token: token }).eq("id", inf.id);
    }
    const origin = process.env["SITE_URL"] ?? "https://sophia-culture.com";
    const url = `${origin}/creators/influencer/app?invite=${token}&email=${encodeURIComponent(inf.email)}`;
    const { sendAppEmail, buildEmailHtml, buildEmailText } = await import("@/lib/email-send.server");
    const paragraphs = [
      `Hello ${inf.display_name},`,
      "Your application to partner with Sophia has been accepted. You are now on our influencer roster.",
      "Create your password with the button below. Your space is where you will read the rules, sign the master agreement, set up payouts, and receive our offers.",
    ];
    const res = await sendAppEmail({
      to: inf.email, subject: "Welcome to the Sophia influencer roster",
      html: buildEmailHtml({ paragraphs, buttonLabel: "Open my influencer space", buttonUrl: url }),
      text: buildEmailText({ paragraphs, buttonLabel: "Open my influencer space", buttonUrl: url } as any),
      idempotencyKey: `influencer-invite-${inf.id}-${new Date().toISOString().slice(0, 13)}`, label: "influencer-invite", purpose: "transactional",
    });
    if (res.sent) await supabaseAdmin.from("influencers").update({ invite_sent_at: new Date().toISOString() }).eq("id", inf.id);
    return { url, sent: res.sent, reason: res.reason ?? null };
  });
