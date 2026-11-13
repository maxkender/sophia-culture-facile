import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getSigningPage, signWithToken } from "@/lib/creator-agreement.functions";
import { creatorAgreementBlocks, TRACK_LABEL } from "@/lib/creator-agreement";
import { parseBlocks } from "@/lib/documents";
import { CreatorAgreementForm } from "@/components/creators/CreatorAgreementForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [ruulEmail, setRuulEmail] = useState("");
  const ruulOk = !ruulEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ruulEmail.trim());
  const { data, isLoading } = useQuery({ queryKey: ["sign", token], queryFn: () => load({ data: { token } }), retry: false });

  useEffect(() => {
    if (data?.state === "ready") setRuulEmail(data.email ?? "");
  }, [data]);

  let body: React.ReactNode;
  if (done || data?.state === "signed") body = <SignedWithGuide token={token} />;
  else if (isLoading) body = <p className="text-sm text-brand-navySoft">Loading…</p>;
  else if (!data || data.state === "invalid")
    body = <Note title="This link is no longer valid">It has already been used or replaced. Ask your hiring manager for a new link.</Note>;
  else if (data.state === "withdrawn")
    body = <Note title="This offer is no longer available">We're sorry, this position is no longer open in your country, so this agreement can't be signed. Thank you for your interest.</Note>;
  else if (data.state === "unpublished") body = <Note title="Not available yet">The agreement is being finalised. Try again later.</Note>;
  else
    body = (
      <CreatorAgreementForm
        title={data.title}
        version={data.version}
        blocks={creatorAgreementBlocks(parseBlocks(data.content), "slideshow")}
        merge={{ legal_name: data.name, country: data.country, email: data.email, track: TRACK_LABEL.slideshow }}
        beforeSignature={
          <section aria-labelledby="after-signing-title" className="rounded-2xl border border-brand-line bg-card p-5 sm:p-8">
            <h2 id="after-signing-title" className="text-lg font-extrabold text-brand-navy">What happens after you sign</h2>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-brand-navySoft">
              <li>You start on Monday {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${data.startMonday}T12:00:00Z`))}. You post 2 slideshows a day.</li>
              <li>Your access: we email you your login for the Sophia OS (your dashboard) right after you sign.</li>
              <li>The job: everything is prepared for you. You download the pictures, add the text on TikTok and post. It takes about 5 minutes.</li>
              <li>Your pay: you're paid every Monday for the week before, through Ruul. Ruul is simply how we keep a safe, proper contract with you. You create a free Ruul account, verify your ID, and then every Monday your pay goes to your bank account.</li>
              <li>Questions or stopping: ask anything with Help on your dashboard. If you ever want to stop, press Stop there, no hard feelings.</li>
            </ul>
          </section>
        }
        extraValid={ruulOk}
        extraField={
          <div className="space-y-2">
            <Label htmlFor="ruul-email">Email for your Ruul account (we'll send your Ruul invitation there)</Label>
            <Input id="ruul-email" type="email" value={ruulEmail} maxLength={254} onChange={(e) => setRuulEmail(e.target.value)} className="h-11" autoComplete="email" />
            <p className="text-xs text-brand-navySoft">Optional. You can also add it later on your dashboard.</p>
          </div>
        }
        onSign={async (signedName) => {
          try {
            await sign({ data: { token, signedName, ruulEmail: ruulEmail.trim(), documentVersion: data.version, userAgent: navigator.userAgent.slice(0, 400) } });
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

function SignedWithGuide(_: { token: string }) {
  return <Note title="Contract signed">Your logins arrive by email.</Note>;
}
