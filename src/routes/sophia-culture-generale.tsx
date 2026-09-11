import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, BrainCircuit, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { DownloadCta } from "@/components/site/DownloadCta";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { COMPANY } from "@/config/links";
import { canonical, ldScript, meta, mobileApplicationSchema } from "@/lib/seo";
import { fill, useI18n } from "@/i18n";

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

const ICONS = [BookOpen, BrainCircuit, CalendarCheck];

function LandingPage() {
  const { t } = useI18n();

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
            {t.landing.benefitsTitle}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {t.landing.benefits.map((benefit, i) => {
              const Icon = ICONS[i] ?? BookOpen;
              return (
                <li key={benefit.title}>
                  <Reveal delay={i * 60}>
                    <div className="h-full rounded-3xl bg-card p-6 shadow-card">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-pink/25 text-brand-navy">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-extrabold text-brand-navy">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-brand-navySoft">
                        {benefit.text}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 py-16">
          <div className="rounded-[2rem] bg-brand-pink px-6 py-14 text-center">
            <h2 className="text-3xl font-extrabold leading-[1.05] text-brand-navy md:text-5xl">
              {t.landing.ctaTitle}
            </h2>
            <div className="mx-auto mt-8 max-w-sm">
              <DownloadCta size="pillLg" className="w-full">
                {t.landing.cta}
              </DownloadCta>
            </div>
            <p className="mt-6 text-xs text-brand-navy/70">
              {fill(t.landing.publisher, { company: COMPANY })}
            </p>
          </div>
        </section>
      </main>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <MobileCtaBar />
    </>
  );
}
