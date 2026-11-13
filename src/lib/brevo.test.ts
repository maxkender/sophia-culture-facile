import { afterEach, expect, it, vi } from "vitest";
import { sendBrevoEmail } from "./brevo.server";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("sends creator emails as Vik Studios from the unchanged support address", async () => {
  vi.stubEnv("BREVO_API_KEY", "mock-provider-key");
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ messageId: "<test-id>" }, { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  await sendBrevoEmail({ to: "test@example.invalid", subject: "Test", html: "<p>Test</p>", text: "Test" });
  const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
  expect(body.sender).toEqual({ name: "Vik Studios", email: "support@vikstudios.com" });
  expect(body.replyTo).toEqual({ email: "support@vikstudios.com" });
});