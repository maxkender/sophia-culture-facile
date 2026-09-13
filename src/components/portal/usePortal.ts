import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/portal";

export function usePortalProfile() {
  return useQuery({
    queryKey: ["portal", "me"],
    staleTime: 30_000,
    queryFn: async (): Promise<{
      profile: Profile | null;
      email: string | null;
      signedAt: string | null;
      signedVersion: number | null;
    }> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return { profile: null, email: null, signedAt: null, signedVersion: null };
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      let signedAt: string | null = null;
      let signedVersion: number | null = null;
      if (profile) {
        const { data: contract } = await supabase
          .from("contracts")
          .select("signed_at, document_version")
          .eq("author_id", profile.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        signedAt = contract?.signed_at ?? null;
        const parsed = Number.parseInt(String(contract?.document_version ?? ""), 10);
        signedVersion = Number.isFinite(parsed) ? parsed : null;
      }
      return { profile: profile ?? null, email: user.email ?? null, signedAt, signedVersion };
    },
  });
}
