import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  date_of_birth: z.string().trim().max(20),
  education: z.string().trim().min(2).max(2000),
  school: z.string().trim().max(200),
  motivation: z.string().trim().min(10).max(2000),
  previous_work: z.string().trim().max(2000),
  country: z.string().trim().max(120),
});

const EMPTY = {
  full_name: "",
  email: "",
  date_of_birth: "",
  education: "",
  school: "",
  motivation: "",
  previous_work: "",
  country: "",
};

export function ApplyPage() {
  const { t } = useI18n();
  const a = t.apply;
  const [form, setForm] = useState(EMPTY);
  const [certified, setCertified] = useState("no");
  const [tried, setTried] = useState("no");
  const [platform, setPlatform] = useState("ios");
  const [cv, setCv] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(a.error);
      return;
    }
    setBusy(true);
    try {
      let cvPath: string | null = null;
      if (cv) {
        const safeName = cv.name.replace(/[^a-zA-Z0-9.]/g, "-").slice(-60);
        const path = `${crypto.randomUUID()}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("applications").upload(path, cv);
        if (!uploadError) cvPath = path;
      }
      const { error: insertError } = await supabase.from("applications").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email.toLowerCase(),
        date_of_birth: parsed.data.date_of_birth || null,
        education: parsed.data.education,
        cv_path: cvPath,
        is_certified_teacher: certified === "yes",
        school: certified === "yes" ? parsed.data.school || null : null,
        motivation: parsed.data.motivation,
        tried_sophia: tried === "yes",
        previous_work: parsed.data.previous_work || null,
        country: parsed.data.country || null,
        platform: platform as "ios" | "android",
      });
      if (insertError) throw insertError;
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(a.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy md:text-4xl">{a.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-navySoft">{a.lead}</p>

        {done ? (
          <div className="mt-10 rounded-2xl border border-brand-line bg-card p-6">
            <p className="flex items-center gap-2 text-lg font-extrabold text-brand-navy">
              <CheckCircle2 aria-hidden="true" className="size-5" /> {a.successTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">{a.successText}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-5 rounded-2xl border border-brand-line bg-card p-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{a.name}</Label>
              <Input id="full_name" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{a.email}</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">{a.dob}</Label>
              <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{a.country}</Label>
              <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="education">{a.education}</Label>
              <Textarea id="education" required rows={3} value={form.education} onChange={(e) => update("education", e.target.value)} />
              <p className="text-xs text-brand-navySoft">{a.educationHint}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cv">{a.cv}</Label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)}
                className="h-11"
              />
              <p className="text-xs text-brand-navySoft">{a.cvHint}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certified">{a.certified}</Label>
              <Select value={certified} onValueChange={setCertified}>
                <SelectTrigger id="certified" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{a.yes}</SelectItem>
                  <SelectItem value="no">{a.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">{a.school}</Label>
              <Input
                id="school"
                value={form.school}
                disabled={certified !== "yes"}
                onChange={(e) => update("school", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motivation">{a.motivation}</Label>
              <Textarea id="motivation" required rows={4} value={form.motivation} onChange={(e) => update("motivation", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tried">{a.tried}</Label>
              <Select value={tried} onValueChange={setTried}>
                <SelectTrigger id="tried" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{a.yes}</SelectItem>
                  <SelectItem value="no">{a.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">{a.platform}</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ios">{a.ios}</SelectItem>
                  <SelectItem value="android">{a.android}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="work">{a.work}</Label>
              <Textarea id="work" rows={4} value={form.previous_work} onChange={(e) => update("previous_work", e.target.value)} />
              <p className="text-xs text-brand-navySoft">{a.workHint}</p>
            </div>
            {error ? (
              <p role="alert" className="md:col-span-2 text-sm font-semibold text-portal-red">
                {error}
              </p>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? a.sending : a.submit}
              </Button>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
