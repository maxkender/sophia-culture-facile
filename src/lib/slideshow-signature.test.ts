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
        maybeSingle: async () => ({ data: table === "documents" ? { published: true, current_version: "1" } : fake.app }),
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
import { signWithToken } from "./creator-agreement.functions";

afterEach(() => vi.useRealTimers());

describe("signature persists the start before OS creation (mocked only)", () => {
  it.each([
    ["2026-10-23", "2026-10-26"],
    ["2026-10-24", "2026-11-02"],
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