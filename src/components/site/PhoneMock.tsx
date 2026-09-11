/**
 * Maquette d'iPhone (cadre foncé + Dynamic Island).
 *
 * TO REPLACE : déposer les captures iPhone (ratio 9:19.5, ex. 1179x2556)
 * dans `public/screenshots/` puis passer le chemin dans `src`.
 */
export function PhoneMock({
  src,
  alt,
  label,
  className = "",
  width = 260,
}: {
  src?: string | undefined;
  alt: string;
  label: string;
  className?: string;
  width?: number;
}) {
  return (
    <div
      className={`relative rounded-[2.4rem] bg-[#0d1626] p-[10px] shadow-[0_40px_80px_-30px_rgba(10,18,35,0.75)] ring-1 ring-white/10 ${className}`}
      style={{ width }}
    >
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-brand-surfaceStrong">
        {/* Dynamic Island */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-10 h-[18px] w-[34%] -translate-x-1/2 rounded-full bg-[#0d1626]"
        />
        {/* EMPLACEMENT CAPTURE D'ÉCRAN */}
        {src ? (
          <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-bold uppercase tracking-widest text-brand-navySoft">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
