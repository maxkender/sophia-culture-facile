import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, CheckCircle2, Clock3, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ensureAdminRole } from "@/lib/admin.functions";

const CATEGORIES = [
  { value: "histoire", label: "Histoire" },
  { value: "science", label: "Science" },
  { value: "litterature", label: "Littérature" },
  { value: "art", label: "Art" },
  { value: "mythologie", label: "Mythologie" },
  { value: "geopolitique", label: "Géopolitique" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];
const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

type Topic = Tables<"topics">;
type Submission = Tables<"course_submissions">;
type Profile = Tables<"profiles">;

export function ContributionDashboard() {
  const ensureAdmin = useServerFn(ensureAdminRole);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [proposal, setProposal] = useState<{ title: string; description: string; category: Category }>({ title: "", description: "", category: "histoire" });

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    await ensureAdmin();
    const [{ data: roles }, { data: ownProfile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);
    const admin = roles?.some((item) => item.role === "admin") ?? false;
    setIsAdmin(admin);
    setProfile(ownProfile ?? undefined);
    const topicQuery = supabase.from("topics").select("*").order("created_at", { ascending: false });
    const submissionQuery = supabase.from("course_submissions").select("*").order("updated_at", { ascending: false });
    const [topicResult, submissionResult, profileResult] = await Promise.all([topicQuery, submissionQuery, admin ? supabase.from("profiles").select("*").order("last_name") : Promise.resolve({ data: [] as Profile[] })]);
    setTopics(topicResult.data ?? []); setSubmissions(submissionResult.data ?? []); setProfiles(profileResult.data ?? []); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function propose(event: FormEvent) {
    event.preventDefault();
    if (proposal.title.trim().length < 3) { toast.error("Le titre doit contenir au moins 3 caractères."); return; }
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    const { error } = await supabase.from("topics").insert({ title: proposal.title.trim(), description: proposal.description.trim() || null, category: proposal.category, language: profile?.language ?? "fr", proposed_by: user.id, status: isAdmin ? "approved" : "pending" });
    if (error) { toast.error(isAdmin ? "Le sujet n’a pas pu être créé." : "La proposition n’a pas pu être envoyée."); return; }
    setProposal({ title: "", description: "", category: "histoire" }); toast.success(isAdmin ? "Sujet créé et publié." : "Sujet envoyé pour validation."); await load();
  }

  async function reviewTopic(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("topics").update({ status }).eq("id", id);
    if (error) { toast.error("La décision n’a pas pu être enregistrée."); return; }
    await load();
  }

  if (loading) return <><WorkspaceHeader /><main className="px-5 py-12 text-center">Chargement…</main></>;
  if (!profile && !isAdmin) return <><WorkspaceHeader /><main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-3xl font-extrabold text-brand-navy">Complétez d’abord votre profil</h1><p className="mt-3 text-brand-navySoft">Votre identité professionnelle est obligatoire avant de proposer un sujet.</p><Button asChild variant="pillPink" size="pillSm" className="mt-7"><Link to="/profil-enseignant">Compléter mon profil</Link></Button></main></>;

  const approved = topics.filter((topic) => topic.status === "approved");
  const pending = topics.filter((topic) => topic.status === "pending");
  return <><WorkspaceHeader /><main className="bg-brand-surface px-5 py-10"><div className="mx-auto w-full max-w-6xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">{isAdmin ? "Administration" : "Espace professeur"}</p><h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-5xl">{isAdmin ? "Validation du contenu" : `Bonjour${profile ? ` ${profile.first_name}` : ""}`}</h1><p className="mt-3 text-brand-navySoft">{isAdmin ? "Consultez les enseignants, les sujets proposés et les cours soumis." : "Choisissez un sujet validé ou proposez-en un nouveau à l’équipe Sophia."}</p>
  <div className="mt-10 grid gap-4 sm:grid-cols-3"><Stat icon={BookOpen} value={approved.length} label="Sujets validés" /><Stat icon={Clock3} value={pending.length} label="En attente" /><Stat icon={isAdmin ? UsersRound : CheckCircle2} value={isAdmin ? profiles.length : submissions.length} label={isAdmin ? "Professeurs" : "Mes cours"} /></div>
  {isAdmin ? <div className="mt-12 grid gap-10 lg:grid-cols-2"><section><h2 className="text-xl font-extrabold text-brand-navy">Sujets à valider</h2><div className="mt-4 space-y-3">{pending.length ? pending.map((topic) => <article key={topic.id} className="rounded-lg border border-brand-line bg-card p-5"><h3 className="font-bold text-brand-navy">{topic.title}</h3>{topic.description ? <p className="mt-2 text-sm text-brand-navySoft">{topic.description}</p> : null}<div className="mt-4 flex gap-2"><Button size="sm" onClick={() => reviewTopic(topic.id, "approved")}>Valider</Button><Button size="sm" variant="outline" onClick={() => reviewTopic(topic.id, "rejected")}>Refuser</Button></div></article>) : <Empty text="Aucun sujet en attente." />}</div></section><section><h2 className="text-xl font-extrabold text-brand-navy">Professeurs inscrits</h2><div className="mt-4 space-y-3">{profiles.map((item) => <article key={item.id} className="rounded-lg border border-brand-line bg-card p-5"><p className="font-bold text-brand-navy">{item.first_name} {item.last_name}</p><p className="mt-1 text-sm text-brand-navySoft">{item.email} · {item.subject_taught} · {item.teaching_level}</p><p className="mt-1 text-xs text-muted-foreground">{item.study_country} · {item.language.toUpperCase()}</p></article>)}</div></section><section className="lg:col-span-2"><h2 className="text-xl font-extrabold text-brand-navy">Cours soumis</h2><div className="mt-4">{submissions.length ? submissions.map((item) => <article key={item.id} className="border-b border-brand-line py-4"><p className="font-bold text-brand-navy">{item.title || "Cours sans titre"}</p><p className="text-sm text-brand-navySoft">Statut : {item.status}</p></article>) : <Empty text="Aucun cours soumis pour le moment." />}</div></section></div> : <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]"><section><h2 className="text-xl font-extrabold text-brand-navy">Sujets disponibles</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{approved.length ? approved.map((topic) => <article key={topic.id} className="rounded-lg border border-brand-line bg-card p-5"><h3 className="font-bold text-brand-navy">{topic.title}</h3>{topic.description ? <p className="mt-2 text-sm text-brand-navySoft">{topic.description}</p> : null}<Button disabled className="mt-5" size="sm">Rédiger bientôt</Button></article>) : <Empty text="Aucun sujet validé pour le moment." />}</div></section><section><h2 className="text-xl font-extrabold text-brand-navy">Proposer un sujet</h2><form onSubmit={propose} className="mt-4 space-y-4 rounded-lg border border-brand-line bg-card p-5"><div className="space-y-2"><Label htmlFor="topic-title">Titre</Label><Input id="topic-title" required minLength={3} maxLength={160} value={proposal.title} onChange={(e) => setProposal((v) => ({ ...v, title: e.target.value }))} /></div><div className="space-y-2"><Label htmlFor="topic-description">Description</Label><Textarea id="topic-description" maxLength={1000} value={proposal.description} onChange={(e) => setProposal((v) => ({ ...v, description: e.target.value }))} /></div><Button type="submit" size="sm"><Plus className="size-4" />Envoyer à l’équipe</Button></form></section></div>}</div></main></>;
}

function Stat({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) { return <div className="rounded-lg border border-brand-line bg-card p-5"><Icon className="size-5 text-brand-pink" /><p className="mt-3 text-3xl font-extrabold text-brand-navy">{value}</p><p className="text-sm text-brand-navySoft">{label}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-brand-line p-5 text-sm text-brand-navySoft">{text}</p>; }