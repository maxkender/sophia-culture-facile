// Server-only: UGC welcome / decline emails. Brevo first; Lovable sender as backup so an accepted creator is never left without their link.
import { sendBrevoEmail } from "./brevo.server";
import { buildEmailHtml, buildEmailText, replaceMergeFields, sendAppEmail } from "./email-send.server";

export const SLACK_URL = "https://join.slack.com/t/ugc-vikstudios/shared_invite/zt-4b6fwnseu-KrYV8Y0~IZ9C~7uo9HipbQ";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

import { EMAIL_DEFAULTS, EMAIL_DEFAULTS_FR } from "./ugc-email-texts";
export { EMAIL_DEFAULTS, EMAIL_DEFAULTS_FR };

const FR_COUNTRIES = new Set(["FR", "BE", "CH", "LU", "MC", "CA", "SN", "CI", "MA", "TN", "DZ", "CM", "RE", "GP", "MQ", "GF", "YT", "PF", "NC"]);
const FR_COUNTRY_NAMES = new Set(["FRANCE", "BELGIQUE", "BELGIUM", "SUISSE", "SWITZERLAND", "LUXEMBOURG", "MONACO", "SÉNÉGAL", "SENEGAL", "CÔTE D’IVOIRE", "CÔTE D'IVOIRE", "IVORY COAST", "MAROC", "MOROCCO", "TUNISIE", "TUNISIA", "ALGÉRIE", "ALGERIA", "CAMEROUN", "CAMEROON", "LA RÉUNION", "RÉUNION", "GUADELOUPE", "MARTINIQUE", "GUYANE", "MAYOTTE"]);
/** French creators get French emails: explicit language first, then country. */
export function emailLang(language?: string | null, country?: string | null): "fr" | "en" {
  const l = (language ?? "").toLowerCase();
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("en")) return "en";
  // Forms store either a code ("FR") or a name ("France"): accept both.
  const c = (country ?? "").trim().toUpperCase();
  return c && (FR_COUNTRIES.has(c) || FR_COUNTRY_NAMES.has(c)) ? "fr" : "en";
}

export type EmailKey = keyof typeof EMAIL_DEFAULTS;

export async function loadTemplate(admin: Admin, key: EmailKey) {
  const { data } = await admin.from("creator_email_settings").select("subject, intro, instructions, button_label").eq("template_key", key).maybeSingle();
  return data ?? EMAIL_DEFAULTS[key];
}

export type EmailOutcome = { sent: boolean; provider: "brevo" | "lovable" | null; messageId: string | null; note: string | null };

export async function sendTemplated(admin: Admin, key: EmailKey, to: string, fullName: string, buttonUrl?: string, lang: "fr" | "en" = "en"): Promise<EmailOutcome> {
  // The admin-edited template is the English one; French creators get the French version.
  // Texts live in code (FR + EN) so they can never carry amounts or old onboarding steps.
  void admin;
  const t = lang === "fr" ? EMAIL_DEFAULTS_FR[key] : EMAIL_DEFAULTS[key];
  const fields = { first_name: fullName.split(/\s+/)[0] || (lang === "fr" ? "" : "there"), full_name: fullName, invite_url: buttonUrl ?? "" };
  const split = (s: string) => replaceMergeFields(s, fields).split(/\n/).map((l) => l.trim()).filter(Boolean);
  const paragraphs = [...split(t.intro), ...split(t.instructions)];
  const opts = {
    paragraphs,
    ...(buttonUrl && t.button_label ? { buttonLabel: t.button_label, buttonUrl } : {}),
  };
  const subject = replaceMergeFields(t.subject, fields).slice(0, 160);
  const html = buildEmailHtml(opts);
  const text = buildEmailText(opts);
  const brevo = await sendBrevoEmail({ to, toName: fullName, subject, html, text });
  if (brevo.sent) return { sent: true, provider: "brevo", messageId: brevo.messageId ?? null, note: null };
  const backup = await sendAppEmail({ to, subject, html, text, label: key, purpose: "transactional", idempotencyKey: `${key}-${to}-${Date.now()}` });
  const why = brevo.reason === "brevo_key_missing" ? "Brevo key missing" : `Brevo failed (${brevo.reason})`;
  if (backup.sent) return { sent: true, provider: "lovable", messageId: null, note: `${why} — sent through the backup sender` };
  return { sent: false, provider: null, messageId: null, note: `Email not sent: ${why}` };
}

/** Acknowledgement after a public UGC application. No link, no account: the owner decides later. */
export async function sendUgcAck(to: string, fullName: string, lang: "fr" | "en"): Promise<EmailOutcome> {
  const first = fullName.split(/\s+/)[0] || "";
  const fr = lang === "fr";
  const subject = fr ? "Candidature reçue" : "Application received";
  const opts = { paragraphs: fr
    ? [`Salut ${first},`, "Candidature reçue, on revient vers toi.", "— L’équipe créateurs Sophia"]
    : [`Hi ${first || "there"},`, "Application received, we'll get back to you.", "— The Sophia creator team"] };
  const html = buildEmailHtml(opts); const text = buildEmailText(opts);
  const brevo = await sendBrevoEmail({ to, toName: fullName, subject, html, text });
  if (brevo.sent) return { sent: true, provider: "brevo", messageId: brevo.messageId ?? null, note: null };
  const backup = await sendAppEmail({ to, subject, html, text, label: "ugc-ack", purpose: "transactional", idempotencyKey: `ugc-ack-${to}-${Date.now()}` });
  return { sent: backup.sent, provider: backup.sent ? "lovable" : null, messageId: null, note: null };
}

/** Short plain message to a creator (draft review outcome, etc.). */
export async function sendCreatorNote(to: string, fullName: string, subject: string, paragraphs: string[], button?: { label: string; url: string }): Promise<EmailOutcome> {
  const opts = { paragraphs, ...(button ? { buttonLabel: button.label, buttonUrl: button.url } : {}) };
  const html = buildEmailHtml(opts); const text = buildEmailText(opts);
  const brevo = await sendBrevoEmail({ to, toName: fullName, subject, html, text });
  if (brevo.sent) return { sent: true, provider: "brevo", messageId: brevo.messageId ?? null, note: null };
  const backup = await sendAppEmail({ to, subject, html, text, label: "ugc-draft", purpose: "transactional", idempotencyKey: `ugc-draft-${to}-${Date.now()}` });
  return { sent: backup.sent, provider: backup.sent ? "lovable" : null, messageId: null, note: null };
}
