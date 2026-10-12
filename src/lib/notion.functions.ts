import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* Notion ↔ Inspiration: admin-only status, connection test and manual sync. */
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
async function assertAdmin(ctx: { supabase: Admin; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("role").eq("user_id", ctx.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Admins only");
}
async function admin(): Promise<Admin> { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }

export const notionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const a = await admin();
    const [{ data: cfg }, { data: items }] = await Promise.all([
      a.from("ugc_settings").select("notion_database_id, notion_auto, notion_last_sync, notion_last_error, notion_videos_per_profile").eq("id", 1).maybeSingle(),
      a.from("notion_items").select("kind, hub_status, error, inspiration_id, profile_status, imported_count"),
    ]);
    const list = (items ?? []) as { kind: string; hub_status: string | null; error: string | null; inspiration_id: string | null; profile_status: string | null; imported_count: number }[];
    const profs = list.filter((i) => i.kind === "profile");
    return {
      connected: Boolean(process.env["NOTION_TOKEN"]),
      databaseId: (cfg?.notion_database_id ?? "") as string, auto: (cfg?.notion_auto ?? true) as boolean,
      lastSync: (cfg?.notion_last_sync ?? null) as string | null, lastError: (cfg?.notion_last_error ?? null) as string | null, perProfile: (cfg?.notion_videos_per_profile ?? 10) as number,
      counts: {
        imported: list.filter((i) => i.kind === "video" && i.inspiration_id).length,
        analyzed: list.filter((i) => i.hub_status === "Analysé").length,
        profiles: profs.length,
        profilesDone: profs.filter((i) => i.profile_status === "done").length,
        profilesPending: profs.filter((i) => i.profile_status === "queued" || i.profile_status === "running").length,
        profileVideos: profs.reduce((n, i) => n + (i.imported_count ?? 0), 0),
        errors: list.filter((i) => i.error || i.kind === "other").length,
      },
    };
  });

export const notionTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ databaseId: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    if (!process.env["NOTION_TOKEN"]) return { ok: false as const, error: "Not connected — add NOTION_TOKEN" };
    try { const { testConnection } = await import("./notion-sync.server"); return { ok: true as const, ...(await testConnection(data.databaseId)) }; }
    catch (e) { return { ok: false as const, error: (e as Error).message }; }
  });

export const notionSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    if (!process.env["NOTION_TOKEN"]) return { skipped: "Not connected — add NOTION_TOKEN" } as Record<string, string | number | boolean | null>;
    const a = await admin();
    const { runNotionSync } = await import("./notion-sync.server");
    const { withLock } = await import("./hub-automation.server");
    return (await withLock(a, "notion-sync", 5, () => runNotionSync(a))) as Record<string, string | number | boolean | null>;
  });

/** Fills notion_format from the stored analysis (no transcription). */
export const backfillNotionFormat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(10) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { classifyNotionFormat } = await import("./notion-sync.server");
    return classifyNotionFormat(await admin(), data.ids);
  });

/** Queue a profile row again with a larger target (top N by views). */
export const notionImportMore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pageId: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const a = await admin();
    const [{ data: cfg }, { data: it }] = await Promise.all([
      a.from("ugc_settings").select("notion_videos_per_profile").eq("id", 1).maybeSingle(),
      a.from("notion_items").select("profile_target, imported_count, kind").eq("notion_page_id", data.pageId).maybeSingle(),
    ]);
    if (it?.kind !== "profile") throw new Error("Not a profile row");
    const step = cfg?.notion_videos_per_profile ?? 10;
    await a.from("notion_items").update({ profile_status: "queued", profile_target: Math.max(it.profile_target ?? 0, it.imported_count ?? 0) + step, error: null, hub_status: "Profil — en file" }).eq("notion_page_id", data.pageId);
    await a.rpc("inspiration_queue_arm");
    return { ok: true };
  });
