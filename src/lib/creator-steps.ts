/** Client-safe onboarding rules shared by the creator app, admin pages and server checks. */
export const WARMUP_REQUIRED = [1] as const;

export const WARMUP_DAYS: { day: number; text: string }[] = [
  { day: 1, text: "During the first 24 hours, on both accounts: scroll for 10 minutes, follow 10 accounts in the niche (education and less screen time), and like and repost relevant content. That is all—do not post yet." },
];

export const SLACK_INVITE = "https://join.slack.com/t/ugc-vikstudios/shared_invite/zt-4b6fwnseu-KrYV8Y0~IZ9C~7uo9HipbQ";

/** Step 3 sub-steps (keys stored in creators.setup_guide_checks). */
export const ACCOUNT_SUBSTEPS: { key: string; title: string; text: string }[] = [
  { key: "acc_email", title: "a. Create a new email address for Sophia", text: "Use a provider that allows handover: Gmail or Outlook. Do not use your personal email. Register the address and its password here." },
  { key: "acc_tiktok", title: "b. Create the TikTok account", text: "Use the Sophia email. Handle: sophia.[firstname] or the one your hiring manager assigned. Bio: \"Learning something new every day with Sophia 📚 Get the app 👇\" · Link: taap.it/sophia.culture" },
  { key: "acc_instagram", title: "c. Create the Instagram account", text: "Same email. Same handle if available, otherwise sophia.[firstname].fr. Switch it to a Creator account (Settings → Account type and tools)." },
  { key: "acc_confirm", title: "d. Confirm both accounts are public and registered", text: "Both profiles public, both handles registered above." },
];

/** Kept for older admin views. */
export const SETUP_GUIDE = ACCOUNT_SUBSTEPS.map((s) => ({ key: s.key, text: s.title }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreatorLike = { rules_accepted_at?: string | null; social_account_created_at?: string | null; accounts_confirmed_at?: string | null; warmup?: any; slack_joined_at?: string | null; resign_required_at?: string | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayoutLike = { stripe_onboarded?: boolean; method?: string | null; wise_email?: string | null; paypal_email?: string | null; bank_iban?: string | null } | null | undefined;

export function creatorSteps(me: CreatorLike, signed: boolean, payout: PayoutLike, signedVersion?: number | string | null) {
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const warmDone = WARMUP_REQUIRED.every((d) => Boolean(warm[String(d)]));
  const rules = Boolean(me.rules_accepted_at);
  const resignPending = Boolean(me.resign_required_at) && Number(signedVersion ?? 0) < 3;
  const sig = signed && !resignPending;
  const accounts = Boolean(me.accounts_confirmed_at ?? me.social_account_created_at);
  const account = accounts && warmDone;
  const payouts = Boolean(payout?.stripe_onboarded) || Boolean((payout?.method === "wise" && payout.wise_email) || (payout?.method === "paypal" && payout.paypal_email) || (payout?.method === "bank" && payout.bank_iban));
  const slack = Boolean(me.slack_joined_at);
  const list = [rules, sig, accounts, warmDone, payouts, slack];
  const count = list.filter(Boolean).length;
  return { rules, signed: sig, resignPending, accounts, warmDone, account, payouts, slack, count, total: 6, unlocked: list.every(Boolean) };
}
