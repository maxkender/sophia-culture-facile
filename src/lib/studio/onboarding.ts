/** Studio v2 creator onboarding: pure rules shared by the wizard, the desk and tests. */

export const ONBOARDING_STEPS = ["identity", "credentials", "profile", "agreement", "guide", "done"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const APP_LANGS = [
  "fr", "en", "es", "de", "pt", "pt-PT", "it", "tr", "pl", "ro", "nl", "el", "sv", "hu", "bg",
  "cs", "da", "nb", "ru", "hr", "sl", "sk", "sr", "ar", "he", "fi", "et", "lt", "lv", "ja",
] as const;
export type AppLang = (typeof APP_LANGS)[number];

export const SHORT_BIO_MAX = 300;
export const LONG_BIO_MAX = 1200;

export type CreatorStatus = "pending" | "approved" | "suspended";

export function isStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value);
}

/** Where a profile resumes: null/unknown means the start. */
export function resumeStep(step: string | null | undefined): OnboardingStep {
  return isStep(step) ? step : "identity";
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  const i = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)]!;
}

export function stepIndex(step: OnboardingStep) {
  return ONBOARDING_STEPS.indexOf(step);
}

/** Lowercase, digits and hyphens, 2–60 chars (the app's creator slug). */
export function creatorSlug(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base.length >= 2 ? base : `creator-${base || "x"}`.slice(0, 60);
}

export function isValidSlug(slug: string) {
  return slug.length >= 2 && slug.length <= 60 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

/** Picks the first free slug: `name`, `name-2`, `name-3`… */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, 60 - suffix.length).replace(/-+$/g, "")}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base.slice(0, 50)}-${Date.now().toString(36)}`;
}

export function defaultDisplayName(first: string, last: string) {
  return `${first.trim()} ${last.trim()}`.trim();
}

/** Drafting is always allowed; submitting a course needs a signed agreement and an active creator. */
export function canSubmitCourse(input: { agreementSigned: boolean; creatorStatus: CreatorStatus | string | null }) {
  if (!input.agreementSigned) return { ok: false as const, reason: "agreement" as const };
  if (input.creatorStatus === "suspended") return { ok: false as const, reason: "suspended" as const };
  return { ok: true as const };
}

export function canDraftCourse(input: { creatorStatus: CreatorStatus | string | null }) {
  return input.creatorStatus !== "suspended";
}

/** Invited profiles (created by the desk) start approved; self sign-ups start pending. */
export function initialCreatorStatus(selfRegistered: boolean): CreatorStatus {
  return selfRegistered ? "pending" : "approved";
}
