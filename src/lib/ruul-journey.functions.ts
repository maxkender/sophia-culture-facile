import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildJourneys, normalizeReferral, type JourneyApplication } from "./ruul-journey";

/** Admin read model only. No lifecycle, email, OS creation or payment actions. */
export const getRuulJourney = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Existing role is database-protected by guard_profile_privileges; never trust metadata or client storage.
    const { data: me, error: roleError } = await context.supabase.from("profiles").select("role").eq("user_id", context.userId).maybeSingle();
    if (roleError || me?.role !== "admin") throw new Error("Forbidden");
    const db = context.supabase;
    async function all(table: "slideshow_applications" | "os_snapshots" | "slideshow_payouts", columns: string) {
      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await db.from(table).select(columns).order("id").range(offset, offset + 999);
        if (error) throw new Error("Journey data could not be loaded. Please retry.");
        const page = (data ?? []) as unknown as Record<string, unknown>[];
        rows.push(...page);
        if (page.length < 1000) return rows;
      }
    }
    const [applications, snapshots, payouts, zoneResult] = await Promise.all([
      all("slideshow_applications", "*"),
      all("os_snapshots", "id,application_id,lundi,publies,dernier_post_at"),
      all("slideshow_payouts", "id,application_id,status,paid_at,week_start"),
      db.from("pay_zones").select("zone,weekly_amount,first_week_amount"),
    ]);
    if (zoneResult.error) throw new Error("Weekly rates could not be loaded.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callOs } = await import("./os-bridge.server");
    let referrals: NonNullable<ReturnType<typeof normalizeReferral>>[] = [];
    let referralsConnected = false;
    try {
      const result = await callOs<{ rows?: unknown[]; parrainages?: unknown[]; referrals?: unknown[] }>(supabaseAdmin, "parrainages", {});
      if (result.ok) {
        const raw = result.rows ?? result.parrainages ?? result.referrals;
        if (Array.isArray(raw)) {
          referrals = raw.map(normalizeReferral).filter((r): r is NonNullable<typeof r> => r !== null);
          // Fail visibly if an incompatible payload silently drops people.
          referralsConnected = raw.length === referrals.length;
        }
      }
    } catch { /* Referrals must never hide application journeys. */ }
    const now = new Date().toISOString();
    const apps = applications as unknown as JourneyApplication[];
    const rows = buildJourneys(apps, referrals, snapshots as unknown as Parameters<typeof buildJourneys>[2], payouts as unknown as Parameters<typeof buildJourneys>[3], now);
    return { rows, applications: apps, zones: zoneResult.data ?? [], referralsConnected, now };
  });