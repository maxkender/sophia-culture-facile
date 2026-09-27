import { trackFunnel } from "@/lib/funnel-events";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createVideoUploadSlot, submitUgcApplication } from "@/lib/creator-apply.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "./CountrySelect";
import { ApplyShell, Confirmation, FormSection, Honeypot, YesNo } from "./ApplyShell";
import { useI18n, useLocalePath } from "@/i18n";
import { CREATOR_FORMS } from "@/i18n/creator-forms";

const KEY = "sophia-ugc-application";
const OCCUPATIONS = ["studying", "working", "both", "other"] as const;

type Form = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  age: string;
  occupation: "" | "studying" | "working" | "both" | "other";
  tiktok_url: string;
  instagram_url: string;
  other_links: string;
  meets: "" | "yes" | "no";
  video_mode: "link" | "file";
  video_url: string;
  referral_source: string;
  consent: boolean;
};

const EMPTY: Form = {
  full_name: "",
  email: "",
  phone: "",
  country: "",
  age: "",
  occupation: "",
  tiktok_url: "",
  instagram_url: "",
  other_links: "",
  meets: "",
  video_mode: "link",
  video_url: "",
  referral_source: "",
  consent: false,
};

function isUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function uploadWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "video/mp4");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function UgcApplyPage() {
  const { lang } = useI18n();
  const privacyPath = useLocalePath("privacy");
  const { common, ugc: copy } = CREATOR_FORMS[lang];
  const slot = useServerFn(createVideoUploadSlot);
  const submitFn = useServerFn(submitUgcApplication);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [honey, setHoney] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [resume, setResume] = useState(false);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Form>;
        setForm({ ...EMPTY, ...parsed });
        if (Object.values(parsed).some((v) => typeof v === "string" && v.trim() !== "")) setResume(true);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && !done) localStorage.setItem(KEY, JSON.stringify(form));
  }, [form, loaded, done]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const ageNum = Number(form.age);
  const underage = form.age !== "" && (!Number.isFinite(ageNum) || ageNum < 18);
  const notMeeting = form.meets === "no";
  const hasVideo = form.video_mode === "link" ? isUrl(form.video_url) : Boolean(file);
  const blocked = underage || notMeeting;

  useEffect(() => {
    if (error) trackFunnel("apply_blocked", { track: "ugc", reason: error });
  }, [error]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blocked) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.country || !form.age || !form.occupation) {
      setError(common.requiredError);
      return;
    }
    if (form.meets !== "yes") {
      setError(copy.notMeeting);
      return;
    }
    if (!hasVideo) {
      setError(copy.videoMissing);
      return;
    }
    if (!form.referral_source.trim()) {
      setError(copy.referralError);
      return;
    }
    if (!form.consent) {
      setError(common.consentError);
      return;
    }
    for (const u of [form.tiktok_url, form.instagram_url]) {
      if (u && !isUrl(u)) {
        setError(copy.linksError);
        return;
      }
    }
    setBusy(true);
    try {
      let path = uploadedPath;
      if (form.video_mode === "file" && file && !path) {
        if (file.size > 200 * 1024 * 1024) {
          setError(copy.videoTooLarge);
          return;
        }
        const res = await slot({ data: { name: file.name, type: file.type, size: file.size } });
        if (!res.ok) {
          setError(res.reason === "size" ? copy.videoTooLarge : copy.videoType);
          return;
        }
        setProgress(0);
        await uploadWithProgress(res.signedUrl, file, setProgress);
        path = res.path;
        setUploadedPath(path);
      }
      const result = await submitFn({
        data: {
          website: honey,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          age: ageNum,
          occupation: form.occupation as "studying",
          tiktok_url: form.tiktok_url,
          instagram_url: form.instagram_url,
          other_links: form.other_links,
          meets_criteria: true,
          video_url: form.video_mode === "link" ? form.video_url : "",
          video_file_path: form.video_mode === "file" ? path ?? undefined : undefined,
          referral_source: form.referral_source,
          consent: true,
        },
      });
      if (!result.ok) {
        setError(
          result.reason === "rate"
            ? common.rateError
            : common.genericError,
        );
        return;
      }
      localStorage.removeItem(KEY);
      trackFunnel("apply_submitted", { track: "ugc" });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(common.genericError);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <ApplyShell title={copy.title}>
        <Confirmation text={copy.confirmation} />
      </ApplyShell>
    );
  }

  return (
    <ApplyShell title={copy.title} lead={copy.lead}>
      {resume && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-line bg-card p-4 text-sm">
          <span className="flex-1">You have an application in progress, continue?</span>
          <button type="button" className="font-semibold underline" onClick={() => setResume(false)}>Continue</button>
          <button type="button" className="text-brand-navySoft underline" onClick={() => { localStorage.removeItem(KEY); setForm(EMPTY); setResume(false); }}>Start over</button>
        </div>
      )}
      <form data-funnel="apply" data-track="ugc" onFocusCapture={() => { if (!started.current) { started.current = true; trackFunnel("apply_started", { track: "ugc" }); } }} onSubmit={onSubmit} className="relative mt-10 grid gap-8 rounded-2xl border border-brand-line bg-card p-6" noValidate>
        <Honeypot value={honey} onChange={setHoney} />

        <FormSection title={common.contact}>
          <div className="space-y-2">
            <Label htmlFor="full_name">{common.fullName}</Label>
            <Input id="full_name" className="h-11" autoComplete="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{common.email}</Label>
            <Input id="email" type="email" className="h-11" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{common.phone}</Label>
            <Input id="phone" type="tel" className="h-11" placeholder="+33 6 12 34 56 78" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{common.country}</Label>
            <CountrySelect id="country" value={form.country} onChange={(v) => set("country", v)} lang={lang} labels={{ select: common.selectCountry, search: common.searchCountry, empty: common.noCountry }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">{common.age}</Label>
            <Input id="age" type="number" inputMode="numeric" min={18} className="h-11 w-32" value={form.age} onChange={(e) => set("age", e.target.value)} />
            {underage ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                {copy.underage}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{copy.occupation}</Label>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {OCCUPATIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={form.occupation === v}
                  onClick={() => set("occupation", v)}
                  className={`h-11 rounded-full border px-5 text-sm font-bold ${
                    form.occupation === v ? "border-brand-navy bg-brand-navy text-brand-onNavy" : "border-brand-line bg-card text-brand-navy"
                  }`}
                >
                  {copy.occupations[v]}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title={copy.content}>
          <p className="text-sm text-brand-navySoft">{copy.contentHint}</p>
          <div className="space-y-2">
            <Label htmlFor="tiktok">{copy.tiktok}</Label>
            <Input id="tiktok" type="url" className="h-11" placeholder="https://www.tiktok.com/@…" value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">{copy.instagram}</Label>
            <Input id="instagram" type="url" className="h-11" placeholder="https://www.instagram.com/…" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="other">{copy.otherLinks}</Label>
            <Textarea id="other" rows={2} value={form.other_links} onChange={(e) => set("other_links", e.target.value)} />
          </div>
        </FormSection>

        <FormSection title={copy.requirements}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-brand-navy">
            {copy.requirementItems.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label htmlFor="meets">{copy.meets}</Label>
            <YesNo id="meets" value={form.meets} onChange={(v) => set("meets", v)} yes={common.yes} no={common.no} />
            {notMeeting ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                {copy.notMeeting}
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection title={copy.videoTitle}>
          <p className="text-sm leading-relaxed text-brand-navySoft">
            {copy.videoHelp}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["link", "file"] as const).map((m) => (
              <Button key={m} type="button" size="pillSm" className="h-auto min-h-11 whitespace-normal px-3 text-center" variant={form.video_mode === m ? "pill" : "pillSecondary"} onClick={() => set("video_mode", m)}>
                {m === "link" ? copy.sendLink : copy.uploadFile}
              </Button>
            ))}
          </div>
          {form.video_mode === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="video_url">{copy.videoLink}</Label>
              <Input id="video_url" type="url" className="h-11" placeholder="https://…" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="video_file">{copy.videoFile}</Label>
              <Input
                id="video_file"
                type="file"
                accept="video/*,.mp4,.mov"
                className="h-11"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setUploadedPath(null);
                  setProgress(null);
                  if (f && f.size > 200 * 1024 * 1024) {
                    setError(copy.videoTooLarge);
                    setFile(null);
                    return;
                  }
                  setError(null);
                  setFile(f);
                }}
              />
              {progress !== null ? (
                <div className="space-y-1">
                  <Progress value={progress} />
                  <p className="text-xs text-brand-navySoft">{progress < 100 ? `${copy.uploading}… ${progress}%` : copy.uploaded}</p>
                </div>
              ) : null}
            </div>
          )}
        </FormSection>

        <FormSection title={copy.referral}>
          <Textarea id="referral" rows={2} value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} />
          <p className="text-xs text-brand-navySoft">{copy.referralHint}</p>
        </FormSection>

        <FormSection title={common.consent}>
          <label className="flex items-start gap-3 text-sm text-brand-navy">
            <Checkbox checked={form.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5" />
            <span>
              {common.consentText}{" "}
              <Link to={privacyPath} className="underline underline-offset-4">
                {common.privacy}
              </Link>
            </span>
          </label>
        </FormSection>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-portal-red">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" variant="pill" size="pill" disabled={busy || blocked}>
            {busy ? (progress !== null && progress < 100 ? `${copy.uploading} ${progress}%…` : common.sending) : common.submit}
          </Button>
        </div>
      </form>
    </ApplyShell>
  );
}
