import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const headerText = z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value));
const httpsUrl = z.string().max(2000).url().refine((value) => new URL(value).protocol === "https:");
export const osEmailSchema = z.object({
  action: z.literal("envoyer_email"),
  to: z.string().trim().email().max(254),
  from_name: headerText,
  subject: headerText,
  html: z.string().min(1).max(200_000),
  text: z.string().min(1).max(200_000),
  tags: z.array(z.string().trim().min(1).max(100)).max(10).optional().default([]),
  unsubscribe_url: httpsUrl,
});

/** Fixed-size digests avoid variable-length comparisons; missing configuration fails closed. */
export function hubSecretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  return timingSafeEqual(createHash("sha256").update(provided).digest(), createHash("sha256").update(expected).digest());
}

export async function readBoundedJson(request: Request, limit: number): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("invalid_content_type");
  if (!request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("body_too_large"); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally { reader.releaseLock(); }
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
export const osEmailMethodNotAllowed = () => new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), { status: 405, headers: { Allow: "POST", "content-type": "application/json", "cache-control": "no-store" } });

export async function handleOsEmail(request: Request, secret: string | undefined, brevoKey: string | undefined, fetcher: typeof fetch = fetch): Promise<Response> {
  if (!hubSecretMatches(request.headers.get("x-hub-secret"), secret)) return json({ ok: false, error: "unauthorized" }, 401);
  let parsed: z.infer<typeof osEmailSchema>;
  try { parsed = osEmailSchema.parse(await readBoundedJson(request, 450_000)); }
  catch { return json({ ok: false, error: "invalid_request" }, 400); }
  if (!brevoKey) return json({ ok: false, error: "email_provider_not_configured" }, 503);
  try {
    const response = await fetcher("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: parsed.from_name, email: "support@vikstudios.com" },
        replyTo: { email: "support@reply.vikstudios.com", name: "Vik Studios" },
        to: [{ email: parsed.to }], subject: parsed.subject,
        htmlContent: parsed.html, textContent: parsed.text, tags: parsed.tags,
        headers: { "List-Unsubscribe": `<${parsed.unsubscribe_url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json().catch(() => null) as { messageId?: unknown; message?: unknown; code?: unknown } | null;
    if (!response.ok) {
      // Error codes, not echoed arbitrary provider content: no credential/body leakage.
      const code = typeof result?.code === "string" && /^[a-z0-9_-]{1,80}$/i.test(result.code) ? result.code : "email_provider_error";
      return json({ ok: false, error: code }, response.status >= 400 && response.status <= 599 ? response.status : 502);
    }
    if (typeof result?.messageId !== "string" || !result.messageId) return json({ ok: false, error: "missing_message_id" }, 502);
    return json({ ok: true, message_id: result.messageId });
  } catch { return json({ ok: false, error: "email_provider_unavailable" }, 502); }
}

export const brevoEventSchema = z.object({
  event: z.enum(["opened", "uniqueOpened", "click", "hardBounce", "softBounce"]),
  "message-id": z.string().min(1).max(500),
  tags: z.array(z.string().max(100)).max(20).optional(),
});
export function osEventType(event: z.infer<typeof brevoEventSchema>["event"]): "ouvert" | "clique" | "rebond" {
  return event === "click" ? "clique" : event === "opened" || event === "uniqueOpened" ? "ouvert" : "rebond";
}

export async function handleOsEmailEvent(request: Request, webhookToken: string | undefined, osSecret: string | undefined, fetcher: typeof fetch = fetch): Promise<Response> {
  // Brevo supports authenticated webhook calls; the receiver uses its own dedicated bearer token.
  const authorization = request.headers.get("authorization");
  if (!hubSecretMatches(authorization?.startsWith("Bearer ") ? authorization.slice(7) : null, webhookToken)) return json({ ok: false, error: "unauthorized" }, 401);
  let event: z.infer<typeof brevoEventSchema>;
  try { event = brevoEventSchema.parse(await readBoundedJson(request, 32_000)); }
  catch { return json({ ok: false, error: "invalid_event" }, 400); }
  try {
    const response = await fetcher("https://mbikecieskoobeizixig.supabase.co/functions/v1/parrainage", {
      method: "POST", headers: { "content-type": "application/json", "x-hub-secret": osSecret ?? "" },
      body: JSON.stringify({ action: "evenement", message_id: event["message-id"], type: osEventType(event.event) }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json().catch(() => null) as { ok?: unknown } | null;
    if (!response.ok || result?.ok === false) return json({ ok: false, error: "os_event_forward_failed" }, 502);
    return json({ ok: true });
  } catch { return json({ ok: false, error: "os_event_forward_failed" }, 502); }
}