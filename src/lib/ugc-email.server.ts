// Server-only: UGC welcome / decline emails. Brevo first; Lovable sender as backup so an accepted creator is never left without their link.
import { sendBrevoEmail } from "./brevo.server";
import { buildEmailHtml, buildEmailText, replaceMergeFields, sendAppEmail } from "./email-send.server";

export const SLACK_URL = "https://join.slack.com/t/ugc-vikstudios/shared_invite/zt-4b6fwnseu-KrYV8Y0~IZ9C~7uo9HipbQ";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const EMAIL_DEFAULTS = {
  "ugc-welcome": {
    subject: "You're in — your Sophia creator space",
    intro: "Hi {first_name},\n\nWelcome to the Sophia creator team. Your private creator space is ready: open the button below and create your password with this email address.",
    instructions: "Do these three things first:\n1. Read the rules and sign the Creator Account Agreement.\n2. Create the Sophia email, TikTok and Instagram accounts and register them in your space.\n3. Do the 24-hour warm-up and set up your payouts.\n\nJoin the team Slack too — the link is below.\n\nReply to this email if anything is unclear.",
    button_label: "Open my creator space",
  },
  "ugc-decline": {
    subject: "Your Sophia creator application",
    intro: "Hi {first_name},\n\nThank you for applying to create for Sophia and for the time you put into your video.",
    instructions: "We are not taking your application further this time. This is not a judgement of you: we look for a very specific style and we receive many more applications than we have places.\n\nWe wish you all the best, and you are welcome to apply again in a few months.",
    button_label: "",
  },
} as const;

/** French versions used for French-speaking creators (language fr, or a French-speaking country). */
export const EMAIL_DEFAULTS_FR = {
  "ugc-welcome": {
    subject: "C’est validé — ton espace créateur Sophia",
    intro: "Salut {first_name},\n\nBienvenue dans l’équipe créateurs Sophia. Ton espace créateur privé est prêt : clique sur le bouton ci-dessous et crée ton mot de passe avec cette adresse email.",
    instructions: "Commence par ces trois choses :\n1. Lis les règles et signe le contrat de compte créateur.\n2. Crée l’email Sophia et les comptes TikTok et Instagram, puis enregistre-les dans ton espace.\n3. Fais l’échauffement de 24 heures et configure tes paiements.\n\nRejoins aussi le Slack de l’équipe — le lien est juste en dessous.\n\nRéponds à cet email si quelque chose n’est pas clair.",
    button_label: "Ouvrir mon espace créateur",
  },
  "ugc-decline": {
    subject: "Ta candidature créateur Sophia",
    intro: "Salut {first_name},\n\nMerci d’avoir candidaté pour créer pour Sophia et pour le temps passé sur ta vidéo.",
    instructions: "On ne retient pas ta candidature cette fois-ci. Ce n’est pas un jugement sur toi : on cherche un style très précis et on reçoit beaucoup plus de candidatures que de places.\n\nOn te souhaite le meilleur, et tu peux candidater à nouveau dans quelques mois.",
    button_label: "",
  },
} as const;

const FR_COUNTRIES = new Set(["FR", "BE", "CH", "LU", "MC", "CA", "SN", "CI", "MA", "TN", "DZ", "CM", "RE", "GP", "MQ", "GF", "YT", "PF", "NC"]);
/** French creators get French emails: explicit language first, then country. */
export function emailLang(language?: string | null, country?: string | null): "fr" | "en" {
  const l = (language ?? "").toLowerCase();
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("en")) return "en";
  return country && FR_COUNTRIES.has(country.toUpperCase()) ? "fr" : "en";
}

export type EmailKey = keyof typeof EMAIL_DEFAULTS;

export async function loadTemplate(admin: Admin, key: EmailKey) {
  const { data } = await admin.from("creator_email_settings").select("subject, intro, instructions, button_label").eq("template_key", key).maybeSingle();
  return data ?? EMAIL_DEFAULTS[key];
}

export type EmailOutcome = { sent: boolean; provider: "brevo" | "lovable" | null; messageId: string | null; note: string | null };

export async function sendTemplated(admin: Admin, key: EmailKey, to: string, fullName: string, buttonUrl?: string, lang: "fr" | "en" = "en"): Promise<EmailOutcome> {
  // The admin-edited template is the English one; French creators get the French version.
  const t = lang === "fr" ? EMAIL_DEFAULTS_FR[key] : await loadTemplate(admin, key);
  const fields = { first_name: fullName.split(/\s+/)[0] || (lang === "fr" ? "" : "there"), full_name: fullName, invite_url: buttonUrl ?? "" };
  const split = (s: string) => replaceMergeFields(s, fields).split(/\n/).map((l) => l.trim()).filter(Boolean);
  const paragraphs = [...split(t.intro), ...split(t.instructions)];
  const opts = {
    paragraphs,
    ...(buttonUrl && t.button_label ? { buttonLabel: t.button_label, buttonUrl } : {}),
    ...(key === "ugc-welcome" ? { linkSection: (lang === "fr" ? { text: "Rejoins le Slack de l’équipe :", url: SLACK_URL, linkLabel: "Rejoindre le Slack" } : { text: "Join the team Slack:", url: SLACK_URL, linkLabel: "Join our Slack" }) } : {}),
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
