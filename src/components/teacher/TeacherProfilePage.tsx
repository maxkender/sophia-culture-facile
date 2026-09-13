import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileForm = { firstName: string; lastName: string; language: "fr" | "en"; country: string; subject: string; level: string; institution: string; specialty: string };
const EMPTY: ProfileForm = { firstName: "", lastName: "", language: "fr", country: "", subject: "", level: "", institution: "", specialty: "" };

export function TeacherProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [avatar, setAvatar] = useState<File>();
  const [existingAvatar, setExistingAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("first_name,last_name,language,study_country,avatar_path,subject_taught,teaching_level,institution,specialty").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({ firstName: data.first_name, lastName: data.last_name, language: data.language as "fr" | "en", country: data.study_country, subject: data.subject_taught, level: data.teaching_level, institution: data.institution, specialty: data.specialty });
        setExistingAvatar(data.avatar_path);
      }
      setLoading(false);
    })();
  }, []);

  function update(key: keyof ProfileForm, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = Object.values(form).every((value) => value.trim().length > 0);
    if (!parsed || (!avatar && !existingAvatar)) {
      toast.error("Tous les champs et la photo sont obligatoires.");
      return;
    }
    if (avatar && (!avatar.type.startsWith("image/") || avatar.size > 5 * 1024 * 1024)) {
      toast.error("La photo doit être une image de moins de 5 Mo.");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user || !user.email) { setSaving(false); toast.error("Session expirée."); return; }
    let avatarPath = existingAvatar;
    if (avatar) {
      const extension = avatar.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      avatarPath = `${user.id}/profile.${extension}`;
      const { error } = await supabase.storage.from("teacher-avatars").upload(avatarPath, avatar, { upsert: true, contentType: avatar.type });
      if (error) { setSaving(false); toast.error("La photo n’a pas pu être importée."); return; }
    }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, first_name: form.firstName.trim(), last_name: form.lastName.trim(), language: form.language, study_country: form.country.trim(), avatar_path: avatarPath, subject_taught: form.subject.trim(), teaching_level: form.level.trim(), institution: form.institution.trim(), specialty: form.specialty.trim() });
    setSaving(false);
    if (error) { toast.error("Le profil n’a pas pu être enregistré."); return; }
    toast.success("Profil enregistré.");
    await navigate({ to: "/espace-professeur", replace: true });
  }

  return <><WorkspaceHeader /><main className="bg-brand-surface px-5 py-10"><form onSubmit={submit} className="mx-auto w-full max-w-3xl"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">Certification Sophia</p><h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-4xl">Votre profil enseignant</h1><p className="mt-3 max-w-2xl text-brand-navySoft">Ces informations permettent à l’équipe de vérifier votre expertise et d’attribuer clairement chaque cours.</p></div>{loading ? <p className="mt-10">Chargement…</p> : <div className="mt-9 grid gap-5 sm:grid-cols-2"><Field label="Prénom" value={form.firstName} onChange={(v) => update("firstName", v)} /><Field label="Nom" value={form.lastName} onChange={(v) => update("lastName", v)} /><Field label="Adresse e-mail" value={email} type="email" disabled onChange={() => undefined} /><div className="space-y-2"><Label htmlFor="language">Langue de contribution</Label><select id="language" value={form.language} onChange={(e) => update("language", e.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="fr">Français</option><option value="en">English</option></select></div><Field label="Pays d’étude" value={form.country} onChange={(v) => update("country", v)} /><Field label="Matière enseignée" value={form.subject} onChange={(v) => update("subject", v)} /><Field label="Niveau enseigné" value={form.level} onChange={(v) => update("level", v)} /><div className="space-y-2"><Label htmlFor="avatar">Photo professionnelle</Label><label htmlFor="avatar" className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-brand-navy"><Camera className="size-4" />{avatar?.name ?? (existingAvatar ? "Remplacer la photo" : "Importer une photo")}</label><Input id="avatar" type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatar(e.target.files?.[0])} /></div><div className="sm:col-span-2 pt-3"><Button type="submit" variant="pillPink" size="pillSm" disabled={saving} className="w-full sm:w-auto">{saving ? "Enregistrement…" : "Enregistrer mon profil"}</Button></div></div>}</form></main></>;
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} disabled={disabled} required maxLength={255} onChange={(e) => onChange(e.target.value)} className="h-11 bg-card" /></div>;
}