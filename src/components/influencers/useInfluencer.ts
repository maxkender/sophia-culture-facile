import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseBlocks, type DocBlock } from "@/lib/documents";
import type { Database } from "@/integrations/supabase/types";

export type Influencer = Database["public"]["Tables"]["influencers"]["Row"];
export const INFLUENCER_KEY = ["influencer", "me"] as const;

export function useInfluencerQuery() {
  return useQuery({
    queryKey: INFLUENCER_KEY,
    queryFn: async (): Promise<Influencer | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("influencers").select("*").eq("user_id", u.user.id).maybeSingle();
      return data ?? null;
    },
  });
}

export function influencerSteps(i: Influencer | null | undefined) {
  const rules = Boolean(i?.rules_accepted_at);
  const agreement = Boolean(i?.agreement_signed_at);
  const payouts = Boolean(i?.payout_setup_at);
  return { rules, agreement, payouts, count: [rules, agreement, payouts].filter(Boolean).length, done: rules && agreement && payouts };
}

export function useInfluencerDoc(slug: "influencer-agreement" | "influencer-rules") {
  return useQuery({
    queryKey: ["influencer", "doc", slug],
    queryFn: async (): Promise<{ title: string; version: number; blocks: DocBlock[] } | null> => {
      const { data } = await supabase.from("documents").select("title, current_version, content, published").eq("slug", slug).maybeSingle();
      if (!data?.published) return null;
      return { title: data.title, version: data.current_version, blocks: parseBlocks(data.content) };
    },
  });
}

export function useInfluencerUnread(influencerId: string | undefined) {
  return useQuery({
    queryKey: ["influencer", "unread", influencerId],
    enabled: Boolean(influencerId),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("influencer_messages").select("id", { count: "exact", head: true })
        .eq("influencer_id", influencerId!).eq("from_admin", true).is("read_at", null);
      return count ?? 0;
    },
  });
}

/** Replaces the agreement's {legal_name}, {country} and {email} placeholders. */
export function fillAgreement(blocks: DocBlock[], i: Influencer): DocBlock[] {
  const fill = (t: string) =>
    t.replaceAll("{legal_name}", i.legal_name || i.display_name).replaceAll("{country}", i.country ?? "—").replaceAll("{email}", i.email);
  return blocks.map((b) => (b.type === "paragraph" ? { ...b, text: fill(b.text) } : b));
}
