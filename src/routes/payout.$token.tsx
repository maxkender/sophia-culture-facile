import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getPosterPayout, savePosterPayout, startPosterStripe } from "@/lib/slideshows.functions";

const T = {
  en: { title: "How do you want to be paid?", lead: "Paid every week in US dollars. Choose one method.", stripe: "Bank account via Stripe", stripeDone: "Stripe is set up. You're all done.", wise: "Wise email", paypal: "PayPal email", save: "Save", saved: "Saved. Thank you!", invalid: "This link has expired. Ask your hiring manager for a new one.", current: "Current method" },
  fr: { title: "Comment voulez-vous être payé·e ?", lead: "Paiement chaque semaine en dollars US. Choisissez un moyen.", stripe: "Compte bancaire via Stripe", stripeDone: "Stripe est configuré. C'est terminé.", wise: "E-mail Wise", paypal: "E-mail PayPal", save: "Enregistrer", saved: "Enregistré. Merci !", invalid: "Ce lien a expiré. Demandez-en un nouveau à votre responsable.", current: "Moyen actuel" },
  es: { title: "¿Cómo quieres cobrar?", lead: "Pago semanal en dólares estadounidenses. Elige un método.", stripe: "Cuenta bancaria con Stripe", stripeDone: "Stripe está configurado. Listo.", wise: "Email de Wise", paypal: "Email de PayPal", save: "Guardar", saved: "Guardado. ¡Gracias!", invalid: "Este enlace ha caducado. Pide uno nuevo a tu responsable.", current: "Método actual" },
  it: { title: "Come vuoi essere pagato?", lead: "Pagamento settimanale in dollari USA. Scegli un metodo.", stripe: "Conto bancario con Stripe", stripeDone: "Stripe è configurato. Fatto.", wise: "Email Wise", paypal: "Email PayPal", save: "Salva", saved: "Salvato. Grazie!", invalid: "Questo link è scaduto. Chiedine uno nuovo al tuo responsabile.", current: "Metodo attuale" },
  pt: { title: "Como queres receber?", lead: "Pagamento semanal em dólares americanos. Escolhe um método.", stripe: "Conta bancária via Stripe", stripeDone: "Stripe configurado. Está feito.", wise: "Email Wise", paypal: "Email PayPal", save: "Guardar", saved: "Guardado. Obrigado!", invalid: "Este link expirou. Pede um novo ao teu responsável.", current: "Método atual" },
  de: { title: "Wie möchtest du bezahlt werden?", lead: "Wöchentliche Zahlung in US-Dollar. Wähle eine Methode.", stripe: "Bankkonto über Stripe", stripeDone: "Stripe ist eingerichtet. Fertig.", wise: "Wise-E-Mail", paypal: "PayPal-E-Mail", save: "Speichern", saved: "Gespeichert. Danke!", invalid: "Dieser Link ist abgelaufen. Bitte deinen Manager um einen neuen.", current: "Aktuelle Methode" },
};

export const Route = createFileRoute("/payout/$token")({
  head: () => ({ meta: [
    { title: "Payout method | Sophia" }, { name: "description", content: "Choose how you receive your weekly Sophia poster payments." },
    { property: "og:title", content: "Payout method | Sophia" }, { property: "og:description", content: "Choose how you receive your weekly Sophia poster payments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: PayoutPage,
});

type State = Awaited<ReturnType<typeof getPosterPayout>>;

function PayoutPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getPosterPayout); const save = useServerFn(savePosterPayout); const stripe = useServerFn(startPosterStripe);
  const [st, setSt] = useState<State | null>(null);
  const [method, setMethod] = useState<"wise" | "paypal">("wise");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void load({ data: { token } }).then(setSt).catch(() => setSt({ state: "invalid" })); }, [token, load]);
  const t = T[(st?.state === "ready" ? st.lang : "en") as keyof typeof T] ?? T.en;
  if (!st) return <main className="min-h-screen bg-brand-surface" />;
  if (st.state !== "ready") return <main className="flex min-h-screen items-center justify-center bg-brand-surface p-6 text-center text-brand-navy"><p>{T.en.invalid}</p></main>;
  return (
    <main className="min-h-screen bg-brand-surface px-5 py-12">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-brand-line bg-card p-6">
        <h1 className="text-2xl font-extrabold text-brand-navy">{t.title}</h1>
        <p className="text-sm text-brand-navySoft">{st.name} — {t.lead}</p>
        {st.method ? <p className="text-sm">{t.current}: <b>{st.method}</b></p> : null}
        {st.stripeOnboarded ? <p className="font-semibold text-portal-green">{t.stripeDone}</p> : (
          <Button className="w-full" disabled={busy} onClick={async () => { setBusy(true); try { const r = await stripe({ data: { token } }); window.location.href = r.url; } catch (e) { setMsg((e as Error).message); setBusy(false); } }}>{t.stripe}</Button>
        )}
        <div className="space-y-2 border-t border-brand-line pt-4">
          <div className="flex gap-2">{(["wise", "paypal"] as const).map((m) => <Button key={m} type="button" variant={method === m ? "default" : "outline"} size="sm" onClick={() => setMethod(m)}>{m === "wise" ? "Wise" : "PayPal"}</Button>)}</div>
          <input type="email" aria-label={method === "wise" ? t.wise : t.paypal} placeholder={method === "wise" ? t.wise : t.paypal} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border px-3" />
          <Button variant="outline" disabled={busy || !/^\S+@\S+\.\S+$/.test(email)} onClick={async () => { setBusy(true); try { await save({ data: { token, method, email } }); setMsg(t.saved); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } }}>{t.save}</Button>
        </div>
        {msg ? <p role="status" className="text-sm font-semibold text-brand-navy">{msg}</p> : null}
      </div>
    </main>
  );
}
