import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PUBLISHER, CONTRACT_VERSION } from "@/config/publisher";
import { CONTRACT_SECTIONS, CONTRACT_SUBTITLE, CONTRACT_TITLE } from "@/content/contract";

type Signature = Tables<"contract_signatures">;

const dateFmt = (value: string) => new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export function ContractPage() {
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<Signature>();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const [{ data: sig }, { data: profile }] = await Promise.all([
        supabase.from("contract_signatures").select("*").eq("user_id", user.id).eq("contract_version", CONTRACT_VERSION).maybeSingle(),
        supabase.from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle(),
      ]);
      setSignature(sig ?? undefined);
      if (profile) setName(`${profile.first_name} ${profile.last_name}`);
      setLoading(false);
    })();
  }, []);

  async function sign(event: FormEvent) {
    event.preventDefault();
    if (!accepted) { toast.error("Cochez la mention « lu et approuvé » pour signer."); return; }
    if (name.trim().length < 3) { toast.error("Saisissez votre nom complet."); return; }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase
      .from("contract_signatures")
      .insert({ user_id: user.id, contract_version: CONTRACT_VERSION, signed_name: name.trim(), accepted: true })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("La signature n’a pas pu être enregistrée."); return; }
    setSignature(data);
    toast.success("Contrat signé. Une copie reste consultable ici.");
  }

  return (
    <>
      <WorkspaceHeader />
      <main className="bg-brand-surface px-5 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">Contrats</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-4xl">{CONTRACT_TITLE}</h1>
          <p className="mt-2 text-brand-navySoft">{CONTRACT_SUBTITLE}</p>

          <div className="mt-6 rounded-lg border border-brand-line bg-card p-5 text-sm text-brand-navySoft">
            <p className="font-bold text-brand-navy">{PUBLISHER.name} ({PUBLISHER.legalForm})</p>
            <p className="mt-1">Siège social : {PUBLISHER.address}</p>
            <p>SIREN {PUBLISHER.siren} · SIRET {PUBLISHER.siret} · TVA {PUBLISHER.vat}</p>
            <p>Capital social {PUBLISHER.capital} · RCS {PUBLISHER.rcsCity} · APE {PUBLISHER.ape}</p>
            <p>Représentée par {PUBLISHER.director}, Président</p>
          </div>

          {loading ? <p className="mt-8 text-brand-navySoft">Chargement…</p> : null}

          <article className="mt-8 space-y-7">
            {CONTRACT_SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-extrabold text-brand-navy">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-2 text-sm leading-relaxed text-brand-navySoft">{paragraph}</p>
                ))}
              </section>
            ))}
          </article>

          {!loading && signature ? (
            <div className="mt-10 flex items-start gap-3 rounded-lg border border-brand-line bg-card p-5">
              <CheckCircle2 className="mt-0.5 size-5 text-brand-pink" />
              <div>
                <p className="font-bold text-brand-navy">Contrat signé</p>
                <p className="mt-1 text-sm text-brand-navySoft">Signé par {signature.signed_name} le {dateFmt(signature.signed_at)} — version {signature.contract_version}.</p>
              </div>
            </div>
          ) : null}

          {!loading && !signature ? (
            <form onSubmit={sign} className="mt-10 space-y-4 rounded-lg border border-brand-line bg-card p-5">
              <h2 className="text-lg font-extrabold text-brand-navy">Signer le contrat</h2>
              <div className="space-y-2">
                <Label htmlFor="signed-name">Nom et prénom</Label>
                <Input id="signed-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={120} />
              </div>
              <label className="flex items-start gap-3 text-sm text-brand-navySoft">
                <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
                <span>Lu et approuvé. Je reconnais avoir pris connaissance de l’intégralité du contrat et j’en accepte les termes.</span>
              </label>
              <Button type="submit" size="sm" disabled={saving}><FileSignature className="size-4" />{saving ? "Signature…" : "Signer le contrat"}</Button>
            </form>
          ) : null}
        </div>
      </main>
    </>
  );
}
