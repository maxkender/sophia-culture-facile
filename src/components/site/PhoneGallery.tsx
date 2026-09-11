/**
 * Galerie d'aperçus de l'application.
 *
 * TO REPLACE : déposer les captures d'écran iPhone (ratio 9:19.5, ex. 1179x2556)
 * dans `public/screenshots/` puis renseigner `src` ci-dessous.
 */
type Shot = { label: string; src?: string | undefined; alt: string };

const SHOTS: Shot[] = [
  { label: "Accueil", src: undefined, alt: "Écran d'accueil de l'application Sophia — Culture générale" },
  { label: "Cours", src: undefined, alt: "Un chapitre de cours dans Sophia — Culture générale" },
  { label: "Quiz", src: undefined, alt: "Un quiz de culture générale dans l'application Sophia" },
  { label: "Progression", src: undefined, alt: "Suivi de progression et série de jours dans Sophia" },
  { label: "Rangs", src: undefined, alt: "Écran des rangs Curieux et Érudit dans Sophia" },
];

export function PhoneGallery() {
  return (
    <ul
      className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4"
      aria-label="Aperçus de l'application Sophia — Culture générale"
    >
      {SHOTS.map((shot) => (
        <li key={shot.label} className="shrink-0 snap-center">
          <div className="w-[210px] overflow-hidden rounded-[28px] border border-brand-line bg-card p-2 shadow-soft">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[22px] bg-brand-surfaceStrong">
              {shot.src ? (
                <img
                  src={shot.src}
                  alt={shot.alt}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-widest text-brand-navySoft">
                  {shot.label}
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-brand-navy">{shot.label}</p>
        </li>
      ))}
    </ul>
  );
}
