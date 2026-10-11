import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* Inspiration: admin-only import, processing and reference saving. Reads/edits of rows go through RLS (admins only). */
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function assertAdmin(ctx: { supabase: Admin; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Admins only");
  return data.id as string;
}
async function admin(): Promise<Admin> { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }

export const importInspirations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ links: z.array(z.string().max(1000)).max(2000), appId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context as never);
    const { enqueue } = await import("./inspirations.server");
    const batchId = crypto.randomUUID();
    const r = await enqueue(await admin(), data.links, data.appId, me, batchId);
    return { batchId, added: r.added, duplicates: r.duplicates, invalid: r.invalid };
  });

/** Processes rows now (used by "Brief depuis une vidéo" and Re-run analysis). Max 5 per call. */
export const processInspirations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).max(5), analyseOnly: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await admin(); const { processRow } = await import("./inspirations.server");
    const out = await Promise.all(data.ids.map((id) => processRow(a, id, data.analyseOnly ? "analyse" : undefined)));
    return { results: out };
  });

/** "Brief depuis une vidéo": one inspirations row per link, processed now; returns the row for the brief analysis. */
export const inspirationForLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(1000), appId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context as never);
    const a = await admin(); const { enqueue, processRow, signedInspirationUrl } = await import("./inspirations.server");
    const r = await enqueue(a, [data.url], data.appId, me, crypto.randomUUID());
    const id = r.ids[0]; if (!id) return null;
    let { data: row } = await a.from("inspirations").select("*").eq("id", id).single();
    if (row.status !== "analyzed") { await processRow(a, id); row = (await a.from("inspirations").select("*").eq("id", id).single()).data; }
    if (row.status !== "analyzed") throw new Error(row.error ? `This video could not be read: ${row.error}` : "This video could not be read. Upload the file instead.");
    return { id, transcript: row.transcript as string | null, caption: row.caption as string | null, handle: row.author_handle as string | null, analysis: row.analysis, coverUrl: await signedInspirationUrl(a, row.cover_path, 600) };
  });

export const retryInspirationErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batchId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    let q = (await admin()).from("inspirations").update({ status: "queued", attempts: 0, next_try_at: new Date().toISOString() }).eq("status", "error");
    if (data.batchId) q = q.eq("batch_id", data.batchId);
    const { data: rows } = await q.select("id");
    if ((rows ?? []).length) await (await admin()).rpc("inspiration_queue_arm");
    return { requeued: (rows ?? []).length };
  });

export const deleteInspirations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await admin();
    const { data: rows } = await a.from("inspirations").select("video_path, cover_path").in("id", data.ids);
    const paths = (rows ?? []).flatMap((r: { video_path: string | null; cover_path: string | null }) => [r.video_path, r.cover_path]).filter(Boolean);
    if (paths.length) await a.storage.from("inspirations").remove(paths);
    await a.from("inspirations").delete().in("id", data.ids);
    return { deleted: data.ids.length };
  });

/** Library → Reference videos, with the analysis. Cover is a 1-year signed link from the private bucket. */
export const inspirationToReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await admin(); const { signedInspirationUrl } = await import("./inspirations.server");
    const { data: r } = await a.from("inspirations").select("*").eq("id", data.id).single();
    if (r.reference_id) return { referenceId: r.reference_id as string, existed: true };
    const an = r.analysis ?? {};
    const { data: ref, error } = await a.from("reference_videos").insert({
      url: r.url, platform: r.platform, app_id: r.app_id, title: `@${r.author_handle ?? "?"} — ${(r.hook_text ?? r.caption ?? "").slice(0, 80)}`,
      thumbnail_url: await signedInspirationUrl(a, r.cover_path, 31_536_000), why_it_works: (an.why_it_works ?? []).join("\n"), format_notes: an.on_screen_text_style ?? null,
      analysis: { ...an, transcript: r.transcript, inspiration_id: r.id }, score: r.score, source: "Inspiration", tags: r.tags, active: true,
    }).select("id").single();
    if (error) throw new Error("The reference could not be saved.");
    await a.from("inspirations").update({ reference_id: ref.id }).eq("id", r.id);
    return { referenceId: ref.id as string, existed: false };
  });
