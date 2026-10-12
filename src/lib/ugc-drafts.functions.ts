// UGC draft review: creators send a draft per brief (file or link); the owner validates or asks for changes.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Ctx = { supabase: any; userId: string }; // eslint-disable-line @typescript-eslint/no-explicit-any

async function meCreator(context: Ctx) {
  const { data } = await context.supabase.from("creators").select("id, status").eq("user_id", context.userId).maybeSingle();
  if (!data || data.status === "pending") throw new Error("Creator account not found.");
  return data as { id: string };
}
async function adminId(context: Ctx): Promise<string> {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id;
}
const TYPES = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" } as const;

export const draftUploadSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ briefId: z.string().uuid(), contentType: z.enum(["video/mp4", "video/quicktime", "video/webm"]), size: z.number().int().positive().max(500 * 1024 * 1024) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await meCreator(context as Ctx);
    const { data: b } = await (context as Ctx).supabase.from("briefs").select("id").eq("id", data.briefId).maybeSingle();
    if (!b) throw new Error("This brief is not available to you.");
    const path = `${me.id}/drafts/${data.briefId}/${crypto.randomUUID()}.${TYPES[data.contentType]}`;
    const { data: slot, error } = await (await db()).storage.from("creator-videos").createSignedUploadUrl(path);
    if (error || !slot) throw new Error("Upload could not start.");
    return { path, signedUrl: slot.signedUrl as string };
  });

export const submitDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    briefId: z.string().uuid(),
    videoPath: z.string().max(300).optional(),
    linkUrl: z.string().trim().url().max(1000).refine((u) => u.startsWith("https://"), "Paste the full link, starting with https://.").optional(),
    note: z.string().trim().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await meCreator(context as Ctx);
    if (!data.videoPath && !data.linkUrl) throw new Error("Add a video or a link.");
    if (data.videoPath && !data.videoPath.startsWith(`${me.id}/drafts/${data.briefId}/`)) throw new Error("Upload the video again.");
    const { data: b } = await (context as Ctx).supabase.from("briefs").select("id, app_id").eq("id", data.briefId).maybeSingle();
    if (!b) throw new Error("This brief is not available to you.");
    const a = await db();
    const { data: last } = await a.from("creator_drafts").select("version").eq("creator_id", me.id).eq("brief_id", data.briefId).order("version", { ascending: false }).limit(1).maybeSingle();
    const { error } = await a.from("creator_drafts").insert({ creator_id: me.id, brief_id: data.briefId, app_id: b.app_id, version: (last?.version ?? 0) + 1, video_path: data.videoPath ?? null, link_url: data.linkUrl ?? null, note: data.note || null, status: "submitted" });
    if (error) throw new Error("Your draft could not be saved. Please try again.");
    return { ok: true };
  });

export const reviewDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), decision: z.enum(["validated", "changes_requested"]), comment: z.string().trim().max(2000).optional(), origin: z.string().url() })
    .refine((x) => x.decision === "validated" || (x.comment ?? "").length >= 2, "Write what needs to change.").parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context as Ctx);
    const a = await db();
    const { data: dr } = await a.from("creator_drafts").select("id, status, version, brief_id, creators(id, full_name, email, email_pending, language, country), briefs(title)").eq("id", data.id).maybeSingle();
    if (!dr) throw new Error("Draft not found.");
    await a.from("creator_drafts").update({ status: data.decision, admin_comment: data.comment || null, reviewed_at: new Date().toISOString(), reviewed_by: me }).eq("id", dr.id);
    const c = dr.creators; const title = dr.briefs?.title ?? "brief";
    const { emailLang, sendCreatorNote } = await import("./ugc-email.server");
    const fr = emailLang(c?.language, c?.country) === "fr";
    const ok = data.decision === "validated";
    const line = ok
      ? (fr ? `Brouillon validé ✅ pour « ${title} » — poste-la et colle ton lien.` : `Draft validated ✅ for "${title}" — post it and paste your link.`)
      : (fr ? `Modifications demandées pour « ${title} » : ${data.comment}` : `Changes requested for "${title}": ${data.comment}`);
    await a.from("creator_notifications").insert({ creator_id: c.id, body: line });
    let emailSent = false;
    if (c?.email && !c.email_pending) {
      const first = String(c.full_name ?? "").split(/\s+/)[0] || "";
      const r = await sendCreatorNote(c.email, c.full_name ?? "", ok ? (fr ? "Brouillon validé ✅" : "Draft validated ✅") : (fr ? "Modifications demandées" : "Changes requested"),
        [fr ? `Salut ${first},` : `Hi ${first || "there"},`, line, ...(ok && data.comment ? [data.comment] : [])],
        { label: fr ? "Ouvrir le brief" : "Open the brief", url: `${data.origin.replace(/\/$/, "")}/creators/app/briefs/${dr.brief_id}` });
      emailSent = r.sent;
    }
    return { ok: true, emailSent };
  });

export const draftVideoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: dr } = await (context as Ctx).supabase.from("creator_drafts").select("video_path").eq("id", data.id).maybeSingle();
    if (!dr?.video_path) return { url: null };
    const { data: s } = await (await db()).storage.from("creator-videos").createSignedUrl(dr.video_path, 3600);
    return { url: (s?.signedUrl as string) ?? null };
  });
