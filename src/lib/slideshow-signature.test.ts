import { afterEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  app: { id: "poster", status: "accepted", start_monday: "2026-10-26", timeline: {} } as Record<string, unknown>,
  writes: [] as Record<string, unknown>[],
  os: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain = {
      middleware: () => chain,
      inputValidator: () => chain,
      handler: (handler: (input: unknown) => unknown) => handler,
    };
    return chain;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => undefined }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("./os-bridge.server", () => ({ callOs: vi.fn() }));
vi.mock("./slideshow-emails.server", () => ({ pickLang: vi.fn(), posterEmails: {} }));
vi.mock("./brevo.server", () => ({ sendBrevoEmail: vi.fn() }));
vi.mock("./slideshows.server", async (original) => ({
  ...await original<typeof import("./slideshows.server")>(),
  createPosterInOs: fake.os,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: table === "documents" ? { published: true, current_version: "1" } : { ...fake.app } }),
        insert: async () => ({ error: null }),
        update: (values: Record<string, unknown>) => {
          fake.writes.push(values);
          Object.assign(fake.app, values);
          return chain;
        },
        then: (resolve: (result: { error: null }) => unknown) => resolve({ error: null }),
      };
      return chain;
    },
  },
}));
import { getSigningPage, signWithToken } from "./creator-agreement.functions";

afterEach(() => vi.useRealTimers());

describe("signing-page start Monday matches the signature date rule", () => {
  it.each([
    ["2026-11-13T12:00:00Z", "2026-11-16", "2026-11-16"],
    ["2026-11-15T23:00:00Z", "2026-11-16", "2026-11-23"],
    ["2026-11-13T12:00:00Z", "2026-11-30", "2026-11-30"],
  ])("at %s displays %s as %s", async (now, stored, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    fake.app = { status: "accepted", start_monday: stored };
    fake.writes = [];
    const result = await getSigningPage({ data: { token: "test-token-no-real-contract" } });
    expect(result).toMatchObject({ state: "ready", startMonday: expected });
    expect(fake.writes).toHaveLength(0);
  });
});

describe("signature persists the start before OS creation (mocked only)", () => {
  it.each([
    ["2026-10-23", "2026-10-26"],
    ["2026-10-24", "2026-10-26"],
    ["2026-10-26", "2026-11-02"],
  ])("signs %s and sends %s to the OS", async (signed, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${signed}T15:51:00Z`));
    fake.app = { id: "poster", status: "accepted", start_monday: "2026-10-26", timeline: {} };
    fake.writes = [];
    fake.os.mockReset().mockImplementation(async () => {
      expect(fake.app["start_monday"]).toBe(expected);
      expect(fake.app["status"]).toBe("contract_signed");
    });
    await signWithToken({ data: { token: "test-token-no-real-contract", signedName: "Test Poster", documentVersion: "1" } });
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toMatchObject({
      start_monday: expected, status: "contract_signed",
      agreement_signed_at: `${signed}T15:51:00.000Z`, contract_signed_at: `${signed}T15:51:00.000Z`,
    });
    expect(fake.os).toHaveBeenCalledOnce();
  });
});
it("allows signing without a Ruul email and leaves it available for later onboarding", async () => {
  fake.app = { id: "poster", status: "accepted", start_monday: "2026-11-16", timeline: {} };
  fake.writes = [];
  fake.os.mockReset().mockResolvedValue({ ok: true });
  await signWithToken({ data: { token: "test-token-no-real-contract", signedName: "Test Poster", documentVersion: "1", ruulEmail: "" } });
  expect(fake.writes[0]).toMatchObject({ ruul_email: null, status: "contract_signed" });
});
