// Client-safe: the auto-accept eligibility rule, shared by the server sweep and the Applications reason badges.
import { countryCodeOf } from "@/config/countries";

export const AUTO_ACCEPT_SETTING = "slides_auto_accept";
export const AUTO_ACCEPT_MAX_PER_SWEEP = 100;
/** Statuses that make the same email a duplicate. */
export const TAKEN_STATUSES = ["accepted", "contract_signed", "os_created", "started"];
export const ZONES_WITH_RATE = ["A", "B", "C"];

export type AutoAcceptReason = "Not pending" | "Portugal closed" | "No zone for this country" | "Not 18+" | "Duplicate email" | "Unsubscribed";
type App = { id: string; status: string; zone: string | null; country: string | null; is_adult: boolean | null; email: string | null; unsubscribed_at?: string | null };

export const emailKey = (e: unknown) => String(e ?? "").trim().toLowerCase();

/** Lower-cased emails of applications already accepted or further along. */
export function takenEmails(apps: { id: string; email: string | null; status: string }[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const a of apps) if (TAKEN_STATUSES.includes(a.status) && emailKey(a.email)) {
    const k = emailKey(a.email); const s = m.get(k) ?? new Set(); s.add(a.id); m.set(k, s);
  }
  return m;
}

/** Null = eligible for auto-accept. `zonesWithRate` = zones that have a rate in pay_zones. */
export function autoAcceptReason(app: App, taken: Map<string, Set<string>>, zonesWithRate: string[] = ZONES_WITH_RATE): AutoAcceptReason | null {
  if (app.status !== "pending") return "Not pending";
  if (countryCodeOf(app.country ?? "") === "PT") return "Portugal closed";
  if (!app.zone || !zonesWithRate.includes(app.zone)) return "No zone for this country";
  if (app.is_adult !== true) return "Not 18+";
  const others = taken.get(emailKey(app.email));
  if (others && [...others].some((id) => id !== app.id)) return "Duplicate email";
  if (app.unsubscribed_at) return "Unsubscribed";
  return null;
}

export const isAutoAcceptOn = (value: string | null | undefined) => value !== "false";
