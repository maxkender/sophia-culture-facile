/** Client-safe onboarding rules shared by the creator app, admin pages and server checks. */
export const WARMUP_REQUIRED = [1] as const;

export const WARMUP_DAYS: { day: number; text: string }[] = [
  { day: 1, text: "During the first 24 hours, on both accounts: scroll for 10 minutes, follow 10 accounts in the niche (education and less screen time), and like and repost relevant content. That is all—do not post yet." },
];

export const SLACK_INVITE = "https://join.slack.com/t/ugc-vikstudios/shared_invite/zt-4b6fwnseu-KrYV8Y0~IZ9C~7uo9HipbQ";

export const UGC_HANDLE_GUIDANCE = "Choose a handle that sounds like you, the way you would name your own account. A first name, a nickname, a word you like. Do NOT put 'Sophia' or the app name in it: the account has to feel like a person, not a brand. Use the same handle on TikTok and Instagram if it is free on both; if not, keep them as close as possible.";
export const UGC_PROFILE_GUIDANCE = [
  { label: "Display name", text: "Your first name, or whatever you would use for your own account." },
  { label: "Bio", text: "Write a one-line bio in your own words, about you. Do not mention Sophia or any app in it." },
  { label: "Profile photo", text: "A clear photo of your face." },
  { label: "Link in bio", text: "Do not add a link during onboarding. Add a link later only when a brief asks for it." },
];

/** Step 3 sub-steps (keys stored in creators.setup_guide_checks). */
export const ACCOUNT_SUBSTEPS: { key: string; title: string; text: string }[] = [
  { key: "acc_email", title: "a. Create a new email address for Sophia", text: "Use a provider that allows handover: Gmail or Outlook. Do not use your personal email. Register the address and its password here." },
  { key: "acc_tiktok", title: "b. Create the TikTok account", text: UGC_HANDLE_GUIDANCE },
  { key: "acc_instagram", title: "c. Create the Instagram account", text: UGC_HANDLE_GUIDANCE },
  { key: "acc_confirm", title: "d. Confirm both accounts are public and registered", text: "Both profiles public, both handles registered above." },
];

/** Kept for older admin views. */
export const SETUP_GUIDE = ACCOUNT_SUBSTEPS.map((s) => ({ key: s.key, text: s.title }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreatorLike = { guidelines_accepted_at?: string | null; rules_accepted_at?: string | null; social_account_created_at?: string | null; accounts_confirmed_at?: string | null; warmup?: any; slack_joined_at?: string | null; resign_required_at?: string | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayoutLike = { stripe_onboarded?: boolean; method?: string | null; wise_email?: string | null; paypal_email?: string | null; bank_iban?: string | null } | null | undefined;

/**
 * UGC onboarding = sign the UGC Creator Agreement (ugc-agreement / -fr), then "Got it" on the shooting guidelines.
 * `signed` must be computed from a UGC-agreement signature only (old Creator Account Agreement rows no longer count).
 */
export function creatorSteps(me: CreatorLike, signed: boolean, _payout?: PayoutLike, _signedVersion?: number | string | null) {
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const warmDone = WARMUP_REQUIRED.every((d) => Boolean(warm[String(d)]));
  const rules = Boolean(me.guidelines_accepted_at);
  const accounts = Boolean(me.accounts_confirmed_at ?? me.social_account_created_at);
  const list = [signed, rules];
  return { rules, signed, resignPending: false, accounts, warmDone, account: accounts && warmDone, payouts: false, slack: Boolean(me.slack_joined_at), count: list.filter(Boolean).length, total: 2, unlocked: list.every(Boolean) };
}
