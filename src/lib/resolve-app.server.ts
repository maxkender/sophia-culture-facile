/** Resolves a public app slug to its id; unknown or inactive apps fall back to Sophia. */
export async function resolveAppId(slug: string | undefined): Promise<string> {
  const SOPHIA = "00000000-0000-4000-8000-000000000001";
  if (!slug || slug === "sophia") return SOPHIA;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("apps").select("id").eq("slug", slug).eq("active", true).maybeSingle();
  return data?.id ?? SOPHIA;
}
