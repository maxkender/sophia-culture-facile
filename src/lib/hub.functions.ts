import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* Creator Hub server logic: job applications, invites, decline emails, ads, tasks, tiers. */

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const originSchema = z.string().url().max(300).refine((v) => { const u = new URL(v); return u.protocol === "https:" || u.hostname === "localhost"; });

async function assertAdmin(context: { supabase: Admin; userId: string }) {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id as string;
}
async function adminClient(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
function reqMeta(ua?: string) {
  const h = getRequest()?.headers;
  const fwd = h?.get("x-forwarded-for") ?? "";
  return { ip: h?.get("cf-connecting-ip") ?? (fwd ? fwd.split(",")[0]?.trim() ?? null : null), ua: ua ?? h?.get("user-agent") ?? null };
}
async function ipHash() {
  const { ip } = reqMeta();
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sophia-creators:${ip ?? "unknown"}`));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function email(to: string, name: string, subject: string, paragraphs: string[], button?: { label: string; url: string }) {
  const { buildEmailHtml, buildEmailText } = await import("./email-send.server");
  const { sendBrevoEmail } = await import("./brevo.server");
  const opts = { paragraphs, ...(button ? { buttonLabel: button.label, buttonUrl: button.url } : {}) };
  return sendBrevoEmail({ to, toName: name, subject, html: buildEmailHtml(opts), text: buildEmailText(opts) });
}

/** Best-effort follower counts from the existing Apify profile actors (30 s max each). */
async function followerCounts(tiktok?: string | null, instagram?: string | null) {
  const token = process.env["APIFY_TOKEN"];
  const out: { tiktok?: number; instagram?: number } = {};
  if (!token) return out;
  const run = async (actor: string, input: unknown) => {
    const res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=30`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(35_000),
    });
    return res.ok ? ((await res.json()) as any[]) : [];
  };
  const clean = (h: string) => h.replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, "").replace(/[/?].*$/, "").replace(/^@/, "");
  await Promise.all([
    tiktok ? run("clockworks~tiktok-profile-scraper", { profiles: [clean(tiktok)], resultsPerPage: 1, shouldDownloadVideos: false, shouldDownloadCovers: false })
      .then((r) => { const n = r[0]?.authorMeta?.fans; if (typeof n === "number") out.tiktok = n; }).catch(() => undefined) : null,
    instagram ? run("apify~instagram-profile-scraper", { usernames: [clean(instagram)] })
      .then((r) => { const n = r[0]?.followersCount; if (typeof n === "number") out.instagram = n; }).catch(() => undefined) : null,
  ]);
  return out;
}

/* ---------------- public: job page + apply ---------------- */

export const resolveJobInvite = createServerFn({ method: "GET" })
  .inputValidator((t: string) => z.string().regex(/^[a-f0-9]{16,64}$/).parse(t))
  .handler(async ({ data }) => {
    const a = await adminClient();
    const { data: inv } = await a.from("job_invites").select("id, email, creator_id, prospect_id, opened_at, jobs(slug, status)").eq("token", data).maybeSingle();
    if (!inv || inv.jobs?.status !== "active") return null;
    if (!inv.opened_at) await a.from("job_invites").update({ opened_at: new Date().toISOString() }).eq("id", inv.id);
    let name: string | null = null;
    if (inv.creator_id) name = (await a.from("creators").select("full_name").eq("id", inv.creator_id).maybeSingle()).data?.full_name ?? null;
    else if (inv.prospect_id) name = (await a.from("creator_prospects").select("name").eq("id", inv.prospect_id).maybeSingle()).data?.name ?? null;
    return { slug: inv.jobs.slug as string, email: (inv.email as string | null) ?? "", name: name ?? "" };
  });

export const getAgreementForJob = createServerFn({ method: "GET" }).handler(async () => {
  const a = await adminClient();
  const { data: doc } = await a.from("documents").select("id, current_version, published, title").eq("slug", "creator-agreement").maybeSingle();
  if (!doc?.published) return null;
  const { data: v } = await a.from("document_versions").select("content").eq("document_id", doc.id).eq("version", doc.current_version).maybeSingle();
  return { version: String(doc.current_version), title: doc.title as string, body: (v?.content as string | undefined) ?? "" };
});

const applySchema = z.object({
  slug: z.string().min(1).max(80),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().min(2).max(80),
  age: z.number().int().min(18).max(99),
  occupation: z.string().trim().max(160).optional(),
  tiktok: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(300).optional(),
  answers: z.record(z.string(), z.string().max(2000)).default({}),
  videoUrl: z.string().trim().max(500).optional(),
  videoPath: z.string().trim().max(300).optional(),
  signedName: z.string().trim().max(160).optional(),
  documentVersion: z.string().max(40).optional(),
  inviteToken: z.string().max(64).optional(),
  origin: originSchema,
  userAgent: z.string().max(400).optional(),
  website: z.string().max(200).optional(),
  quick: z.boolean().optional(),
  lang: z.enum(["fr", "en"]).optional(),
  device: z.enum(["ios", "android"]).optional(),
  src: z.string().trim().max(60).optional(),
  ref: z.string().trim().regex(/^@?[A-Za-z0-9._]{1,40}$/).optional().or(z.literal("")),
});

export const applyToJob = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => applySchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const, accepted: false };
    const a = await adminClient();
    const { data: job } = await a.from("jobs").select("*").eq("slug", data.slug).eq("status", "active").maybeSingle();
    if (!job) return { ok: false as const, reason: "This job is closed." };
    if (data.quick && !job.open) return { ok: false as const, reason: "This job needs a full application." };
    const items = (data.quick ? [] : (job.application_items ?? [])) as { label: string; required: boolean; type: string }[];
    const missing = items.filter((i) => i.required && i.type !== "video" && !data.answers[i.label]?.trim());
    if (missing.length) return { ok: false as const, reason: `Please fill in: ${missing.map((m) => m.label).join(", ")}.` };
    if (items.some((i) => i.required && i.type === "video") && !data.videoUrl && !data.videoPath) return { ok: false as const, reason: "Please add your short video." };
    if (job.verified_country && job.countries?.length && !job.countries.includes(data.country.toUpperCase())) return { ok: false as const, reason: "This job is only open to creators living in: " + job.countries.join(", ") + "." };
    if (job.age_min && data.age < job.age_min) return { ok: false as const, reason: `You need to be at least ${job.age_min} for this job.` };
    if (job.age_max && data.age > job.age_max) return { ok: false as const, reason: `This job is for creators up to ${job.age_max}.` };
    const email = data.email.toLowerCase();
    const hash = await ipHash();
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await a.from("creator_applications").select("id", { count: "exact", head: true }).eq("submit_ip_hash", hash).gte("created_at", hourAgo);
    if ((count ?? 0) >= 6) return { ok: false as const, reason: "Too many applications from this connection. Please try again in an hour." };
    const { data: dup } = await a.from("job_applications").select("id, creator_applications:application_id(email)").eq("job_id", job.id);
    if ((dup ?? []).some((d: any) => d.creator_applications?.email?.toLowerCase() === email)) return { ok: false as const, reason: "You already applied to this job with this email." };

    const followers = await followerCounts(data.tiktok, data.instagram);
    // The job form takes free text; the table only accepts a fixed set, so the text is kept in the answers.
    const occ = (data.occupation ?? "").trim();
    const occupation = ["studying", "working", "both", "other"].includes(occ.toLowerCase()) ? occ.toLowerCase() : "other";
    if (occ) data.answers = { ...data.answers, "School or job": occ };
    const { data: app, error } = await a.from("creator_applications").insert({
      full_name: data.fullName, email, phone: data.phone || "", country: data.country, age: data.age, occupation,
      tiktok_url: data.tiktok || null, instagram_url: data.instagram || null, video_url: data.videoUrl || null, video_file_path: data.videoPath || null,
      referral_source: data.src ? `${data.src}|job:${job.slug}` : `job:${job.slug}`, source: data.quick ? "quick" : "job", ref_handle: data.ref ? data.ref.replace(/^@/, "").toLowerCase() : null, consent_at: new Date().toISOString(), meets_criteria: true, status: "pending", submit_ip_hash: hash, app_id: job.app_id,
    }).select("id").single();
    if (error || !app) return { ok: false as const, reason: "Your application could not be saved. Please try again." };
    const { data: ja } = await a.from("job_applications").insert({ job_id: job.id, application_id: app.id, answers: { ...data.answers, followers_tiktok: followers.tiktok != null ? String(followers.tiktok) : "", followers_instagram: followers.instagram != null ? String(followers.instagram) : "" } }).select("id").single();
    if (data.inviteToken) await a.from("job_invites").update({ accepted_at: new Date().toISOString() }).eq("token", data.inviteToken).eq("job_id", job.id);

    // Every UGC application waits for the owner's decision (Hub → UGC → Creators → Accept).
    // No creator, login, contract, code or welcome email here — only an acknowledgement.
    try {
      const { sendUgcAck } = await import("./ugc-email.server");
      await sendUgcAck(email, data.fullName, data.lang ?? (job.language === "fr" ? "fr" : "en"));
    } catch { /* the application is saved either way */ }
    return { ok: true as const, accepted: false };
  });

/* ---------------- admin: decisions + invites ---------------- */

export const acceptJobApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const adminId = await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ja } = await a.from("job_applications").select("id, application_id, creator_id, jobs(app_id, title)").eq("id", data.id).maybeSingle();
    if (!ja) throw new Error("Application not found");
    let creatorId = ja.creator_id as string | null;
    let emailSent = true; let emailReason: string | null = null;
    if (ja.application_id) {
      const r = await (await import("./ugc-accept.server")).acceptApplication(a, ja.application_id, data.origin, adminId, null);
      creatorId = r.creatorId; emailSent = r.emailSent; emailReason = r.emailReason;
    } else if (creatorId) {
      await a.from("creator_notifications").insert({ creator_id: creatorId, body: `You were accepted on the job "${ja.jobs?.title}".` });
    }
    if (creatorId) { await a.from("creator_apps").upsert({ creator_id: creatorId, app_id: ja.jobs?.app_id, status: "active" }, { onConflict: "creator_id,app_id" }); await (await import("./access-codes.server")).assignAppCode(a, creatorId, ja.jobs?.app_id); }
    await a.from("job_applications").update({ status: "accepted", creator_id: creatorId, decided_at: new Date().toISOString(), decided_by: context.userId }).eq("id", data.id);
    return { ok: true, emailSent, emailReason };
  });

export const declineJobApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), reason: z.string().trim().max(1000).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ja } = await a.from("job_applications").select("id, application_id, creator_id, jobs(title), creator_applications:application_id(full_name, email)").eq("id", data.id).maybeSingle();
    if (!ja) throw new Error("Application not found");
    await a.from("job_applications").update({ status: "declined", decline_reason: data.reason || null, decided_at: new Date().toISOString(), decided_by: context.userId }).eq("id", data.id);
    if (ja.application_id) await a.from("creator_applications").update({ status: "rejected", rejection_reason: data.reason || null, decided_at: new Date().toISOString() }).eq("id", ja.application_id);
    let to = ja.creator_applications?.email as string | undefined; let name = ja.creator_applications?.full_name as string | undefined;
    if (!to && ja.creator_id) { const c = (await a.from("creators").select("email, full_name").eq("id", ja.creator_id).maybeSingle()).data; to = c?.email; name = c?.full_name; }
    if (!to) return { ok: true, emailSent: false, emailReason: "No email on file" };
    const r = await email(to, name ?? "", `Your application: ${ja.jobs?.title ?? "Sophia creator job"}`, [
      `Hi ${(name ?? "").split(/\s+/)[0] || "there"},`, "Thank you for applying. We are not moving forward with your application for this job.",
      ...(data.reason ? [`Why: ${data.reason}`] : []), "You are welcome to apply to other jobs later.", "— The Sophia creator team",
    ]);
    if (r.sent && ja.application_id) await a.from("creator_applications").update({ decline_email_sent_at: new Date().toISOString(), decline_email_message_id: r.messageId ?? null }).eq("id", ja.application_id);
    return { ok: true, emailSent: r.sent, emailReason: r.reason ?? null };
  });

export const sendJobInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid(), creatorId: z.string().uuid().nullable(), prospectId: z.string().uuid().nullable(), email: z.string().email().nullable(), name: z.string().max(160), origin: originSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: job } = await a.from("jobs").select("title, slug, apps(name)").eq("id", data.jobId).maybeSingle();
    if (!job) throw new Error("Job not found");
    const { data: inv, error } = await a.from("job_invites").insert({ job_id: data.jobId, creator_id: data.creatorId, prospect_id: data.prospectId, email: data.email }).select("token").single();
    if (error) throw new Error("The invite could not be created.");
    const link = `${data.origin.replace(/\/$/, "")}/invite/${inv.token}`;
    if (data.creatorId) await a.from("creator_notifications").insert({ creator_id: data.creatorId, body: `You were invited to the job "${job.title}". Open Jobs to apply.` });
    if (data.prospectId) await a.from("creator_prospects").update({ status: "invited" }).eq("id", data.prospectId);
    let emailSent = false; let emailReason: string | null = "No email on file";
    if (data.email) {
      const r = await email(data.email, data.name, `You're invited: ${job.title}`, [
        `Hi ${data.name.split(/\s+/)[0] || "there"},`, `We'd love you to join ${job.apps?.name ?? "Sophia"} as a creator for "${job.title}".`, "Open the job to see the pay and apply in a few minutes. Your details are already filled in.",
      ], { label: "See the job", url: link });
      emailSent = r.sent; emailReason = r.reason ?? null;
    }
    return { link, emailSent, emailReason };
  });

/* ---------------- ads ---------------- */

export const adsConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: t } = await a.from("ad_tokens").select("app_id, advertiser_ids, updated_at").eq("channel", "tiktok");
    return { meta: Boolean(process.env["META_ADS_TOKEN"]), tiktok: Boolean((t ?? []).length || process.env["TIKTOK_ADS_TOKEN"]), tiktokApps: t ?? [], tiktokAppSet: Boolean(process.env["TIKTOK_APP_ID"] && process.env["TIKTOK_APP_SECRET"]), redirectUri: "https://sophia-culture.com/api/public/tiktok/oauth" };
  });

export const verifyAdConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appId: z.string().uuid(), channel: z.enum(["meta", "tiktok"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: conn } = await a.from("ad_connections").select("account_id, config").eq("app_id", data.appId).eq("channel", data.channel).maybeSingle();
    const { verifyMeta, verifyTikTok } = await import("./ads.server");
    return data.channel === "meta" ? verifyMeta(conn) : verifyTikTok(a, conn?.account_id ?? null, data.appId);
  });

/** TikTok OAuth start: state is HMAC-signed with the app secret and expires after 15 minutes. */
export const tiktokConnectUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const id = process.env["TIKTOK_APP_ID"]; const secret = process.env["TIKTOK_APP_SECRET"];
    if (!id || !secret) throw new Error("Add the TIKTOK_APP_ID and TIKTOK_APP_SECRET secrets first.");
    const { signTikTokState } = await import("./tiktok-oauth.server");
    const state = await signTikTokState(data.appId, secret);
    return { url: `https://business-api.tiktok.com/portal/auth?app_id=${encodeURIComponent(id)}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent("https://sophia-culture.com/api/public/tiktok/oauth")}` };
  });

/** Creates the ad on the ad platform, always PAUSED. Needs the token secret and the account id saved in Connections. */
export const pushAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ad } = await a.from("ad_candidates").select("*").eq("id", data.id).maybeSingle();
    if (!ad) throw new Error("Ad not found");
    const { data: conn } = await a.from("ad_connections").select("account_id, config").eq("app_id", ad.app_id).eq("channel", ad.channel).maybeSingle();
    const { pushMetaAd, pushTikTokAd } = await import("./ads.server");
    const result = ad.channel === "meta" ? await pushMetaAd(a, ad, conn) : await pushTikTokAd(a, ad, conn);
    if (!result.ok) return result;
    await a.from("ad_candidates").update({ status: "paused", external_ids: result.ids, started_at: new Date().toISOString().slice(0, 10) }).eq("id", ad.id);
    return result;
  });

export const setAdStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["live", "paused", "ended"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ad } = await a.from("ad_candidates").select("*").eq("id", data.id).maybeSingle();
    if (!ad) throw new Error("Ad not found");
    let remote: string | null = null;
    if (ad.external_ids?.ad_id && data.status !== "ended") {
      const { setRemoteStatus } = await import("./ads.server");
      remote = await setRemoteStatus(ad, data.status === "live" ? "ACTIVE" : "PAUSED");
    }
    await a.from("ad_candidates").update({ status: data.status, ...(data.status === "ended" ? { ended_at: new Date().toISOString().slice(0, 10) } : {}) }).eq("id", ad.id);
    return { ok: true, remote };
  });

/** Winner: badge, notification and a one-time ad selection bonus on the creator's next statement. */
export const markAdWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), winner: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ad } = await a.from("ad_candidates").select("id, creator_id, bonus_paid_at, post_id").eq("id", data.id).maybeSingle();
    if (!ad) throw new Error("Ad not found");
    await a.from("ad_candidates").update({ winner: data.winner }).eq("id", ad.id);
    if (data.winner && !ad.bonus_paid_at && ad.creator_id) {
      const { data: s } = await a.from("ugc_settings").select("ad_selection_bonus").eq("id", 1).maybeSingle();
      const amount = Number(s?.ad_selection_bonus ?? 20);
      await a.from("payout_adjustments").insert({ creator_id: ad.creator_id, period: new Date().toISOString().slice(0, 7), amount, reason: "ad_selection_bonus" });
      await a.from("creator_notifications").insert({ creator_id: ad.creator_id, body: `Your video was selected for ads. A ${amount} € bonus was added to this month.` });
      await a.from("ad_candidates").update({ bonus_paid_at: new Date().toISOString() }).eq("id", ad.id);
      const { data: post } = await a.from("creator_posts").select("brief_id").eq("id", ad.post_id).maybeSingle();
      if (post?.brief_id) {
        const { data: b } = await a.from("briefs").select("tags").eq("id", post.brief_id).maybeSingle();
        const tags = Array.from(new Set([...(b?.tags ?? []), "ad winner"]));
        await a.from("briefs").update({ tags }).eq("id", post.brief_id);
      }
    }
    return { ok: true };
  });

export const requestCreatorTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ adId: z.string().uuid(), type: z.enum(["spark_code", "raw_upload"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: ad } = await a.from("ad_candidates").select("id, creator_id, post_id, creator_posts(url)").eq("id", data.adId).maybeSingle();
    if (!ad?.creator_id) throw new Error("This post has no creator.");
    const spark = data.type === "spark_code";
    await a.from("creator_tasks").insert({
      creator_id: ad.creator_id, ad_candidate_id: ad.id, type: data.type,
      title: spark ? "Send the Spark Ads code for your video" : "Upload the original video file",
      instructions: spark
        ? `Video: ${ad.creator_posts?.url ?? ""}\n1. Open TikTok on the account that posted the video.\n2. Open the video → ⋯ → Ad settings → turn on "Ad authorization".\n3. Tap "Generate code", choose 60 days, agree.\n4. Copy the code and paste it here with its expiry date.`
        : `Video: ${ad.creator_posts?.url ?? ""}\nUpload the original MP4 you edited (at least 1080p, no TikTok watermark). Do not download it from TikTok.`,
    });
    await a.from("creator_notifications").insert({ creator_id: ad.creator_id, body: spark ? "New task: send the Spark Ads code for one of your videos." : "New task: upload the original file of one of your videos." });
    return { ok: true };
  });

export const submitCreatorTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), response: z.string().trim().max(500).optional(), validUntil: z.string().max(10).optional(), filePath: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as never as { supabase: Admin; userId: string };
    const { data: me } = await supabase.from("creators").select("id").eq("user_id", userId).maybeSingle();
    if (!me) throw new Error("Not a creator");
    const a = await adminClient();
    const { data: task } = await a.from("creator_tasks").select("*").eq("id", data.id).eq("creator_id", me.id).maybeSingle();
    if (!task || task.status !== "open") throw new Error("This task is closed.");
    if (task.type === "spark_code" && !data.response) throw new Error("Paste the code first.");
    if (task.type === "raw_upload" && !data.filePath) throw new Error("Upload the file first.");
    if (data.filePath && !data.filePath.startsWith(`${me.id}/`)) throw new Error("Invalid file.");
    await a.from("creator_tasks").update({ status: "done", response: data.response ?? null, valid_until: data.validUntil || null, file_path: data.filePath ?? null, done_at: new Date().toISOString() }).eq("id", task.id);
    if (task.ad_candidate_id) {
      const patch = task.type === "spark_code" ? { spark_code: data.response, spark_valid_until: data.validUntil || null } : { raw_file_path: data.filePath };
      await a.from("ad_candidates").update(patch).eq("id", task.ad_candidate_id);
      await refreshAdReady(a, task.ad_candidate_id);
    }
    return { ok: true };
  });

export async function refreshAdReady(a: Admin, id: string) {
  const { data: ad } = await a.from("ad_candidates").select("status, channel, spark_code, raw_file_path, daily_budget, landing_url").eq("id", id).maybeSingle();
  if (!ad || !["queued", "ready"].includes(ad.status)) return;
  const asset = ad.channel === "tiktok" ? ad.spark_code : ad.raw_file_path;
  await a.from("ad_candidates").update({ status: asset && ad.daily_budget && ad.landing_url ? "ready" : "queued" }).eq("id", id);
}

export const saveAdCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const allowed = ["channel", "objective", "daily_budget", "duration_days", "country", "cta", "landing_url", "notes", "caption", "hook", "spark_code", "spark_valid_until", "raw_file_path"];
    const patch = Object.fromEntries(Object.entries(data.patch).filter(([k]) => allowed.includes(k)));
    await a.from("ad_candidates").update(patch).eq("id", data.id);
    await refreshAdReady(a, data.id);
    return { ok: true };
  });

export const adFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await adminClient();
    const { data: s } = await a.storage.from("creator-videos").createSignedUrl(data.path, 3600);
    return { url: s?.signedUrl ?? null };
  });

export const syncAdMetricsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { syncAdMetrics } = await import("./ads.server");
    return syncAdMetrics(await adminClient());
  });

/* ---------------- tiers ---------------- */

export const runTiersNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { runTierJob } = await import("./ugc-tiers.server");
    return runTierJob(await adminClient());
  });

/** Thumbnail for a TikTok post via public oEmbed (Instagram oEmbed needs a Meta token, so it returns null). */
export const postThumbnail = createServerFn({ method: "GET" })
  .inputValidator((u: string) => z.string().url().max(500).parse(u))
  .handler(async ({ data }) => {
    if (!/^https:\/\/(www\.|vm\.)?tiktok\.com\//.test(data)) return { thumb: null as string | null, title: null as string | null };
    try {
      const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(data)}`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return { thumb: null, title: null };
      const j = (await r.json()) as { thumbnail_url?: string; title?: string };
      return { thumb: j.thumbnail_url ?? null, title: j.title ?? null };
    } catch {
      return { thumb: null, title: null };
    }
  });

/* ---------------- creator side ---------------- */

async function meCreator(context: unknown) {
  const { supabase, userId } = context as { supabase: Admin; userId: string };
  const { data } = await supabase.from("creators").select("id, full_name, email").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Not a creator");
  return data as { id: string; full_name: string; email: string };
}

/** A signed-in creator applies to a feed job. Open jobs accept at once (the agreement is already signed in onboarding). */
export const applyAsCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid(), answers: z.record(z.string(), z.string().max(2000)).default({}) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await meCreator(context);
    const a = await adminClient();
    const { data: job } = await a.from("jobs").select("id, app_id, open, status, access, title, application_items").eq("id", data.jobId).maybeSingle();
    if (!job || job.status !== "active" || job.access === "invite_only") return { ok: false as const, reason: "This job is not open for applications." };
    const missing = ((job.application_items ?? []) as { label: string; required: boolean }[]).filter((i) => i.required && !data.answers[i.label]?.trim());
    if (missing.length) return { ok: false as const, reason: `Please fill in: ${missing.map((m) => m.label).join(", ")}.` };
    const { data: dup } = await a.from("job_applications").select("id").eq("job_id", job.id).eq("creator_id", me.id).maybeSingle();
    if (dup) return { ok: false as const, reason: "You already applied to this job." };
    const { data: sig } = await a.from("creator_signatures").select("id").eq("creator_id", me.id).maybeSingle();
    const accept = job.open && Boolean(sig);
    await a.from("job_applications").insert({ job_id: job.id, creator_id: me.id, answers: data.answers, status: accept ? "accepted" : "pending", ...(accept ? { contract_signed_at: new Date().toISOString(), decided_at: new Date().toISOString() } : {}) });
    if (accept) { await a.from("creator_apps").upsert({ creator_id: me.id, app_id: job.app_id, status: "active" }, { onConflict: "creator_id,app_id" }); await (await import("./access-codes.server")).assignAppCode(a, me.id, job.app_id); }
    return { ok: true as const, accepted: accept, needsSignature: job.open && !sig };
  });

export const taskUploadSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ taskId: z.string().uuid(), contentType: z.enum(["video/mp4", "video/quicktime"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await meCreator(context);
    const a = await adminClient();
    const { data: t } = await a.from("creator_tasks").select("id").eq("id", data.taskId).eq("creator_id", me.id).eq("status", "open").maybeSingle();
    if (!t) throw new Error("This task is closed.");
    const path = `${me.id}/ads/${data.taskId}-${Date.now()}.${data.contentType === "video/mp4" ? "mp4" : "mov"}`;
    const { data: slot, error } = await a.storage.from("creator-videos").createSignedUploadUrl(path);
    if (error || !slot) throw new Error("Upload could not start.");
    return { path, token: slot.token };
  });
