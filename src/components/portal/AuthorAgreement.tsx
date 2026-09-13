import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CONTRACT_VERSION } from "@/config/portal";
import { AGREEMENT_SECTIONS, AGREEMENT_SUBTITLE, AGREEMENT_TITLE, agreementPlainText } from "@/content/author-agreement";
import { signAgreement } from "@/lib/portal.functions";
import { formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortalProfile } from "./usePortal";
import { Banner, DocumentView, PageTitle, PortalCard } from "./ui";

export function AuthorAgreement() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const sign = useServerFn(signAgreement);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const signedAt = me?.signedAt ?? null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accepted || name.trim().length < 2) return;
    setBusy(true);
    try {
      await sign({
        data: {
          signedName: name.trim(),
          documentVersion: CONTRACT_VERSION,
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

  return (
    <div>
      <PageTitle
        title="Author agreement"
        lead="Read the agreement in full, then sign at the bottom. You can come back to this page at any time."
      />

      {signedAt ? (
        <div className="mb-6">
          <Banner tone="success" title={`Signed on ${formatDateTime(signedAt)}`}>
            Document version {CONTRACT_VERSION}. Your courses are open for writing.
          </Banner>
        </div>
      ) : null}

      <DocumentView
        title={AGREEMENT_TITLE}
        subtitle={AGREEMENT_SUBTITLE}
        sections={AGREEMENT_SECTIONS}
        filename={`sophia-author-agreement-${CONTRACT_VERSION}.txt`}
        plainText={agreementPlainText()}
      />

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
              Signing records your typed name, the date and time, your IP address, your browser and the document
              version.
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
