import { Apple, Play } from "lucide-react";
import { appStoreHref, PLAY_STORE_URL } from "@/config/links";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

/** Boutons vers les deux stores. */
export function StoreButtons({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <Button asChild variant={light ? "pillLight" : "pill"} size="pill" className="w-full">
        <a href={appStoreHref()} target="_blank" rel="noopener noreferrer">
          <Apple aria-hidden="true" />
          {t.stores.appStore}
        </a>
      </Button>
      <Button asChild variant={light ? "pillLight" : "pillSecondary"} size="pill" className="w-full">
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          <Play aria-hidden="true" />
          {t.stores.play}
        </a>
      </Button>
    </div>
  );
}
