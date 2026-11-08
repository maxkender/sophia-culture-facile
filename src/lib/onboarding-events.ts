/**
 * Funnel analytics for /start. No analytics tool is connected yet: events go to
 * window.dataLayer. `src` (and utm_*) is captured once per session and attached
 * to every event.
 */
const KEY = "sophia_start_attr";
const ATTR_KEYS = ["src", "utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
let memory: Record<string, string> | null = null;

export function readAttribution(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of ATTR_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 100);
  }
  return out;
}

export function captureAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const fresh = readAttribution(window.location.search);
  let stored: Record<string, string> = memory ?? {};
  try {
    stored = JSON.parse(window.sessionStorage.getItem(KEY) || "null") ?? stored;
  } catch { /* in-app browsers may block storage */ }
  const merged = { src: "direct", ...stored, ...fresh };
  memory = merged;
  try { window.sessionStorage.setItem(KEY, JSON.stringify(merged)); } catch { /* ignore */ }
  return merged;
}

export function trackStart(event: string, props: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const attr = memory ?? captureAttribution();
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event: `start_${event}`, funnel: "start", ...attr, ...props });
}
