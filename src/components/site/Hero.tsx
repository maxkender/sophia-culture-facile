import { DownloadCta } from "./DownloadCta";
import { PhoneMock } from "./PhoneMock";
import { StoreBadges } from "./StoreBadges";

/**
 * Hero navy plein écran.
 * `compact` : version courte pour la landing publicitaire (un seul CTA).
 */
export function Hero({ compact = false }: { compact?: boolean }) {
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
            Ta <span className="text-brand-pink">culture générale</span>, 5 minutes par jour.
          </h1>
          <p className="mt-6 max-w-[520px] text-base leading-relaxed text-brand-onNavy/75 md:text-lg">
            Des cours courts, des quiz, et une série à ne pas briser. Sophia transforme ta curiosité
            en habitude quotidienne.
          </p>
          <div className="mt-8 max-w-sm">
            <DownloadCta variant="pillLight" size="pillLg" className="w-full">
              Télécharger gratuitement
            </DownloadCta>
            <p className="mt-3 text-center text-xs text-brand-onNavy/55">
              Gratuit · iOS et Android · Sans engagement
            </p>
          </div>
          {compact ? null : <StoreBadges className="mt-8" />}
        </div>

        {/* Maquettes : elles débordent légèrement du bas du hero. */}
        <div className="relative -mb-16 h-[380px] sm:h-[440px] md:mb-[-90px] md:h-[560px]">
          <div className="absolute left-1/2 top-0 -translate-x-[85%] rotate-[-8deg] md:-translate-x-[70%]">
            <PhoneMock
              label="Accueil"
              alt="Écran d'accueil de l'application Sophia — Culture générale"
              width={216}
            />
          </div>
          <div className="absolute left-1/2 top-10 -translate-x-[8%] rotate-[12deg] md:-translate-x-[10%]">
            <PhoneMock
              label="Quiz"
              alt="Un quiz de culture générale dans l'application Sophia"
              width={216}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
