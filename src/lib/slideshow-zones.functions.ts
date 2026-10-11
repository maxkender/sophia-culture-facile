import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { parseBlocks } from "./documents";
import { mergeGuideBlocks } from "./slideshow-guide";

async function loadGuide(admin: any, zone: string | null) {
  if (!zone) return { state: "no_zone" as const };
  const [{ data: doc }, { data: pz }] = await Promise.all([
    admin.from("documents").select("title, content, current_version, published").eq("slug", "slideshow-guide").maybeSingle(),
    admin.from("pay_zones").select("weekly_amount, first_week_amount, posts_per_day").eq("zone", zone).maybeSingle(),
  ]);
  if (!doc?.published) return { state: "unpublished" as const };
  if (!pz) return { state: "no_zone" as const };
  const figures = { weekly_amount: Number(pz.weekly_amount), first_week_amount: Number(pz.first_week_amount), posts_per_day: Number(pz.posts_per_day) };
  return {
    state: "ready" as const,
    title: doc.title as string,
    version: Number(doc.current_version),
    blocks: mergeGuideBlocks(parseBlocks(doc.content), figures),
    figures,
  };
}

// Public: applicant reads their guide from the link they signed with. Never returns the zone name.
export const getGuideByToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(20).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("slideshow_applications")
      .select("id, zone, status, guide_opened_at")
      .eq("guide_token", data.token)
      .maybeSingle();
    if (!app || !["approved", "accepted", "contract_signed", "os_created", "started"].includes(app.status)) return { state: "invalid" as const };
    const guide = await loadGuide(supabaseAdmin, app.zone);
    if (guide.state !== "ready") return { state: guide.state };
    await supabaseAdmin
      .from("slideshow_applications")
      .update({ guide_opened_at: app.guide_opened_at ?? new Date().toISOString(), guide_zone_shown: app.zone, guide_figures_shown: guide.figures })
      .eq("id", app.id);
    return { state: "ready" as const, title: guide.title, version: guide.version, blocks: guide.blocks };
  });

async function assertAdmin(context: any) {
  const { data: me } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (me?.role !== "admin") throw new Error("Forbidden");
  return me.id as string;
}

// Admin: zone-merged guide for the Upwork PDF.
export const getGuideForApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("slideshow_applications").select("zone").eq("id", data.applicationId).maybeSingle();
    const guide = await loadGuide(supabaseAdmin, app?.zone ?? null);
    if (guide.state !== "ready") throw new Error(guide.state === "no_zone" ? "This application has no pay zone." : "The guide is not published.");
    return { title: guide.title, version: guide.version, blocks: guide.blocks };
  });

// Admin: set a zone by hand, with a note, logged.
export const setApplicationZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ applicationId: z.string().uuid(), zone: z.enum(["A", "B", "C"]), note: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("slideshow_applications")
      .update({ zone: data.zone, zone_override: true, zone_note: data.note })
      .eq("id", data.applicationId);
    if (error) throw new Error("The zone could not be saved.");
    await supabaseAdmin.from("activity_log").insert({
      actor_id: actor,
      entity: "slideshow_application",
      entity_id: data.applicationId,
      action: "zone_set_manually",
      comment: `Zone ${data.zone}: ${data.note}`,
    });
    return { ok: true };
  });
