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
      a.from("ugc_settings").select("notion_database_id, notion_auto, notion_last_sync, notion_last_error").eq("id", 1).maybeSingle(),
      a.from("notion_items").select("kind, hub_status, error, inspiration_id"),
    ]);
    const list = (items ?? []) as { kind: string; hub_status: string | null; error: string | null; inspiration_id: string | null }[];
    return {
      connected: Boolean(process.env["NOTION_TOKEN"]),
      databaseId: (cfg?.notion_database_id ?? "") as string, auto: (cfg?.notion_auto ?? true) as boolean,
      lastSync: (cfg?.notion_last_sync ?? null) as string | null, lastError: (cfg?.notion_last_error ?? null) as string | null,
      counts: {
        imported: list.filter((i) => i.kind === "video" && i.inspiration_id).length,
        analyzed: list.filter((i) => i.hub_status === "Analysé").length,
        profiles: list.filter((i) => i.kind === "profile").length,
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
    if (!process.env["NOTION_TOKEN"]) return { skipped: "Not connected — add NOTION_TOKEN" } as Record<string, unknown>;
    const a = await admin();
    const { runNotionSync } = await import("./notion-sync.server");
    const { withLock } = await import("./hub-automation.server");
    return (await withLock(a, "notion-sync", 5, () => runNotionSync(a))) as Record<string, unknown>;
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
