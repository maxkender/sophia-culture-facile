import { DownloadCta } from "./DownloadCta";
import { PhoneMock } from "./PhoneMock";
import { StoreBadges } from "./StoreBadges";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n, useLocalePath } from "@/i18n";
import shotCours from "@/assets/shot-cours.png.asset.json";
import shotQuiz from "@/assets/shot-quiz.png.asset.json";

/**
 * Hero navy plein écran.
 * `compact` : version courte pour la landing publicitaire (un seul CTA).
 */
export function Hero({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const creatorsPath = useLocalePath("creatorsUgc");

  return (
    <section
      className={`relative isolate overflow-hidden bg-brand-navy pb-0 md:pt-16 ${
        compact ? "pt-24" : "pt-10"
      }`}
    >
      <span aria-hidden="true" className="grid-texture absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center md:gap-6">
        <div className={compact ? "pb-10 text-center md:text-left" : "pb-6"}>
          <h1 className="h1-hero font-extrabold text-brand-onNavy">
            {t.hero.titleA}
            <span className="text-brand-pink">{t.hero.titleHighlight}</span>
            {t.hero.titleB}
          </h1>
          <p className="mt-6 max-w-[520px] text-base leading-relaxed text-brand-onNavy/75 md:text-lg">
            {t.hero.subtitle}
          </p>
          <div className={compact ? "mt-8 max-w-sm" : "mt-8 max-w-xl"}>
            <div className={compact ? "" : "grid gap-3 sm:grid-cols-2"}>
              <DownloadCta variant="pillLight" size="pillLg" className="w-full">
                {t.hero.cta}
              </DownloadCta>
              {compact ? null : (
                <Button asChild variant="pillOutlineLight" size="pillLg" className="w-full">
                  <Link to={creatorsPath}>{t.nav.becomeCreator}</Link>
                </Button>
              )}
            </div>
            <p className={`mt-3 text-xs text-brand-onNavy/55 ${compact ? "text-center" : "sm:max-w-[50%] text-center"}`}>{t.hero.note}</p>
          </div>
          {compact ? null : <StoreBadges className="mt-8" />}
        </div>

        {/* Maquettes : elles débordent légèrement du bas du hero. */}
        <div className="relative -mb-16 h-[380px] sm:h-[440px] md:mb-[-90px] md:h-[560px]">
          <div className="absolute left-1/2 top-0 -translate-x-[85%] rotate-[-8deg] md:-translate-x-[70%]">
            <PhoneMock
              src={shotCours.url}
              label={t.hero.shotHome}
              alt={t.hero.shotHomeAlt}
              width={216}
            />
          </div>
          <div className="absolute left-1/2 top-10 -translate-x-[8%] rotate-[12deg] md:-translate-x-[10%]">
            <PhoneMock
              src={shotQuiz.url}
              label={t.hero.shotQuiz}
              alt={t.hero.shotQuizAlt}
              width={216}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
