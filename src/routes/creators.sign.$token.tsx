import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getSigningPage, signWithToken } from "@/lib/creator-agreement.functions";
import { creatorAgreementBlocks, TRACK_LABEL } from "@/lib/creator-agreement";
import { parseBlocks } from "@/lib/documents";
import { CreatorAgreementForm } from "@/components/creators/CreatorAgreementForm";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { Button } from "@/components/ui/button";
import { getGuideByToken } from "@/lib/slideshow-zones.functions";
import { GUIDE_PDF_NAME } from "@/lib/slideshow-guide";
import type { DocBlock } from "@/lib/documents";

export const Route = createFileRoute("/creators/sign/$token")({
  head: () => ({
    meta: [
      { title: "Creator Account Agreement | Sophia" },
      { name: "description", content: "Sign your Sophia Creator Account Agreement." },
      { property: "og:title", content: "Creator Account Agreement | Sophia" },
      { property: "og:description", content: "Sign your Sophia Creator Account Agreement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignPage,
});

function SignPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getSigningPage);
  const sign = useServerFn(signWithToken);
  const [done, setDone] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["sign", token], queryFn: () => load({ data: { token } }), retry: false });

  let body: React.ReactNode;
  if (done || data?.state === "signed") body = <SignedWithGuide token={token} />;
  else if (isLoading) body = <p className="text-sm text-brand-navySoft">Loading…</p>;
  else if (!data || data.state === "invalid")
    body = <Note title="This link is no longer valid">It has already been used or replaced. Ask your hiring manager for a new link.</Note>;
  else if (data.state === "unpublished") body = <Note title="Not available yet">The agreement is being finalised. Try again later.</Note>;
  else
    body = (
      <CreatorAgreementForm
        title={data.title}
        version={data.version}
        blocks={creatorAgreementBlocks(parseBlocks(data.content), "slideshow")}
        merge={{ legal_name: data.name, country: data.country, email: data.email, track: TRACK_LABEL.slideshow }}
        onSign={async (signedName) => {
          try {
            await sign({ data: { token, signedName, documentVersion: data.version, userAgent: navigator.userAgent.slice(0, 400) } });
            setDone(true);
          } catch (e: any) {
            toast.error(e?.message ?? "The signature could not be recorded.");
          }
        }}
      />
    );

  return <main className="mx-auto max-w-3xl px-4 py-10">{body}</main>;
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-card p-6">
      <h1 className="text-xl font-extrabold text-brand-navy">{title}</h1>
      <p className="mt-2 text-sm text-brand-navySoft">{children}</p>
    </div>
  );
}

function SignedWithGuide({ token }: { token: string }) {
  const load = useServerFn(getGuideByToken);
  const [guide, setGuide] = useState<{ title: string; version: number; blocks: DocBlock[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    try {
      const r = await load({ data: { token } });
      if (r.state === "ready") setGuide({ title: r.title, version: r.version, blocks: r.blocks });
      else setMsg(r.state === "unpublished" ? "The guide is being finalised. Try again later." : "Your hiring manager will send you your guide directly.");
    } catch {
      setMsg("The guide could not be loaded. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function pdf() {
    if (!guide) return;
    const { downloadDocumentPdf } = await import("@/lib/documentPdf");
    await downloadDocumentPdf({ slug: "slideshow-guide", title: guide.title, subtitle: "Sophia · TikTok slideshow programme", version: guide.version, blocks: guide.blocks, filename: GUIDE_PDF_NAME });
  }
  return (
    <div className="space-y-6">
      <Note title="Agreement signed">Thank you. Your signature is recorded. Next, read your creator guide before your first post.</Note>
      {!guide ? (
        <div className="space-y-2">
          <Button type="button" variant="pill" className="min-h-11" disabled={busy} onClick={() => void open()}>Read your creator guide</Button>
          {msg ? <p className="text-sm text-brand-navySoft">{msg}</p> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-line bg-card p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-brand-navy">{guide.title}</h2>
            <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => void pdf()}>Download PDF</Button>
          </div>
          <DocumentBody blocks={guide.blocks} />
        </div>
      )}
    </div>
  );
}
