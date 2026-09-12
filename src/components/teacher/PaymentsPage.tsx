import { useEffect, useState, type FormEvent } from "react";
import { Banknote, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Payment = Tables<"payments">;
type Details = Tables<"author_payment_details">;

export const formatAmount = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
export const PAYMENT_KIND_LABEL: Record<string, string> = { acompte: "Acompte", solde: "Solde", complement: "Complément" };

type Form = { legal_name: string; address: string; legal_status: "droits_auteur" | "independant"; siret: string; iban: string; bic: string };
const EMPTY: Form = { legal_name: "", address: "", legal_status: "droits_auteur", siret: "", iban: "", bic: "" };

export function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [hasDetails, setHasDetails] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const [{ data: details }, { data: rows }] = await Promise.all([
        supabase.from("author_payment_details").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("payments").select("*").eq("teacher_id", user.id).order("due_date", { ascending: true }),
      ]);
      if (details) { setHasDetails(true); setForm(toForm(details)); }
      setPayments(rows ?? []);
      setLoading(false);
    })();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) { setSaving(false); return; }
    const payload = {
      user_id: user.id,
      legal_name: form.legal_name.trim(),
      address: form.address.trim(),
      legal_status: form.legal_status,
      siret: form.siret.trim() || null,
      iban: form.iban.replace(/\s+/g, "").toUpperCase(),
      bic: form.bic.trim().toUpperCase() || null,
    };
    const { error } = hasDetails
      ? await supabase.from("author_payment_details").update(payload).eq("user_id", user.id)
      : await supabase.from("author_payment_details").insert(payload);
    setSaving(false);
    if (error) { toast.error("Les coordonnées n’ont pas pu être enregistrées."); return; }
    setHasDetails(true);
    toast.success("Coordonnées de paiement enregistrées.");
  }

  const due = payments.filter((p) => p.status === "a_venir").reduce((sum, p) => sum + p.amount_cents, 0);
  const paid = payments.filter((p) => p.status === "paye").reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <>
      <WorkspaceHeader />
      <main className="bg-brand-surface px-5 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">Paiements</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-4xl">Vos rémunérations</h1>
          <p className="mt-3 text-brand-navySoft">Suivez vos acomptes et vos soldes, et tenez vos coordonnées de paiement à jour.</p>

          {loading ? <p className="mt-8 text-brand-navySoft">Chargement…</p> : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-brand-line bg-card p-5"><Banknote className="size-5 text-brand-pink" /><p className="mt-3 text-3xl font-extrabold text-brand-navy">{formatAmount(due)}</p><p className="text-sm text-brand-navySoft">À venir</p></div>
                <div className="rounded-lg border border-brand-line bg-card p-5"><Banknote className="size-5 text-brand-pink" /><p className="mt-3 text-3xl font-extrabold text-brand-navy">{formatAmount(paid)}</p><p className="text-sm text-brand-navySoft">Déjà versé</p></div>
              </div>

              <section className="mt-10">
                <h2 className="text-xl font-extrabold text-brand-navy">Historique</h2>
                <div className="mt-4">
                  {payments.length ? payments.map((item) => (
                    <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line py-4">
                      <div>
                        <p className="font-bold text-brand-navy">{item.label}</p>
                        <p className="text-sm text-brand-navySoft">{PAYMENT_KIND_LABEL[item.kind] ?? item.kind}{item.due_date ? ` · échéance ${new Date(item.due_date).toLocaleDateString("fr-FR")}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-brand-navy">{formatAmount(item.amount_cents)}</p>
                        <p className="text-sm text-brand-navySoft">{item.status === "paye" ? `Payé${item.paid_at ? ` le ${new Date(item.paid_at).toLocaleDateString("fr-FR")}` : ""}` : "À venir"}</p>
                      </div>
                    </article>
                  )) : <p className="rounded-lg border border-dashed border-brand-line p-5 text-sm text-brand-navySoft">Aucun paiement enregistré pour le moment.</p>}
                </div>
              </section>

              <section className="mt-10">
                <h2 className="text-xl font-extrabold text-brand-navy">Coordonnées de paiement</h2>
                <form onSubmit={save} className="mt-4 grid gap-4 rounded-lg border border-brand-line bg-card p-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="legal-name">Nom légal</Label><Input id="legal-name" required value={form.legal_name} onChange={(e) => setForm((v) => ({ ...v, legal_name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Statut</Label>
                    <Select value={form.legal_status} onValueChange={(next) => setForm((v) => ({ ...v, legal_status: next as Form["legal_status"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="droits_auteur">Droits d’auteur (précompte)</SelectItem><SelectItem value="independant">Indépendant (facturation)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Adresse postale</Label><Input id="address" required value={form.address} onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="siret">SIRET (si indépendant)</Label><Input id="siret" value={form.siret} onChange={(e) => setForm((v) => ({ ...v, siret: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="bic">BIC</Label><Input id="bic" value={form.bic} onChange={(e) => setForm((v) => ({ ...v, bic: e.target.value }))} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="iban">IBAN</Label><Input id="iban" required value={form.iban} onChange={(e) => setForm((v) => ({ ...v, iban: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Button type="submit" size="sm" disabled={saving}><Save className="size-4" />{saving ? "Enregistrement…" : "Enregistrer"}</Button></div>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function toForm(details: Details): Form {
  return {
    legal_name: details.legal_name,
    address: details.address,
    legal_status: details.legal_status,
    siret: details.siret ?? "",
    iban: details.iban,
    bic: details.bic ?? "",
  };
}
