// Server-only bridge to the Sophia OS (hub-posteurs). The secret never leaves the server.
type Admin = any;

export type OsResult<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string; notConnected?: boolean };

export const OS_NOT_CONNECTED = "Not connected yet — add OS_HUB_SECRET in Settings → Secrets";

export async function osBaseUrl(admin: Admin): Promise<string> {
  const { data } = await admin.from("hub_settings").select("value").eq("key", "os_base_url").maybeSingle();
  return (data?.value || "https://mbikecieskoobeizixig.supabase.co").replace(/\/+$/, "");
}

export function osConfigured(): boolean {
  return Boolean(process.env["OS_HUB_SECRET"]);
}

/** POST {base}/functions/v1/hub-posteurs with 3 tries and backoff; every call is logged in os_calls. */
export async function callOs<T = Record<string, unknown>>(admin: Admin, action: string, params: Record<string, unknown> = {}): Promise<OsResult<T>> {
  if (!osConfigured()) return { ok: false, error: "OS integration is dormant", notConnected: true };
  const secret = process.env["OS_HUB_SECRET"];
  if (!secret) return { ok: false, error: OS_NOT_CONNECTED, notConnected: true };
  const url = `${await osBaseUrl(admin)}/functions/v1/hub-posteurs`;
  const started = Date.now();
  let last = "unknown error";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-hub-secret": secret },
        body: JSON.stringify({ action, ...params }),
      });
      const body = (await res.json().catch(() => null)) as any;
      if (body && body.ok === true) {
        await log(admin, action, true, Date.now() - started, null);
        return body as OsResult<T>;
      }
      last = body?.error ? String(body.error) : `HTTP ${res.status}`;
      // A clear refusal from the OS is not retried.
      if (body && body.ok === false && res.status < 500) break;
    } catch (e) {
      last = (e as Error).message;
    }
  }
  await log(admin, action, false, Date.now() - started, last);
  await admin.from("hub_settings").upsert({ key: "os_last_error", value: `${new Date().toISOString()} · ${action}: ${last}`.slice(0, 500), updated_at: new Date().toISOString() });
  return { ok: false, error: last.slice(0, 300) };
}

async function log(admin: Admin, action: string, ok: boolean, ms: number, error: string | null) {
  await admin.from("os_calls").insert({ action, ok, ms, error: error?.slice(0, 500) ?? null });
  if (ok) await admin.from("hub_settings").upsert({ key: "os_last_sync", value: new Date().toISOString(), updated_at: new Date().toISOString() });
}
