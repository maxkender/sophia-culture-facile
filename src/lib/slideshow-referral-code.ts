import { z } from "zod";

export const REFERRAL_STORAGE_KEY = "sophia_slideshow_referral";
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const referralCodeSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,120}$/);
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function normalizeReferralCode(value: unknown): string | null {
  const result = referralCodeSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Storage failures never prevent a visit or application. Only explicit codes refresh expiry. */
export function captureReferralCode(storage: StorageLike, queryCode: unknown, now = Date.now()): string | null {
  const code = normalizeReferralCode(queryCode);
  try {
    if (code) {
      storage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code, expiresAt: now + REFERRAL_TTL_MS }));
      return code;
    }
    const raw = storage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { code?: unknown; expiresAt?: unknown };
    const stored = normalizeReferralCode(saved.code);
    if (!stored || typeof saved.expiresAt !== "number" || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= now) {
      storage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }
    return stored;
  } catch { return code; }
}

export function browserReferralCode(): string | null {
  const code = new URLSearchParams(window.location.search).get("ref");
  try { return captureReferralCode(window.localStorage, code); }
  catch { return normalizeReferralCode(code); }
}

export function withReferralCode(href: string, value: unknown): string {
  const code = normalizeReferralCode(value);
  if (!code) return href;
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("ref", code);
  return `${path}?${params.toString()}`;
}