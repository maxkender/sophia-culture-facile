import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, BrainCircuit, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { DownloadCta } from "@/components/site/DownloadCta";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { COMPANY } from "@/config/links";
import { canonical, ldScript, meta, mobileApplicationSchema } from "@/lib/seo";

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
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto w-full max-w-5xl px-5 py-4">
          <Logo light />
        </div>
      </header>
      <main>
        <Hero compact />

        <section aria-labelledby="atouts" className="mx-auto w-full max-w-4xl px-5 pb-4 pt-24">
          <h2 id="atouts" className="sr-only">
            Ce que propose Sophia — Culture générale
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <Reveal delay={i * 60}>
                  <div className="h-full rounded-3xl bg-card p-6 shadow-card">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-pink/25 text-brand-navy">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold text-brand-navy">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-brand-navySoft">{text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 py-16">
          <div className="rounded-[2rem] bg-brand-pink px-6 py-14 text-center">
            <h2 className="text-3xl font-extrabold leading-[1.05] text-brand-navy md:text-5xl">
              Commence aujourd'hui.
            </h2>
            <div className="mx-auto mt-8 max-w-sm">
              <DownloadCta size="pillLg" className="w-full">
                Télécharger gratuitement
              </DownloadCta>
            </div>
            <p className="mt-6 text-xs text-brand-navy/70">
              Sophia — Culture générale, éditée par {COMPANY}, France.
            </p>
          </div>
        </section>
      </main>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <MobileCtaBar />
    </>
  );
}
