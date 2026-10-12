/** Shared Brief Studio model: fields, defaults and the /10 validation grid (used by the Studio, the creator page and the list). */
export const STUDIO_DRAFT_KEY = "brief-studio-draft";
export type Effort = "pov" | "reaction" | "talking_head";
export type StudioBrief = {
  id: string; app_id: string; title: string; brief_type: "format" | "precise";
  effort: Effort | null; platform: string; duration_target: string | null;
  hook_text: string | null; oral_hook: string | null; hook_visual: string | null; hooks: string[];
  beats: string[]; product_second: number | null; product_gesture: string | null; product_moment: string | null; say_name: boolean;
  rules_do: string[]; rules_dont: string[]; rules_text: string | null;
  status: string; drop_at: string | null; audience: string; audience_efforts: string[]; due_date: string | null;
  language: string; translation_of: string | null; parent_format_id: string | null; campaign_id: string | null; score: number | null;
  style: BriefStyle | null; style_data: StyleData;
};

/* ---------- Max's 5 video styles ---------- */
export type BriefStyle = "reaction_demo" | "broll_stickers" | "sole_footage" | "talked_hook_demo" | "educational";
export const STYLES: [BriefStyle, string, string][] = [
  ["reaction_demo", "Reaction into demo", "Direct · face plan, then phone demo"],
  ["broll_stickers", "B-roll + stickers", "Storytelling · one visual per plan"],
  ["sole_footage", "Sole footage + music + text", "One plan, music, text on screen"],
  ["talked_hook_demo", "Talked hook into demo", "Indirect · our story, then the demo"],
  ["educational", "Educational", "Talked · face cam, seated, notebook"],
];
export const STYLE_LABEL: Record<string, string> = Object.fromEntries(STYLES.map(([k, l]) => [k, l]));
export const STYLE_NUM: Record<string, number> = Object.fromEntries(STYLES.map(([k], i) => [k, i + 1]));
export const TEXT_FORMATS = [["title", "Big title centred"], ["subtitle", "Subtitle bottom"], ["sticker", "Sticker"], ["caption", "Caption bar"], ["none", "No text"]] as const;
export type TextFormat = { kind: string; note: string };
export type AssetRef = { asset_id: string; when: string };
export type Plan = { on_screen: string; fmt: TextFormat; say: string; do: string; camera: string; reaction: string; assets: AssetRef[] };
export type StyleData = {
  plans?: Plan[];
  flips?: { on: boolean; note: string };
  demo?: { mode: "filmed" | "asset"; do: string; say: string; asset: AssetRef | null };
  sole?: { what: string; duration_s: number | null; music_title: string; music_link: string; music_asset_id: string | null; text: string; fmt: TextFormat };
  script?: string; script_fmt?: TextFormat; flashes?: AssetRef[];
  body?: string; cta?: string;
  /** Caption + hashtags to paste under the post, and an optional pinned-comment note, per language. */
  post_desc?: { fr?: string; en?: string; comment_fr?: string; comment_en?: string };
};
export const blankFmt = (): TextFormat => ({ kind: "subtitle", note: "" });
export const blankPlan = (): Plan => ({ on_screen: "", fmt: blankFmt(), say: "", do: "", camera: "", reaction: "", assets: [] });
export function styleDefaults(style: BriefStyle, d: StyleData = {}): StyleData {
  const plans = d.plans ?? [];
  if (style === "reaction_demo") return { ...d, plans: plans.length ? plans : [blankPlan(), blankPlan()], flips: d.flips ?? { on: false, note: "" } };
  if (style === "broll_stickers") return { ...d, plans: plans.length ? plans : [blankPlan(), blankPlan(), blankPlan()] };
  if (style === "talked_hook_demo") return { ...d, plans: plans.length ? plans : [blankPlan(), blankPlan()], demo: d.demo ?? { mode: "filmed", do: "", say: "", asset: null } };
  if (style === "sole_footage") return { ...d, plans: plans.length ? plans : [{ ...blankPlan(), do: d.sole?.what ?? "", on_screen: d.sole?.text ?? "", fmt: d.sole?.fmt ?? { kind: "title", note: "" } }], sole: d.sole ?? { what: "", duration_s: 7, music_title: "", music_link: "", music_asset_id: null, text: "", fmt: { kind: "title", note: "" } } };
  return { ...d, plans: plans.length ? plans : [blankPlan()], script: d.script ?? "", script_fmt: d.script_fmt ?? blankFmt(), flashes: d.flashes ?? [] };
}
/** Every asset id the style content points to (synced into brief_assets so creators can download them). */
export function styleAssetIds(d: StyleData): string[] {
  const ids = [...(d.plans ?? []).flatMap((p) => p.assets.map((a) => a.asset_id)), ...(d.flashes ?? []).map((a) => a.asset_id)];
  if (d.demo?.mode === "asset" && d.demo.asset) ids.push(d.demo.asset.asset_id);
  if (d.sole?.music_asset_id) ids.push(d.sole.music_asset_id);
  return [...new Set(ids.filter(Boolean))];
}

export const GESTURES = ["Scroller un cours", "Ouvrir l'app", "Montrer la barre du bas sans Reels", "Écran de fin de fil", "Courbe du temps d'écran", "Autre"] as const;
export const ASSET_ROLES = [["reference_video", "Reference video"], ["app_screen_recording", "App screen recording"], ["screenshot", "Screenshot"], ["logo", "Logo"], ["sound", "Sound"], ["broll", "B-roll"], ["caption_text", "Caption text"], ["pdf", "PDF"]] as const;
export const ROLE_LABEL: Record<string, string> = Object.fromEntries(ASSET_ROLES);
export const FOLDERS = [["screen_recordings", "App screen recordings"], ["logos", "Logos & icons"], ["sounds", "Sounds"], ["broll", "B-roll"], ["captions", "Captions & copy"], ["references", "References"]] as const;
export const DEFAULT_DO = ["App visible à l'écran", "Nom de l'app dit une fois", "Fin qui boucle ou pose une question"];
export const DEFAULT_DONT = ["Pas de politique, religion ou médical", "Pas de réutilisation entre comptes", "Pas de logo en premier"];
export const BEAT_LABELS = ["0-3 s · hook", "3-20 s · le fait / la mécanique avec le retournement", "20-30 s · payoff + app + fin"];

export function blankBrief(appId: string): StudioBrief {
  return {
    id: "", app_id: appId, title: "", brief_type: "precise", effort: "pov", platform: "both", duration_target: "30s",
    hook_text: "", oral_hook: "", hook_visual: "", hooks: [], beats: ["", "", ""], product_second: 5, product_gesture: GESTURES[1], product_moment: "", say_name: true,
    rules_do: [...DEFAULT_DO], rules_dont: [...DEFAULT_DONT], rules_text: "", status: "draft", drop_at: null, audience: "all", audience_efforts: [], due_date: null,
    language: "fr", translation_of: null, parent_format_id: null, campaign_id: null, score: null,
    style: null, style_data: {},
  };
}

export const words = (s: string | null | undefined): number => (s ?? "").trim().split(/\s+/).filter(Boolean).length;
export const scriptWords = (b: Pick<StudioBrief, "beats" | "oral_hook">) => b.beats.reduce((n, x) => n + words(x), 0);

const filled = (x: string | null | undefined) => Boolean((x ?? "").trim());
/** Per-format grid: only the fields that style needs count; the result is scaled to /10. */
export function styleChecks(b: StudioBrief, assetCount: number): [string, boolean][] {
  const d = b.style_data ?? {}; const plans = d.plans ?? [];
  const common: [string, boolean][] = [
    ["Title set", filled(b.title)],
    ["Hook written", filled(b.hook_text)],
    ["CTA written", filled(d.cta)],
    ["Effort chosen (sets the pay)", Boolean(b.effort)],
  ];
  const by: Record<BriefStyle, [string, boolean][]> = {
    reaction_demo: [
      ["Plan 1: the reaction to perform", filled(plans[0]?.reaction)],
      ["Plan 1: on-screen text", filled(plans[0]?.on_screen) || plans[0]?.fmt.kind === "none"],
      ["Plan 1: what to say", filled(plans[0]?.say)],
      ["Plan 2: actions in the app", filled(plans[1]?.do)],
      ["Plan 2: what to say", filled(plans[1]?.say)],
      ["Camera flips: note when on", !d.flips?.on || filled(d.flips.note)],
    ],
    broll_stickers: [
      ["At least 3 plans", plans.length >= 3],
      ["Every shot has on-screen text", plans.length > 0 && plans.every((p) => filled(p.on_screen))],
      ["Every plan has what to say", plans.length > 0 && plans.every((p) => filled(p.say))],
      ["At least one asset placed", plans.some((p) => p.assets.length > 0)],
      ["Every placed asset has a timing", plans.every((p) => p.assets.every((a) => filled(a.when)))],
    ],
    sole_footage: [
      ["What is on the plan", filled(d.sole?.what)],
      ["Duration set", Boolean(d.sole?.duration_s)],
      ["Music (link or audio file)", filled(d.sole?.music_link) || Boolean(d.sole?.music_asset_id) || filled(d.sole?.music_title)],
      ["Text on screen", filled(d.sole?.text)],
    ],
    talked_hook_demo: [
      ["At least 2 story plans", plans.length >= 2],
      ["Every plan has what to say", plans.length > 0 && plans.every((p) => filled(p.say))],
      ["Every shot has on-screen text", plans.length > 0 && plans.every((p) => filled(p.on_screen))],
      ["Demo: what to do / which recording", d.demo?.mode === "asset" ? Boolean(d.demo.asset) : filled(d.demo?.do)],
      ["Demo: what to say", filled(d.demo?.say)],
    ],
    educational: [
      ["Script written (60+ words)", words(d.script) >= 60],
      ["Script under 220 words", words(d.script) > 0 && words(d.script) <= 220],
      ["On-screen text format chosen", Boolean(d.script_fmt?.kind)],
    ],
  };
  return [...common, ...by[b.style as BriefStyle], ["At least 1 file or reference", assetCount >= 1]];
}

/** The /10 grid. Styled briefs use the per-format checks; older briefs keep the original 10 points. */
export function scoreBrief(b: StudioBrief, assetCount: number) {
  if (b.style) {
    const checks = styleChecks(b, assetCount);
    const ok = checks.filter(([, v]) => v).length;
    return { score: Math.round((10 * ok) / checks.length), missing: checks.filter(([, v]) => !v).map(([l]) => l), checks };
  }
  const all = [b.oral_hook, ...b.beats].join(" ");
  const sentences = all.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
  const name = /unswipe/i.test(all) ? /unswipe/gi : /sophia/gi;
  const nameCount = (all.match(name) ?? []).length;
  const hookCount = [b.hook_text, b.oral_hook, b.hook_visual].filter((x) => (x ?? "").trim()).length;
  const lastBeat = (b.beats[2] ?? "").trim();
  const checks: [string, boolean][] = [
    ["Hook starts mid-action (visual described, no « Salut »/« Bonjour »)", Boolean((b.hook_visual ?? "").trim()) && !/^(salut|bonjour|hello|hey|coucou)\b/i.test((b.oral_hook ?? "").trim())],
    ["One fact or mechanic (beat 2 filled, not a list)", words(b.beats[1]) >= 5 && (b.beats[1] ?? "").split(/\n|;|•/).filter((x) => x.trim()).length <= 2],
    ["Turn before 15 s (beat 2 has « mais », « sauf que », « en fait »…)", /\b(mais|sauf que|en fait|pourtant|alors que|but|actually|turns out)\b/i.test(b.beats[1] ?? "")],
    ["3 hooks (on screen, oral, visual)", hookCount === 3],
    ["Under 110 words", scriptWords(b) > 0 && scriptWords(b) < 110],
    ["Short sentences (≤ 18 words on average)", sentences.length > 0 && words(all) / sentences.length <= 18],
    ["Product moment set (second + gesture)", Boolean(b.product_second && b.product_gesture)],
    ["App name said once", b.say_name ? nameCount <= 1 : true],
    ["Ending loops or asks", /\?|\b(toi|et toi|commente|dis-moi|you|comment)\b/i.test(lastBeat)],
    ["At least 1 asset attached", assetCount >= 1],
  ];
  return { score: checks.filter(([, ok]) => ok).length, missing: checks.filter(([, ok]) => !ok).map(([l]) => l), checks };
}

export function stepDone(b: StudioBrief, assetCount: number) {
  return [
    Boolean(b.brief_type && b.effort && b.platform && b.title.trim()),
    Boolean(b.hook_text?.trim() && b.oral_hook?.trim() && b.hook_visual?.trim()),
    b.beats.filter((x) => x.trim()).length === 3,
    Boolean(b.product_second && b.product_gesture),
    assetCount >= 1,
    b.rules_do.length + b.rules_dont.length > 0,
    b.status !== "draft",
  ];
}

/** Text form used in body/script so older screens (Sidekick, exports) still read the brief. */
export function briefBody(b: StudioBrief) {
  const d = b.style_data ?? {};
  if (b.style) {
    const parts = [b.hook_text, d.body, ...(d.plans ?? []).map((p, i) => `Plan ${i + 1}: ${[p.on_screen, p.say, p.do].filter(Boolean).join(" — ")}`), d.demo?.say, d.sole?.what, d.sole?.text, d.script, d.cta];
    return parts.filter((x) => (x ?? "").trim()).join("\n\n");
  }
  return [b.hook_text, b.oral_hook, ...b.beats].filter((x) => (x ?? "").trim()).join("\n\n");
}

/** True once the style content has any text or file (older styled formats still show their original script until then). */
export function hasStyledContent(d: StyleData | null | undefined): boolean {
  if (!d) return false;
  const t = [d.body, d.cta, d.script, d.sole?.what, d.sole?.text, d.sole?.music_link, d.demo?.do, d.demo?.say, ...(d.plans ?? []).flatMap((p) => [p.on_screen, p.say, p.do, p.reaction, p.camera])];
  return t.some((x) => (x ?? "").trim()) || styleAssetIds(d).length > 0;
}
