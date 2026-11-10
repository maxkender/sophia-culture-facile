import { supabase } from "@/integrations/supabase/client";

export type AccountRole = "admin" | "author" | "creator" | "influencer" | "none";
export const ADMIN_MODE_KEY = "sophia.portal.admin.mode";

/** Resolves which space the signed-in user belongs to. Admin > author > creator > influencer. */
export async function resolveAccountRole(): Promise<AccountRole | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [{ data: profile }, { data: creator }, { data: influencer }] = await Promise.all([
    supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("creators").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("influencers").select("id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile?.role === "admin") return "admin";
  if (profile?.role === "author") return "author";
  if (creator) return "creator";
  if (influencer) return "influencer";
  return "none";
}

/** Only the slideshow Hub remains on this site; every other role has no space here. */
export function homeFor(role: AccountRole): string {
  if (role === "admin") return "/hub/slideshows";
  return "/account-not-set-up";
}
