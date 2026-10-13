import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { parseBlocks } from "@/lib/documents";
import { acceptUgcGuidelines, signUgcAgreement } from "@/lib/creator-agreement.functions";
import { friendlyCreatorError } from "@/lib/creator-validation";
import { cn } from "@/lib/utils";
import { GuidelinesList } from "../Guidelines";
import { useCreator } from "./useCreator";
import { creatorLang, creatorLocale, L, useCreatorLang } from "@/i18n/creator-app";

/** Signed contract as a print window (Print → Save as PDF). */
export function printSnapshot(text: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><title>Contract</title><pre style="white-space:pre-wrap;font:14px/1.5 Georgia,serif;max-width:720px;margin:40px auto">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`);
  w.document.close(); w.focus(); w.print();
}

/** UGC Creator Agreement: FR or EN version (switchable), full text, checkbox, typed legal name, Sign. */
export function UgcContractScreen() {
  const { me, signature, reload } = useCreator();
  useCreatorLang();
  const [lang, setLang] = useState<"fr" | "en">(creatorLang());
  const slug = lang === "fr" ? "ugc-agreement-fr" : "ugc-agreement";
  const { data: doc } = useQuery({ queryKey: ["creator-doc", slug], queryFn: async () => (await supabase.from("documents").select("title, content, current_version").eq("slug", slug).maybeSingle()).data });
  const { data: snap } = useQuery({
    enabled: Boolean(signature),
    queryKey: ["my-contract", signature?.id],
    queryFn: async () => (await supabase.from("creator_signatures").select("contract_snapshot").eq("id", (signature as { id: string }).id).maybeSingle()).data?.contract_snapshot ?? null,
  });
  const sign = useServerFn(signUgcAgreement);
  const [ok, setOk] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const fr = lang === "fr";
  if (signature) {
    const sl = (signature as { contract_lang?: string | null }).contract_lang ?? "en";
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-brand-navy">{L("My contract", "Mon contrat")}</h1>
        <p className="rounded-xl bg-portal-green/10 p-3 text-sm font-semibold text-brand-navy">{L(`Signed on ${new Date(signature.signed_at).toLocaleDateString(creatorLocale())} (v${signature.document_version}, ${sl.toUpperCase()})`, `Signé le ${new Date(signature.signed_at).toLocaleDateString(creatorLocale())} (v${signature.document_version}, ${sl.toUpperCase()})`)}</p>
        {snap ? <><Button variant="outline" onClick={() => printSnapshot(snap)}>{L("Print / save as PDF", "Imprimer / enregistrer en PDF")}</Button><pre className="whitespace-pre-wrap rounded-2xl border border-brand-line bg-card p-5 font-serif text-sm">{snap}</pre></> : null}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5" data-testid="ugc-contract">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy">{fr ? "Signe ton contrat" : "Sign your agreement"}</h1>
        <span className="ml-auto inline-flex rounded-full border border-brand-line p-1">{(["fr", "en"] as const).map((x) => <button key={x} type="button" aria-pressed={lang === x} onClick={() => setLang(x)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", lang === x ? "bg-brand-navy text-card" : "text-brand-navy")}>{x.toUpperCase()}</button>)}</span>
      </div>
      <p className="text-sm text-brand-navySoft">{fr ? "Lis le contrat en entier, coche la case, écris ton nom légal complet et signe." : "Read the whole agreement, tick the box, type your full legal name and sign."}</p>
      {!doc ? <p className="text-sm text-brand-navySoft">{fr ? "Chargement…" : "Loading…"}</p> : (
        <div className="rounded-2xl border border-brand-line bg-card p-5 sm:p-8">
          <h2 className="text-xl font-extrabold text-brand-navy">{doc.title}</h2>
          <p className="text-xs text-brand-navySoft">Version {doc.current_version}</p>
          <DocumentBody blocks={parseBlocks(doc.content)} merge={{ legal_name: name.trim() || me.full_name, country: me.country, email: me.email } as never} className="mt-5" />
        </div>
      )}
      <div className="space-y-4 rounded-2xl border border-brand-line bg-card p-5">
        <label className="flex items-start gap-3 text-sm font-semibold text-brand-navy"><Checkbox checked={ok} onCheckedChange={(v) => setOk(v === true)} className="mt-0.5" />{fr ? "J'ai lu et j'accepte le contrat" : "I have read and accept the agreement"}</label>
        <div><label htmlFor="legal-name" className="text-sm font-semibold text-brand-navy">{fr ? "Ton nom légal complet" : "Your full legal name"}</label>
          <Input id="legal-name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} className="mt-1 h-11" autoComplete="name" /></div>
        <Button disabled={!ok || name.trim().length < 2 || busy || !doc} onClick={async () => {
          setBusy(true);
          try { await sign({ data: { signedName: name.trim(), lang, accepted: true, userAgent: navigator.userAgent.slice(0, 400) } }); toast.success(fr ? "Contrat signé." : "Agreement signed."); await reload(); }
          catch (e) { toast.error(friendlyCreatorError(e)); }
          setBusy(false);
        }}>{busy ? (fr ? "Signature…" : "Signing…") : (fr ? "Signer" : "Sign")}</Button>
      </div>
    </div>
  );
}

/** One screen after signing: the shooting guidelines and "Got it". */
export function GuidelinesScreen() {
  const { reload } = useCreator();
  useCreatorLang();
  const accept = useServerFn(acceptUgcGuidelines);
  const [busy, setBusy] = useState(false);
  const fr = creatorLang() === "fr";
  return (
    <div className="mx-auto max-w-2xl space-y-5" data-testid="guidelines-screen">
      <h1 className="text-2xl font-extrabold text-brand-navy">{fr ? "Consignes de tournage" : "Shooting guidelines"}</h1>
      <p className="text-sm text-brand-navySoft">{fr ? "Lis ces consignes : elles s'appliquent à chaque vidéo." : "Read these guidelines: they apply to every video."}</p>
      <div className="rounded-2xl border border-brand-line bg-card p-5"><GuidelinesList en={!fr} /></div>
      <Button disabled={busy} onClick={async () => { setBusy(true); try { await accept(); await reload(); } catch (e) { toast.error(friendlyCreatorError(e)); } setBusy(false); }}>{fr ? "J'ai compris" : "Got it"}</Button>
    </div>
  );
}

/** Accueil: a short checklist with the next action highlighted. */
export function UgcHome() {
  const { me, signature, codes, briefs } = useCreator();
  useCreatorLang();
  const first = String(me.full_name ?? "").split(/\s+/)[0];
  const steps = [
    { done: Boolean(signature), label: L("Sign your agreement", "Signe ton contrat"), to: "/creators/app/contract" },
    { done: codes.length > 0, label: L("Get your codes", "Récupère tes codes"), to: "/creators/app/apps" },
    { done: false, label: L("Open your brief → send your draft → post → paste your link", "Ouvre ton brief → envoie ton brouillon → poste → colle ton lien"), to: "/creators/app/briefs" },
  ];
  const next = steps.findIndex((s) => !s.done);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-brand-navy">{L(`Hi ${first}`, `Salut ${first}`)}</h1>
      <p className="text-sm text-brand-navySoft">{L("Follow these steps in order. The highlighted one is next.", "Suis ces étapes dans l'ordre. Celle en surbrillance est la prochaine.")}</p>
      <ol className="space-y-3" data-testid="home-checklist">
        {steps.map((s, i) => (
          <li key={i}>
            <Link to={s.to} className={cn("flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold", i === next ? "border-portal-accent bg-portal-accent/10 text-brand-navy" : "border-brand-line bg-card text-brand-navySoft", s.done && "line-through")}>
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-portal-green text-card" : i === next ? "bg-portal-accent text-card" : "bg-muted")}>{s.done ? "✓" : i + 1}</span>
              {s.label}
            </Link>
          </li>
        ))}
      </ol>
      {!briefs.length ? <p className="text-sm text-brand-navySoft">{L("No brief yet. You'll get a notification when one is published.", "Pas encore de brief. Tu recevras une notification dès qu'il y en a un.")}</p> : null}
    </div>
  );
}
