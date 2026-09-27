import { useEffect, useState, type FormEvent } from "react";
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

const KEY = "sophia-ugc-application";
const REQUIREMENTS = [
  "You have an iPhone",
  "You can post at least five times a week, consistently",
  "You do not currently work for a competing app",
  "You are at least 18 years old",
  "You are good on camera",
];
const OCCUPATIONS = [
  ["studying", "Studying"],
  ["working", "Working"],
  ["both", "Both"],
  ["other", "Other"],
] as const;

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setForm({ ...EMPTY, ...(JSON.parse(saved) as Partial<Form>) });
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blocked) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.country || !form.age || !form.occupation) {
      setError("Please fill in every required field in Contact.");
      return;
    }
    if (form.meets !== "yes") {
      setError("Please confirm you meet the requirements.");
      return;
    }
    if (!hasVideo) {
      setError("Please add a video: a link, or a file upload.");
      return;
    }
    if (!form.referral_source.trim()) {
      setError("Please tell us how you heard about us.");
      return;
    }
    if (!form.consent) {
      setError("Please tick the consent box.");
      return;
    }
    for (const u of [form.tiktok_url, form.instagram_url]) {
      if (u && !isUrl(u)) {
        setError("Links must start with https://");
        return;
      }
    }
    setBusy(true);
    try {
      let path = uploadedPath;
      if (form.video_mode === "file" && file && !path) {
        if (file.size > 200 * 1024 * 1024) {
          setError("The video is over 200 MB.");
          return;
        }
        const res = await slot({ data: { name: file.name, type: file.type, size: file.size } });
        if (!res.ok) {
          setError(res.reason === "size" ? "The video is over 200 MB." : "Please upload an .mp4 or .mov file.");
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
            ? "We have already received an application from you recently. We will be in touch."
            : "Something went wrong. Please try again in a moment.",
        );
        return;
      }
      localStorage.removeItem(KEY);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please check your answers and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <ApplyShell title="Apply as a UGC creator">
        <Confirmation text="Thank you. We read every application and reply within five days by email." />
      </ApplyShell>
    );
  }

  return (
    <ApplyShell title="Apply as a UGC creator" lead="Two minutes. Your answers are saved on this device as you type.">
      <form onSubmit={onSubmit} className="relative mt-10 grid gap-8 rounded-2xl border border-brand-line bg-card p-6" noValidate>
        <Honeypot value={honey} onChange={setHoney} />

        <FormSection title="Contact">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" className="h-11" autoComplete="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" className="h-11" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number, with country code *</Label>
            <Input id="phone" type="tel" className="h-11" placeholder="+33 6 12 34 56 78" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Which country are you in? *</Label>
            <CountrySelect id="country" value={form.country} onChange={(v) => set("country", v)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">How old are you? *</Label>
            <Input id="age" type="number" inputMode="numeric" min={18} className="h-11 w-32" value={form.age} onChange={(e) => set("age", e.target.value)} />
            {underage ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                You need to be at least 18 to apply.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>What do you do? *</Label>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {OCCUPATIONS.map(([v, label]) => (
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
                  {label}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title="Your content">
          <p className="text-sm text-brand-navySoft">Past content experience is not required, but it helps to see what you have made.</p>
          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok link</Label>
            <Input id="tiktok" type="url" className="h-11" placeholder="https://www.tiktok.com/@…" value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram link</Label>
            <Input id="instagram" type="url" className="h-11" placeholder="https://www.instagram.com/…" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="other">Other links</Label>
            <Textarea id="other" rows={2} value={form.other_links} onChange={(e) => set("other_links", e.target.value)} />
          </div>
        </FormSection>

        <FormSection title="Requirements">
          <ul className="list-disc space-y-1 pl-5 text-sm text-brand-navy">
            {REQUIREMENTS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label htmlFor="meets">Do you meet all of the above? *</Label>
            <YesNo id="meets" value={form.meets} onChange={(v) => set("meets", v)} />
            {notMeeting ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                Please do not apply if you do not meet these.
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="A video of you talking *">
          <p className="text-sm leading-relaxed text-brand-navySoft">
            A 30 to 90 second video of you talking to the camera. Any subject. Be casual, like you are on a call with a friend. Decent light, no
            influencer voice. You can send a link to a video you have already made, as long as you are facing the camera and speaking.
          </p>
          <div className="flex gap-2">
            {(["link", "file"] as const).map((m) => (
              <Button key={m} type="button" size="pillSm" variant={form.video_mode === m ? "pill" : "pillSecondary"} onClick={() => set("video_mode", m)}>
                {m === "link" ? "Send a link" : "Upload a file"}
              </Button>
            ))}
          </div>
          {form.video_mode === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="video_url">Video link</Label>
              <Input id="video_url" type="url" className="h-11" placeholder="https://…" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="video_file">Video file (.mp4 or .mov, 200 MB maximum)</Label>
              <Input
                id="video_file"
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="h-11"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setUploadedPath(null);
                  setProgress(null);
                  if (f && f.size > 200 * 1024 * 1024) {
                    setError("The video is over 200 MB.");
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
                  <p className="text-xs text-brand-navySoft">{progress < 100 ? `Uploading… ${progress}%` : "Uploaded"}</p>
                </div>
              ) : null}
            </div>
          )}
        </FormSection>

        <FormSection title="How did you hear about us? *">
          <Textarea id="referral" rows={2} value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} />
          <p className="text-xs text-brand-navySoft">If a friend referred you, give their name and contact so we can thank them.</p>
        </FormSection>

        <FormSection title="Consent *">
          <label className="flex items-start gap-3 text-sm text-brand-navy">
            <Checkbox checked={form.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5" />
            <span>
              I agree that Sophia stores this application and contacts me about it.{" "}
              <Link to="/en/privacy" className="underline underline-offset-4">
                Privacy policy
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
            {busy ? (progress !== null && progress < 100 ? `Uploading ${progress}%…` : "Sending…") : "Submit my application"}
          </Button>
        </div>
      </form>
    </ApplyShell>
  );
}
