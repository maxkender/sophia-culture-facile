import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { downloadDocumentPdf } from "@/lib/documentPdf";
import { formatDate } from "@/lib/portal";
import { DocumentBody } from "./DocumentBody";
import { useDocument } from "./useDocuments";
import { usePortalProfile } from "./usePortal";
import { Banner, PageTitle, PortalCard } from "./ui";

export function WritingGuidePage() {
  const { data, isLoading } = useDocument("guide");
  const { data: me } = usePortalProfile();
  const queryClient = useQueryClient();
  const marked = useRef(false);

  // Opening the guide is enough to tick step 3 on the author's home page.
  useEffect(() => {
    const profile = me?.profile;
    if (!profile || profile.role !== "author" || profile.guide_read_at || marked.current) return;
    marked.current = true;
    void (async () => {
      await supabase.from("profiles").update({ guide_read_at: new Date().toISOString() }).eq("id", profile.id);
      await queryClient.invalidateQueries({ queryKey: ["portal", "me"] });
    })();
  }, [me, queryClient]);

  if (isLoading) {
    return (
      <PortalCard>
        <p className="text-sm text-brand-navySoft">Loading…</p>
      </PortalCard>
    );
  }

  if (!data) {
    return <Banner tone="warning" title="The writing guide has not been published yet" />;
  }

  const subtitle = `Version ${data.row.current_version} — updated ${formatDate(data.row.updated_at)}`;

  return (
    <div>
      <PageTitle
        title="Writing guide"
        lead="Read this once before your first course, then keep it open while you write."
      />
      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy">{data.row.title}</h2>
            <p className="mt-1 text-sm text-brand-navySoft">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="pillSecondary"
            size="pillSm"
            onClick={() =>
              downloadDocumentPdf({
                slug: "writing-guide",
                title: data.row.title,
                subtitle,
                version: data.row.current_version,
                blocks: data.blocks,
              })
            }
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
        <DocumentBody blocks={data.blocks} className="mt-8" />
      </PortalCard>
    </div>
  );
}
