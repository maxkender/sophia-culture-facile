// Pure selection rule for the "slides-os-retry" cron.
export type OsRetryRow = { id: string; status: string; agreement_signed_at: string | null; os_created_at: string | null; os_error: string | null; start_monday: string | null };

function parisToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function shouldRetryOs(row: OsRetryRow, now = new Date()): boolean {
  if (row.status !== "contract_signed" || !row.agreement_signed_at || row.os_created_at) return false;
  if (row.os_error) return true; // existing behaviour: rows with a recorded error are always retried
  // Silent failure (no error recorded): only after 15 minutes, and never for a start date already past.
  if (new Date(row.agreement_signed_at).getTime() > now.getTime() - 15 * 60_000) return false;
  return !!row.start_monday && row.start_monday >= parisToday(now);
}
