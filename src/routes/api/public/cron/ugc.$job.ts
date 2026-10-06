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
        try {
          if (params.job === "compliance" || params.job === "d7") {
            if (!process.env["APIFY_TOKEN"]) return Response.json({ skipped: "APIFY_TOKEN missing" });
            const sync = await import("@/lib/ugc-sync.server");
            const r = params.job === "compliance" ? await sync.runComplianceSync(a) : await sync.runD7Sync(a);
            return Response.json(r);
          }
          if (params.job === "monthly") {
            const { generateMonth } = await import("@/lib/ugc-month.server");
            const { previousPeriod } = await import("@/lib/ugc-pay");
            return Response.json(await generateMonth(a, previousPeriod(), null));
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
