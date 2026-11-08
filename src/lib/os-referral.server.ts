import { osBaseUrl } from "./os-bridge.server";

/** One bounded notification; application success is independent of OS availability. */
export async function notifyOsApplication(admin: Parameters<typeof osBaseUrl>[0], email: string, ref: string | null, secret: string): Promise<void> {
  try {
    const base = await osBaseUrl(admin);
    await fetch(`${base}/functions/v1/hub-posteurs`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-secret": secret },
      body: JSON.stringify({ action: "candidature", email, ref }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* No recipient, credential, or body logging; the application is already saved. */ }
}

export function runOsNotification(request: Request & { waitUntil?: (task: Promise<unknown>) => unknown }, task: Promise<void>): void {
  const safe = task.catch(() => {});
  if (request.waitUntil) request.waitUntil(safe);
  else void safe; // Local Node preview keeps pending network operations alive.
}