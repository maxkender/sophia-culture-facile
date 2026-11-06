import { createFileRoute } from "@tanstack/react-router";

/** Scheduled UGC jobs: compliance (Mon 06:00 Paris), d7 (daily 07:00), monthly (1st 08:00). Caller must send the cron secret. */
export const Route = createFileRoute("/api/public/cron/ugc/$job")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const a = supabaseAdmin as any;
        const given = request.headers.get("x-cron-secret") ?? "";
        const envSecret = process.env["LOVABLE_CRON_SECRET"];
        const { data: cfg } = await a.from("ugc_settings").select("cron_token").eq("id", 1).maybeSingle();
        if (!given || (given !== envSecret && given !== cfg?.cron_token)) return new Response("Unauthorized", { status: 401 });
        // Schedules fire at two UTC hours to follow Paris daylight saving; only the one matching Paris time runs.
        const wantHour = new URL(request.url).searchParams.get("parisHour");
        if (wantHour) {
          const parisHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(new Date()));
          if (parisHour !== Number(wantHour)) return Response.json({ skipped: "not the Paris hour" });
        }
        // No automatic emails, no pay jobs: these entry points are switched off for good (cron rows deactivated too).
        if (["nurture", "dormancy", "brief-drop", "planner-reminder", "monthly", "tiers", "compliance", "daily-detect", "budget"].includes(params.job)) return Response.json({ skipped: "disabled" });
        try {
          if (params.job === "compliance" || params.job === "d7") {
            if (!process.env["APIFY_TOKEN"]) return Response.json({ skipped: "APIFY_TOKEN missing" });
            const sync = await import("@/lib/ugc-sync.server");
            const r = params.job === "compliance" ? await sync.runComplianceSync(a) : await sync.runD7Sync(a);
            if (params.job === "d7") {
              // Validated posts: daily view refresh, then J+7 freeze and pricing.
              const j7 = await import("@/lib/ugc-j7.server");
              const tracked = await j7.trackValidated(a).catch((e: Error) => ({ error: e.message }));
              return Response.json({ ...r, tracked, frozen: await j7.freezeDue(a) });
            }
            return Response.json(r);
          }
          if (params.job === "monthly") {
            const { generateMonth } = await import("@/lib/ugc-month.server");
            const { previousPeriod } = await import("@/lib/ugc-pay");
            return Response.json(await generateMonth(a, previousPeriod(), null));
          }
          if (params.job === "tiers") {
            const { runTierJob } = await import("@/lib/ugc-tiers.server");
            return Response.json(await runTierJob(a));
          }
          if (params.job === "ads-metrics") {
            const { syncAdMetrics } = await import("@/lib/ads.server");
            return Response.json(await syncAdMetrics(a));
          }
          if (params.job === "daily-detect") {
            if (!process.env["APIFY_TOKEN"]) return Response.json({ skipped: "APIFY_TOKEN missing" });
            const { runDailyDetect } = await import("@/lib/hub-automation.server");
            return Response.json(await runDailyDetect(a));
          }
          if (params.job === "dormancy") {
            const { runDormancy } = await import("@/lib/hub-automation.server");
            return Response.json(await runDormancy(a));
          }
          if (params.job === "brief-drop") {
            const { runBriefDrop } = await import("@/lib/hub-automation.server");
            return Response.json(await runBriefDrop(a));
          }
          if (params.job === "nurture") {
            const { runNurture } = await import("@/lib/hub-automation.server");
            return Response.json(await runNurture(a, new URL(request.url).origin));
          }
          if (params.job === "budget") {
            const { applyBudgetCap } = await import("@/lib/hub-automation.server");
            return Response.json(await applyBudgetCap(a));
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
          if (params.job === "inspiration") {
            const { runInspirationTick } = await import("@/lib/inspirations.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "inspiration", 10, () => runInspirationTick(a)));
          }
          if (params.job === "notion-sync") {
            if (!process.env["NOTION_TOKEN"]) return Response.json({ skipped: "NOTION_TOKEN missing" });
            const { data: s } = await a.from("ugc_settings").select("notion_auto").eq("id", 1).maybeSingle();
            if (s && s.notion_auto === false) return Response.json({ skipped: "auto-sync off" });
            const { runNotionSync } = await import("@/lib/notion-sync.server");
            const { withLock } = await import("@/lib/hub-automation.server");
            return Response.json(await withLock(a, "notion-sync", 5, () => runNotionSync(a)));
          }
          if (params.job === "planner-reminder") {
            const { data: admins } = await a.from("profiles").select("id").eq("role", "admin");
            await a.from("notifications").insert((admins ?? []).map((p: any) => ({ profile_id: p.id, type: "message", body: "Reminder: publish next week's UGC briefs in the Week planner by Friday." })));
            return Response.json({ ok: true });
          }
          return new Response("Unknown job", { status: 404 });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
