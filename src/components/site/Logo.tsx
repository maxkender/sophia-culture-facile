type LogoProps = {
  className?: string;
  /** Variante claire pour les fonds navy. */
  light?: boolean;
};

/** Logo Sophia : monogramme φ rose + wordmark. */
export function Logo({ className, light = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        role="img"
        aria-label="Logo Sophia — Culture générale"
        className="shrink-0"
      >
        <circle cx="20" cy="20" r="10.5" fill="none" stroke="currentColor" strokeWidth="4.5" className="text-brand-pink" />
        <rect x="12.2" y="4" width="4.2" height="32" rx="2.1" className="fill-brand-pink" />
        <rect x="23.6" y="4" width="4.2" height="32" rx="2.1" className="fill-brand-pink" />
      </svg>
      <span
        className={`text-xl font-extrabold tracking-tight ${light ? "text-brand-onNavy" : "text-brand-navy"}`}
      >
        Sophia
      </span>
    </span>
  );
}
