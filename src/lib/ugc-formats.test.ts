import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { formatDefaults, formatText, setFormatText, type UgcFormat } from "./ugc-formats";
import { blankPlan, styleDefaults, STYLES } from "./brief-studio";
const definition = (key: UgcFormat["key"]): UgcFormat => ({ id: "test", key, name_en: key, name_fr: key, description: "", when_to_use: "", tips: "", sort_order: 1, example_inspiration_ids: [], structure: { fields: [], shots: [{ ...blankPlan(), label: "Custom shot", do: "Owner instruction", camera: "0–3 s", assets: [{ asset_id: "asset", when: "0:02" }] }] } });
describe("UGC video formats", () => {
  it("has exactly the five formats in the owner's order", () => { expect(STYLES.map(([k]) => k)).toEqual(["reaction_demo", "broll_stickers", "sole_footage", "talked_hook_demo", "educational"]); });
  it.each(STYLES.map(([k]) => [k]))("uses edited shot structures for %s", (key) => { const f = definition(key); const d = formatDefaults(f); expect(d.plans).toHaveLength(1); expect(d.plans?.[0]?.do).toBe("Owner instruction"); expect(d.plans?.[0]?.camera).toBe("0–3 s"); expect(d.plans?.[0]?.assets[0]?.asset_id).toBe("asset"); expect(styleDefaults(key, d).plans).toHaveLength(1); });
  it("does not truncate edited reaction shot structures on reload", () => { expect(styleDefaults("reaction_demo", { plans: [blankPlan(), blankPlan(), blankPlan()] }).plans).toHaveLength(3); });
  it("preserves older sole-footage content in its shot", () => { const d = styleDefaults("sole_footage", { sole: { what: "Legacy visual", text: "Legacy text", duration_s: 7, music_title: "", music_link: "", music_asset_id: null, fmt: { kind: "title", note: "" } } }); expect(d.plans?.[0]?.do).toBe("Legacy visual"); expect(d.plans?.[0]?.on_screen).toBe("Legacy text"); });
  it("edits French guidance without changing English", () => { const v = setFormatText('{"en":"English","fr":"French"}', "fr", "Modifié"); expect(formatText(v, "fr")).toBe("Modifié"); expect(formatText(v, "en")).toBe("English"); });
  it("supports plain guidance", () => { expect(formatText("Plain text", "fr")).toBe("Plain text"); });
});
