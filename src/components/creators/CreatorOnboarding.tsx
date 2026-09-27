import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { markCreatorStep, signCreatorAgreement } from "@/lib/creator-agreement.functions";
import { creatorAgreementBlocks, TRACK_LABEL } from "@/lib/creator-agreement";
import { parseBlocks } from "@/lib/documents";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { Button } from "@/components/ui/button";
import { CreatorAgreementForm } from "./CreatorAgreementForm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreatorOnboarding({ me, refs }: { me: any; refs: any[] }) {
  const qc = useQueryClient();
  const mark = useServerFn(markCreatorStep);
  const sign = useServerFn(signCreatorAgreement);
  const { data: docs } = useQuery({
    queryKey: ["creator-docs"],
    queryFn: async () => (await supabase.from("documents").select("slug, title, content, current_version, published").in("slug", ["creator-agreement", "creator-guide"])).data ?? [],
  });
  const agreement = docs?.find((d) => d.slug === "creator-agreement");
  const guide = docs?.find((d) => d.slug === "creator-guide");
  const reload = () => qc.invalidateQueries({ queryKey: ["creator-space"] });
  const step = !me.examples_read_at ? 1 : !me.guide_read_at && guide?.published ? 2 : 3;

  async function done(s: "examples" | "guide") {
    await mark({ data: { step: s } });
    reload();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Welcome {me.full_name.split(" ")[0]}</h1>
      <ol className="flex gap-2 text-xs font-bold">
        {["Read the examples", "Read the brief guide", "Sign the agreement"].map((l, i) => (
          <li key={l} className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-primary text-primary-foreground" : step > i + 1 ? "bg-muted text-brand-navy" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {l}
          </li>
        ))}
      </ol>
      <p className="text-sm text-brand-navySoft">Briefs and posting unlock once all three steps are done.</p>

      {step === 1 && (
        <section className="space-y-3 rounded-2xl border border-brand-line p-4">
          <h2 className="font-bold text-brand-navy">Examples</h2>
          {refs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No examples yet. You can continue.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {refs.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{r.category} · {r.platform}</a>
                  {r.note ? ` — ${r.note}` : ""}
                </li>
              ))}
            </ul>
          )}
          <Button onClick={() => done("examples")}>I have watched the examples</Button>
        </section>
      )}

      {step === 2 && guide && (
        <section className="space-y-3 rounded-2xl border border-brand-line p-4">
          <h2 className="font-bold text-brand-navy">{guide.title}</h2>
          <DocumentBody blocks={parseBlocks(guide.content)} />
          <Button onClick={() => done("guide")}>I have read the brief guide</Button>
        </section>
      )}

      {step === 3 &&
        (!agreement?.published ? (
          <p className="rounded-2xl border border-brand-line p-4 text-sm">The agreement is being finalised. You will be able to sign it here soon.</p>
        ) : (
          <CreatorAgreementForm
            title={agreement.title}
            version={String(agreement.current_version)}
            blocks={creatorAgreementBlocks(parseBlocks(agreement.content), "ugc")}
            merge={{ legal_name: me.full_name, country: me.country, email: me.email, track: TRACK_LABEL.ugc }}
            onSign={async (signedName) => {
              try {
                await sign({ data: { signedName, documentVersion: String(agreement.current_version), userAgent: navigator.userAgent.slice(0, 400) } });
                toast.success("Agreement signed.");
                reload();
              } catch (e: any) {
                toast.error(e?.message ?? "The signature could not be recorded.");
              }
            }}
          />
        ))}
    </div>
  );
}
