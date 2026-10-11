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
};

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
  };
}

export const words = (s: string | null | undefined) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;
export const scriptWords = (b: Pick<StudioBrief, "beats" | "oral_hook">) => b.beats.reduce((n, x) => n + words(x), 0);

/** The 10-point validation grid. Each item is one point. */
export function scoreBrief(b: StudioBrief, assetCount: number) {
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
  return [b.hook_text, b.oral_hook, ...b.beats].filter((x) => (x ?? "").trim()).join("\n\n");
}
