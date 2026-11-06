/** Referral answer on the slideshow form: required name when referred, null when not or when an older client omits it. */
export function referralFields(d: { referred?: boolean | undefined; referral_name?: string | undefined }): { referred: boolean | null; referral_name: string | null } {
  if (d.referred === undefined) return { referred: null, referral_name: null };
  if (!d.referred) return { referred: false, referral_name: null };
  const name = (d.referral_name ?? "").trim();
  if (!name) throw new Error("Referral name is required when referred");
  if (name.length > 120) throw new Error("Referral name is too long");
  return { referred: true, referral_name: name };
}
