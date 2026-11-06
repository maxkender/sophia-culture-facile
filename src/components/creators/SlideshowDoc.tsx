import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/site/Logo";
import sophiaPlush from "@/assets/sophia-plush.png.asset.json";
import { useI18n, useLocalePath } from "@/i18n";
import { CONTACT_EMAIL } from "@/config/links";
import { useApps } from "@/lib/apps";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";

/** FR <-> EN counterpart of the slideshow recruiting pages (query string kept). */
const PAIRS: [string, string][] = [
  ["/en/creators/unswipe/slideshow", "/fr/createurs/unswipe/slideshow"],
  ["/en/creators/slideshow", "/fr/createurs/slideshow"],
  ["/en/slideshow-application", "/fr/candidature-slideshow"],
];

function DocLangSwitch() {
  const { lang } = useI18n();
  const loc = useLocation();
  const path = loc.pathname.replace(/\/$/, "");
  const pair = PAIRS.find(([en, fr]) => en === path || fr === path);
  const search = typeof window !== "undefined" ? window.location.search : "";
  const href = (l: "fr" | "en") => (pair ? (l === "en" ? pair[0] : pair[1]) + search : "#");
  return (
    <nav aria-label="Language" className="absolute right-4 top-4 flex gap-1 text-[13px] font-medium md:right-6 md:top-5">
      {(["fr", "en"] as const).map((l) => (
        <a
          key={l}
          href={href(l)}
          hrefLang={l}
          aria-current={lang === l ? "true" : undefined}
          className={`rounded px-2 py-1 ${lang === l ? "bg-doc-hover text-doc-ink" : "text-doc-muted hover:bg-doc-hover"}`}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}

export function DocAvatar({ app }: { app?: string | undefined }) {
  const { data: apps = [] } = useApps();
  const a = app && app !== "sophia" ? apps.find((x) => x.slug === app) : undefined;
  if (!app || app === "sophia") {
    return <Logo className="h-16 gap-3 [&>svg:first-child]:h-16 [&>svg:last-child]:h-11" />;
  }
  return (
    <div className="flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-doc-avatar text-doc-paper md:size-24">
      {a?.logo_path ? (
        <img src={a.logo_path} alt={a.name} className="size-full object-cover" />
      ) : a ? (
        <span className="text-[32px] font-bold md:text-[40px]">{a.name.charAt(0)}</span>
      ) : (
        <LogoMark className="doc-logo-white h-9 w-auto md:h-12" label="Sophia" />
      )}
    </div>
  );
}

export function DocShell({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const privacyPath = useLocalePath("privacy");
  const legalPath = useLocalePath("legal");
  return (
    <div lang={lang} className="relative flex min-h-screen flex-col overflow-x-hidden bg-doc-paper font-doc tracking-tight text-doc-ink antialiased">
      <DocLangSwitch />
      <main className="mx-auto w-full max-w-[700px] flex-1 px-4 pb-16 pt-8 md:pt-16">{children}</main>
      <footer className="mx-auto w-full max-w-[700px] px-4 pb-8 text-[13px] text-doc-muted">
        © Vik Studios SAS ·{" "}
        <Link to={privacyPath} className="hover:underline">{lang === "fr" ? "Confidentialité" : "Privacy"}</Link> ·{" "}
        <Link to={legalPath} className="hover:underline">{lang === "fr" ? "Mentions légales" : "Legal notice"}</Link> ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
      </footer>
    </div>
  );
}

export const docLink = "text-doc-link underline decoration-doc-link/40 underline-offset-2 hover:decoration-doc-link";
export const docButton =
  "inline-flex h-9 items-center gap-1 rounded-[6px] bg-doc-button px-4 text-[15px] font-medium text-doc-paper transition-opacity hover:opacity-85 disabled:opacity-40";

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-doc tracking-tight text-xl font-semibold">{children}</h2>;
}
function Sec({ children }: { children: ReactNode }) {
  return <section className="space-y-4 border-t border-doc-line pt-7">{children}</section>;
}

const withApp = (to: string, slug?: string) => (slug && slug !== "sophia" ? `${to}?app=${slug}` : to);

export function SlideshowDocLanding({ app }: { app?: string | undefined }) {
  const { lang } = useI18n();
  const applyPath = useLocalePath("creatorsSlideshowApply");
  const { data: apps = [] } = useApps();
  const a = app && app !== "sophia" ? apps.find((x) => x.slug === app) : undefined;
  const name = a?.name ?? "Sophia";
  const isSophia = !a;
  const [range, setRange] = useState<{ min: number; max: number } | null>(null);
  useEffect(() => {
    getSlideshowPayInfo({ data: {} }).then((r) => setRange(r.range)).catch(() => {});
  }, []);
  const min = range?.min ?? 7;
  const max = range?.max ?? 14;
  const fr = lang === "fr";
  const b = (s: string) => <strong className="font-semibold">{s}</strong>;
  const about = isSophia
    ? fr
      ? "Sophia est une application mobile qui aide à apprendre quelque chose de nouveau chaque jour : histoire, mythologie, art, littérature, sciences et monde d'aujourd'hui. Elle est éditée par Vik Studios SAS, une société française."
      : "Sophia is a mobile learning app that helps people learn something new every day: history, mythology, art, literature, science and today's world. It is published by Vik Studios SAS, a French company."
    : `${name}${a?.tagline ? ` (${a.tagline})` : ""}${a?.short_description ? `${fr ? " : " : ": "}${a.short_description}` : ""} ${fr ? `${name} est éditée par Vik Studios SAS, une société française.` : `${name} is published by Vik Studios SAS, a French company.`}`;
  const crit = fr
    ? ["Vous avez au moins 18 ans", "Vous avez un smartphone et une connexion internet fiable", "Vous pouvez publier 2 slideshows par jour, 7 jours sur 7", "Vous ne travaillez pas actuellement pour une application concurrente", "Vous acceptez de signer un court contrat avant de commencer"]
    : ["You are at least 18 years old", "You have a smartphone and a reliable internet connection", "You can post 2 slideshows a day, 7 days a week", "You don't currently work for a competing app", "You agree to sign a short agreement before you start"];
  const why = fr
    ? ["Un montant fixe chaque semaine : aucun objectif d'abonnés ni de vues.", "Tout est préparé pour vous : vous n'avez jamais à trouver d'idées.", ...(isSophia ? ["Nos slideshows font des centaines de milliers de vues ; certains ont dépassé le million de vues."] : []), "Vous travaillez d'où vous voulez, au moment qui vous arrange dans la journée."]
    : ["A fixed amount every week: no follower or view target.", "Everything is prepared for you: you never have to find ideas.", ...(isSophia ? ["Our slideshows reach hundreds of thousands of views; some have passed 1 million views."] : []), "You work from anywhere, whenever suits you during the day."];
  const highlightedPhrases = fr
    ? ["Pas de caméra, pas d'expérience nécessaire.", `${min} à ${max} $ par semaine`, "moins de 30 minutes par jour", "Un montant fixe chaque semaine", "certains ont dépassé le million de vues"]
    : ["No camera, no experience needed.", `$${min} to $${max} a week`, "under 30 minutes a day", "A fixed amount every week", "some have passed 1 million views"];
  const highlight = (text: string): ReactNode => {
    if (!isSophia) return text;
    const phrase = highlightedPhrases.find((p) => text.includes(p));
    if (!phrase) return text;
    const start = text.indexOf(phrase);
    return <>{text.slice(0, start)}<mark className="rounded-[3px] bg-doc-highlight px-[2px] text-inherit">{phrase}</mark>{text.slice(start + phrase.length)}</>;
  };
  const stats = fr
    ? [["500 000+", "utilisateurs"], ["4,8★", "sur l'App Store"], ["n°3", "en Éducation sur l'App Store (France, 2026)"], ["240+", "leçons dans 6 matières"]]
    : [["500,000+", "users"], ["4.8★", "on the App Store"], ["#3", "in Education on the App Store (France, 2026)"], ["240+", "lessons in 6 subjects"]];

  return (
    <DocShell>
      <DocAvatar app={app} />
      <div className="flow-root">
      {isSophia ? <img src={sophiaPlush.url} alt={fr ? "Sophia, notre mascotte hibou" : "Sophia, our owl mascot"} width={768} height={768} className="float-right ml-6 mt-6 hidden w-[220px] rounded-2xl md:block" /> : null}
      <h1 className="mt-6 font-doc tracking-tight text-[30px] font-bold leading-tight md:text-[40px]">
        {fr ? `Candidature créateur de slideshows ${name}` : `${name} Slideshow Creator Application`}
      </h1>
      {isSophia ? <img src={sophiaPlush.url} alt={fr ? "Sophia, notre mascotte hibou" : "Sophia, our owl mascot"} width={768} height={768} className="mx-auto mt-5 block w-[180px] rounded-2xl md:hidden" /> : null}
        <div className="mt-6 space-y-4 text-[17px] leading-[1.6]">
          {fr ? (
            <p>En tant que {b("créateur de slideshows")}, vous publiez 2 slideshows par jour sur un compte TikTok pour {b(name)}, depuis votre téléphone. Tout est préparé pour vous : les slides, la légende et la musique. Vous assemblez et vous publiez. {highlight("Pas de caméra, pas d'expérience nécessaire.")}</p>
          ) : (
            <p>As a {b("slideshow creator")}, you post 2 slideshows a day on a TikTok account for {b(name)}, from your phone. Everything is prepared for you: the slides, the caption and the music. You assemble and publish. {highlight("No camera, no experience needed.")}</p>
          )}
          {fr ? (
            <p>Vous êtes payé·e {b("chaque lundi")} : un montant fixe de <strong className="font-semibold">{highlight(`${min} à ${max} $ par semaine`)}</strong> selon votre pays (1 $ de plus la première semaine), via Ruul.</p>
          ) : (
            <p>You are paid {b("every Monday")}: a fixed amount of <strong className="font-semibold">{highlight(`$${min} to $${max} a week`)}</strong> depending on your country ($1 extra your first week), through Ruul.</p>
          )}
          <p>{b(fr ? "Nous répondons par email, dans votre langue." : "We reply by email, in your language.")} {fr ? "Nous ouvrons les places pays par pays." : "We open places country by country."}</p>
        </div>
      </div>
      <div className="mt-7 space-y-7 text-[17px] leading-[1.6]">
        {isSophia ? <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([number, label]) => <div key={number} className="rounded-lg bg-doc-callout p-3"><dt className="text-[24px] font-bold leading-tight">{number}</dt><dd className="mt-2 text-[13px] leading-[1.5] text-doc-muted">{label}</dd></div>)}</dl> : null}
        <Sec>
          <H2>{fr ? "Qui sommes-nous" : "About us"}</H2>
          <p>{about}</p>
          {isSophia ? <p>{highlight(fr ? "Nos slideshows sont publiés dans de nombreuses langues, et certains ont dépassé le million de vues." : "Our slideshows are posted in many languages, and some have passed 1 million views.")}</p> : null}
        </Sec>
        <Sec>
          <H2>{fr ? "Ce que vous ferez" : "What you'll be doing"}</H2>
          <p>{fr ? `Nous vous donnons une identité TikTok (nom, photo, bio). Vous créez le compte sur votre téléphone et vous le chauffez quelques jours, exactement comme nous vous l'indiquons. Le compte appartient à ${name} ; c'est vous qui le faites vivre.` : `We give you a TikTok identity (name, photo, bio). You create the account on your phone and warm it up for a few days, exactly as we tell you. The account belongs to ${name}; you run it.`}</p>
          <p>{highlight(fr ? "Ensuite, chaque jour, 2 slideshows vous attendent dans votre espace. Vous les publiez sur TikTok et vous collez les liens. C'est tout : moins de 30 minutes par jour." : "Then, every day, 2 slideshows are waiting for you in your dashboard. You post them on TikTok and paste the links. That's it: under 30 minutes a day.")}</p>
          <p>{fr ? "Une question ? Notre équipe vous répond sur Slack." : "Questions? Our team answers you on Slack."}</p>
        </Sec>
        <Sec>
          <H2>{fr ? "Qui nous cherchons" : "Who we're looking for"}</H2>
          <p>
            {fr ? "Des personnes qui veulent une tâche simple et régulière, faisable depuis leur téléphone, et qui suivent les consignes à la lettre." : "People who want a simple, regular task they can do from their phone, and who follow instructions to the letter."}{" "}
            {b(fr ? "Vous n'apparaissez pas à l'écran et aucune expérience n'est nécessaire." : "You don't appear on camera and you don't need any experience.")}
          </p>
          <p>{b(fr ? "Merci de ne pas postuler si vous ne remplissez pas ces critères." : "Please do not apply if you don't meet the following criteria.")}</p>
          <ul className="list-disc space-y-1 pl-6">{crit.map((c) => <li key={c}>{c}</li>)}</ul>
        </Sec>
        <Sec>
          <H2>{fr ? `Pourquoi ${name} ?` : `Why ${name}?`}</H2>
          {why.map((w) => <p key={w}>{highlight(w)}</p>)}
        </Sec>
        <div className="border-t border-doc-line pt-7">
          <p>{fr ? "Une minute, pas de vidéo." : "One minute, no video needed."}</p>
          {a ? (
            <a href={withApp(applyPath, app)} className={`${docButton} mt-4`}>{fr ? "Postuler (1 min) →" : "Apply now (1 min) →"}</a>
          ) : (
            <Link to={applyPath} className={`${docButton} mt-4`}>{fr ? "Postuler (1 min) →" : "Apply now (1 min) →"}</Link>
          )}
        </div>
      </div>
    </DocShell>
  );
}
