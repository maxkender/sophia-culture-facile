import { createFileRoute } from "@tanstack/react-router";

const ACTIVE_ADVERTISER = "7675679952181493778";
const back = (q: string) => new Response(null, { status: 302, headers: { Location: `/hub/ugc/ads?tab=connections&tiktok=${q}`, "Cache-Control": "no-store" } });

/* TikTok OAuth callback: signed state is verified before the auth code is exchanged; the token is stored server-side only. */
export const Route = createFileRoute("/api/public/tiktok/oauth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("auth_code") ?? url.searchParams.get("code");
        const state = url.searchParams.get("state") ?? "";
        const id = process.env["TIKTOK_APP_ID"]; const secret = process.env["TIKTOK_APP_SECRET"];
        if (!id || !secret) return back("not_configured");
        const { readTikTokState } = await import("@/lib/tiktok-oauth.server");
        const appId = await readTikTokState(state, secret);
        if (!appId || !code || code.length > 500) return back("bad_state");
        const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ app_id: id, secret, auth_code: code }) });
        const j = (await res.json().catch(() => ({}))) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const token = j?.data?.access_token;
        if (!res.ok || j.code !== 0 || !token) return back("token_error");
        const ids: string[] = (j.data.advertiser_ids ?? []).map(String);
        const { supabaseAdmin: a } = await import("@/integrations/supabase/client.server");
        await a.from("ad_tokens").upsert({ app_id: appId, channel: "tiktok", access_token: token, advertiser_ids: ids, scope: j.data.scope ?? null, updated_at: new Date().toISOString() });
        const active = ids.includes(ACTIVE_ADVERTISER) ? ACTIVE_ADVERTISER : ids[0] ?? ACTIVE_ADVERTISER;
        await a.from("ad_connections").upsert({ app_id: appId, channel: "tiktok", account_id: active, connected_at: new Date().toISOString() }, { onConflict: "app_id,channel" });
        return back("connected");
      },
    },
  },
});
