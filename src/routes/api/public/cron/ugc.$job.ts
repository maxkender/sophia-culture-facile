import { createFileRoute } from "@tanstack/react-router";

/** Scheduled slideshow poster jobs (slides-*). Caller must send the cron secret. Path kept so existing schedules keep working. */
export const Route = createFileRoute("/api/public/cron/ugc/$job")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const a = supabaseAdmin as any;
        const given = request.headers.get("x-cron-secret") ?? "";
        const envSecret = process.env["LOVABLE_CRON_SECRET"];
        const { data: cfg } = await a.from("ugc_settings").select("cron_token").eq("id", 1).maybeSingle();
        const secretOk = Boolean(given) && (given === envSecret || given === cfg?.cron_token);
        if (!secretOk) {
          // Managed schedules authenticate with a bearer token instead of x-cron-secret.
          const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
          const authFailure = await authenticateCronRequest(request);
          if (authFailure) return authFailure;
        }
        // Schedules fire at two UTC hours to follow Paris daylight saving; only the one matching Paris time runs.
        const wantHour = new URL(request.url).searchParams.get("parisHour");
        if (wantHour) {
          const parisHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(new Date()));
          if (parisHour !== Number(wantHour)) return Response.json({ skipped: "not the Paris hour" });
        }
        // Only the slideshow poster jobs remain on this site; every other job name is gone.
        if (!params.job.startsWith("slides-")) return Response.json({ error: "Unknown job" }, { status: 404 });
        try {
          if (params.job === "slides-remind") {
            const { runSignatureReminders } = await import("@/lib/slideshow-reminders.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "slides-remind", 15, () => runSignatureReminders(a)));
          }
          if (params.job === "slides-auto-accept") {
            const { runAutoAccept } = await import("@/lib/slideshow-auto-accept.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "slides-auto-accept", 15, () => runAutoAccept(a)));
          }
          if (params.job === "slides-pool-expiry") {
            const { expirePool } = await import("@/lib/slideshows.server");
            return Response.json(await expirePool(a));
          }
          if (params.job === "slides-os-retry") {
            const { createPosterInOs } = await import("@/lib/slideshows.server");
            const { data: rows, error } = await a.from("slideshow_applications").select("id")
              .eq("status", "contract_signed").not("agreement_signed_at", "is", null).not("os_error", "is", null)
              .order("agreement_signed_at", { ascending: true }).limit(20);
            if (error) return Response.json({ error: error.message }, { status: 500 });
            let created = 0;
            const failed: { id: string; error: string }[] = [];
            for (const row of (rows ?? []) as { id: string }[]) {
              try {
                const r = await createPosterInOs(a, row.id);
                if (r.ok) created++;
                else failed.push({ id: row.id, error: r.error ?? "Unknown error" });
              } catch (e) {
                failed.push({ id: row.id, error: (e as Error).message });
              }
            }
            return Response.json({ ok: true, tried: (rows ?? []).length, created, failed });
          }
          if (params.job === "slides-accept") {
            const { z } = await import("zod");
            const parsed = z.object({
              application_ids: z.array(z.string().uuid()).min(1).max(50).optional(),
              country: z.string().trim().min(1).max(100).optional(),
              all_valid: z.literal(true).optional(),
              dry_run: z.boolean().optional(),
            }).refine((b) => [b.application_ids, b.country, b.all_valid].filter(Boolean).length === 1, "Send exactly one of application_ids, country or all_valid")
              .safeParse(await request.json().catch(() => null));
            if (!parsed.success) return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
            const b = parsed.data;
            if (b.all_valid) {
              const { acceptAllValidRun } = await import("@/lib/slideshow-accept.server");
              const r: any = await acceptAllValidRun(a, { id: null, name: "Claude (on admin request)" }, b.dry_run === true, 50);
              // Same shape as other slides-accept calls: accepted / skipped / failed (+ remaining).
              if (b.dry_run === true) return Response.json({ ok: true, dry_run: true, accepted: r.valid.slice(0, 50), skipped: r.skipped, failed: [], remaining: r.valid.length });
              return Response.json(r);
            }
            let q = a.from("slideshow_applications").select("id, country").eq("status", "pending").order("created_at", { ascending: true });
            if (b.application_ids) q = q.in("id", b.application_ids);
            const { data: all, error } = await q;
            if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
            // Country: matches the stored name or the ISO code ("Turkey", "Türkiye" and "TR" all match).
            const { countryCodeOf } = await import("@/config/countries");
            const want = b.country ? (b.country.length === 2 ? b.country.toUpperCase() : countryCodeOf(b.country)) : null;
            const rows = ((all ?? []) as { id: string; country: string }[]).filter((r) => !b.country || r.country.toLowerCase() === b.country.toLowerCase() || (want && countryCodeOf(r.country) === want)).slice(0, 50);
            const { acceptMany } = await import("@/lib/slideshow-accept.server");
            // decided_by is a profile id: left null, the timeline records who decided.
            return Response.json(await acceptMany(a, rows.map((r) => r.id), { id: null, name: "Claude (on admin request)" }, b.dry_run === true));
          }
          if (["slides-snapshots", "slides-week"].includes(params.job)) return Response.json({ skipped: "Slideshows is manual; OS integration is dormant" });
          if (params.job === "slides-snapshots") {
            const { refreshSnapshots } = await import("@/lib/slideshows.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "slides-snapshots", 15, () => refreshSnapshots(a)));
          }
          if (params.job === "slides-week") {
            const { buildWeek } = await import("@/lib/slideshows.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "slides-week", 15, () => buildWeek(a)));
          }
          return Response.json({ error: "Unknown job" }, { status: 404 });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
