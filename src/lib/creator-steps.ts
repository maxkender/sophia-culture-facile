/** Client-safe onboarding rules shared by the creator app, admin pages and server checks. */
export const WARMUP_REQUIRED = [1] as const;

export const WARMUP_DAYS: { day: number; text: string }[] = [
  { day: 1, text: "During the first 24 hours: scroll for 10 minutes, follow 10 accounts in the niche (education and less screen time), and like and repost relevant content. That is all—do not post yet." },
];

export const SETUP_GUIDE: { key: string; text: string }[] = [
  { key: "1", text: "Create a new TikTok account. Use a new email address, not one already tied to a TikTok account, and do not link it to a phone number that has another TikTok. Do not log in to this account from the TikTok app where your personal account is signed in; use a separate device or log out first." },
  { key: "2", text: "Choose any available username that suits a general-knowledge account. There is no required format: it can be culture-related or something else appropriate. Choose a clear display name to match." },
  { key: "3", text: "Profile photo: a clear photo of your face, well lit, looking at the camera. No filters, no group photos." },
  { key: "4", text: "Bio, paste exactly: \"Learning something new every day with Sophia 📚 Get the app 👇\"" },
  { key: "5", text: "Link in bio: taap.it/sophia.culture" },
  { key: "6", text: "Turn on: public account, allow duets and stitches, allow downloads." },
  { key: "7", text: "Do not post anything yet." },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreatorLike = { rules_accepted_at?: string | null; social_account_created_at?: string | null; warmup?: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayoutLike = { stripe_onboarded?: boolean; method?: string | null; wise_email?: string | null; paypal_email?: string | null } | null | undefined;

export function creatorSteps(me: CreatorLike, signed: boolean, payout: PayoutLike) {
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const warmDone = WARMUP_REQUIRED.every((d) => Boolean(warm[String(d)]));
  const rules = Boolean(me.rules_accepted_at);
  const account = Boolean(me.social_account_created_at) && warmDone;
  const payouts = Boolean(payout?.stripe_onboarded) || Boolean((payout?.method === "wise" && payout.wise_email) || (payout?.method === "paypal" && payout.paypal_email));
  const count = [rules, signed, account, payouts].filter(Boolean).length;
  return { rules, signed, account, payouts, count, unlocked: rules && signed && account, warmDone };
}
