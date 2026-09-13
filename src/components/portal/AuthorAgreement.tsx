import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { signAgreement } from "@/lib/portal.functions";
import { downloadDocumentPdf } from "@/lib/documentPdf";
import { formatDate, formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortalProfile } from "./usePortal";
import { DocumentBody } from "./DocumentBody";
import { useDocument, useDocumentVersion } from "./useDocuments";
import { Banner, PageTitle, PortalCard } from "./ui";

export function AuthorAgreement() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const { data: doc, isLoading } = useDocument("contract");
  const sign = useServerFn(signAgreement);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const signedAt = me?.signedAt ?? null;
  // An author who has signed stays bound to the version they signed, whatever the desk edits afterwards.
  const signedVersion = me?.signedVersion ?? null;
  const { data: signedDoc } = useDocumentVersion(doc?.row.id, signedAt ? signedVersion : null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accepted || name.trim().length < 2 || !doc) return;
    setBusy(true);
    try {
      await sign({
        data: {
          signedName: name.trim(),
          // The version live at the moment of signature is what binds the author.
          documentVersion: String(doc.row.current_version),
          userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent.slice(0, 400),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["portal", "me"] });
      toast.success("Agreement signed.");
    } catch {
      toast.error("The signature could not be recorded. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <PortalCard>
        <p className="text-sm text-brand-navySoft">Loading…</p>
      </PortalCard>
    );
  }

  if (!doc) {
    return <Banner tone="warning" title="The agreement has not been published yet" />;
  }

  const showingSigned = Boolean(signedAt && signedDoc);
  const blocks = showingSigned ? signedDoc!.blocks : doc.blocks;
  const title = showingSigned ? signedDoc!.title || doc.row.title : doc.row.title;
  const version = showingSigned ? signedVersion! : doc.row.current_version;
  const subtitle = showingSigned
    ? `Version ${version} — the version you signed on ${formatDate(signedAt)}`
    : `Version ${version} — current version, updated ${formatDate(doc.row.updated_at)}`;

  return (
    <div>
      <PageTitle
        title="Author agreement"
        lead="Read the agreement in full, then sign at the bottom. You can come back to this page at any time."
      />

      {signedAt ? (
        <div className="mb-6">
          <Banner tone="success" title={`Signed on ${formatDateTime(signedAt)}`}>
            You signed version {signedVersion ?? "—"} and remain bound to that version. Later edits to the agreement do
            not change what you signed. Your courses are open for writing.
          </Banner>
        </div>
      ) : null}

      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy">{title}</h2>
            <p className="mt-1 text-sm text-brand-navySoft">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="pillSecondary"
            size="pillSm"
            onClick={() =>
              downloadDocumentPdf({ slug: "author-agreement", title, subtitle, version, blocks })
            }
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
        <DocumentBody blocks={blocks} className="mt-8" />
      </PortalCard>

      {!signedAt ? (
        <PortalCard className="mt-6 max-w-2xl">
          <h2 className="text-lg font-extrabold text-brand-navy">Signature</h2>
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(value) => setAccepted(value === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept" className="text-sm font-medium leading-relaxed text-brand-navy">
                I have read and accept this agreement
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signed-name">Your full legal name</Label>
              <Input
                id="signed-name"
                value={name}
                maxLength={160}
                onChange={(event) => setName(event.target.value)}
                className="h-11"
                autoComplete="name"
              />
            </div>
            <p className="text-xs leading-relaxed text-brand-navySoft">
              Signing records your typed name, the date and time, your IP address, your browser and document version{" "}
              {doc.row.current_version}.
            </p>
            <Button
              type="submit"
              variant="pill"
              size="pillSm"
              disabled={busy || !accepted || name.trim().length < 2}
            >
              {busy ? "Signing…" : "Sign"}
            </Button>
          </form>
        </PortalCard>
      ) : null}
    </div>
  );
}
