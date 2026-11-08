import { describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ os: vi.fn(async () => ({ ok: false, error: "mock refusal" })) }));
vi.mock("./os-bridge.server", () => ({ callOs: fake.os }));
vi.mock("./slideshow-emails.server", () => ({ pickLang: vi.fn(), posterEmails: {} }));
vi.mock("./brevo.server", () => ({ sendBrevoEmail: vi.fn() }));
import { createPosterInOs } from "./slideshows.server";
describe("existing poster creation referral payload (mocked only)", () => {
  it.each(["CODE-123", null])("includes the saved referral %s after signature", async (ref) => {
    fake.os.mockClear();
    const chain = {
      select: () => chain, eq: () => chain,
      maybeSingle: async () => ({ data: { id: "test", status: "contract_signed", full_name: "Test Poster", email: "test@example.com", country: "FR", ref } }),
      update: () => chain, then: (resolve: (value: unknown) => unknown) => resolve({ error: null }),
    };
    await createPosterInOs({ from: () => chain }, "test");
    expect(fake.os).toHaveBeenCalledWith(expect.anything(), "creer_posteur", expect.objectContaining({ ref }));
  });
});