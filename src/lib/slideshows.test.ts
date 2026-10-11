import { describe, it, expect, vi } from "vitest";
vi.mock("./os-bridge.server", () => ({ callOs: vi.fn() }));
vi.mock("./slideshow-emails.server", () => ({ pickLang: vi.fn(), posterEmails: {} }));
vi.mock("./brevo.server", () => ({ sendBrevoEmail: vi.fn() }));
import { buildWeek } from "./slideshows.server";
function fixture(existing = false, future = false) {
  const writes: Record<string, unknown>[] = [];
  const sb = { from: (table: string) => {
    const chain: any = {
      select: () => chain, eq: () => chain, lt: () => chain,
      maybeSingle: async () => ({ data: existing ? { id: "existing", status: "draft" } : null }),
      upsert: async (row: Record<string, unknown>) => { writes.push(row); return { error: null }; },
      update: () => chain, in: async () => ({ error: null }),
      then: (resolve: (v: unknown) => unknown) => resolve({ data: table === "slideshow_applications" ? [{ id: "poster", zone: "A", start_monday: future ? "2026-10-19" : "2026-10-05", os_profile_id: null }] : table === "pay_zones" ? [{ zone: "A", weekly_amount: 14 }] : [] }),
    }; return chain;
  } };
  return { sb, writes };
}
describe("manual slideshow week", () => {
  it("prepares a draft without OS data, plus $1 first week, never pays", async () => {
    const { sb, writes } = fixture();
    const result = await buildWeek(sb, "2026-10-05");
    expect(result.built).toBe(1);
    expect(writes[0]).toMatchObject({ status: "draft", amount: 15, rate: 14, first_week: true, manques: null });
    expect(writes[0]?.["note"]).toContain("Manual week");
  });
  it("does not overwrite an edited existing draft", async () => { const { sb, writes } = fixture(true); await buildWeek(sb, "2026-10-05"); expect(writes).toHaveLength(0); });
  it("does not prepare pay before the poster starts", async () => { const { sb, writes } = fixture(false, true); await buildWeek(sb, "2026-10-05"); expect(writes).toHaveLength(0); });
});
