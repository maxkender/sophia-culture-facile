import { useEffect, useState } from "react";
import { CalendarClock, PenLine, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Assignment = Tables<"assignments">;
type Topic = Tables<"topics">;
type Application = Tables<"topic_applications">;

export const ASSIGNMENT_LABEL: Record<string, string> = { attribue: "Attribué", en_cours: "En cours de rédaction", soumis: "Soumis à validation", termine: "Terminé", annule: "Annulé" };
export const CATEGORY_LABEL: Record<string, string> = { histoire: "Histoire", science: "Science", litterature: "Littérature", art: "Art", mythologie: "Mythologie", geopolitique: "Géopolitique" };

export function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    const [{ data: rows }, { data: topicRows }, { data: appRows }] = await Promise.all([
      supabase.from("assignments").select("*").eq("teacher_id", user.id).order("deadline", { ascending: true }),
      supabase.from("topics").select("*").eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("topic_applications").select("*").eq("teacher_id", user.id),
    ]);
    setAssignments(rows ?? []); setTopics(topicRows ?? []); setApplications(appRows ?? []); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const topicById = (id: string) => topics.find((t) => t.id === id);

  async function updateStatus(id: string, status: Assignment["status"]) {
    const { error } = await supabase.from("assignments").update({ status }).eq("id", id);
    if (error) { toast.error("Le statut n’a pas pu être mis à jour."); return; }
    toast.success("Statut mis à jour."); await load();
  }

  async function apply(topicId: string) {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    const { error } = await supabase.from("topic_applications").insert({ topic_id: topicId, teacher_id: user.id, message: (messages[topicId] ?? "").trim() || null, status: "pending" });
    if (error) { toast.error("La candidature n’a pas pu être envoyée."); return; }
    toast.success("Candidature envoyée à l’équipe Sophia."); await load();
  }

  const assignedTopicIds = new Set(assignments.map((a) => a.topic_id));
  const appliedTopicIds = new Set(applications.map((a) => a.topic_id));
  const openTopics = topics.filter((t) => !assignedTopicIds.has(t.id));

  return (
    <>
      <WorkspaceHeader />
      <main className="bg-brand-surface px-5 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">Rédaction</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-4xl">Mes cours à rédiger</h1>
          <p className="mt-3 text-brand-navySoft">Les cours qui vous sont confiés par l’équipe Sophia, et les sujets sur lesquels vous pouvez vous porter volontaire.</p>

          {loading ? <p className="mt-8 text-brand-navySoft">Chargement…</p> : (
            <>
              <section className="mt-10">
                <h2 className="text-xl font-extrabold text-brand-navy">Cours attribués</h2>
                <div className="mt-4 space-y-3">
                  {assignments.length ? assignments.map((item) => {
                    const topic = topicById(item.topic_id);
                    return (
                      <article key={item.id} className="rounded-lg border border-brand-line bg-card p-5">
                        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-pink">{topic ? CATEGORY_LABEL[topic.category] ?? topic.category : "Sujet"}</p>
                        <h3 className="mt-1 font-bold text-brand-navy">{topic?.title ?? "Sujet attribué"}</h3>
                        {item.brief ? <p className="mt-2 text-sm text-brand-navySoft">{item.brief}</p> : null}
                        <p className="mt-3 flex items-center gap-2 text-sm text-brand-navySoft"><CalendarClock className="size-4" />{item.deadline ? `À rendre le ${new Date(item.deadline).toLocaleDateString("fr-FR")}` : "Sans date limite"} · {ASSIGNMENT_LABEL[item.status] ?? item.status}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.status === "attribue" ? <Button size="sm" onClick={() => updateStatus(item.id, "en_cours")}><PenLine className="size-4" />Commencer la rédaction</Button> : null}
                          {item.status === "en_cours" ? <Button size="sm" onClick={() => updateStatus(item.id, "soumis")}><Send className="size-4" />Soumettre à validation</Button> : null}
                        </div>
                      </article>
                    );
                  }) : <p className="rounded-lg border border-dashed border-brand-line p-5 text-sm text-brand-navySoft">Aucun cours ne vous est attribué pour le moment.</p>}
                </div>
              </section>

              <section className="mt-12">
                <h2 className="text-xl font-extrabold text-brand-navy">Se porter volontaire</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {openTopics.length ? openTopics.map((topic) => {
                    const application = applications.find((a) => a.topic_id === topic.id);
                    return (
                      <article key={topic.id} className="rounded-lg border border-brand-line bg-card p-5">
                        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-pink">{CATEGORY_LABEL[topic.category] ?? topic.category}</p>
                        <h3 className="mt-1 font-bold text-brand-navy">{topic.title}</h3>
                        {topic.description ? <p className="mt-2 text-sm text-brand-navySoft">{topic.description}</p> : null}
                        {appliedTopicIds.has(topic.id) ? (
                          <p className="mt-4 text-sm font-semibold text-brand-navySoft">{application?.status === "accepted" ? "Candidature acceptée." : application?.status === "rejected" ? "Candidature non retenue." : "Candidature envoyée, en attente de réponse."}</p>
                        ) : (
                          <div className="mt-4 space-y-2">
                            <Textarea maxLength={500} placeholder="Quelques mots sur votre angle (facultatif)" value={messages[topic.id] ?? ""} onChange={(e) => setMessages((v) => ({ ...v, [topic.id]: e.target.value }))} />
                            <Button size="sm" onClick={() => apply(topic.id)}>Me porter volontaire</Button>
                          </div>
                        )}
                      </article>
                    );
                  }) : <p className="rounded-lg border border-dashed border-brand-line p-5 text-sm text-brand-navySoft">Aucun sujet disponible actuellement.</p>}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
