import { Link } from "@tanstack/react-router";
import { Camera, Check, Layers, Megaphone } from "lucide-react";
import { INFLUENCER_COPY } from "@/i18n/influencers";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { useI18n, useLocalePath } from "@/i18n";
import { CREATORS } from "@/i18n/creators";
import { useEffect } from "react";
import { trackFunnel } from "@/lib/funnel-events";
import { useApps } from "@/lib/apps";

/** Brand band shown on app-specific creator pages (e.g. UnSwipe). */
function AppBand({ slug }: { slug?: string | undefined }) {
  const { lang } = useI18n();
  const { data: apps = [] } = useApps();
  const app = apps.find((a) => a.slug === slug);
  if (!slug || slug === "sophia" || !app) return null;
  return (
    <section className="border-b border-brand-line bg-card">
      <div className="mx-auto flex w-full max-w-3xl items-start gap-4 px-5 py-6">
        {app.logo_path ? <img src={app.logo_path} alt="" className="size-12 rounded-xl object-cover" /> : null}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{lang === "fr" ? "Programme créateurs" : "Creator programme"} · Vik Studios</p>
          <p className="text-2xl font-extrabold text-brand-navy">{app.name}{app.tagline ? <span className="font-semibold text-brand-navySoft"> · {app.tagline}</span> : null}</p>
          {app.short_description ? <p className="mt-2 text-[15px] leading-relaxed text-brand-navySoft">{app.short_description}</p> : null}
        </div>
      </div>
    </section>
  );
}
const withApp = (to: string, slug?: string) => (slug && slug !== "sophia" ? `${to}?app=${slug}` : to);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-surface">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-10 md:py-14">
      <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-brand-navySoft">{children}</div>
    </section>
  );
}

function Hero({ title, subtitle, cta, to, note, app }: { app?: string | undefined; title: string; subtitle: string; cta: string; to: "/fr/candidature-ugc" | "/en/ugc-application" | "/fr/candidature-slideshow" | "/en/slideshow-application" | "/fr/candidature-influenceur" | "/en/influencer-application"; note?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-navy">
      <span aria-hidden="true" className="grid-texture absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
        <h1 className="h1-hero font-extrabold text-brand-onNavy">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-onNavy/75 md:text-lg">{subtitle}</p>
        <div className="mt-8 max-w-sm">
          <Button asChild variant="pillLight" size="pillLg" className="w-full">
            {app ? <a href={withApp(to, app)}>{cta}</a> : <Link to={to}>{cta}</Link>}
          </Button>
          {note ? <p className="mt-3 text-center text-xs text-brand-onNavy/60">{note}</p> : null}
        </div>
      </div>
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-brand-navy">
          <Check aria-hidden="true" className="mt-1 size-4 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CreatorsChooserPage({ app }: { app?: string | undefined } = {}) {
  const { lang } = useI18n();
  const c = CREATORS[lang].chooser;
  const ugcPath = useLocalePath("creatorsUgc");
  const slidePath = useLocalePath("creatorsSlideshow");
  const inflPath = useLocalePath("creatorsInfluencer");
  const cards = [
    { ...c.ugc, icon: Camera, to: ugcPath, track: "ugc", appTo: `${lang === "fr" ? "/fr/createurs" : "/en/creators"}/${app}/ugc` },
    { ...c.slideshow, icon: Layers, to: slidePath, track: "slideshow", appTo: `${lang === "fr" ? "/fr/createurs" : "/en/creators"}/${app}/slideshow` },
    { ...INFLUENCER_COPY[lang].card, icon: Megaphone, to: inflPath, track: "influencer", appTo: `${lang === "fr" ? "/fr/createurs" : "/en/creators"}/${app}/${lang === "fr" ? "influenceur" : "influencer"}` },
  ];
  useEffect(() => trackFunnel("creators_page_view", { lang }), [lang]);
  return (
    <Shell>
      <AppBand slug={app} />
      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-navy md:text-5xl">{c.title}</h1>
        <p className="mt-4 text-lg text-brand-navySoft">{c.lead}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="flex flex-col rounded-3xl bg-card p-7 shadow-card">
                <Icon aria-hidden="true" className="size-7 text-brand-navy" />
                <h2 className="mt-4 text-2xl font-extrabold text-brand-navy">{card.title}</h2>
                <div className="mt-4 flex-1 space-y-3 text-[15px] leading-relaxed text-brand-navySoft">
                  {card.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <Button asChild variant="pill" size="pill" className="mt-6 w-full whitespace-normal text-center">
                  {app ? <a href={card.appTo} onClick={() => trackFunnel("track_selected", { track: card.track, app })}>{card.cta}</a> : <Link to={card.to} data-funnel="track_selected" data-track={card.track} onClick={() => trackFunnel("track_selected", { track: card.track })}>{card.cta}</Link>}
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

export function UgcLandingPage({ app }: { app?: string | undefined } = {}) {
  const { lang } = useI18n();
  const u = CREATORS[lang].ugc;
  const applyPath = useLocalePath("creatorsUgcApply");
  return (
    <Shell>
      <AppBand slug={app} />
      <Hero app={app} title={u.heroTitle} subtitle={u.heroSubtitle} cta={u.cta} to={applyPath} note={u.replyLine} />
      <Section title={u.aboutTitle}>
        <p>{u.about}</p>
      </Section>
      <Section title={u.doingTitle}>
        {u.doing.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Section>
      <Section title={u.whoTitle}>
        <p>{u.who}</p>
        <p className="pt-2 font-bold text-brand-navy">{u.onlyIf}</p>
        <CheckList items={u.requirements} />
      </Section>
      <Section title={u.whyTitle}>
        <CheckList items={u.why} />
      </Section>
      <section className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6">
        <div className="rounded-3xl bg-card p-7 shadow-card">
          <p className="text-[17px] font-semibold text-brand-navy">{u.bottom}</p>
          <Button asChild variant="pill" size="pill" className="mt-5">
            {app ? <a href={withApp(applyPath, app)}>{u.cta}</a> : <Link to={applyPath}>{u.cta}</Link>}
          </Button>
        </div>
      </section>
    </Shell>
  );
}

export function SlideshowLandingPage({ app }: { app?: string | undefined } = {}) {
  const { lang } = useI18n();
  const s = CREATORS[lang].slideshow;
  const applyPath = useLocalePath("creatorsSlideshowApply");
  return (
    <Shell>
      <AppBand slug={app} />
      <Hero app={app} title={s.heroTitle} subtitle={s.heroSubtitle} cta={s.cta} to={applyPath} />
      <Section title={s.howTitle}>
        <ol className="space-y-3">
          {s.steps.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-brand-onNavy">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section title={s.paidTitle}>
        <p>{s.paid}</p>
      </Section>
      <Section title={s.forTitle}>
        <p>{s.forText}</p>
      </Section>
      <Section title={s.reqTitle}>
        <CheckList items={s.requirements} />
      </Section>
      <section className="mx-auto w-full max-w-3xl px-5 pb-20 pt-2">
        <Button asChild variant="pill" size="pill">
          {app ? <a href={withApp(applyPath, app)}>{s.cta}</a> : <Link to={applyPath}>{s.cta}</Link>}
        </Button>
      </section>
    </Shell>
  );
}

export function InfluencerLandingPage({ app }: { app?: string | undefined } = {}) {
  const { lang } = useI18n();
  const s = INFLUENCER_COPY[lang];
  const applyPath = useLocalePath("creatorsInfluencerApply");
  return (
    <Shell>
      <AppBand slug={app} />
      <Hero app={app} title={s.heroTitle} subtitle={s.heroSubtitle} cta={s.cta} to={applyPath} />
      <Section title={s.howTitle}>
        <ol className="space-y-3">
          {s.steps.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-brand-onNavy">{i + 1}</span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section title={s.buyTitle}>
        <CheckList items={s.buy} />
      </Section>
      <Section title={s.whoTitle}>
        <p>{s.who}</p>
      </Section>
      <Section title={s.reqTitle}>
        <CheckList items={s.requirements} />
      </Section>
      <section className="mx-auto w-full max-w-3xl px-5 pb-20 pt-2">
        <Button asChild variant="pill" size="pill">
          {app ? <a href={withApp(applyPath, app)}>{s.cta}</a> : <Link to={applyPath}>{s.cta}</Link>}
        </Button>
      </section>
    </Shell>
  );
}
