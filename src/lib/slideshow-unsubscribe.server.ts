import { SITE_URL } from "@/config/site";
// Server-only: signed one-click unsubscribe links for slideshow candidate/poster emails.
import { createHmac, timingSafeEqual } from "node:crypto";

const SITE = () => process.env["SITE_URL"] ?? SITE_URL;
const norm = (email: string) => email.trim().toLowerCase();

export function unsubscribeToken(email: string, secret = process.env["OS_HUB_SECRET"] ?? ""): string {
  return createHmac("sha256", `slideshow-unsub:${secret}`).update(norm(email)).digest("base64url").slice(0, 32);
}

export function unsubscribeTokenValid(email: string, token: string, secret = process.env["OS_HUB_SECRET"] ?? ""): boolean {
  if (!secret || !email || !token) return false;
  const a = Buffer.from(unsubscribeToken(email, secret));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unsubscribeUrl(email: string): string {
  return `${SITE()}/poster-unsubscribe?e=${encodeURIComponent(norm(email))}&t=${unsubscribeToken(email)}`;
}

/** Sets unsubscribed_at on every slideshow application with this email (first time only). */
export async function markUnsubscribed(admin: any, email: string) {
  await admin.from("slideshow_applications").update({ unsubscribed_at: new Date().toISOString() }).ilike("email", norm(email).replace(/[%_\\]/g, "\\$&")).is("unsubscribed_at", null);
}
