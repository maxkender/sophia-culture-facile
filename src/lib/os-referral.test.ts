import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./os-bridge.server", () => ({ osBaseUrl: async () => "https://os.example.com" }));
import { notifyOsApplication, runOsNotification } from "./os-referral.server";
afterEach(() => vi.unstubAllGlobals());
describe("saved application OS notification", () => {
  it("sends candidature with the applicant email and stored code", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    await notifyOsApplication({}, "poster@example.com", "CODE", "test-shared-value");
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ action: "candidature", email: "poster@example.com", ref: "CODE" });
  });
  it("old clients send null and OS failures never reject the application notification", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => { throw new Error("OS offline"); });
    vi.stubGlobal("fetch", fetcher);
    await expect(notifyOsApplication({}, "poster@example.com", null, "test-shared-value")).resolves.toBeUndefined();
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({ ref: null });
  });
  it("registers background work without waiting for completion", () => {
    const waitUntil = vi.fn();
    const pending = new Promise<void>(() => {});
    expect(runOsNotification(Object.assign(new Request("https://example.com"), { waitUntil }), pending)).toBeUndefined();
    expect(waitUntil).toHaveBeenCalledOnce();
  });
});