import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  app: {} as Record<string, unknown>,
  rates: [] as { zone: string; weekly_amount: number | null; first_week_amount: number; posts_per_day: number }[],
  writes: [] as Record<string, unknown>[],
  emails: [] as { text: string }[],
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (data: unknown): unknown => data;
    const chain = {
      middleware: () => chain,
      inputValidator: (fn: typeof validate) => { validate = fn; return chain; },
      handler: (fn: (input: { data: unknown; context?: unknown }) => unknown) =>
        (input: { data?: unknown; context?: unknown } = {}) => fn({ ...input, data: validate(input.data) }),
    };
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("./slideshows.server", () => ({
  getOsZones: vi.fn(), nextStartMonday: () => "2026-11-30", randomToken: () => "test-token-no-real-contract", RUUL_BLOCKED: [],
}));
vi.mock("./brevo.server", () => ({ sendBrevoEmail: async (email: { text: string }) => { fake.emails.push(email); return { sent: true }; } }));
vi.mock("./slideshow-email-audit.server", () => ({ recordPosterEmail: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: "US" }),
    from: (table: string) => {
      let selectedZone: unknown;
      const row = () => table === "pay_zones" ? fake.rates.find((r) => r.zone === selectedZone)
        : table === "documents" ? { published: true, title: "Guide", current_version: 1, content: [{ type: "paragraph", text: "{weekly_amount}" }] }
        : table === "profiles" ? { id: "admin", role: "admin" }
        : table === "hub_settings" ? { value: "true" } : fake.app;
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => { if (key === "zone") selectedZone = value; return chain; },
        in: () => chain, order: () => chain, limit: () => chain,
        maybeSingle: async () => ({ data: row(), error: null }),
        update: (patch: Record<string, unknown>) => { fake.writes.push(patch); return chain; },
        insert: () => chain,
        then: (resolve: (result: unknown) => unknown) => resolve({ data: table === "pay_zones" ? fake.rates : table === "slideshow_applications" ? [fake.app] : [], error: null }),
      };
      return chain;
    },
  },
}));
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { acceptSlideshowApplication } from "./slideshow-accept.server";
import { runAutoAccept } from "./slideshow-auto-accept.server";
import { getGuideByToken, getSlideshowPayInfo, setApplicationZone } from "./slideshow-zones.functions";
import { acceptPoster } from "./slideshows.functions";

const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  fake.app = { id, status: "pending", zone: "US", country: "United States", is_adult: true, email: "test@example.invalid", full_name: "Test Poster", langue: "en" };
  fake.rates = [
    { zone: "A", weekly_amount: 14, first_week_amount: 14, posts_per_day: 2 },
    { zone: "B", weekly_amount: 10, first_week_amount: 10, posts_per_day: 2 },
    { zone: "C", weekly_amount: 7, first_week_amount: 7, posts_per_day: 2 },
    { zone: "US", weekly_amount: 30, first_week_amount: 30, posts_per_day: 2 },
  ];
  fake.writes = []; fake.emails = [];
});

describe("US zone uses database rates without remapping existing applications (mocked, no sends)", () => {
  it.each([["US", false, 30], ["A", true, 14]])("acceptance email uses stored zone %s rate", async (zone, override, amount) => {
    Object.assign(fake.app, { zone, zone_override: override });
    await acceptSlideshowApplication(supabaseAdmin, { applicationId: id }, { id: "admin", name: "Admin" }, null);
    expect(fake.emails).toHaveLength(1);
    expect(fake.emails[0]?.text).toContain(`$${amount}`);
    expect(fake.writes.every((patch) => !("zone" in patch))).toBe(true);
  });
  it("auto-accept includes US with its database rate", async () => {
    const result = await runAutoAccept(supabaseAdmin);
    expect(result.accepted).toEqual([{ id, email: "test@example.invalid", zone: "US", rate: 30 }]);
  });
  it("auto-accept skips US when its database rate is absent", async () => {
    fake.rates = fake.rates.filter((r) => r.zone !== "US");
    expect((await runAutoAccept(supabaseAdmin)).accepted).toEqual([]);
    expect(fake.emails).toHaveLength(0);
  });
  it("public pay range includes US and looks up its country rate", async () => {
    expect(await getSlideshowPayInfo({ data: { country: "US" } })).toEqual({ range: { min: 7, max: 30 }, country: { weekly: 30, first: 30 } });
  });
  it.each([["US", false, 30], ["A", true, 14]])("signed guide uses stored zone %s", async (zone, override, amount) => {
    Object.assign(fake.app, { status: "contract_signed", zone, zone_override: override });
    expect(await getGuideByToken({ data: { token: "test-token-no-real-contract" } })).toMatchObject({ state: "ready", blocks: [{ type: "paragraph", text: String(amount) }] });
    expect(fake.writes[0]).toMatchObject({ guide_figures_shown: { weekly_amount: amount } });
  });
  it("manual zone schema accepts US", async () => {
    const invoke = setApplicationZone as unknown as (input: unknown) => Promise<unknown>;
    await invoke({ data: { applicationId: id, zone: "US", note: "US zone" }, context: { supabase: supabaseAdmin, userId: "admin" } });
    expect(fake.writes[0]).toMatchObject({ zone: "US", zone_override: true });
  });
  it("manual acceptance schema accepts US", async () => {
    const invoke = acceptPoster as unknown as (input: unknown) => Promise<unknown>;
    await invoke({ data: { applicationId: id, zone: "US", apps: ["sophia"], langue: "en" }, context: { supabase: supabaseAdmin, userId: "admin" } });
    expect(fake.emails[0]?.text).toContain("$30");
  });
});