/**
 * Creator funnel events. No analytics tool is configured yet: events are pushed to
 * window.dataLayer (ready for GTM/Plausible/PostHog) and mirrored as data-funnel-* attributes.
 */
export type FunnelEvent = "creators_page_view" | "track_selected" | "apply_started" | "apply_submitted" | "apply_blocked";

export function trackFunnel(event: FunnelEvent, props: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event, ...props });
}
