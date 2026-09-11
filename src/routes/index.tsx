import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Flame,
  Trophy,
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
import { SOCIAL_PROOF } from "@/config/stats";
import {
  faqSchema,
  ldScript,
  meta,
  canonical,
  mobileApplicationSchema,
  organizationSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: meta({
      title: "Sophia — Culture générale | L'application pour apprendre chaque jour",
      description:
        "Sophia — Culture générale est l'application mobile française gratuite pour apprendre la culture générale chaque jour : cours courts, quiz et révision quotidienne. iOS et Android.",
      url: "/",
    }),
    links: [canonical("/")],
    scripts: [
      ldScript(mobileApplicationSchema),
      ldScript(organizationSchema),
      ldScript(faqSchema),
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  { icon: Landmark, label: "Histoire", tint: "bg-brand-blue/12 text-brand-navy" },
  { icon: FlaskConical, label: "Sciences", tint: "bg-brand-purple/15 text-brand-navy" },
  { icon: Users, label: "Société", tint: "bg-brand-pink/25 text-brand-navy" },
  { icon: Globe2, label: "Géopolitique", tint: "bg-brand-navy/10 text-brand-navy" },
  { icon: Palette, label: "Culture", tint: "bg-brand-pink/20 text-brand-navy" },
  { icon: Coins, label: "Économie", tint: "bg-brand-blue/10 text-brand-navy" },
  { icon: BrainCog, label: "Philosophie", tint: "bg-brand-purple/12 text-brand-navy" },
  { icon: Star, label: "Arts", tint: "bg-brand-navy/8 text-brand-navy" },
];

const FEATURES = [
  {
    label: "Les cours",
    title: "Des cours qui se lisent en 5 minutes",
    text: "Chaque dossier se découpe en cinq chapitres courts. Tu avances par petites touches, sans jamais y passer ta soirée.",
    bullets: ["Dossiers de 5 chapitres", "Sources citées", "Images d'illustration"],
    shot: "Cours",
    alt: "Un chapitre de cours dans Sophia — Culture générale",
  },
  {
    label: "Les quiz",
    title: "Un quiz après chaque cours",
    text: "Tu réponds juste après avoir lu. C'est là que ce que tu viens de lire devient quelque chose que tu retiens vraiment.",
    bullets: ["Questions immédiates", "Correction expliquée", "Score par chapitre"],
    shot: "Quiz",
    alt: "Un quiz de culture générale dans l'application Sophia",
  },
  {
    label: "L'habitude",
    title: "Une série qui te fait revenir",
    text: "Un entraînement quotidien de quelques minutes suffit. La révision espacée ramène les bonnes notions au bon moment.",
    bullets: ["Entraînement quotidien", "Révision espacée", "Rangs à débloquer"],
    shot: "Progression",
    alt: "Suivi de progression et série de jours dans Sophia",
  },
];

/* À REMPLACER PAR DE VRAIS AVIS — aucun faux témoignage ne doit être publié. */
const TESTIMONIALS = [
  { name: "Prénom À REMPLACER", text: "Témoignage à remplacer" },
  { name: "Prénom À REMPLACER", text: "Témoignage à remplacer" },
  { name: "Prénom À REMPLACER", text: "Témoignage à remplacer" },
];

function Home() {
  return (
    <>
      <SiteHeader overDark />
      <main>
        <Hero />

        {/* Preuve sociale */}
        <section aria-label="Chiffres clés" className="bg-brand-surface pt-24 md:pt-32">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-6 px-5">
            {SOCIAL_PROOF.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <Laurel />
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-brand-navy md:text-3xl">{item.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-navySoft">
                    {item.label}
                  </p>
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
              Ce que tu apprends
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-brand-navySoft">
              Huit domaines de culture générale, découpés en dossiers courts.
            </p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map(({ icon: Icon, label, tint }, i) => (
              <li key={label}>
                <Reveal delay={i * 40}>
                  <div
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 font-bold transition-transform duration-200 hover:-translate-y-1 hover:shadow-card ${tint}`}
                  >
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    <span className="text-[13px] uppercase leading-tight tracking-wide">{label}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* Fonctionnalités en alternance */}
        <section aria-label="Fonctionnalités" className="mx-auto w-full max-w-6xl px-5 pb-8">
          {FEATURES.map((f, i) => (
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
                <PhoneMock label={f.shot} alt={f.alt} width={250} />
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
                Ta progression, jour après jour.
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-brand-onNavy/75">
                Une série de jours à entretenir, des rangs à débloquer, de Curieux à Érudit.
              </p>
              <div className="mt-8 max-w-sm">
                <DownloadCta variant="pillLight" className="w-full">
                  Télécharger gratuitement
                </DownloadCta>
              </div>
            </Reveal>
            <Reveal delay={80} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-3xl bg-brand-onNavy/10 p-5 ring-1 ring-white/10">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-pink/30 text-brand-pink">
                  <Flame aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-brand-onNavy">Série en cours</p>
                  <p className="text-sm text-brand-onNavy/70">
                    Reviens chaque jour pour ne pas la briser.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-pink/30 text-brand-navy">
                  <Trophy aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-brand-navy">Nouveau rang ! Érudit</p>
                  <p className="text-sm text-brand-navySoft">
                    Débloqué en révisant tes chapitres chaque jour.
                  </p>
                </div>
              </div>
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
              Ils apprennent avec Sophia
            </h2>
            {/* À REMPLACER PAR DE VRAIS AVIS D'UTILISATEURS */}
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-brand-navySoft">
              Contenu provisoire — à remplacer par de vrais avis
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <li key={i}>
                <Reveal delay={i * 60}>
                  <div className="h-full rounded-3xl bg-card p-7 shadow-card">
                    <p className="text-[17px] font-semibold leading-relaxed text-brand-navy">
                      « {t.text} »
                    </p>
                    <p className="mt-5 text-sm text-brand-navySoft">{t.name}</p>
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
            Questions fréquentes
          </h2>
          <Faq />
        </section>

        {/* À propos */}
        <section aria-labelledby="a-propos" className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2
            id="a-propos"
            className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft"
          >
            À propos de Sophia
          </h2>
          <div className="mt-6 columns-1 gap-10 text-[14px] leading-relaxed text-brand-navySoft md:columns-2">
            <p className="mb-4">
              Sophia — Culture générale est une application mobile d'apprentissage de la culture
              générale, entièrement en français. L'application propose des cours courts, des quiz et
              un entraînement quotidien. Elle s'adresse à toute personne qui veut apprendre un peu
              chaque jour, sans y consacrer plus de dix minutes.
            </p>
            <p className="mb-4">
              Sophia — Culture générale est éditée par Vik Studios SAS, une société française. Vik
              Studios SAS conçoit et rédige l'ensemble des contenus de l'application. L'éditeur est
              établi en France et publie l'application sous son propre nom.
            </p>
            <p className="mb-4">
              Le téléchargement de Sophia — Culture générale est gratuit. L'application est
              disponible sur iPhone et iPad via l'App Store d'Apple, et sur les smartphones et
              tablettes Android via le Google Play Store. Aucun matériel particulier n'est
              nécessaire : un téléphone récent suffit.
            </p>
            <p className="mb-4">
              Les contenus de Sophia — Culture générale couvrent cinq grands domaines : l'histoire,
              les sciences, la société, la géopolitique et la culture. Chaque domaine est découpé en
              dossiers thématiques de cinq chapitres. Un chapitre se lit en quelques minutes et se
              termine par un quiz.
            </p>
            <p className="mb-4">
              Le fonctionnement de Sophia — Culture générale repose sur trois étapes : lire un
              chapitre court, répondre à un quiz, puis réviser plus tard grâce à la répétition
              espacée. La progression est mesurée par une série de jours consécutifs et par des
              rangs, de Curieux à Érudit. L'objectif est de transformer l'apprentissage en habitude
              quotidienne plutôt qu'en effort ponctuel.
            </p>
            <p className="mb-4">
              Sophia — Culture générale est une application mobile d'apprentissage. Elle n'a aucun
              lien avec le robot humanoïde Sophia, avec l'université Sophia de Tokyo, ni avec le
              programme sophia de l'Assurance Maladie.
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-brand-pink">
          <div className="mx-auto w-full max-w-4xl px-5 py-20 text-center">
            <h2 className="text-4xl font-extrabold leading-[1.05] text-brand-navy md:text-6xl">
              Commence aujourd'hui.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-brand-navy/80">
              Gratuit, sur iOS et Android. Cinq minutes par jour suffisent.
            </p>
            <div className="mx-auto mt-9 max-w-sm">
              <DownloadCta size="pillLg" className="w-full">
                Télécharger gratuitement
              </DownloadCta>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <div className="h-20 md:hidden" aria-hidden="true" />
      <MobileCtaBar />
    </>
  );
}
