export function platformName(p: string | null | undefined) {
  const v = (p ?? "").toLowerCase();
  if (v.includes("tiktok")) return "TikTok";
  if (v.includes("insta") || v.includes("reel")) return "Instagram";
  if (v.includes("youtube")) return "YouTube";
  return p ?? "";
}

export const PLATFORM_FILTERS = ["all", "TikTok", "Instagram", "YouTube"] as const;
export function matchesPlatform(p: string | null | undefined, filter: string) {
  return filter === "all" || platformName(p) === filter;
}

/** Plain-English rights note per platform, used on offers and deal sheets. */
export function platformRightsNote(platform: string | null | undefined) {
  const name = platformName(platform);
  if (name === "TikTok") return "On TikTok, ad rights are used through Spark Ads: you give us a Spark Ads code and the post runs as an ad from your account.";
  if (name === "Instagram") return "On Instagram, ad rights are used through partnership ads: you add us via the branded-content tool so the post can run as an ad from your account.";
  return "";
}
