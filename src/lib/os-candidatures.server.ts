import { SITE_URL } from "@/config/site";
// Server-only: Sophia OS endpoint for slideshow recruiting (list + actions). Auth: x-hub-secret === OS_HUB_SECRET.
import { z } from "zod";
import { hubSecretMatches, readBoundedJson } from "./os-email.server";

const FIELDS = "id, full_name, email, country, is_adult, deux_telephones, q_country_now, q_hours_per_day, q_tiktok_daily, q_previous_content, referred, referral_name, ref, langue, status, created_at, accepted_at, contract_signed_at, os_created_at, os_profile_id, start_monday, expired_at, ruul_email, phone, unsubscribed_at";
const SINCE_COLS = ["created_at", "decided_at", "accepted_at", "contract_signed_at", "os_created_at", "expired_at", "unsubscribed_at", "agreement_signed_at"];
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const SITE = () => process.env["SITE_URL"] ?? SITE_URL;

const monday = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => { const x = new Date(`${d}T00:00:00Z`); return !isNaN(x.getTime()) && x.getUTCDay() === 1 && x.toISOString().slice(0, 10) === d; }, "start_monday must be a Monday (YYYY-MM-DD)");
const id = z.string().uuid();
export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), id, start_monday: monday }),
  z.object({ action: z.literal("refuse"), id, reason: z.string().trim().max(500).optional().default("") }),
  z.object({ action: z.literal("remind_signature"), id, step: z.union([z.literal(1), z.literal(3), z.literal(6)]) }),
  z.object({ action: z.literal("expire"), id }),
  z.object({ action: z.literal("move_start"), id, start_monday: monday }),
]);

const BY = { id: null, name: "Sophia OS" };
const ACCEPTED_OR_LATER = ["accepted", "approved", "contract_signed", "os_created", "started"];

async function stamp(a: any, appId: string, key: string) {
  const { data } = await a.from("slideshow_applications").select("timeline").eq("id", appId).maybeSingle();
  await a.from("slideshow_applications").update({ timeline: { ...((data?.timeline as object) ?? {}), [key]: { at: new Date().toISOString(), by: BY.name } } }).eq("id", appId);
}

export async function listCandidatures(a: any, since: string | null) {
  let q = a.from("slideshow_applications").select(FIELDS).order("created_at", { ascending: true }).limit(10000);
  if (since) q = q.or(SINCE_COLS.map((c) => `${c}.gte.${since}`).join(","));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ phone, ...r }: any) => ({ ...r, has_phone: String(phone ?? "").trim() !== "" }));
}

export async function runAction(a: any, input: z.infer<typeof actionSchema>): Promise<{ ok: true; [k: string]: unknown } | { ok: false; error: string }> {
  const { data: app } = await a.from("slideshow_applications").select("*").eq("id", input.id).maybeSingle();
  if (!app) return { ok: false, error: "Application not found" };
  switch (input.action) {
    case "accept": {
      if (ACCEPTED_OR_LATER.includes(app.status)) return { ok: true, already: true };
      const { acceptSlideshowApplication } = await import("./slideshow-accept.server");
      try {
        const r = await acceptSlideshowApplication(a, { applicationId: app.id, startMonday: input.start_monday }, BY);
        return { ok: true, emailed: r.emailed };
      } catch (e) { return { ok: false, error: (e as Error).message }; }
    }
    case "refuse": {
      if (app.status === "rejected") return { ok: true, already: true };
      const reason = input.reason || null;
      await a.from("slideshow_applications").update({ status: "rejected", rejected_reason: reason, rejection_reason: reason, decided_at: new Date().toISOString(), decided_by: null }).eq("id", app.id);
      await stamp(a, app.id, "rejected");
      const { posterEmails, pickLang } = await import("./slideshow-emails.server");
      const sent = await posterEmails.rejected(app.email, app.full_name, pickLang(app.langue), reason);
      return { ok: true, emailed: sent.sent };
    }
    case "remind_signature": {
      if (app.agreement_signed_at || app.contract_signed_at) return { ok: true, skipped: "already_signed" };
      if (app.unsubscribed_at) return { ok: true, skipped: "unsubscribed" };
      if (!app.signing_token || !["accepted", "approved"].includes(app.status)) return { ok: false, error: "No active signing link for this application" };
      const { posterEmails } = await import("./slideshow-emails.server");
      const sent = await posterEmails.remindSignature(app.email, app.full_name, `${SITE()}/creators/sign/${app.signing_token}`);
      if (sent.sent) await stamp(a, app.id, ({ 1: "remind_1", 3: "remind_2", 6: "remind_3" } as const)[input.step]);
      return sent.sent ? { ok: true, emailed: true } : { ok: false, error: sent.reason ?? "Email not sent" };
    }
    case "expire": {
      if (app.status === "expired") return { ok: true, already: true };
      await a.from("slideshow_applications").update({ status: "expired", expired_at: new Date().toISOString() }).eq("id", app.id);
      await stamp(a, app.id, "expired");
      return { ok: true };
    }
    case "move_start": {
      await a.from("slideshow_applications").update({ start_monday: input.start_monday }).eq("id", app.id);
      return { ok: true };
    }
  }
}

export async function handleOsCandidatures(request: Request, secret: string | undefined, getAdmin: () => Promise<any>): Promise<Response> {
  if (!hubSecretMatches(request.headers.get("x-hub-secret"), secret)) return json({ ok: false, error: "unauthorized" }, 401);
  const a = await getAdmin();
  if (request.method === "GET") {
    const raw = new URL(request.url).searchParams.get("since");
    let since: string | null = null;
    if (raw) {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return json({ ok: false, error: "invalid since" }, 400);
      since = d.toISOString();
    }
    try { return json({ ok: true, candidatures: await listCandidatures(a, since) }); }
    catch (e) { return json({ ok: false, error: (e as Error).message }, 500); }
  }
  let body: unknown;
  try { body = await readBoundedJson(request, 20_000); } catch { return json({ ok: false, error: "invalid JSON" }, 400); }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") }, 400);
  try {
    const r = await runAction(a, parsed.data);
    return json(r, r.ok ? 200 : 422);
  } catch (e) { return json({ ok: false, error: (e as Error).message }, 500); }
}
