import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createMediaKitUploadSlot, submitInfluencerApplication } from "@/lib/influencer-apply.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "./CountrySelect";
import { ApplyShell, Confirmation, FormSection, Honeypot, YesNo } from "./ApplyShell";
import { useI18n, useLocalePath } from "@/i18n";
import { CREATOR_FORMS } from "@/i18n/creator-forms";
import { INFLUENCER_COPY, NICHES, POST_LANGUAGES } from "@/i18n/influencers";
import { isHttpUrl, isValidEmail, isValidInternationalPhone } from "@/lib/creator-validation";

const T = {
  en: {
    title: "Apply as an influencer", lead: "Takes about five minutes. We reply to every application.",
    about: "About you", city: "City", platforms: "Your platforms", platformsHelp: "Give at least one. Add the follower count for every platform you give.",
    tiktok: "TikTok profile link", tiktokF: "TikTok followers", insta: "Instagram profile link", instaF: "Instagram followers", yt: "YouTube channel link", ytF: "YouTube subscribers",
    avgViews: "Average views on your last 10 TikToks", content: "Your content", niches: "Niches (up to 4)", langs: "Languages you post in",
    rates: "Rates and partnership", rateTiktok: "Your rate per TikTok post (€)", rateReel: "Your rate per Instagram Reel (€, optional)",
    recurring: "Would you accept a monthly partnership?", yes: "Yes", no: "No", depends: "Depends",
    kit: "Media kit (optional)", kitFile: "Upload a PDF or image", kitUrl: "Or a link to your media kit",
    proud: "Posts you are proud of", proudHelp: "At least one link.", agency: "Are you represented by an agency?", agencyName: "Agency name", agencyContact: "Agency contact (name, email or phone)",
    referral: "How did you hear about us?", done: "Thank you. Your application has been received. We will be in touch.",
    errPlatform: "Add at least one platform: TikTok, Instagram or YouTube.", errUrl: "Enter complete links beginning with https://.",
    errCount: "Add the follower count for every platform you gave.", errViews: "Add your average views on your last 10 TikToks.",
    errNiche: "Choose between one and four niches.", errLang: "Choose at least one language you post in.", errRate: "Enter your rate per TikTok post in euros.",
    errProud: "Add at least one link to a post you are proud of.", errAgency: "Add the agency's name and contact.", errKit: "The media kit must be a PDF or image under 20 MB.",
    underage: "You must be at least 18 to apply.",
  },
  fr: {
    title: "Postuler comme influenceur", lead: "Environ cinq minutes. Nous répondons à chaque candidature.",
    about: "Vous", city: "Ville", platforms: "Vos plateformes", platformsHelp: "Au moins une. Indiquez le nombre d'abonnés pour chaque plateforme renseignée.",
    tiktok: "Lien du profil TikTok", tiktokF: "Abonnés TikTok", insta: "Lien du profil Instagram", instaF: "Abonnés Instagram", yt: "Lien de la chaîne YouTube", ytF: "Abonnés YouTube",
    avgViews: "Vues moyennes sur vos 10 derniers TikToks", content: "Votre contenu", niches: "Thématiques (4 maximum)", langs: "Langues dans lesquelles vous publiez",
    rates: "Tarifs et partenariat", rateTiktok: "Votre tarif par post TikTok (€)", rateReel: "Votre tarif par Reel Instagram (€, facultatif)",
    recurring: "Accepteriez-vous un partenariat mensuel ?", yes: "Oui", no: "Non", depends: "Ça dépend",
    kit: "Media kit (facultatif)", kitFile: "Téléverser un PDF ou une image", kitUrl: "Ou un lien vers votre media kit",
    proud: "Des posts dont vous êtes fier", proudHelp: "Au moins un lien.", agency: "Êtes-vous représenté par une agence ?", agencyName: "Nom de l'agence", agencyContact: "Contact de l'agence (nom, e-mail ou téléphone)",
    referral: "Comment nous avez-vous connus ?", done: "Merci. Votre candidature a bien été reçue. Nous vous recontacterons.",
    errPlatform: "Ajoutez au moins une plateforme : TikTok, Instagram ou YouTube.", errUrl: "Saisissez des liens complets commençant par https://.",
    errCount: "Indiquez le nombre d'abonnés pour chaque plateforme renseignée.", errViews: "Indiquez vos vues moyennes sur vos 10 derniers TikToks.",
    errNiche: "Choisissez entre une et quatre thématiques.", errLang: "Choisissez au moins une langue de publication.", errRate: "Indiquez votre tarif par post TikTok en euros.",
    errProud: "Ajoutez au moins un lien vers un post dont vous êtes fier.", errAgency: "Indiquez le nom et le contact de l'agence.", errKit: "Le media kit doit être un PDF ou une image de moins de 20 Mo.",
    underage: "Vous devez avoir au moins 18 ans pour postuler.",
  },
};

const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/\s/g, "")))));

export function InfluencerApplyPage() {
  const { lang } = useI18n();
  const t = T[lang];
  const c = INFLUENCER_COPY[lang];
  const { common } = CREATOR_FORMS[lang];
  const privacyPath = useLocalePath("privacy");
  const submitFn = useServerFn(submitInfluencerApplication);
  const slotFn = useServerFn(createMediaKitUploadSlot);
  const [f, setF] = useState({
    full_name: "", email: "", phone: "", country: "", city: "", age: "",
    tiktok_url: "", tiktok_followers: "", instagram_url: "", instagram_followers: "", youtube_url: "", youtube_subscribers: "",
    tiktok_avg_views: "", rate_tiktok: "", rate_reel: "", media_kit_url: "", proud1: "", proud2: "", proud3: "",
    agency_name: "", agency_contact: "", referral: "",
  });
  const [niches, setNiches] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [recurring, setRecurring] = useState<"" | "yes" | "no" | "depends">("");
  const [agency, setAgency] = useState<"" | "yes" | "no">("");
  const [kit, setKit] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (list: string[], v: string, max: number, setter: (l: string[]) => void) =>
    setter(list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);
  const underage = f.age !== "" && Number(f.age) < 18;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (underage) return setError(t.underage);
    if (!f.full_name.trim() || !f.email.trim() || !f.phone.trim() || !f.country || !f.city.trim() || !f.age || !recurring || !agency) return setError(common.requiredError);
    if (!isValidEmail(f.email)) return setError(common.emailError);
    if (!isValidInternationalPhone(f.phone)) return setError(common.phoneError);
    const urls = [f.tiktok_url, f.instagram_url, f.youtube_url].map((u) => u.trim());
    if (!urls.some(Boolean)) return setError(t.errPlatform);
    const proud = [f.proud1, f.proud2, f.proud3].map((u) => u.trim()).filter(Boolean);
    if ([...urls.filter(Boolean), ...proud, f.media_kit_url.trim()].filter(Boolean).some((u) => !isHttpUrl(u))) return setError(t.errUrl);
    if ((urls[0] && num(f.tiktok_followers) == null) || (urls[1] && num(f.instagram_followers) == null) || (urls[2] && num(f.youtube_subscribers) == null)) return setError(t.errCount);
    if (urls[0] && num(f.tiktok_avg_views) == null) return setError(t.errViews);
    if (niches.length < 1) return setError(t.errNiche);
    if (langs.length < 1) return setError(t.errLang);
    const rate = num(f.rate_tiktok);
    if (rate == null || !Number.isFinite(rate)) return setError(t.errRate);
    if (!proud.length) return setError(t.errProud);
    if (agency === "yes" && (!f.agency_name.trim() || !f.agency_contact.trim())) return setError(t.errAgency);
    if (!consent) return setError(common.consentError);
    setBusy(true);
    try {
      let media_kit_path: string | undefined;
      if (kit) {
        const slot = await slotFn({ data: { name: kit.name, size: kit.size } });
        if (!slot.ok) { setError(t.errKit); return; }
        const up = await fetch(slot.signedUrl, { method: "PUT", body: kit, headers: { "content-type": kit.type || "application/octet-stream", "x-upsert": "false" } });
        if (!up.ok) { setError(common.genericError); return; }
        media_kit_path = slot.path;
      }
      const res = await submitFn({
        data: { app: new URLSearchParams(window.location.search).get("app") ?? undefined,
          website: honey, full_name: f.full_name, email: f.email, phone: f.phone, country: f.country, city: f.city, age: Number(f.age),
          tiktok_url: urls[0], tiktok_followers: num(f.tiktok_followers), instagram_url: urls[1], instagram_followers: num(f.instagram_followers),
          youtube_url: urls[2], youtube_subscribers: num(f.youtube_subscribers), niche_tags: niches as never, languages: langs,
          tiktok_avg_views: num(f.tiktok_avg_views), rate_tiktok: rate, rate_reel: num(f.rate_reel), accepts_recurring: recurring,
          media_kit_path, media_kit_url: f.media_kit_url.trim(), proud_links: proud, has_agency: agency === "yes",
          agency_name: f.agency_name, agency_contact: f.agency_contact, referral_source: f.referral, consent: true,
        },
      });
      if (res.ok) setDone(true);
      else setError(res.reason === "rate" ? common.rateError : common.genericError);
    } catch {
      setError(common.genericError);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <ApplyShell title={ct(t.title)}><Confirmation text={t.done} /></ApplyShell>;

  const field = (id: keyof typeof f, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-11" value={f[id]} onChange={(e) => set(id, e.target.value)} {...props} />
    </div>
  );
  const chips = (all: readonly string[], labels: Record<string, string>, list: string[], max: number, setter: (l: string[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {all.map((v) => {
        const on = list.includes(v);
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => toggle(list, v, max, setter)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${on ? "border-brand-navy bg-brand-navy text-brand-onNavy" : "border-brand-line bg-card text-brand-navy"}`}>
            {labels[v] ?? v}
          </button>
        );
      })}
    </div>
  );

  return (
    <ApplyShell title={ct(t.title)} lead={ct(t.lead)}>
      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8">
        <Honeypot value={honey} onChange={setHoney} />
        <FormSection title={t.about}>
          {field("full_name", common.fullName, { autoComplete: "name" })}
          {field("email", common.email, { type: "email", autoComplete: "email" })}
          {field("phone", common.phone, { type: "tel", autoComplete: "tel", placeholder: "+33 6 12 34 56 78" })}
          <div className="grid gap-2">
            <Label htmlFor="country">{common.country}</Label>
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} lang={lang} labels={{ select: common.selectCountry, search: common.searchCountry, empty: common.noCountry }} />
          </div>
          {field("city", t.city, { autoComplete: "address-level2" })}
          {field("age", common.age, { type: "number", inputMode: "numeric", min: 18 })}
          {underage ? <p className="text-sm font-semibold text-portal-red">{t.underage}</p> : null}
        </FormSection>

        <FormSection title={t.platforms}>
          <p className="text-sm text-brand-navySoft">{t.platformsHelp}</p>
          {field("tiktok_url", t.tiktok, { type: "url", placeholder: "https://www.tiktok.com/@…" })}
          {field("tiktok_followers", t.tiktokF, { inputMode: "numeric" })}
          {f.tiktok_url.trim() ? field("tiktok_avg_views", t.avgViews, { inputMode: "numeric" }) : null}
          {field("instagram_url", t.insta, { type: "url", placeholder: "https://www.instagram.com/…" })}
          {field("instagram_followers", t.instaF, { inputMode: "numeric" })}
          {field("youtube_url", t.yt, { type: "url", placeholder: "https://www.youtube.com/@…" })}
          {field("youtube_subscribers", t.ytF, { inputMode: "numeric" })}
        </FormSection>

        <FormSection title={t.content}>
          <div className="grid gap-2"><Label>{t.niches}</Label>{chips(NICHES, c.niches, niches, 4, setNiches)}</div>
          <div className="grid gap-2"><Label>{t.langs}</Label>{chips(POST_LANGUAGES, c.languages, langs, 10, setLangs)}</div>
          <div className="grid gap-2">
            <Label>{t.proud}</Label>
            <p className="text-xs text-brand-navySoft">{t.proudHelp}</p>
            {(["proud1", "proud2", "proud3"] as const).map((k) => (
              <Input key={k} type="url" className="h-11" placeholder="https://…" value={f[k]} onChange={(e) => set(k, e.target.value)} aria-label={t.proud} />
            ))}
          </div>
        </FormSection>

        <FormSection title={t.rates}>
          {field("rate_tiktok", t.rateTiktok, { inputMode: "numeric" })}
          {field("rate_reel", t.rateReel, { inputMode: "numeric" })}
          <div className="grid gap-2">
            <Label>{t.recurring}</Label>
            <div className="flex flex-wrap gap-2">
              {(["yes", "no", "depends"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={recurring === v} onClick={() => setRecurring(v)}
                  className={`min-h-11 rounded-full border px-5 text-sm font-semibold ${recurring === v ? "border-brand-navy bg-brand-navy text-brand-onNavy" : "border-brand-line bg-card text-brand-navy"}`}>
                  {t[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kit">{t.kitFile}</Label>
            <Input id="kit" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="h-11" onChange={(e) => setKit(e.target.files?.[0] ?? null)} />
          </div>
          {field("media_kit_url", t.kitUrl, { type: "url", placeholder: "https://…" })}
          <div className="grid gap-2">
            <Label>{t.agency}</Label>
            <YesNo id="agency" value={agency} onChange={setAgency} yes={common.yes} no={common.no} />
          </div>
          {agency === "yes" ? (<>{field("agency_name", t.agencyName)}{field("agency_contact", t.agencyContact)}</>) : null}
          <div className="grid gap-2">
            <Label htmlFor="referral">{t.referral}</Label>
            <Textarea id="referral" value={f.referral} onChange={(e) => set("referral", e.target.value)} />
          </div>
        </FormSection>

        <div className="flex items-start gap-3">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1" />
          <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
            {common.consentText} <Link to={privacyPath} className="underline">{common.privacy}</Link>
          </Label>
        </div>
        {error ? <p role="alert" className="text-sm font-semibold text-portal-red">{error}</p> : null}
        <Button type="submit" variant="pill" size="pillLg" disabled={busy || underage}>{busy ? common.sending : common.submit}</Button>
      </form>
    </ApplyShell>
  );
}
