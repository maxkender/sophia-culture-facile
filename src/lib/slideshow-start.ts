/** Paris-local cutoff, shared by acceptance, signature and reminder dates. */
export function nextStartMonday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const value = (key: string) => Number(parts.find(p => p.type === key)?.value ?? 0);
  const date = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  const weekday = date.getUTCDay();
  const seconds = value('hour') * 3600 + value('minute') * 60 + value('second');
  const afterCutoff = weekday === 0 || (weekday === 6 && (seconds > 20 * 3600 || (seconds === 20 * 3600 && now.getUTCMilliseconds() > 0)));
  date.setUTCDate(date.getUTCDate() + ((8 - weekday) % 7 || 7) + (afterCutoff ? 7 : 0));
  return date.toISOString().slice(0, 10);
}
export function startMondayAtSignature(stored: string | null, now = new Date()): string {
  const next = nextStartMonday(now);
  return stored && stored > next ? stored : next;
}
export function signingSaturday(monday: string): string {
  const date = new Date(`${monday}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 2);
  return date.toISOString().slice(0, 10);
}
