import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AiReviewRow } from "@/lib/aiReview";
import { AiReviewShareable } from "./admin/AiReviewPanel";
import { PortalCard } from "./ui";

/**
 * Author-facing half of the AI first pass, and only when the desk has switched sharing on.
 * Wording and readability only: the claims flagged for a human check stay with the desk.
 */
export function AiSuggestions({ courseId }: { courseId: string }) {
  const { data: review } = useQuery({
    queryKey: ["portal", "ai-suggestions", courseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_reviews")
        .select("*")
        .eq("course_id", courseId)
        .eq("shared_with_author", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as AiReviewRow | null;
    },
  });

  if (!review) return null;

  return (
    <PortalCard className="border-l-4 border-portal-accent">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-navy">
        <Sparkles className="size-5 text-portal-accent" aria-hidden="true" />
        Automated suggestions
      </h2>
      <p className="mt-2 text-sm text-brand-navySoft">
        These come from an automatic check on wording and readability, not from the editorial desk. Treat them as
        hints: take what helps and ignore the rest. Editorial notes always arrive as a change request.
      </p>
      <div className="mt-5">
        <AiReviewShareable review={review} />
      </div>
    </PortalCard>
  );
}
