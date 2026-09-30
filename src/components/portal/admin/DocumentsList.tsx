import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DOCUMENT_LABEL, type DocumentSlug } from "@/lib/documents";
import { formatDateTime } from "@/lib/portal";
import { PageTitle, PortalCard } from "../ui";

const SLUGS: DocumentSlug[] = ["guide", "contract", "creator-agreement", "creator-guide", "creator-rules", "slideshow-guide", "influencer-agreement", "influencer-rules"];

export function DocumentsList() {
  const { data = [] } = useQuery({
    queryKey: ["portal", "documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("slug, title, current_version, updated_at, published");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageTitle
        title="Documents"
        lead="The writing guide and the author contract live here. Every save creates a new version and nothing is overwritten."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {SLUGS.map((slug) => {
          const row = data.find((entry) => entry.slug === slug);
          return (
            <PortalCard key={slug}>
              <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                <FileText className="size-4" aria-hidden="true" />
                {DOCUMENT_LABEL[slug]}
              </p>
              <p className="mt-4 text-sm text-brand-navySoft">{row?.title ?? "Not created yet"}</p>
              <p className="mt-1 text-xs text-brand-navySoft">
                {row ? `Version ${row.current_version} — updated ${formatDateTime(row.updated_at)}` : "—"}
              </p>
              {row ? (
                <span
                  className={
                    row.published
                      ? "mt-3 inline-block rounded-full bg-portal-green/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-portal-green"
                      : "mt-3 inline-block rounded-full bg-portal-amber/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-portal-amber"
                  }
                >
                  {row.published ? "Published" : "Draft"}
                </span>
              ) : null}
              <Button asChild variant="pill" size="pillSm" className="mt-4">
                <Link to="/auteurs/admin/documents/$slug" params={{ slug }}>
                  Edit
                </Link>
              </Button>
            </PortalCard>
          );
        })}
      </div>
    </div>
  );
}
