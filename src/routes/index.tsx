import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  BrainCircuit,
  CalendarCheck,
  Trophy,
  Globe2,
  Landmark,
  FlaskConical,
  Users,
  Palette,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PhoneGallery } from "@/components/site/PhoneGallery";
import { Faq } from "@/components/site/Faq";
import { Chip } from "@/components/site/Chip";
import { Button } from "@/components/ui/button";
import {
  faqSchema,
  ldScript,
  meta,
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
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      ldScript(mobileApplicationSchema),
      ldScript(organizationSchema),
      ldScript(faqSchema),
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: BookOpen,
    title: "Des cours courts",
    text: "Des dossiers de 5 chapitres, lisibles en quelques minutes chacun, écrits en français clair.",
  },
  {
    icon: BrainCircuit,
    title: "Des quiz",
    text: "Un quiz après chaque chapitre pour tester immédiatement ce que tu viens d'apprendre.",
  },
  {
    icon: CalendarCheck,
    title: "Un entraînement quotidien",
    text: "La révision espacée ramène les bonnes notions au bon moment, et ta série de jours entretient l'habitude.",
  },
  {
    icon: Trophy,
    title: "Des rangs",
    text: "Ta progression se traduit en niveaux, de Curieux à Érudit, au fil de tes sessions.",
  },
];

function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-14 pt-12 md:pt-20">
          <div className="flex flex-wrap gap-2">
            <Chip icon={Landmark} tone="blue">
              Histoire
            </Chip>
            <Chip icon={FlaskConical} tone="purple">
              Sciences
            </Chip>
            <Chip icon={Globe2} tone="blue">
              Géopolitique
            </Chip>
            <Chip icon={Users} tone="purple">
              Société
            </Chip>
            <Chip icon={Palette} tone="pink">
              Culture
            </Chip>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] text-brand-navy md:text-6xl">
            Sophia — Culture générale
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-navySoft">
            L'application française qui transforme ta culture générale en habitude quotidienne.
          </p>
          <div className="mt-8 max-w-sm">
            <Button asChild variant="pill" size="pill" className="w-full">
              <Link to="/telecharger">Télécharger l'app</Link>
            </Button>
            <p className="mt-3 text-center text-sm text-brand-navySoft">Gratuit · iOS et Android</p>
          </div>
        </section>

        {/* Sophia, c'est quoi ? */}
        <section aria-labelledby="cest-quoi" className="mx-auto w-full max-w-5xl px-5 py-12">
          <div className="rounded-3xl bg-card p-7 shadow-card md:p-10">
            <h2 id="cest-quoi" className="text-2xl font-extrabold text-brand-navy md:text-3xl">
              Sophia, c'est quoi ?
            </h2>
            <div className="mt-5 flex flex-col gap-4 text-[16px] leading-relaxed text-brand-navySoft">
              <p>
                Sophia — Culture générale est une application mobile d'apprentissage de la culture
                générale, entièrement en français. L'application propose des cours courts, des quiz
                et un entraînement quotidien. Elle s'adresse à toute personne qui veut apprendre un
                peu chaque jour, sans y consacrer plus de dix minutes.
              </p>
              <p>
                Sophia — Culture générale est éditée par Vik Studios SAS, une société française. Vik
                Studios SAS conçoit et rédige l'ensemble des contenus de l'application. L'éditeur est
                établi en France et publie l'application sous son propre nom.
              </p>
              <p>
                Le téléchargement de Sophia — Culture générale est gratuit. L'application est
                disponible sur iPhone et iPad via l'App Store d'Apple, et sur les smartphones et
                tablettes Android via le Google Play Store. Aucun matériel particulier n'est
                nécessaire : un téléphone récent suffit.
              </p>
              <p>
                Les contenus de Sophia — Culture générale couvrent cinq grands domaines : l'histoire,
                les sciences, la société, la géopolitique et la culture. Chaque domaine est découpé
                en dossiers thématiques de cinq chapitres. Un chapitre se lit en quelques minutes et
                se termine par un quiz.
              </p>
              <p>
                Le fonctionnement de Sophia — Culture générale repose sur trois étapes : lire un
                chapitre court, répondre à un quiz, puis réviser plus tard grâce à la répétition
                espacée. La progression est mesurée par une série de jours consécutifs et par des
                rangs, de Curieux à Érudit. L'objectif est de transformer l'apprentissage en habitude
                quotidienne plutôt qu'en effort ponctuel.
              </p>
              <p>
                Sophia — Culture générale est une application mobile d'apprentissage. Elle n'a aucun
                lien avec le robot humanoïde Sophia, avec l'université Sophia de Tokyo, ni avec le
                programme sophia de l'Assurance Maladie.
              </p>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section aria-labelledby="comment" className="mx-auto w-full max-w-5xl px-5 py-12">
          <h2 id="comment" className="text-2xl font-extrabold text-brand-navy md:text-3xl">
            Comment ça marche
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-card p-7 shadow-card">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-surfaceStrong text-brand-navy">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-navySoft">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Aperçu */}
        <section aria-labelledby="apercu" className="mx-auto w-full max-w-5xl px-5 py-12">
          <h2 id="apercu" className="text-2xl font-extrabold text-brand-navy md:text-3xl">
            Aperçu de l'app
          </h2>
          <p className="mb-6 mt-2 max-w-xl text-[15px] text-brand-navySoft">
            Quelques écrans de Sophia — Culture générale : les cours, les quiz et le suivi de la
            progression.
          </p>
          <PhoneGallery />
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mx-auto w-full max-w-5xl px-5 py-12">
          <h2 id="faq" className="mb-6 text-2xl font-extrabold text-brand-navy md:text-3xl">
            Questions fréquentes
          </h2>
          <Faq />
        </section>

        {/* CTA final */}
        <section className="mt-6 bg-brand-navy">
          <div className="mx-auto w-full max-w-5xl px-5 py-16 text-center">
            <h2 className="text-2xl font-extrabold text-brand-onNavy md:text-4xl">
              Commence ta culture générale aujourd'hui
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-brand-onNavy/80">
              Sophia — Culture générale est gratuite, sur iOS et Android. Dix minutes par jour
              suffisent.
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <Button asChild variant="pillLight" size="pill" className="w-full">
                <Link to="/telecharger">Télécharger l'app</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
