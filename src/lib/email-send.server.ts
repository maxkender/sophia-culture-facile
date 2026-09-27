// Server-only helper that sends app email through Lovable's managed email API.
// Keep synchronous: no queues, no cron, no email tables — delivery handling lives on Lovable's side.
import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";

/** Verified delegated subdomain used for sending. FROM_DOMAIN is display-only. */
export const SENDER_DOMAIN = "notify.sophia-culture.com";
export const FROM_DOMAIN = "sophia-culture.com";
export const FROM_EMAIL = `onboarding@${SENDER_DOMAIN}`;
export const FROM_NAME = "Sophia";

export type SendResult = { sent: boolean; reason?: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export function replaceMergeFields(text: string, fields: Record<string, string>): string {
  return Object.entries(fields).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    text,
  );
}

/** Renders a simple branded email: optional paragraphs and bullets, then one primary button. */
export function buildEmailHtml(options: {
  paragraphs: string[];
  bullets?: string[];
  buttonLabel?: string;
  buttonUrl?: string;
}): string {
  const { paragraphs, bullets, buttonLabel, buttonUrl } = options;
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p)}</p>`)
    .join("");
  const list = bullets && bullets.length > 0
    ? `<ul style="margin:0 0 16px;padding-left:20px;">${bullets.map((b) => `<li style="margin:0 0 8px;">${escapeHtml(b)}</li>`).join("")}</ul>`
    : "";
  const button = buttonLabel && buttonUrl
    ? `<p style="margin:24px 0;"><a href="${escapeAttribute(buttonUrl)}" style="display:inline-block;background:#1f3a5f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">${escapeHtml(buttonLabel)}</a></p><p style="margin:0;font-size:13px;color:#555555;word-break:break-all;">${escapeHtml(buttonUrl)}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f2;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:15px;line-height:1.6;">
<p style="margin:0 0 24px;font-weight:700;letter-spacing:0.02em;">Sophia</p>
${body}${list}${button}
<p style="margin:24px 0 0;font-size:12px;color:#888888;">Sophia — apprendre la culture facilement. sophia-culture.com</p>
</div></body></html>`;
}

export function buildEmailText(options: {
  paragraphs: string[];
  bullets?: string[];
  buttonLabel?: string;
  buttonUrl?: string;
}): string {
  const parts = [...options.paragraphs];
  if (options.bullets?.length) parts.push("", ...options.bullets.map((b) => `- ${b}`));
  if (options.buttonUrl) parts.push("", options.buttonLabel ?? "Open the link:", options.buttonUrl);
  return parts.join("\n\n");
}

export async function sendAppEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  label?: string;
  purpose?: string;
}): Promise<SendResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, reason: "missing_api_key" };
  const payload: import("@lovable.dev/email-js").EmailSendRequest = {
    to: options.to,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    sender_domain: SENDER_DOMAIN,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };
  if (options.idempotencyKey) payload.idempotency_key = options.idempotencyKey;
  if (options.label) payload.label = options.label;
  if (options.purpose) payload.purpose = options.purpose;
  const sendOptions: import("@lovable.dev/email-js").SendEmailOptions = { apiKey };
  if (options.idempotencyKey) sendOptions.idempotencyKey = options.idempotencyKey;
  try {
    const response = await sendLovableEmail(payload, sendOptions);
    return { sent: Boolean(response.success), ...(response.success ? {} : { reason: response.status ?? "send_failed" }) };
  } catch (error) {
    const code = error instanceof EmailAPIError ? error.code : null;
    return { sent: false, reason: code ?? "send_error" };
  }
}
