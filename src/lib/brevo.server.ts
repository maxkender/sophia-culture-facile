// Server-only Brevo transactional email sender. Never import from client code.
export const BREVO_SENDER = { name: "Maximilien — Sophia", email: "maximilien@vikstudios.com" };

export type BrevoResult = { sent: boolean; messageId?: string; reason?: string };

export async function sendBrevoEmail(opts: { to: string; toName?: string; subject: string; html: string; text: string }): Promise<BrevoResult> {
  const key = process.env["BREVO_API_KEY"];
  if (!key) return { sent: false, reason: "brevo_key_missing" };
  if (/@fastlane\.sophia-culture\.com$/i.test(opts.to.trim())) return { sent: false, reason: "email_pending" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: BREVO_SENDER,
        replyTo: { email: BREVO_SENDER.email },
        to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { sent: false, reason: `brevo_${res.status}: ${String((body as any)?.message ?? "").slice(0, 200)}` };
    return { sent: true, messageId: (body as any)?.messageId };
  } catch (e) {
    return { sent: false, reason: `brevo_error: ${(e as Error).message.slice(0, 200)}` };
  }
}
