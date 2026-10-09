import { createFileRoute } from "@tanstack/react-router";

/** /go/<handle>: logs a click and sends the visitor to the right store, tagged with the creator's handle. */
export const Route = createFileRoute("/go/$handle")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const handle = params.handle.replace(/^@/, "").replace(/[^a-z0-9._]/gi, "").toLowerCase().slice(0, 40);
        const ua = request.headers.get("user-agent") ?? "";
        const device = /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : "desktop";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const a = supabaseAdmin as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        let creatorId: string | null = null;
        let app: { id: string; app_store_url: string | null; play_store_url: string | null; taap_url: string | null; domain: string | null } | null = null;
        if (handle) {
          const { data: c } = await a.from("creators").select("id")
            .or(`tiktok_handle.ilike.${handle},instagram_handle.ilike.${handle},tiktok_handle.ilike.@${handle},instagram_handle.ilike.@${handle}`).limit(1).maybeSingle();
          creatorId = c?.id ?? null;
          if (creatorId) {
            const { data: e } = await a.from("creator_apps").select("apps(id, app_store_url, play_store_url, taap_url, domain)").eq("creator_id", creatorId).eq("status", "active").limit(1).maybeSingle();
            app = e?.apps ?? null;
          }
        }
        if (!app) {
          const { data } = await a.from("apps").select("id, app_store_url, play_store_url, taap_url, domain").eq("slug", "sophia").maybeSingle();
          app = data;
        }
        await a.from("go_clicks").insert({ handle: handle || "unknown", creator_id: creatorId, app_id: app?.id ?? null, device, country: request.headers.get("cf-ipcountry"), user_agent: ua.slice(0, 300) });
        const add = (base: string, q: string) => base + (base.includes("?") ? "&" : "?") + q;
        let to = app?.taap_url || (app?.domain ? `https://${app.domain}` : "https://sophia-culture.com");
        if (device === "ios" && app?.app_store_url) to = add(app.app_store_url, `ct=${encodeURIComponent(handle)}`);
        if (device === "android" && app?.play_store_url) to = add(app.play_store_url, `utm_campaign=${encodeURIComponent(handle)}&referrer=${encodeURIComponent(`utm_source=creator&utm_campaign=${handle}`)}`);
        return new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store" } });
      },
    },
  },
});
