import { Apple, Play } from "lucide-react";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { Button } from "@/components/ui/button";

/** Boutons vers les deux stores. */
export function StoreButtons({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Button asChild variant={light ? "pillLight" : "pill"} size="pill" className="w-full">
        <a href={APP_STORE_URL} rel="noopener">
          <Apple aria-hidden="true" />
          Télécharger sur l'App Store
        </a>
      </Button>
      <Button asChild variant={light ? "pillLight" : "pillSecondary"} size="pill" className="w-full">
        <a href={PLAY_STORE_URL} rel="noopener">
          <Play aria-hidden="true" />
          Télécharger sur Google Play
        </a>
      </Button>
    </div>
  );
}
