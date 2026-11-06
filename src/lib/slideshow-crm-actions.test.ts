import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  accept: vi.fn(),
  bulk: vi.fn(),
  rejected: vi.fn(),
  writes: [] as Record<string, unknown>[],
  drafts: [{ id: "draft", amount: 25, carried_in: 0 }],
  app: {
    id: "test-app",
    email: "test@example.invalid",
    full_name: "Test Poster",
    langue: "fr",
    timeline: {},
  },
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain = {
      middleware: () => chain,
      inputValidator: () => chain,
      handler: (h: unknown) => h,
    };
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("./slideshow-accept.server", () => ({
  acceptSlideshowApplication: fake.accept,
  acceptMany: fake.bulk,
}));
vi.mock("./slideshow-emails.server", () => ({
  pickLang: (l: string) => l,
  posterEmails: { rejected: fake.rejected },
}));
vi.mock("./slideshows.server", () => ({ MIN_PAYOUT: 20 }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: fake.app }),
        update: (v: Record<string, unknown>) => {
          fake.writes.push(v);
          return chain;
        },
        then: (resolve: (v: unknown) => unknown) =>
          resolve({ data: table === "slideshow_payouts" ? fake.drafts : [], error: null }),
      };
      return chain;
    },
  },
}));
import { acceptPoster, acceptPostersBulk, approveWeek, rejectPoster } from "./slideshows.functions";
const context = {
  userId: "test",
  supabase: {
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({
          data: { id: "admin", role: "admin", full_name: "Test Admin" },
        }),
      };
      return chain;
    },
  },
};
const invoke = (fn: unknown, data: unknown) =>
  (fn as (v: unknown) => Promise<unknown>)({ data, context });
beforeEach(() => {
  vi.clearAllMocks();
  fake.writes = [];
  fake.accept.mockResolvedValue({ startMonday: "2026-11-16", emailed: true });
  fake.bulk.mockResolvedValue({ accepted: [], skipped: [], failed: [] });
  fake.rejected.mockResolvedValue({ sent: true });
});
describe("slideshow CRM actions preserve existing handlers (isolated, no sends)", () => {
  it("single acceptance forwards apps, zone and language to the shared path", async () => {
    const data = { applicationId: "test-app", apps: ["sophia"], zone: "A", langue: "fr" };
    await invoke(acceptPoster, data);
    expect(fake.accept).toHaveBeenCalledWith(expect.anything(), data, {
      id: "admin",
      name: "Test Admin",
    });
  });
  it("bulk acceptance forwards selected IDs to the shared sequential path", async () => {
    await invoke(acceptPostersBulk, { applicationIds: ["one", "two"] });
    expect(fake.bulk).toHaveBeenCalledWith(expect.anything(), ["one", "two"], {
      id: "admin",
      name: "Test Admin",
    });
  });
  it("refusal stores the reason and retains the localized email call", async () => {
    await invoke(rejectPoster, { applicationId: "test-app", reason: "Test refusal" });
    expect(fake.writes[0]).toMatchObject({ status: "rejected", rejected_reason: "Test refusal" });
    expect(fake.rejected).toHaveBeenCalledWith(
      "test@example.invalid",
      "Test Poster",
      "fr",
      "Test refusal",
    );
  });
  it("week approval only marks the draft approved, never paid", async () => {
    await invoke(approveWeek, { lundi: "2026-11-02" });
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toMatchObject({ status: "approved", approved_by: "admin" });
  });
});
