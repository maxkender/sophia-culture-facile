import type { Database } from "@/integrations/supabase/types";

export type Prospect = Database["public"]["Tables"]["creator_prospects"]["Row"];
export type Touch = Database["public"]["Tables"]["prospect_touches"]["Row"];
export type Template = Database["public"]["Tables"]["prospect_templates"]["Row"];
export type Hm = { id: string; full_name: string | null };

export const STATUSES = [
  "new",
  "contacted",
  "replied",
  "interested",
  "not_interested",
  "applied",
  "converted",
  "unreachable",
] as const;

export const STATUS_CLASS: Record<string, string> = {
  new: "bg-status-new text-card",
  contacted: "bg-status-contacted text-card",
  replied: "bg-status-replied text-card",
  interested: "bg-status-interested text-card",
  not_interested: "bg-status-not-interested text-card",
  applied: "bg-status-applied text-card",
  converted: "bg-status-converted text-card",
  unreachable: "bg-status-unreachable text-brand-navy",
};

export const TRACKS = ["ugc", "slideshow", "influencer", "both"] as const;
export const SOURCES = ["app_form", "scrape", "manual", "referral"] as const;
export const CHANNELS = ["email", "dm", "whatsapp", "call", "upwork", "other"] as const;
export const FUNNEL = ["new", "contacted", "replied", "interested", "applied", "converted"] as const;

export const DAY = 864e5;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const REGIONS =
  "AD AE AF AL AM AO AR AT AU AZ BA BD BE BF BG BH BJ BO BR BY CA CD CH CI CL CM CN CO CR CU CY CZ DE DK DO DZ EC EE EG ES ET FI FR GA GB GE GH GN GR GT HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KR KW KZ LB LK LT LU LV MA MC MD ME MG MK ML MN MT MU MX MY MZ NE NG NI NL NO NP NZ OM PA PE PH PK PL PR PT PY QA RE RO RS RU RW SA SE SG SI SK SN SV SY TG TH TN TR TW TZ UA UG US UY UZ VE VN YE ZA ZM ZW".split(
    " ",
  );

let names: Map<string, string> | null = null;
function nameMap() {
  if (names) return names;
  names = new Map();
  try {
    const en = new Intl.DisplayNames(["en"], { type: "region" });
    const fr = new Intl.DisplayNames(["fr"], { type: "region" });
    for (const code of REGIONS) {
      names.set(en.of(code)!.toLowerCase(), code);
      names.set(fr.of(code)!.toLowerCase(), code);
    }
  } catch {
    /* no Intl support */
  }
  names.set("uk", "GB").set("usa", "US");
  return names;
}

export function countryCode(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^[a-z]{2}$/i.test(v)) return v.toUpperCase();
  return nameMap().get(v.toLowerCase()) ?? null;
}

export function countryLabel(value: string | null): string {
  if (!value) return "";
  const code = countryCode(value);
  if (!code) return value;
  const flag = String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
  let name = value;
  try {
    name = /^[a-z]{2}$/i.test(value.trim()) ? new Intl.DisplayNames(["en"], { type: "region" }).of(code)! : value;
  } catch {
    /* keep raw */
  }
  return `${flag} ${name}`;
}

export function handleUrl(kind: "tiktok" | "instagram", handle: string) {
  const h = handle.trim().replace(/^@/, "");
  if (/^https?:\/\//.test(h)) return h;
  return kind === "tiktok" ? `https://www.tiktok.com/@${h}` : `https://www.instagram.com/${h}`;
}

export function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadCsv(name: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type Enriched = Prospect & {
  touchCount: number;
  lastTouchAt: string | null;
  lastTouchChannel: string | null;
  hmName: string | null;
};

export function enrich(prospects: Prospect[], touches: Touch[], hms: Hm[]): Enriched[] {
  const byP = new Map<string, Touch[]>();
  for (const t of touches) {
    const list = byP.get(t.prospect_id) ?? [];
    list.push(t);
    byP.set(t.prospect_id, list);
  }
  const hmMap = new Map(hms.map((h) => [h.id, h.full_name]));
  return prospects.map((p) => {
    const list = byP.get(p.id) ?? [];
    const last = list[0];
    return {
      ...p,
      touchCount: list.length,
      lastTouchAt: last?.created_at ?? null,
      lastTouchChannel: last?.channel ?? null,
      hmName: p.assigned_hm_id ? (hmMap.get(p.assigned_hm_id) ?? "—") : null,
    };
  });
}

export type PresetView = "all" | "new" | "today" | "waiting" | "interested" | "applied" | "ugc" | "slideshow" | "influencer";

export const PRESETS: { id: PresetView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "today", label: "To contact today" },
  { id: "waiting", label: "Waiting for reply" },
  { id: "interested", label: "Interested" },
  { id: "applied", label: "Applied" },
  { id: "ugc", label: "UGC" },
  { id: "slideshow", label: "Slideshow" },
  { id: "influencer", label: "Influencer" },
];

export function matchPreset(p: Enriched, preset: PresetView): boolean {
  const today = todayIso();
  switch (preset) {
    case "new":
      return p.status === "new";
    case "today":
      return Boolean(p.next_action_on && p.next_action_on <= today);
    case "waiting":
      return (
        p.status === "contacted" &&
        Boolean(p.lastTouchAt) &&
        Date.now() - new Date(p.lastTouchAt!).getTime() > 5 * DAY
      );
    case "interested":
      return p.status === "interested";
    case "applied":
      return p.status === "applied";
    case "ugc":
      return p.track === "ugc" || p.track === "both";
    case "slideshow":
      return p.track === "slideshow" || p.track === "both";
    case "influencer":
      return p.track === "influencer";
    default:
      return true;
  }
}

export function matchSearch(p: Enriched, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [p.name, p.email, p.tiktok_handle, p.instagram_handle, p.handle, p.notes, p.presentation]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(s));
}
