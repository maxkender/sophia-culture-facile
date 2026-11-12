import { describe, expect, it, vi } from "vitest";
import { handleOsEmail, handleOsEmailEvent, hubSecretMatches, osEmailMethodNotAllowed } from "./os-email.server";

const payload = { action: "envoyer_email", to: "test@example.com", from_name: "Sophia", subject: "Referral update", html: "<p>Update</p>", text: "Update", tags: ["parrainage"], unsubscribe_url: "https://example.com/unsubscribe" };
const request = (body: unknown, headers: Record<string, string> = {}) => new Request("https://example.com/api/public/os-email", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
describe("OS email request", () => {
  it("fails closed for missing or incorrect authentication without sending", async () => {
    const fetcher = vi.fn();
    const response = await handleOsEmail(request(payload), "test-shared-value", "test-provider", fetcher);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(hubSecretMatches("wrong", "test-shared-value")).toBe(false);
    expect(hubSecretMatches("test-shared-value", undefined)).toBe(false);
  });
  it("sends both formats, requested sender name, tags and one-click headers from Sophia", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ messageId: "<provider-id>" }, { status: 201 }));
    const response = await handleOsEmail(request(payload, { "x-hub-secret": "test-shared-value" }), "test-shared-value", "test-provider", fetcher);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, message_id: "<provider-id>" });
    const sent = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(sent).toEqual({ sender: { name: "Sophia", email: "support@vikstudios.com" }, replyTo: { email: "support@reply.vikstudios.com", name: "Vik Studios" }, to: [{ email: "test@example.com" }], subject: "Referral update", htmlContent: "<p>Update</p>", textContent: "Update", tags: ["parrainage"], headers: { "List-Unsubscribe": "<https://example.com/unsubscribe>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
  });
  it("rejects invalid action and header injection before sending", async () => {
    const fetcher = vi.fn();
    for (const changes of [{ action: "other" }, { subject: "subject\r\nInjected: yes" }, { unsubscribe_url: "javascript:alert(1)" }, { to: "not-email" }]) {
      const response = await handleOsEmail(request({ ...payload, ...changes }, { "x-hub-secret": "test-shared-value" }), "test-shared-value", "test-provider", fetcher);
      expect(response.status).toBe(400);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns provider refusal status and code, not provider-echoed content", async () => {
    const response = await handleOsEmail(request(payload, { "x-hub-secret": "test-shared-value" }), "test-shared-value", "test-provider", async () => Response.json({ code: "invalid_parameter", message: "echoed content" }, { status: 400 }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_parameter" });
  });
  it("returns 502 for provider failures and missing message IDs", async () => {
    const req = () => request(payload, { "x-hub-secret": "test-shared-value" });
    expect((await handleOsEmail(req(), "test-shared-value", "test-provider", async () => { throw new Error("offline"); })).status).toBe(502);
    expect((await handleOsEmail(req(), "test-shared-value", "test-provider", async () => Response.json({}))).status).toBe(502);
  });
  it("allows only POST", () => {
    expect(osEmailMethodNotAllowed().status).toBe(405);
    expect(osEmailMethodNotAllowed().headers.get("Allow")).toBe("POST");
  });
});

describe("Brevo events to OS", () => {
  it.each([["opened", "ouvert"], ["click", "clique"], ["hardBounce", "rebond"], ["softBounce", "rebond"]])("forwards %s as %s only after authentication", async (event, type) => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
    const response = await handleOsEmailEvent(request({ event, "message-id": "<id>" }, { authorization: "Bearer test-webhook-token" }), "test-webhook-token", "test-os-secret", fetcher);
    expect(response.status).toBe(200);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://mbikecieskoobeizixig.supabase.co/functions/v1/parrainage");
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ "x-hub-secret": "test-os-secret" });
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ action: "evenement", message_id: "<id>", type });
  });
  it("rejects unauthenticated webhook calls without forwarding", async () => {
    const fetcher = vi.fn();
    expect((await handleOsEmailEvent(request({ event: "opened", "message-id": "<id>" }), "test-webhook-token", "test-os-secret", fetcher)).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails closed when the webhook token is not configured", async () => {
    const fetcher = vi.fn();
    const response = await handleOsEmailEvent(request({ event: "opened", "message-id": "<id>" }, { authorization: "Bearer anything" }), undefined, "test-os-secret", fetcher);
    expect(response.status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects the OS secret used as webhook token (dedicated token only)", async () => {
    const fetcher = vi.fn();
    const response = await handleOsEmailEvent(request({ event: "opened", "message-id": "<id>" }, { authorization: "Bearer test-os-secret" }), "test-webhook-token", "test-os-secret", fetcher);
    expect(response.status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns failure so a refused OS event can be retried by the provider", async () => {
    expect((await handleOsEmailEvent(request({ event: "opened", "message-id": "<id>" }, { authorization: "Bearer test-webhook-token" }), "test-webhook-token", "test-os-secret", async () => Response.json({ ok: false }))).status).toBe(502);
  });
});