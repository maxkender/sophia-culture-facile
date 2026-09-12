import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, FileSignature, UsersRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSIGNMENT_LABEL, CATEGORY_LABEL } from "./AssignmentsPage";
import { formatAmount, PAYMENT_KIND_LABEL } from "./PaymentsPage";

type Profile = Tables<"profiles">;
type Topic = Tables<"topics">;
type Assignment = Tables<"assignments">;
type Application = Tables<"topic_applications">;
type Payment = Tables<"payments">;
type Signature = Tables<"contract_signatures">;
type Details = Tables<"author_payment_details">;

export function AdminWorkspace() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [details, setDetails] = useState<Details[]>([]);
  const [assignForm, setAssignForm] = useState({ topic_id: "", teacher_id: "", deadline: "", brief: "" });
  const [paymentForm, setPaymentForm] = useState({ teacher_id: "", label: "", kind: "acompte", amount: "", due_date: "" });

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const admin = roles?.some((item) => item.role === "admin") ?? false;
    setIsAdmin(admin);
    if (!admin) { setLoading(false); return; }
    const [p, t, a, ap, pay, sig, det] = await Promise.all([
      supabase.from("profiles").select("*").order("last_name"),
      supabase.from("topics").select("*").order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }),
      supabase.from("topic_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("contract_signatures").select("*"),
      supabase.from("author_payment_details").select("*"),
    ]);
    setProfiles(p.data ?? []); setTopics(t.data ?? []); setAssignments(a.data ?? []); setApplications(ap.data ?? []);
    setPayments(pay.data ?? []); setSignatures(sig.data ?? []); setDetails(det.data ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const teacherName = (id: string) => { const p = profiles.find((x) => x.id === id); return p ? `${p.first_name} ${p.last_name}` : "Professeur"; };
  const topicTitle = (id: string) => topics.find((x) => x.id === id)?.title ?? "Sujet";
  const approvedTopics = topics.filter((t) => t.status === "approved");

  async function createAssignment(event: FormEvent) {
    event.preventDefault();
    if (!assignForm.topic_id || !assignForm.teacher_id) { toast.error("Choisissez un sujet et un professeur."); return; }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("assignments").insert({
      topic_id: assignForm.topic_id,
      teacher_id: assignForm.teacher_id,
      deadline: assignForm.deadline || null,
      brief: assignForm.brief.trim() || null,
      created_by: auth.user?.id ?? null,
    });
    if (error) { toast.error("L’attribution n’a pas pu être créée."); return; }
    setAssignForm({ topic_id: "", teacher_id: "", deadline: "", brief: "" });
    toast.success("Cours attribué."); await load();
  }

  async function reviewApplication(item: Application, status: "accepted" | "rejected") {
    const { error } = await supabase.from("topic_applications").update({ status }).eq("id", item.id);
    if (error) { toast.error("La décision n’a pas pu être enregistrée."); return; }
    if (status === "accepted") {
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("assignments").insert({ topic_id: item.topic_id, teacher_id: item.teacher_id, created_by: auth.user?.id ?? null });
    }
    await load();
  }

  async function createPayment(event: FormEvent) {
    event.preventDefault();
    const amount = Math.round(Number(paymentForm.amount.replace(",", ".")) * 100);
    if (!paymentForm.teacher_id || !paymentForm.label.trim() || !Number.isFinite(amount) || amount <= 0) { toast.error("Professeur, libellé et montant sont requis."); return; }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      teacher_id: paymentForm.teacher_id,
      label: paymentForm.label.trim(),
      kind: paymentForm.kind as Payment["kind"],
      amount_cents: amount,
      due_date: paymentForm.due_date || null,
      created_by: auth.user?.id ?? null,
    });
    if (error) { toast.error("Le paiement n’a pas pu être créé."); return; }
    setPaymentForm({ teacher_id: "", label: "", kind: "acompte", amount: "", due_date: "" });
    toast.success("Paiement enregistré."); await load();
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("payments").update({ status: "paye", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Le paiement n’a pas pu être mis à jour."); return; }
    await load();
  }

  if (loading) return <><WorkspaceHeader /><main className="px-5 py-12 text-center">Chargement…</main></>;
  if (!isAdmin) return <><WorkspaceHeader /><main className="mx-auto max-w-xl px-5 py-16 text-center"><h1 className="text-2xl font-extrabold text-brand-navy">Accès réservé à l’équipe Sophia</h1></main></>;

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const duePayments = payments.filter((p) => p.status === "a_venir").reduce((s, p) => s + p.amount_cents, 0);

  return (
    <>
      <WorkspaceHeader />
      <main className="bg-brand-surface px-5 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">Administration</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-5xl">Vue d’ensemble</h1>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <Stat icon={UsersRound} value={String(profiles.length)} label="Professeurs" />
            <Stat icon={BookOpen} value={String(assignments.filter((a) => a.status !== "termine" && a.status !== "annule").length)} label="Cours en cours" />
            <Stat icon={FileSignature} value={String(signatures.length)} label="Contrats signés" />
            <Stat icon={Wallet} value={formatAmount(duePayments)} label="Paiements à venir" />
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <section>
              <h2 className="text-xl font-extrabold text-brand-navy">Attribuer un cours</h2>
              <form onSubmit={createAssignment} className="mt-4 space-y-4 rounded-lg border border-brand-line bg-card p-5">
                <div className="space-y-2"><Label>Sujet</Label>
                  <Select value={assignForm.topic_id} onValueChange={(v) => setAssignForm((s) => ({ ...s, topic_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un sujet validé" /></SelectTrigger>
                    <SelectContent>{approvedTopics.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Professeur</Label>
                  <Select value={assignForm.teacher_id} onValueChange={(v) => setAssignForm((s) => ({ ...s, teacher_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un professeur" /></SelectTrigger>
                    <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="deadline">Date limite</Label><Input id="deadline" type="date" value={assignForm.deadline} onChange={(e) => setAssignForm((s) => ({ ...s, deadline: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="brief">Consigne</Label><Textarea id="brief" maxLength={1000} value={assignForm.brief} onChange={(e) => setAssignForm((s) => ({ ...s, brief: e.target.value }))} /></div>
                <Button type="submit" size="sm">Attribuer</Button>
              </form>

              <h2 className="mt-10 text-xl font-extrabold text-brand-navy">Candidatures</h2>
              <div className="mt-4 space-y-3">
                {pendingApplications.length ? pendingApplications.map((item) => (
                  <article key={item.id} className="rounded-lg border border-brand-line bg-card p-5">
                    <p className="font-bold text-brand-navy">{teacherName(item.teacher_id)} → {topicTitle(item.topic_id)}</p>
                    {item.message ? <p className="mt-2 text-sm text-brand-navySoft">{item.message}</p> : null}
                    <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => reviewApplication(item, "accepted")}>Accepter</Button><Button size="sm" variant="outline" onClick={() => reviewApplication(item, "rejected")}>Refuser</Button></div>
                  </article>
                )) : <Empty text="Aucune candidature en attente." />}
              </div>

              <h2 className="mt-10 text-xl font-extrabold text-brand-navy">Cours attribués</h2>
              <div className="mt-4 space-y-3">
                {assignments.length ? assignments.map((item) => (
                  <article key={item.id} className="rounded-lg border border-brand-line bg-card p-5">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-brand-pink">{CATEGORY_LABEL[topics.find((t) => t.id === item.topic_id)?.category ?? ""] ?? "Sujet"}</p>
                    <p className="mt-1 font-bold text-brand-navy">{topicTitle(item.topic_id)}</p>
                    <p className="mt-1 text-sm text-brand-navySoft">{teacherName(item.teacher_id)} · {ASSIGNMENT_LABEL[item.status] ?? item.status}{item.deadline ? ` · ${new Date(item.deadline).toLocaleDateString("fr-FR")}` : ""}</p>
                  </article>
                )) : <Empty text="Aucun cours attribué." />}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-brand-navy">Enregistrer un paiement</h2>
              <form onSubmit={createPayment} className="mt-4 space-y-4 rounded-lg border border-brand-line bg-card p-5">
                <div className="space-y-2"><Label>Professeur</Label>
                  <Select value={paymentForm.teacher_id} onValueChange={(v) => setPaymentForm((s) => ({ ...s, teacher_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un professeur" /></SelectTrigger>
                    <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="pay-label">Libellé</Label><Input id="pay-label" value={paymentForm.label} onChange={(e) => setPaymentForm((s) => ({ ...s, label: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={paymentForm.kind} onValueChange={(v) => setPaymentForm((s) => ({ ...s, kind: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="acompte">Acompte</SelectItem><SelectItem value="solde">Solde</SelectItem><SelectItem value="complement">Complément</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="pay-amount">Montant (€)</Label><Input id="pay-amount" inputMode="decimal" value={paymentForm.amount} onChange={(e) => setPaymentForm((s) => ({ ...s, amount: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="pay-due">Échéance</Label><Input id="pay-due" type="date" value={paymentForm.due_date} onChange={(e) => setPaymentForm((s) => ({ ...s, due_date: e.target.value }))} /></div>
                <Button type="submit" size="sm">Enregistrer</Button>
              </form>

              <h2 className="mt-10 text-xl font-extrabold text-brand-navy">Paiements</h2>
              <div className="mt-4">
                {payments.length ? payments.map((item) => (
                  <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line py-4">
                    <div><p className="font-bold text-brand-navy">{item.label}</p><p className="text-sm text-brand-navySoft">{teacherName(item.teacher_id)} · {PAYMENT_KIND_LABEL[item.kind] ?? item.kind}</p></div>
                    <div className="flex items-center gap-3"><span className="font-extrabold text-brand-navy">{formatAmount(item.amount_cents)}</span>{item.status === "paye" ? <span className="text-sm text-brand-navySoft">Payé</span> : <Button size="sm" variant="outline" onClick={() => markPaid(item.id)}>Marquer payé</Button>}</div>
                  </article>
                )) : <Empty text="Aucun paiement enregistré." />}
              </div>

              <h2 className="mt-10 text-xl font-extrabold text-brand-navy">Professeurs</h2>
              <div className="mt-4 space-y-3">
                {profiles.map((item) => (
                  <article key={item.id} className="rounded-lg border border-brand-line bg-card p-5">
                    <p className="font-bold text-brand-navy">{item.first_name} {item.last_name}</p>
                    <p className="mt-1 text-sm text-brand-navySoft">{item.email} · {item.subject_taught} · {item.teaching_level}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {signatures.some((s) => s.user_id === item.id) ? "Contrat signé" : "Contrat non signé"} · {details.some((d) => d.user_id === item.id) ? "Coordonnées de paiement renseignées" : "Coordonnées manquantes"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof BookOpen; value: string; label: string }) { return <div className="rounded-lg border border-brand-line bg-card p-5"><Icon className="size-5 text-brand-pink" /><p className="mt-3 text-2xl font-extrabold text-brand-navy">{value}</p><p className="text-sm text-brand-navySoft">{label}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-brand-line p-5 text-sm text-brand-navySoft">{text}</p>; }
