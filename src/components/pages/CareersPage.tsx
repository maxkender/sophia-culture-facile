import { Link } from "@tanstack/react-router";
import { Camera, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { useI18n, useLocalePath } from "@/i18n";

/**
 * Page « Careers » : deux voies d'entrée chez Sophia,
 * professeurs (cours) et créateurs (contenus vidéo).
 */
export function CareersPage() {
  const t = useI18n().t.careers;
  const applyPath = useLocalePath("apply");
  const creatorsPath = useLocalePath("creators");

  const cards = [
    { ...t.profs, icon: GraduationCap, to: applyPath },
    { ...t.creators, icon: Camera, to: creatorsPath },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-brand-surface">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-navy md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg text-brand-navySoft">{t.lead}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="flex flex-col rounded-3xl bg-card p-7 shadow-card"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-pink/25 text-brand-navy">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold text-brand-navy">{card.title}</h2>
                  <div className="mt-4 flex-1 space-y-3 text-[15px] leading-relaxed text-brand-navySoft">
                    {card.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  <Button
                    asChild
                    variant="pill"
                    size="pill"
                    className="mt-6 w-full whitespace-normal text-center"
                  >
                    <Link to={card.to}>{card.cta}</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
