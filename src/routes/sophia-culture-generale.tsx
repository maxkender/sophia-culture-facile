import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, BrainCircuit, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { PhoneGallery } from "@/components/site/PhoneGallery";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/config/links";
import { ldScript, meta, mobileApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/sophia-culture-generale")({
  head: () => ({
    meta: meta({
      title: "Sophia — Culture générale : l'app française de culture générale",
      description:
        "Sophia — Culture générale : cours courts, quiz et entraînement quotidien. Application française gratuite sur iOS et Android. Télécharge-la en une minute.",
      url: "/sophia-culture-generale",
    }),
    links: [canonical("/sophia-culture-generale")],
    scripts: [ldScript(mobileApplicationSchema)],
  }),
  component: LandingPage,
});

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Des cours courts",
    text: "Des dossiers de 5 chapitres en histoire, sciences, société, géopolitique et culture.",
  },
  {
    icon: BrainCircuit,
    title: "Des quiz immédiats",
    text: "Chaque chapitre se termine par un quiz pour ancrer ce que tu viens de lire.",
  },
  {
    icon: CalendarCheck,
    title: "10 minutes par jour",
    text: "Révision espacée, série de jours et rangs : la culture générale devient une habitude.",
  },
];

function LandingPage() {
  return (
    <>
      <header className="border-b border-brand-line/70 bg-brand-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-16">
        <section className="pt-12 text-center">
          <h1 className="text-4xl font-extrabold leading-[1.05] text-brand-navy md:text-5xl">
            Sophia — Culture générale
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-brand-navySoft">
            L'application française qui transforme ta culture générale en habitude quotidienne.
            Gratuite sur iOS et Android.
          </p>
          <div className="mx-auto mt-8 max-w-sm">
            <Button asChild variant="pill" size="pill" className="w-full">
              <Link to="/telecharger">Télécharger l'app</Link>
            </Button>
            <p className="mt-3 text-sm text-brand-navySoft">Gratuit · iOS et Android</p>
          </div>
        </section>

        <section aria-labelledby="atouts" className="py-12">
          <h2 id="atouts" className="sr-only">
            Ce que propose Sophia — Culture générale
          </h2>
          <ul className="grid gap-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-3xl bg-card p-6 shadow-card">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-surfaceStrong text-brand-navy">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-brand-navySoft">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="apercu-landing" className="pb-12">
          <h2 id="apercu-landing" className="mb-5 text-xl font-extrabold text-brand-navy">
            Aperçu de l'app
          </h2>
          <PhoneGallery />
        </section>

        <section className="rounded-3xl bg-brand-navy px-6 py-12 text-center">
          <h2 className="text-2xl font-extrabold text-brand-onNavy">
            Apprends quelque chose aujourd'hui
          </h2>
          <div className="mx-auto mt-7 max-w-sm">
            <Button asChild variant="pillLight" size="pill" className="w-full">
              <Link to="/telecharger">Télécharger l'app</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-brand-onNavy/70">
            Sophia — Culture générale, éditée par {COMPANY}, France.
          </p>
        </section>
      </main>
    </>
  );
}
