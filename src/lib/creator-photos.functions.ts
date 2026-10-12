import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only: short-lived signed links to creators' private profile photos. */
export const adminCreatorPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: me } = await (context.supabase as any).from("profiles").select("role").eq("user_id", context.userId).maybeSingle(); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (me?.role !== "admin") throw new Error("Admins only");
    if (!data.ids.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("creators").select("id, photo_path").in("id", data.ids).not("photo_path", "is", null);
    const list = (rows ?? []) as { id: string; photo_path: string }[];
    if (!list.length) return {} as Record<string, string>;
    const { data: signed } = await supabaseAdmin.storage.from("creator-videos").createSignedUrls(list.map((r) => r.photo_path), 3600);
    const out: Record<string, string> = {};
    list.forEach((r, i) => { const u = signed?.[i]?.signedUrl; if (u) out[r.id] = u; });
    return out;
  });
