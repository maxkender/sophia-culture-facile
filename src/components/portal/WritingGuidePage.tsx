import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadDocumentPdf } from "@/lib/documentPdf";
import { formatDate } from "@/lib/portal";
import { DocumentBody } from "./DocumentBody";
import { useDocument } from "./useDocuments";
import { Banner, PageTitle, PortalCard } from "./ui";

export function WritingGuidePage() {
  const { data, isLoading } = useDocument("guide");

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
