import { useEffect, useState } from "react";
import { DownloadCta } from "./DownloadCta";
import { useI18n } from "@/i18n";

/** Barre de téléchargement fixe, mobile uniquement, visible après le hero. */
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-brand-line bg-brand-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <DownloadCta className="w-full">Télécharger gratuitement</DownloadCta>
    </div>
  );
}
