import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
}

async function myCreator(supabase: any, userId: string) {
  const { data } = await supabase.from("creators").select("id, full_name").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Creator account not found.");
  return data as { id: string; full_name: string };
}

/** Public: tells the invite page whether the link is fresh, already used, or invalid. */
export const checkCreatorInvite = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(10).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("creators").select("user_id, invite_sent_at, created_at").eq("invite_token", data.token).maybeSingle();
    if (!row) return { state: "invalid" as const };
    if (row.user_id) return { state: "used" as const };
    const issued = new Date(row.invite_sent_at ?? row.created_at).getTime();
    if (Date.now() - issued > 30 * 86400000) return { state: "expired" as const };
    return { state: "fresh" as const };
  });

/** Admin publishes a brief to everyone or to selected creators, and notifies them. */
export const publishBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ briefId: z.string().uuid(), creatorIds: z.array(z.string().uuid()).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const audience = data.creatorIds.length ? "selected" : "all";
    const { data: brief, error } = await supabaseAdmin.from("briefs").update({ status: "published", audience }).eq("id", data.briefId).select("title, app_id").single();
    if (error || !brief) throw new Error("Brief not found.");
    await supabaseAdmin.from("brief_assignments").delete().eq("brief_id", data.briefId);
    let targets = data.creatorIds;
    if (audience === "selected") {
      await supabaseAdmin.from("brief_assignments").insert(targets.map((creator_id) => ({ brief_id: data.briefId, creator_id })));
    } else {
      const { data: all } = await supabaseAdmin.from("creators").select("id").not("user_id", "is", null);
      targets = (all ?? []).map((c) => c.id);
    }
    const { data: enrolled } = await supabaseAdmin.from("creator_apps").select("creator_id").eq("app_id", brief.app_id).eq("status", "active");
    const ok = new Set((enrolled ?? []).map((e) => e.creator_id));
    targets = targets.filter((id) => ok.has(id));
    if (targets.length) await supabaseAdmin.from("creator_notifications").insert(targets.map((creator_id) => ({ creator_id, body: `New brief: ${brief.title}` })));
    return { assigned: audience === "selected" ? targets.length : 0, notified: targets.length };
  });

/** Creator skips a brief with a reason; the reason lands in the admin inbox. */
export const skipBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ briefId: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { data: brief } = await context.supabase.from("briefs").select("title").eq("id", data.briefId).maybeSingle();
    if (!brief) throw new Error("Brief not found.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creator_messages").insert({ creator_id: me.id, from_admin: false, body: `Skipped brief "${brief.title}": ${data.reason}` });
    return { ok: true as const };
  });

/** Creator enters views on one of their posts, from day 7. */
export const enterPostViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string().uuid(), views: z.number().int().min(0).max(1_000_000_000) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin.from("creator_posts").select("id, creator_id, posted_on").eq("id", data.postId).maybeSingle();
    if (!post || post.creator_id !== me.id) throw new Error("Post not found.");
    if (Date.now() - new Date(post.posted_on).getTime() < 7 * 86400000) throw new Error("Views can be entered 7 days after posting.");
    await supabaseAdmin.from("creator_posts").update({ views: data.views, views_entered_at: new Date().toISOString() }).eq("id", post.id);
    return { ok: true as const };
  });

/** Creator records a Wise or PayPal fallback when Stripe is not available in their country. */
export const savePayoutFallback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    method: z.enum(["wise", "paypal"]),
    email: z.string().trim().email("Enter a complete email address, for example name@example.com.").max(255),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    const me = await myCreator(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = { method: data.method, wise_email: data.method === "wise" ? data.email : null, paypal_email: data.method === "paypal" ? data.email : null };
    const { data: existing } = await supabaseAdmin.from("creator_payout_profiles").select("id").eq("creator_id", me.id).maybeSingle();
    const { error } = existing
      ? await supabaseAdmin.from("creator_payout_profiles").update(patch).eq("id", existing.id)
      : await supabaseAdmin.from("creator_payout_profiles").insert({ creator_id: me.id, ...patch });
    if (error) throw new Error("Could not save payout details.");
    return { ok: true as const };
  });

/** Admin: fetch oEmbed thumbnails for reference videos that have none. */
export const fetchReferenceThumbnails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("reference_videos").select("id, url, platform").is("thumbnail_url", null).limit(50);
    let found = 0, missed = 0;
    for (const r of rows ?? []) {
      const endpoint = r.platform === "tiktok" || r.url.includes("tiktok.com")
        ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(r.url)}`
        : null; // Instagram oEmbed requires a Meta app token.
      if (!endpoint) { missed++; continue; }
      try {
        const res = await fetch(endpoint);
        const json = res.ok ? ((await res.json()) as { thumbnail_url?: string }) : null;
        if (json?.thumbnail_url) {
          await supabaseAdmin.from("reference_videos").update({ thumbnail_url: json.thumbnail_url }).eq("id", r.id);
          found++;
        } else missed++;
      } catch { missed++; }
    }
    return { found, missed };
  });
