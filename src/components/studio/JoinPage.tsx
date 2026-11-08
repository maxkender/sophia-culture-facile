import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Check, Globe2, Headphones, Image as ImageIcon, LockKeyhole, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthorAgreement } from "@/components/portal/AuthorAgreement";
import { Banner, PortalCard } from "@/components/portal/ui";
import { SL, st, StudioLangSwitch, useStudioLang } from "@/i18n/studio";
import { ensureStudioProfile, saveIdentity } from "@/lib/studio/onboarding.functions";
import { APP_LANGS, LONG_BIO_MAX, ONBOARDING_STEPS, SHORT_BIO_MAX, defaultDisplayName, resumeStep, stepIndex, type OnboardingStep } from "@/lib/studio/onboarding";

const WIZARD_STEPS = ONBOARDING_STEPS.filter((s) => s !== "done");
const STEP_LABEL: Record<OnboardingStep, string> = {
  identity: "Identity",
  credentials: "Credentials",
  profile: "Public profile",
  agreement: "Agreement",
  guide: "Writing guide",
  done: "Done",
};

function langName(code: string, ui: string) {
  try { return new Intl.DisplayNames([ui], { type: "language" }).of(code) ?? code; } catch { return code; }
}

function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-portal-bg px-5 py-8">
      <div className={`mx-auto w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Sophia" className="w-fit"><Logo /></Link>
          <StudioLangSwitch />
        </div>
        {children}
      </div>
    </main>
  );
}

/* ---------------- Sign-up ---------------- */

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "magic">(null);
  const redirect = typeof window !== "undefined" ? `${window.location.origin}/auteurs/join` : undefined;

  async function signUp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } });
    setBusy(false);
    if (error) { toast.error(st("The account could not be created. Check the address, or sign in if you already have an account.")); return; }
    setSent("confirm");
  }
  async function magic() {
    if (!email.trim()) { toast.error(st("Enter your email address first.")); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect, shouldCreateUser: true } });
    setBusy(false);
    if (error) { toast.error(st("The link could not be sent.")); return; }
    setSent("magic");
  }

  return (
    <Shell>
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wider text-portal-accent">Sophia Studio</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-navy">{st("Write for Sophia")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">{st("Create your creator account. You will build your profile, sign the author agreement, then write your first course.")}</p>
        {sent ? (
          <div className="mt-6">
            <Banner tone="success" title={st("Check your inbox")}>
              {sent === "confirm" ? st("We sent you a confirmation link. Open it on this device to continue your sign-up.") : st("We sent you a sign-in link. Open it on this device to continue.")}
            </Banner>
          </div>
        ) : (
          <>
            <form onSubmit={signUp} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-email">{st("Email address")}</Label>
                <div className="relative">
                  <Mail aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input id="join-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-password">{st("Password (8 characters or more)")}</Label>
                <div className="relative">
                  <LockKeyhole aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input id="join-password" type="password" autoComplete="new-password" required minLength={8} maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10" />
                </div>
              </div>
              <Button type="submit" variant="pillPink" size="pillSm" className="w-full" disabled={busy}>{busy ? st("Please wait…") : st("Create my account")}</Button>
            </form>
            <Button type="button" variant="ghost" size="pillSm" className="mt-3 w-full" disabled={busy} onClick={magic}>{st("Email me a sign-up link instead")}</Button>
          </>
        )}
        <p className="mt-6 border-t border-brand-line pt-5 text-center text-sm text-brand-navySoft">
          {st("Already have an account?")} <Link to="/auteurs/login" className="font-bold text-brand-navy underline-offset-4 hover:underline">{st("Sign in")}</Link>
        </p>
      </PortalCard>
    </Shell>
  );
}

/* ---------------- Wizard ---------------- */

type Profile = {
  id: string; email: string | null; first_name: string | null; last_name: string | null; full_name: string; display_name: string | null;
  writing_lang: string | null; display_title: string | null; institution: string | null; country: string | null; personal_site: string | null;
  orcid: string | null; scholar_url: string | null; short_bio: string | null; bio: string | null; photo_url: string | null;
  onboarding_step: string | null; creator_status: string; guide_read_at: string | null; examples_reviewed_at: string | null;
};

function Progress({ step }: { step: OnboardingStep }) {
  const i = stepIndex(step);
  return (
    <ol className="mb-6 flex gap-1.5" aria-label={st("Progress")}>
      {WIZARD_STEPS.map((s, n) => (
        <li key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${n <= i ? "bg-brand-navy" : "bg-brand-line"}`} />
          <p className={`mt-2 hidden text-xs font-bold sm:block ${n === i ? "text-brand-navy" : "text-brand-navySoft"}`}>{st(STEP_LABEL[s])}</p>
        </li>
      ))}
    </ol>
  );
}

function StepCard({ step, title, lead, children, onNext, nextLabel, busy, disabled }: { step: OnboardingStep; title: string; lead: string; children: ReactNode; onNext: () => void; nextLabel?: string; busy?: boolean; disabled?: boolean }) {
  return (
    <>
      <Progress step={step} />
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wider text-portal-accent">{SL(`Step ${stepIndex(step) + 1} of 5`, `Étape ${stepIndex(step) + 1} sur 5`)}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">{lead}</p>
        <div className="mt-6 space-y-5">{children}</div>
        <div className="mt-8 flex justify-end">
          <Button type="button" variant="pillPink" size="pillSm" onClick={onNext} disabled={busy || disabled}>{busy ? st("Saving…") : nextLabel ?? st("Save and continue")}</Button>
        </div>
      </PortalCard>
    </>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-brand-navySoft">{hint}</p> : null}
    </div>
  );
}

async function setStep(profileId: string, step: OnboardingStep, extra: Record<string, unknown> = {}) {
  const { error } = await supabase.from("profiles").update({ ...extra, onboarding_step: step }).eq("id", profileId);
  if (error) throw error;
}

function IdentityStep({ p, onDone }: { p: Profile; onDone: () => void }) {
  const lang = useStudioLang();
  const save = useServerFn(saveIdentity);
  const guess = (p.full_name || "").split(/\s+/);
  const [first, setFirst] = useState(p.first_name ?? (p.email && p.full_name === p.email.split("@")[0] ? "" : guess[0] ?? ""));
  const [last, setLast] = useState(p.last_name ?? (p.email && p.full_name === p.email.split("@")[0] ? "" : guess.slice(1).join(" ")));
  const [display, setDisplay] = useState(p.display_name ?? "");
  const [writing, setWriting] = useState(p.writing_lang ?? (lang === "fr" ? "fr" : "en"));
  const [busy, setBusy] = useState(false);
  const fallback = defaultDisplayName(first, last);
  async function next() {
    if (!first.trim() || !last.trim()) { toast.error(st("Enter your first and last name.")); return; }
    setBusy(true);
    try { await save({ data: { firstName: first, lastName: last, displayName: display.trim() || undefined, writingLang: writing as (typeof APP_LANGS)[number] } }); onDone(); }
    catch { toast.error(st("Your details could not be saved.")); }
    finally { setBusy(false); }
  }
  return (
    <StepCard step="identity" title={st("Who are you?")} lead={st("This is how readers will see you in the app.")} onNext={next} busy={busy}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="first" label={st("First name")}><Input id="first" value={first} maxLength={80} onChange={(e) => setFirst(e.target.value)} /></Field>
        <Field id="last" label={st("Last name")}><Input id="last" value={last} maxLength={80} onChange={(e) => setLast(e.target.value)} /></Field>
      </div>
      <Field id="display" label={st("Display name")} hint={st("Leave empty to use your first and last name.")}>
        <Input id="display" value={display} placeholder={fallback} maxLength={160} onChange={(e) => setDisplay(e.target.value)} />
      </Field>
      <Field id="writing" label={st("The language you will write in")} hint={st("Sophia translates your courses into the other app languages.")}>
        <select id="writing" value={writing} onChange={(e) => setWriting(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {APP_LANGS.map((c) => <option key={c} value={c}>{langName(c, lang)}</option>)}
        </select>
      </Field>
    </StepCard>
  );
}

type Edu = { degree: string; field: string; institution: string; year: string };

function CredentialsStep({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [f, setF] = useState({ display_title: p.display_title ?? "", institution: p.institution ?? "", country: p.country ?? "", personal_site: p.personal_site ?? "", orcid: p.orcid ?? "", scholar_url: p.scholar_url ?? "" });
  const [edu, setEdu] = useState<Edu[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void supabase.from("education_records").select("degree, field, institution, year").eq("profile_id", p.id).order("order_index").then(({ data }) => {
      setEdu((data ?? []).map((r) => ({ degree: r.degree ?? "", field: r.field ?? "", institution: r.institution ?? "", year: r.year ?? "" })));
    });
  }, [p.id]);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  async function next() {
    if (!f.display_title.trim()) { toast.error(st("Add the title shown under your name.")); return; }
    for (const url of [f.personal_site, f.scholar_url]) if (url.trim() && !/^https:\/\//.test(url.trim())) { toast.error(st("Links must start with https://")); return; }
    setBusy(true);
    try {
      const links = { site: f.personal_site.trim() || undefined, orcid: f.orcid.trim() || undefined, scholar: f.scholar_url.trim() || undefined };
      await setStep(p.id, stepIndex(resumeStep(p.onboarding_step)) > 1 ? resumeStep(p.onboarding_step) : "profile", {
        display_title: f.display_title.trim(), title: f.display_title.trim(), institution: f.institution.trim() || null, country: f.country.trim() || null,
        personal_site: f.personal_site.trim() || null, orcid: f.orcid.trim() || null, scholar_url: f.scholar_url.trim() || null, creator_links: links,
      });
      await supabase.from("education_records").delete().eq("profile_id", p.id);
      const rows = edu.filter((r) => r.degree.trim() || r.institution.trim()).map((r, i) => ({ profile_id: p.id, degree: r.degree.trim() || null, field: r.field.trim() || null, institution: r.institution.trim() || null, year: r.year.trim() || null, order_index: i }));
      if (rows.length) { const { error } = await supabase.from("education_records").insert(rows); if (error) throw error; }
      onDone();
    } catch { toast.error(st("Your details could not be saved.")); }
    finally { setBusy(false); }
  }
  return (
    <StepCard step="credentials" title={st("Your credentials")} lead={st("Readers trust courses written by people who know their subject.")} onNext={next} busy={busy}>
      <Field id="title" label={st("Title shown under your name")} hint={st("For example: PhD candidate in Medieval History, Sorbonne University")}>
        <Input id="title" value={f.display_title} maxLength={200} onChange={set("display_title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="inst" label={st("Institution")}><Input id="inst" value={f.institution} maxLength={200} onChange={set("institution")} /></Field>
        <Field id="country" label={st("Country")}><Input id="country" value={f.country} maxLength={80} onChange={set("country")} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="site" label={st("Personal site (optional)")}><Input id="site" value={f.personal_site} placeholder="https://" maxLength={300} onChange={set("personal_site")} /></Field>
        <Field id="orcid" label="ORCID"><Input id="orcid" value={f.orcid} maxLength={100} onChange={set("orcid")} /></Field>
        <Field id="scholar" label="Google Scholar"><Input id="scholar" value={f.scholar_url} placeholder="https://" maxLength={300} onChange={set("scholar_url")} /></Field>
      </div>
      <div>
        <p className="text-sm font-bold text-brand-navy">{st("Education")}</p>
        <div className="mt-3 space-y-3">
          {edu.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-portal bg-portal-bg p-3 sm:grid-cols-[1fr_1fr_1fr_80px_auto]">
              {(["degree", "field", "institution", "year"] as const).map((k) => (
                <Input key={k} aria-label={st(k === "degree" ? "Degree" : k === "field" ? "Field" : k === "institution" ? "Institution" : "Year")} placeholder={st(k === "degree" ? "Degree" : k === "field" ? "Field" : k === "institution" ? "Institution" : "Year")} value={r[k]} maxLength={200} onChange={(e) => setEdu((s) => s.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
              ))}
              <Button type="button" variant="ghost" size="icon" aria-label={st("Remove")} onClick={() => setEdu((s) => s.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setEdu((s) => [...s, { degree: "", field: "", institution: "", year: "" }])}><Plus className="size-4" />{st("Add a degree")}</Button>
        </div>
      </div>
    </StepCard>
  );
}

/** Centre-crops to a square JPEG (max 1200 px) so the preview is exactly what gets stored. */
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(side, 1200);
  const canvas = document.createElement("canvas");
  canvas.width = out; canvas.height = out;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
  return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop"))), "image/jpeg", 0.9));
}

function ProfileStep({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [shortBio, setShortBio] = useState(p.short_bio ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (preview || !p.photo_url) return;
    void supabase.storage.from("author-photos").createSignedUrl(p.photo_url, 1800).then(({ data }) => { if (data?.signedUrl) setPreview(data.signedUrl); });
  }, [p.photo_url, preview]);
  async function pick(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast.error(st("Use a JPEG, PNG or WebP photo.")); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error(st("The photo must be smaller than 10 MB.")); return; }
    try { const b = await squareJpeg(f); setFile(b); setPreview(URL.createObjectURL(b)); } catch { toast.error(st("This photo could not be read.")); }
  }
  async function next() {
    if (!shortBio.trim()) { toast.error(st("Write a short bio.")); return; }
    if (!file && !p.photo_url) { toast.error(st("Add a photo.")); return; }
    setBusy(true);
    try {
      let photoPath = p.photo_url;
      if (file) {
        const path = `${p.id}/${Date.now()}-studio.jpg`;
        const { error } = await supabase.storage.from("author-photos").upload(path, file, { contentType: "image/jpeg" });
        if (error) throw error;
        photoPath = path;
      }
      await setStep(p.id, stepIndex(resumeStep(p.onboarding_step)) > 2 ? resumeStep(p.onboarding_step) : "agreement", { short_bio: shortBio.trim(), bio: bio.trim() || null, photo_url: photoPath });
      onDone();
    } catch { toast.error(st("Your profile could not be saved.")); }
    finally { setBusy(false); }
  }
  return (
    <StepCard step="profile" title={st("Your public profile")} lead={st("Shown next to your courses in the app and on the site.")} onNext={next} busy={busy}>
      <div className="flex flex-wrap items-center gap-5">
        <div className="size-28 overflow-hidden rounded-full bg-portal-bg ring-1 ring-brand-line">
          {preview ? <img src={preview} alt={st("Photo preview")} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-xs text-brand-navySoft">{st("No photo")}</div>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo">{st("Photo")}</Label>
          <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void pick(e.target.files?.[0])} />
          <p className="text-xs text-brand-navySoft">{st("A clear portrait. It is cropped to a square, as shown.")}</p>
        </div>
      </div>
      <Field id="short" label={SL(`Short bio (shown in the app) · ${shortBio.length}/${SHORT_BIO_MAX}`, `Bio courte (affichée dans l'app) · ${shortBio.length}/${SHORT_BIO_MAX}`)}>
        <Textarea id="short" rows={3} maxLength={SHORT_BIO_MAX} value={shortBio} onChange={(e) => setShortBio(e.target.value)} />
      </Field>
      <Field id="long" label={SL(`Long bio (shown on the site, optional) · ${bio.length}/${LONG_BIO_MAX}`, `Bio longue (affichée sur le site, facultative) · ${bio.length}/${LONG_BIO_MAX}`)}>
        <Textarea id="long" rows={6} maxLength={LONG_BIO_MAX} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
    </StepCard>
  );
}

function AgreementStep({ p, onDone }: { p: Profile; onDone: () => void }) {
  const { data: signed } = useQuery({
    queryKey: ["studio", "contract", p.id],
    refetchInterval: (q) => (q.state.data ? false : 3000),
    queryFn: async () => (await supabase.from("contracts").select("document_version, signed_at").eq("author_id", p.id).maybeSingle()).data,
  });
  const [busy, setBusy] = useState(false);
  async function next() {
    setBusy(true);
    try { await setStep(p.id, stepIndex(resumeStep(p.onboarding_step)) > 3 ? resumeStep(p.onboarding_step) : "guide"); onDone(); }
    catch { toast.error(st("Your progress could not be saved.")); }
    finally { setBusy(false); }
  }
  return (
    <>
      <Progress step="agreement" />
      <div className="mb-4">
        <Banner tone={signed ? "success" : "info"} title={signed ? SL(`Signed (version ${signed.document_version})`, `Signé (version ${signed.document_version})`) : st("Sign the author agreement")}>
          {signed ? st("You can continue.") : st("You can already draft courses without signing, but no course can be sent for review before the agreement is signed.")}
        </Banner>
      </div>
      <div className="studio-agreement"><AuthorAgreement /></div>
      <div className="mt-6 flex justify-end gap-3">
        {!signed ? <Button type="button" variant="ghost" size="pillSm" onClick={next} disabled={busy}>{st("Sign later")}</Button> : null}
        <Button type="button" variant="pillPink" size="pillSm" onClick={next} disabled={busy || !signed}>{st("Continue")}</Button>
      </div>
    </>
  );
}

function GuideStep({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [read, setRead] = useState(Boolean(p.guide_read_at && p.examples_reviewed_at));
  const [busy, setBusy] = useState(false);
  async function next() {
    setBusy(true);
    const now = new Date().toISOString();
    try { await setStep(p.id, "done", { guide_read_at: p.guide_read_at ?? now, examples_reviewed_at: p.examples_reviewed_at ?? now }); onDone(); }
    catch { toast.error(st("Your progress could not be saved.")); }
    finally { setBusy(false); }
  }
  return (
    <StepCard step="guide" title={st("The writing guide")} lead={st("Two short reads before your first course: how a Sophia course is written, and real examples.")} onNext={next} busy={busy} disabled={!read} nextLabel={st("Finish")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href="/auteurs/guide" target="_blank" rel="noopener" className="rounded-portal border border-brand-line p-4 hover:border-brand-navy">
          <BookOpen className="size-5 text-portal-accent" aria-hidden="true" />
          <p className="mt-2 font-bold text-brand-navy">{st("Writing guide")}</p>
          <p className="text-sm text-brand-navySoft">{st("Tone, structure, sources.")}</p>
        </a>
        <a href="/auteurs/examples" target="_blank" rel="noopener" className="rounded-portal border border-brand-line p-4 hover:border-brand-navy">
          <Sparkles className="size-5 text-portal-accent" aria-hidden="true" />
          <p className="mt-2 font-bold text-brand-navy">{st("Examples")}</p>
          <p className="text-sm text-brand-navySoft">{st("Courses that work well in the app.")}</p>
        </a>
      </div>
      <label className="flex items-start gap-3 text-sm text-brand-navy">
        <Checkbox checked={read} onCheckedChange={(v) => setRead(v === true)} />
        <span>{st("I have read the guide and the examples.")}</span>
      </label>
    </StepCard>
  );
}

function DoneStep({ p }: { p: Profile }) {
  const { data: signed } = useQuery({ queryKey: ["studio", "contract", p.id], queryFn: async () => (await supabase.from("contracts").select("document_version").eq("author_id", p.id).maybeSingle()).data });
  const after = [
    { icon: Check, text: st("A quiz written and fact-checked") },
    { icon: BookOpen, text: st("Glossary entries") },
    { icon: ImageIcon, text: st("An illustrated cover") },
    { icon: Globe2, text: st("Translation into every app language") },
    { icon: Headphones, text: st("Audio narration") },
  ];
  return (
    <>
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wider text-portal-green">{st("Your profile is ready")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-navy">{SL(`Welcome, ${p.first_name ?? p.display_name ?? ""}`, `Bienvenue, ${p.first_name ?? p.display_name ?? ""}`)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">{st("You have no course yet. Write your first one: about 500 to 900 words, in sections, with sources.")}</p>
        {p.creator_status === "pending" ? <p className="mt-3 text-sm text-brand-navySoft">{st("Your creator profile will be approved by the editorial desk with your first accepted course.")}</p> : null}
        {!signed ? <div className="mt-4"><Banner tone="warning" title={st("Agreement not signed yet")}>{st("Sign it before sending a course for review.")} <Link to="/auteurs/contract" className="font-bold underline">{st("Sign now")}</Link></Banner></div> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="pillPink" size="pillSm"><Link to="/auteurs">{st("Write your first course")}</Link></Button>
          <Button asChild variant="pillSecondary" size="pillSm"><Link to="/auteurs/open">{st("See the calls for courses")}</Link></Button>
        </div>
      </PortalCard>
      <PortalCard className="mt-4">
        <p className="text-sm font-bold text-brand-navy">{st("After review, Sophia takes care of")}</p>
        <ul className="mt-3 space-y-2">
          {after.map(({ icon: Icon, text }) => <li key={text} className="flex items-center gap-2 text-sm text-brand-navySoft"><Icon className="size-4 text-portal-accent" aria-hidden="true" />{text}</li>)}
        </ul>
      </PortalCard>
    </>
  );
}

function Wizard({ p }: { p: Profile }) {
  useStudioLang(p.writing_lang);
  const qc = useQueryClient();
  const saved = resumeStep(p.onboarding_step);
  const [view, setView] = useState<OnboardingStep>(saved);
  useEffect(() => { setView(saved); }, [saved]);
  const advance = (to: OnboardingStep) => async () => { await qc.invalidateQueries({ queryKey: ["studio", "me"] }); setView(to); window.scrollTo({ top: 0 }); };
  const reachable = stepIndex(saved);
  return (
    <Shell wide>
      {view !== "done" ? (
        <nav className="mb-4 flex flex-wrap gap-2 text-xs" aria-label={st("Steps")}>
          {WIZARD_STEPS.map((s, i) => (
            <button key={s} type="button" disabled={i > reachable} onClick={() => setView(s)} className={`rounded-full px-3 py-1 font-bold ${view === s ? "bg-brand-navy text-card" : i <= reachable ? "bg-card text-brand-navy" : "text-brand-navySoft/60"}`}>{i + 1}. {st(STEP_LABEL[s])}</button>
          ))}
        </nav>
      ) : null}
      {view === "identity" ? <IdentityStep p={p} onDone={advance("credentials")} /> : null}
      {view === "credentials" ? <CredentialsStep p={p} onDone={advance("profile")} /> : null}
      {view === "profile" ? <ProfileStep p={p} onDone={advance("agreement")} /> : null}
      {view === "agreement" ? <AgreementStep p={p} onDone={advance("guide")} /> : null}
      {view === "guide" ? <GuideStep p={p} onDone={advance("done")} /> : null}
      {view === "done" ? <DoneStep p={p} /> : null}
    </Shell>
  );
}

/* ---------------- Entry ---------------- */

export function JoinPage({ token }: { token: string }) {
  useStudioLang();
  const ensure = useServerFn(ensureStudioProfile);
  const [auth, setAuth] = useState<"loading" | "out" | "in">("loading");
  const [problem, setProblem] = useState<null | "other_space" | "invited" | "email" | "error">(null);

  useEffect(() => {
    if (token) { window.location.replace(`/auteurs/invite?token=${encodeURIComponent(token)}`); return; }
    const check = async () => { const { data } = await supabase.auth.getUser(); setAuth(data.user ? "in" : "out"); };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") void check(); });
    return () => sub.subscription.unsubscribe();
  }, [token]);

  const me = useQuery({
    queryKey: ["studio", "me"],
    enabled: auth === "in",
    queryFn: async () => {
      const res = await ensure();
      if (!res.ok) { setProblem(res.reason); return null; }
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user!.id).maybeSingle();
      return (data ?? null) as Profile | null;
    },
  });
  const content = useMemo(() => {
    if (token || auth === "loading" || (auth === "in" && me.isLoading)) return <div className="min-h-screen bg-portal-bg" />;
    if (auth === "out") return <SignUpForm />;
    if (problem) {
      const msg = problem === "other_space" ? st("This account belongs to the creator programme. Use another email address to write courses.")
        : problem === "invited" ? st("The editorial desk already prepared a profile for this address. Open the invitation link you received by email.")
        : st("Your account could not be set up. Try again or contact the editorial desk.");
      return <Shell><Banner tone="warning" title={st("One more thing")}>{msg}</Banner></Shell>;
    }
    if (!me.data) return <Shell><Banner tone="error" title={st("Something went wrong")}>{st("Your account could not be set up. Try again or contact the editorial desk.")}</Banner></Shell>;
    return <Wizard p={me.data} />;
  }, [token, auth, me.isLoading, me.data, problem]);
  return content;
}
