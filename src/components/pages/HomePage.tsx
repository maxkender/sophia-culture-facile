import {
  Check,
  Globe2,
  Landmark,
  FlaskConical,
  Users,
  Palette,
  Coins,
  BrainCog,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { PhoneMock } from "@/components/site/PhoneMock";
import { Laurel } from "@/components/site/Laurel";
import { Reveal } from "@/components/site/Reveal";
import { DownloadCta } from "@/components/site/DownloadCta";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { Faq } from "@/components/site/Faq";
import { TeacherAccessBand } from "@/components/site/TeacherAccessBand";
import {
  STAT_RANK_COUNTRY,
  STAT_RANK_YEAR,
  formatDownloads,
  formatRating,
} from "@/config/stats";
import { fill, useI18n } from "@/i18n";
import shotCours from "@/assets/shot-cours.png.asset.json";
import shotQuiz from "@/assets/shot-quiz.png.asset.json";
import shotProgression from "@/assets/shot-progression.png.asset.json";
import shotProfil from "@/assets/shot-profil.png.asset.json";

const CATEGORY_STYLE = [
  { icon: Landmark, tint: "bg-brand-blue/12 text-brand-navy" },
  { icon: FlaskConical, tint: "bg-brand-purple/15 text-brand-navy" },
  { icon: Users, tint: "bg-brand-pink/25 text-brand-navy" },
  { icon: Globe2, tint: "bg-brand-navy/10 text-brand-navy" },
  { icon: Palette, tint: "bg-brand-pink/20 text-brand-navy" },
  { icon: Coins, tint: "bg-brand-blue/10 text-brand-navy" },
  { icon: BrainCog, tint: "bg-brand-purple/12 text-brand-navy" },
  { icon: Star, tint: "bg-brand-navy/8 text-brand-navy" },
];

/* Captures réelles de l'application pour les deux premières fonctionnalités. */
const FEATURE_SHOTS = [shotCours.url, shotQuiz.url, shotProfil.url];

export function HomePage() {
  const { t, lang } = useI18n();

  const socialProof = [
    { value: formatDownloads(lang), label: t.stats.downloadsLabel },
    {
      value: `${formatRating(lang)} ${t.stats.ratingSuffix}`,
      label: t.stats.ratingLabel,
    },
    {
      value: t.stats.rankValue,
      label: t.stats.rankLabel,
      note: fill(t.stats.qualifier, { country: STAT_RANK_COUNTRY, year: STAT_RANK_YEAR }),
    },
  ];

  /* À REMPLACER PAR DE VRAIS AVIS : aucun faux témoignage ne doit être publié. */
  const testimonials = [0, 1, 2].map(() => ({
    name: t.testimonials.name,
    text: t.testimonials.text,
  }));

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />

        {/* Preuve sociale */}
        <section aria-label={t.stats.aria} className="bg-brand-surface pt-24 md:pt-32">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-start justify-center gap-x-6 gap-y-8 px-5">
            {socialProof.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <Laurel />
                <div className="max-w-[190px] text-center">
                  <p className="text-2xl font-extrabold text-brand-navy md:text-3xl">
                    {item.value}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-navySoft">
                    {item.label}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-navySoft/70">
                      {item.note}
                    </p>
                  ) : null}
                </div>
                <Laurel flip />
              </div>
            ))}
          </div>
        </section>

        {/* Ce que tu apprends */}
        <section aria-labelledby="apprends" className="mx-auto w-full max-w-6xl px-5 py-20">
          <Reveal>
            <h2
              id="apprends"
              className="text-3xl font-extrabold leading-tight text-brand-navy md:text-5xl"
            >
              {t.categories.title}
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-brand-navySoft">
              {t.categories.subtitle}
            </p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {t.categories.items.map((label, i) => {
              const style = CATEGORY_STYLE[i] ?? CATEGORY_STYLE[0]!;
              const Icon = style.icon;
              return (
                <li key={label}>
                  <Reveal delay={i * 40}>
                    <div
                      className={`flex items-center gap-3 rounded-2xl px-4 py-4 font-bold transition-transform duration-200 hover:-translate-y-1 hover:shadow-card ${style.tint}`}
                    >
                      <Icon aria-hidden="true" className="size-5 shrink-0" />
                      <span className="text-[13px] uppercase leading-tight tracking-wide">
                        {label}
                      </span>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Fonctionnalités en alternance */}
        <section aria-label={t.features.aria} className="mx-auto w-full max-w-6xl px-5 pb-8">
          {t.features.items.map((f, i) => (
            <div
              key={f.title}
              className={`grid items-center gap-10 py-14 md:grid-cols-2 md:gap-16 ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Reveal>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-pink">
                  {f.label}
                </p>
                <h3 className="mt-3 text-3xl font-extrabold leading-tight text-brand-navy md:text-[2.6rem]">
                  {f.title}
                </h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-brand-navySoft">
                  {f.text}
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 font-semibold text-brand-navy">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-pink/30">
                        <Check aria-hidden="true" className="size-3.5" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={80} className="flex justify-center">
                <PhoneMock src={FEATURE_SHOTS[i]} label={f.shot} alt={f.alt} width={250} />
              </Reveal>
            </div>
          ))}
        </section>

        {/* Progression / gamification */}
        <section
          aria-labelledby="progression"
          className="relative isolate overflow-hidden bg-brand-navy py-20"
        >
          <span aria-hidden="true" className="grid-texture absolute inset-0 -z-10" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
            <Reveal>
              <h2
                id="progression"
                className="text-3xl font-extrabold leading-tight text-brand-onNavy md:text-5xl"
              >
                {t.progress.title}
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-brand-onNavy/75">
                {t.progress.text}
              </p>
              <div className="mt-8 max-w-sm">
                <DownloadCta variant="pillLight" className="w-full">
                  {t.hero.cta}
                </DownloadCta>
              </div>
            </Reveal>
            <Reveal delay={80} className="flex justify-center">
              <PhoneMock
                src={shotProgression.url}
                label={t.progress.shot}
                alt={t.progress.shotAlt}
                width={260}
              />
            </Reveal>
          </div>
        </section>

        {/* Témoignages */}
        <section aria-labelledby="avis" className="mx-auto w-full max-w-6xl px-5 py-20">
          <Reveal>
            <h2
              id="avis"
              className="text-3xl font-extrabold leading-tight text-brand-navy md:text-5xl"
            >
              {t.testimonials.title}
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-brand-navySoft">
              {t.testimonials.subtitle}
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <li key={i}>
                <Reveal delay={i * 60}>
                  <div className="h-full rounded-3xl bg-card p-7 shadow-card">
                    <p className="text-[17px] font-semibold leading-relaxed text-brand-navy">
                      « {item.text} »
                    </p>
                    <p className="mt-5 text-sm text-brand-navySoft">{item.name}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mx-auto w-full max-w-3xl px-5 py-12">
          <h2
            id="faq"
            className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft"
          >
            {t.faqTitle}
          </h2>
          <Faq />
        </section>

        {/* À propos */}
        <section aria-labelledby="a-propos" className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2
            id="a-propos"
            className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft"
          >
            {t.about.title}
          </h2>
          <div className="mt-6 columns-1 gap-10 text-[14px] leading-relaxed text-brand-navySoft md:columns-2">
            {t.about.paragraphs.map((p) => (
              <p key={p} className="mb-4">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-brand-pink">
          <div className="mx-auto w-full max-w-4xl px-5 py-20 text-center">
            <h2 className="text-4xl font-extrabold leading-[1.05] text-brand-navy md:text-6xl">
              {t.finalCta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-brand-navy/80">
              {t.finalCta.text}
            </p>
            <div className="mx-auto mt-9 max-w-sm">
              <DownloadCta size="pillLg" className="w-full">
                {t.finalCta.cta}
              </DownloadCta>
            </div>
          </div>
        </section>
        <TeacherAccessBand />
      </main>
      <SiteFooter />
      <div className="h-20 md:hidden" aria-hidden="true" />
      <MobileCtaBar />
    </>
  );
}
