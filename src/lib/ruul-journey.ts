import { countryCodeOf } from "@/config/countries";
import type { Database } from "@/integrations/supabase/types";
import { applicationSource, sourceDeclared, ATTRIBUTION_KEYS, type Attribution, type ApplicationSource } from "./slideshow-attribution";

export type JourneyApplication = Database["public"]["Tables"]["slideshow_applications"]["Row"];
export const JOURNEY_STEPS = [
  ["referred", "Referred"], ["invited", "Invited"], ["reminders", "Reminders"],
  ["applied", "Applied"], ["accepted", "Accepted"], ["signed", "Signed"],
  ["os", "OS account created"], ["login", "Logged in"], ["ruul", "Added in Ruul"],
  ["post", "First post"], ["paid", "First week paid"], ["bonus", "Referrer bonus paid"],
] as const;
export type JourneyStep = typeof JOURNEY_STEPS[number][0];
export type Referral = {
  id: string; ref: string | null; referrer_name: string; referrer_channel: string | null;
  friend_first_name: string; friend_last_name: string; friend_email: string; country: string;
  created_at: string | null; invitation_status: string | null;
  j0_sent_at: string | null; j2_sent_at: string | null; j5_sent_at: string | null;
  opened_at: string | null; clicked_at: string | null; unsubscribed_at: string | null;
  bounced_at: string | null; applied_at: string | null; recrue_id: string | null;
  bonus_status: string | null; bonus_paid_at: string | null;
  first_login_at: string | null; first_post_at: string | null;
};
type Snapshot = { application_id: string; lundi: string; publies: number; dernier_post_at: string | null };
type Payout = { application_id: string; status: string; paid_at: string | null; week_start: string };
export function paidPeopleThisWeek(payouts: Payout[], now: string): number {
  const monday = new Date(now); monday.setUTCHours(0, 0, 0, 0); monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return new Set(payouts.filter(p => p.status === "paid" && p.paid_at && Date.parse(p.paid_at) >= monday.getTime() && Date.parse(p.paid_at) <= Date.parse(now)).map(p => p.application_id)).size;
}
export type JourneyRow = {
  id: string; applicationId: string | null; name: string; email: string; country: string; zone: string;
  referrer: string; referrerChannel: string | null; source: ApplicationSource; sourceDeclared: boolean; startMonday: string; attribution: Attribution;
  dates: Record<JourneyStep, string | null>; reminderDates: { j2: string | null; j5: string | null };
  current: JourneyStep | "ended" | "complete"; currentLabel: string; since: string | null;
  daysStuck: number | null; red: boolean; ended: boolean; nextAction: string;
  postObserved: boolean; openedAt: string | null; clickedAt: string | null; bonusStatus: string | null;
};
const date = (v: unknown): string | null => typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : null;
const text = (v: unknown): string => typeof v === "string" ? v.trim() : "";
const obj = (v: unknown): Record<string, unknown> => v && typeof v === "object" ? v as Record<string, unknown> : {};
const emailKey = (v: string) => v.trim().toLowerCase();
const earliest = (values: (string | null | undefined)[]) => values.filter((v): v is string => Boolean(v && date(v))).sort((a,b) => Date.parse(a)-Date.parse(b))[0] ?? null;

/** OS adapter: canonical snake_case contract, with French bridge aliases isolated here. */
export function normalizeReferral(raw: unknown): Referral | null {
  const x = obj(raw), friend = obj(x["friend"]), by = obj(x["referrer"]), emails = obj(x["emails_sent"]), bonus = obj(x["referral_bonus"]);
  const id = text(x["id"] ?? x["referral_id"]);
  if (!id) return null;
  const sent = (key: string) => date(emails[key]) ?? date(obj(emails[key])["sent_at"]);
  return {
    id, ref: text(x["ref"] ?? x["ref_code"]) || null,
    referrer_name: text(x["referrer_name"] ?? by["name"]), referrer_channel: text(x["referrer_channel"] ?? by["channel"]) || null,
    friend_first_name: text(x["friend_first_name"] ?? friend["first_name"] ?? x["prenom"]),
    friend_last_name: text(x["friend_last_name"] ?? friend["last_name"] ?? x["nom"]),
    friend_email: text(x["friend_email"] ?? friend["email"] ?? x["email"]), country: text(x["country"] ?? x["pays_code"]),
    created_at: date(x["created_at"]), invitation_status: text(x["invitation_status"]) || null,
    j0_sent_at: date(x["j0_sent_at"]) ?? sent("J0"), j2_sent_at: date(x["j2_sent_at"]) ?? sent("J+2"), j5_sent_at: date(x["j5_sent_at"]) ?? sent("J+5"),
    opened_at: date(x["opened_at"]), clicked_at: date(x["clicked_at"]), unsubscribed_at: date(x["unsubscribed_at"]) ?? (x["unsubscribed"] === true ? date(x["created_at"]) : null),
    bounced_at: date(x["bounced_at"]) ?? (x["bounced"] === true ? date(x["created_at"]) : null),
    applied_at: date(x["applied_at"]), recrue_id: text(x["recrue_id"]) || null,
    bonus_status: text(x["bonus_status"] ?? x["referral_bonus_status"] ?? bonus["status"]) || null,
    bonus_paid_at: date(x["bonus_paid_at"] ?? x["referral_bonus_paid_at"] ?? bonus["paid_at"]),
    first_login_at: date(x["first_login_at"]), first_post_at: date(x["first_post_at"]),
  };
}

export function buildJourneys(applications: JourneyApplication[], referrals: Referral[], snapshots: Snapshot[], payouts: Payout[], now: string): JourneyRow[] {
  const groups = new Map<string, { apps: JourneyApplication[]; refs: Referral[] }>();
  for (const app of applications) {
    const key = emailKey(app.email) || `app:${app.id}`;
    const g = groups.get(key) ?? { apps: [], refs: [] }; g.apps.push(app); groups.set(key, g);
  }
  for (const r of referrals) {
    const email = emailKey(r.friend_email);
    const candidates = r.ref ? applications.filter(a => a.ref === r.ref) : [];
    // Shared referrer codes cannot identify a friend. Only a unique match without conflicting email is safe.
    const match = applications.find(a => a.id === r.recrue_id) ?? applications.find(a => email && emailKey(a.email) === email)
      ?? (candidates.length === 1 && (!email || emailKey(candidates[0]?.email ?? "") === email) ? candidates[0] : undefined);
    const key = match ? emailKey(match.email) || `app:${match.id}` : email || `ref:${r.id}`;
    const g = groups.get(key) ?? { apps: [], refs: [] }; g.refs.push(r); groups.set(key, g);
  }
  return [...groups.entries()].map(([id, g]): JourneyRow => {
    const apps = g.apps.sort((a,b) => Date.parse(b.created_at)-Date.parse(a.created_at));
    // Keep progressed records in preference to repeat pending submissions.
    const a = apps.find(a => a.contract_signed_at || a.agreement_signed_at || a.accepted_at) ?? apps[0];
    const r = g.refs.sort((a,b) => Date.parse(a.created_at ?? now)-Date.parse(b.created_at ?? now))[0];
    const appIds = new Set(apps.map(a => a.id));
    const snaps = snapshots.filter(s => appIds.has(s.application_id) && s.publies > 0);
    const paid = payouts.filter(p => appIds.has(p.application_id) && p.status === "paid");
    const timeline = obj(a?.timeline);
    const tlDate = (key: string) => date(obj(timeline[key])["at"]);
    const postExact = r?.first_post_at ?? tlDate("first_post");
    const dates: JourneyRow["dates"] = {
      referred: earliest(g.refs.map(r => r.created_at)), invited: earliest(g.refs.map(r => r.j0_sent_at)),
      reminders: earliest(g.refs.flatMap(r => [r.j2_sent_at, r.j5_sent_at])),
      applied: earliest([...apps.map(a => a.created_at), ...g.refs.map(r => r.applied_at)]),
      accepted: a?.accepted_at ?? (a && ["accepted","approved","contract_signed","os_created","started"].includes(a.status) ? a.decided_at : null),
      signed: a?.contract_signed_at ?? a?.agreement_signed_at ?? null, os: a?.os_created_at ?? null,
      login: r?.first_login_at ?? tlDate("first_login") ?? tlDate("logged_in"), ruul: a?.ruul_added_at ?? null,
      post: postExact ?? earliest(snaps.map(s => s.dernier_post_at)), paid: earliest(paid.map(p => p.paid_at)),
      bonus: earliest(g.refs.filter(r => r.bonus_status === "paid").map(r => r.bonus_paid_at)),
    };
    const country = countryCodeOf(a?.country ?? r?.country ?? "") ?? (a?.country ?? r?.country ?? "");
    const endedLabel = country === "PT" ? "Country closed" : a?.unsubscribed_at || r?.unsubscribed_at ? "Unsubscribed"
      : r?.bounced_at || r?.invitation_status === "bounced" ? "Bounced"
      : a?.expired_at || a?.status === "expired" || r?.invitation_status === "expired" ? "Expired"
      : a?.dropped_at || a?.status === "dropped" ? "Dropped"
      : a && ["rejected","refused"].includes(a.status) || r?.invitation_status === "refused" ? "Refused" : null;
    // Reminders are optional, not a gate. Non-referrals skip referral milestones.
    const required: JourneyStep[] = [...(r && !dates.applied ? ["invited","applied"] as JourneyStep[] : ["applied"] as JourneyStep[]), "accepted","signed","os","login","ruul","post","paid", ...(r ? ["bonus"] as JourneyStep[] : [])];
    // Later evidence proves earlier progress, but never invents missing dates.
    const missing = required.find(s => !dates[s] && !(s === "login" && (dates.post || dates.paid)) && !(s === "post" && dates.paid));
    const current = endedLabel ? "ended" : missing ?? "complete";
    const anchors: Partial<Record<JourneyStep, string | null>> = { invited: dates.referred, applied: dates.invited ?? dates.referred, accepted: dates.applied, signed: dates.accepted, os: dates.signed, login: dates.os, ruul: dates.login ?? dates.os, post: a?.start_monday ?? dates.ruul, paid: a?.start_monday ? new Date(Date.parse(a.start_monday)+7*86400000).toISOString() : dates.post, bonus: dates.paid };
    const since = current === "ended" || current === "complete" ? null : anchors[current] ?? null;
    const age = since ? Math.max(0, Date.parse(now)-Date.parse(since)) : null;
    const daysStuck = age === null ? null : Math.floor(age/86400000);
    const signatureReminder = [ ["remind_3", "J+6"], ["remind_2", "J+3"], ["remind_1", "J+1"], ["remind_manual", "manual"] ].find(([k]) => k && tlDate(k));
    const actions: Record<JourneyStep,string> = {
      referred: "Waiting for referral", invited: "Send invitation", reminders: "Waiting for application",
      applied: "Waiting for application", accepted: "Review application", signed: `Waiting for signature${signatureReminder ? ` — reminder ${signatureReminder[1]} sent` : ""}`,
      os: a?.os_error ? "OS creation failed — review poster card" : "Create OS account", login: "Waiting for first login — date not available",
      ruul: "Add in Ruul", post: a?.start_monday && Date.parse(a.start_monday)>Date.parse(now) ? "Waiting for start Monday" : "Waiting for first post",
      paid: since && Date.parse(since)>Date.parse(now) ? "Waiting for payment Monday" : "Review and pay completed week", bonus: "Check referrer bonus payment",
    };
    const nextAction = endedLabel ?? (current === "complete" ? "Journey complete" : current === "ended" ? "Journey ended" : !a && !r?.friend_email ? "No email — ask referrer" : actions[current]);
    const declared = !r && sourceDeclared(a ?? {});
    return { id, applicationId: a?.id ?? null, name: a?.full_name ?? ([r?.friend_first_name,r?.friend_last_name].filter(Boolean).join(" ") || "Unnamed friend"), email: a?.email ?? r?.friend_email ?? "", country, zone: a?.zone ?? "", referrer: r?.referrer_name || a?.referral_name || "", referrerChannel: r?.referrer_channel ?? null, source: r ? "referral" : applicationSource(a ?? {}), sourceDeclared: declared, attribution: Object.fromEntries(ATTRIBUTION_KEYS.map(k=>[k,a?.[k] ?? null])), startMonday: a?.start_monday ?? "", dates, reminderDates: { j2: r?.j2_sent_at ?? null, j5: r?.j5_sent_at ?? null }, current, currentLabel: endedLabel ?? (current === "complete" ? "Complete" : JOURNEY_STEPS.find(([k]) => k === current)?.[1] ?? current), since, daysStuck, red: !endedLabel && current !== "complete" && age !== null && age > 48*3600000, ended: Boolean(endedLabel), nextAction, postObserved: !postExact && Boolean(dates.post), openedAt: r?.opened_at ?? null, clickedAt: r?.clicked_at ?? null, bonusStatus: r?.bonus_status ?? null };
  }).sort((a,b) => Number(b.red)-Number(a.red) || (b.daysStuck ?? -1)-(a.daysStuck ?? -1));
}

export function journeyCsv(rows: JourneyRow[]): string {
  const safe = (v: unknown) => { const s = String(v ?? ""); return `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "")+s.replaceAll('"','""')}"`; };
  const headers = ["Name","Email","Country","Zone","Referrer","Referrer channel","Source","Source declared","Start Monday","Current step","Days stuck","Next action",...JOURNEY_STEPS.map(([,l])=>l),"J+2 sent","J+5 sent","Opened","Clicked","First post observed","Bonus status",...ATTRIBUTION_KEYS];
  return '\uFEFF'+[headers, ...rows.map(r => [r.name,r.email,r.country,r.zone,r.referrer,r.referrerChannel,r.source,r.sourceDeclared,r.startMonday,r.currentLabel,r.daysStuck,r.nextAction,...JOURNEY_STEPS.map(([k])=>r.dates[k]),r.reminderDates.j2,r.reminderDates.j5,r.openedAt,r.clickedAt,r.postObserved,r.bonusStatus,...ATTRIBUTION_KEYS.map(k=>r.attribution[k])])].map(row=>row.map(safe).join(",")).join("\r\n");
}