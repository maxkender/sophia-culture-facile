import { appStoreHref, PLAY_STORE_URL } from "@/config/links";
import { useI18n } from "@/i18n";

/** Badges officiels App Store et Google Play, dessinés en SVG inline. */
export function StoreBadges({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={appStoreHref()}
        target="_blank" rel="noopener noreferrer"
        aria-label={t.stores.badgeAppStoreAria}
        className="rounded-xl"
      >
        <AppStoreBadge topLine={t.stores.badgeAppStoreTop} />
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank" rel="noopener noreferrer"
        aria-label={t.stores.badgePlayAria}
        className="rounded-xl"
      >
        <GooglePlayBadge topLine={t.stores.badgePlayTop} />
      </a>
    </div>
  );
}

function AppStoreBadge({ topLine }: { topLine: string }) {
  return (
    <svg
      width="150"
      height="50"
      viewBox="0 0 150 50"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="h-[46px] w-auto"
    >
      <rect x="0.5" y="0.5" width="149" height="49" rx="10" fill="#000" />
      <rect x="0.5" y="0.5" width="149" height="49" rx="10" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
      <path
        fill="#fff"
        d="M30.7 26.3c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.3 10.3.9 1.3 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.2-1.3 3.1-2.5 1-1.5 1.4-2.9 1.4-3-.1 0-2.6-1-2.6-3.9zm-2.6-7.3c.7-.9 1.2-2.1 1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3.1-1.5z"
      />
      <text x="45" y="20" fill="#fff" fontSize="9" fontFamily="Poppins, sans-serif">
        {topLine}
      </text>
      <text x="45" y="37" fill="#fff" fontSize="16" fontWeight="600" fontFamily="Poppins, sans-serif">
        App Store
      </text>
    </svg>
  );
}

function GooglePlayBadge({ topLine }: { topLine: string }) {
  return (
    <svg
      width="160"
      height="50"
      viewBox="0 0 160 50"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="h-[46px] w-auto"
    >
      <rect x="0.5" y="0.5" width="159" height="49" rx="10" fill="#000" />
      <rect x="0.5" y="0.5" width="159" height="49" rx="10" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
      <g transform="translate(16 13)">
        <path fill="#34A853" d="M0 1.2v21.6c0 .5.2.9.5 1.1L12.4 12 .5.1C.2.3 0 .7 0 1.2z" />
        <path fill="#FBBC04" d="M16.3 8.1 12.4 12 .5 24l.2.1c.4.2.9.2 1.4-.1l14.2-8z" />
        <path fill="#EA4335" d="M16.3 15.9 2.1.1C1.6-.2 1.1-.2.7 0L.5.1 12.4 12z" />
        <path fill="#4285F4" d="m16.3 8.1 4.4 2.5c1.2.7 1.2 2.1 0 2.8l-4.4 2.5L12.4 12z" />
      </g>
      <text x="52" y="20" fill="#fff" fontSize="9" fontFamily="Poppins, sans-serif">
        {topLine}
      </text>
      <text x="52" y="37" fill="#fff" fontSize="16" fontWeight="600" fontFamily="Poppins, sans-serif">
        Google Play
      </text>
    </svg>
  );
}
