// Server-only: fast lane for pre-validated creators (one-time personal link, pay set before arrival).
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type FastPay = {
  tier: "trial" | "active" | "pro";
  perPost: number | null; rpm: number | null; cap: number | null;
  postsPerMonth: number | null; platforms: "tiktok" | "instagram" | "both";
  fixedMonthly: number | null; welcomeBonus: number | null;
};
export type FastPerson = {
  firstName: string; lastName?: string | null; email?: string | null; country?: string | null; language?: "fr" | "en" | null;
  platform?: "ios" | "android" | null; tiktok?: string | null; instagram?: string | null; source?: string | null; notes?: string | null;
  ref?: { kind: "creator" | "applicant" | "prospect"; id: string } | null;
};

const LINK_DAYS = 14;
export function newToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function defaultLanguage(country?: string | null): "fr" | "en" {
  return /^(fr|france|be|belgi|ch|suisse|switz|lu|luxem|mc|monaco)/i.test((country ?? "").trim()) ? "fr" : "en";
}
const cleanHandle = (h?: string | null) => (h ? h.trim().replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, "").replace(/[/?].*$/, "").replace(/^@/, "") || null : null);
export const fastLink = (origin: string, token: string) => `${origin.replace(/\/$/, "")}/j/${token}`;

export function payColumns(p: FastPay) {
  return {
    starting_tier: p.tier, per_post_override: p.perPost, rpm_override: p.rpm, cap_override: p.cap,
    posts_per_month: p.postsPerMonth ?? 20, required_platforms: p.platforms, fixed_monthly_override: p.fixedMonthly, welcome_bonus: p.welcomeBonus,
  };
}

/** Create or update one creator record for the fast lane and return the personal link. Sends nothing. */
export async function createFastLaneOne(a: Admin, person: FastPerson, pay: FastPay, appId: string, jobId: string | null, origin: string) {
  const token = newToken();
  const typed = (person.email ?? "").trim().toLowerCase();
  const pending = !typed;
  const email = pending ? `pending+${token}@fastlane.sophia-culture.com` : typed;
  const fullName = [person.firstName.trim(), (person.lastName ?? "").trim()].filter(Boolean).join(" ");
  let creatorId: string | null = null;
  let applicationId: string | null = null;

  if (person.ref?.kind === "creator") creatorId = person.ref.id;
  if (person.ref?.kind === "applicant") {
    const { data: app } = await a.from("creator_applications").select("id, created_creator_id").eq("id", person.ref.id).maybeSingle();
    if (!app) throw new Error("Application not found");
    applicationId = app.id; creatorId = app.created_creator_id ?? null;
  }
  if (!creatorId && !pending) {
    const { data: dup } = await a.from("creators").select("id").ilike("email", email).limit(1).maybeSingle();
    creatorId = dup?.id ?? null;
  }
  const base = {
    full_name: fullName, email, email_pending: pending, country: person.country || null, language: person.language ?? defaultLanguage(person.country),
    ...(person.platform ? { platform: person.platform } : {}),
    ...(cleanHandle(person.tiktok) ? { tiktok_handle: cleanHandle(person.tiktok) } : {}),
    ...(cleanHandle(person.instagram) ? { instagram_handle: cleanHandle(person.instagram) } : {}),
    source: person.source || "other", fast_lane: true, fast_lane_token: token,
    fast_lane_expires_at: new Date(Date.now() + LINK_DAYS * 86400_000).toISOString(),
    fast_lane_job_id: jobId, fast_lane_app_id: appId, fast_lane_opened_at: null, fast_lane_entered_at: null,
    ...payColumns(pay),
  };
  if (creatorId) {
    const { data: cur } = await a.from("creators").select("status, user_id, admin_notes").eq("id", creatorId).maybeSingle();
    const upd: Record<string, unknown> = { ...base };
    if (!cur?.user_id) { upd["tier"] = pay.tier; upd["tier_since"] = new Date().toISOString(); }
    if (person.notes) upd["admin_notes"] = [cur?.admin_notes, person.notes].filter(Boolean).join("\n");
    const { error } = await a.from("creators").update(upd).eq("id", creatorId);
    if (error) throw new Error("The creator could not be updated.");
  } else {
    const { data: c, error } = await a.from("creators").insert({ ...base, track: "ugc", status: "invited", tier: pay.tier, application_id: applicationId, admin_notes: person.notes || null }).select("id").single();
    if (error || !c) throw new Error("The creator could not be created.");
    creatorId = c.id as string;
  }
  if (applicationId) await a.from("creator_applications").update({ status: "approved", decided_at: new Date().toISOString(), created_creator_id: creatorId, admin_notes: "Fast lane" }).eq("id", applicationId);
  if (person.ref?.kind === "prospect") await a.from("creator_prospects").update({ status: "converted" }).eq("id", person.ref.id);
  await a.from("creator_apps").upsert({ creator_id: creatorId, app_id: appId, status: "active" }, { onConflict: "creator_id,app_id" });
  if (jobId) await a.from("job_invites").insert({ job_id: jobId, creator_id: creatorId, email: pending ? null : email });
  return { creatorId: creatorId as string, name: fullName, email, link: fastLink(origin, token) };
}

export async function sendFastLaneEmail(a: Admin, creatorId: string, origin: string) {
  const { data: c } = await a.from("creators").select("full_name, email, email_pending, fast_lane_token, language").eq("id", creatorId).maybeSingle();
  if (!c?.fast_lane_token) throw new Error("No link yet");
  if (c.email_pending) return { sent: false, reason: "No email yet: she will type it on her link", link: fastLink(origin, c.fast_lane_token) };
  const link = fastLink(origin, c.fast_lane_token);
  const first = String(c.full_name).split(/\s+/)[0] || "";
  const en = c.language === "en";
  const { buildEmailHtml, buildEmailText } = await import("./email-send.server");
  const { sendBrevoEmail } = await import("./brevo.server");
  const opts = {
    paragraphs: en
      ? [`Hi ${first},`, "Your Sophia creator space is ready. You were validated: no form, no password.", "Click the button, read your pay and the agreement, and you're in. It takes 2 minutes."]
      : [`Salut ${first},`, "Ton espace Sophia est prêt. Tu as été validé·e : pas de formulaire, pas de mot de passe.", "Clique sur le bouton, regarde ta rémunération et le contrat, et tu es dedans. Ça prend 2 minutes."],
    buttonLabel: en ? "Open my space" : "Ouvrir mon espace", buttonUrl: link,
  };
  const r = await sendBrevoEmail({ to: c.email, toName: c.full_name, subject: en ? "Your Sophia space is ready" : "Ton espace Sophia est prêt", html: buildEmailHtml(opts), text: buildEmailText(opts) });
  if (r.sent) await a.from("creators").update({ fast_lane_sent_at: new Date().toISOString() }).eq("id", creatorId);
  return { sent: r.sent, reason: r.reason ?? null, link };
}

/** Make sure an auth user exists for this email and return a one-time session token for verifyOtp. */
export async function sessionTokenFor(a: Admin, email: string) {
  await a.auth.admin.createUser({ email, email_confirm: true }).catch(() => undefined);
  const { data, error } = await a.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) throw new Error("Sign-in link could not be prepared.");
  return { userId: data.user?.id as string, tokenHash: data.properties.hashed_token as string, type: (data.properties.verification_type ?? "magiclink") as string };
}
