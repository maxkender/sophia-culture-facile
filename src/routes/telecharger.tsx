import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StoreButtons } from "@/components/site/StoreButtons";
import { meta } from "@/lib/seo";

export const Route = createFileRoute("/telecharger")({
  head: () => ({
    meta: meta({
      title: "Télécharger Sophia — Culture générale (iOS et Android)",
      description:
        "Télécharge Sophia — Culture générale gratuitement sur l'App Store ou Google Play. L'application française de culture générale : cours courts, quiz et entraînement quotidien.",
      url: "/telecharger",
    }),
    links: [{ rel: "canonical", href: "/telecharger" }],
  }),
  component: Telecharger;
});

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ se présente comme un Mac tactile
  if (/Macintosh/.test(ua) && "ontouchend" in document) return "ios";
  return "other";
}

function Telecharger() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setPageUrl(window.location.href);
    if (p === "ios" || p === "android") {
      const target = p === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
      const timer = window.setTimeout(() => {
        window.location.replace(target);
      }, 900);
      return () => window.clearTimeout(timer);
    }
    return;
  }, []);

  const redirecting = platform === "ios" || platform === "android";

  return (
    <>
      <SiteHeader bare />
      <main className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-16 text-center">
        {platform === null || redirecting ? (
          <>
            <span
              aria-hidden="true"
              className="size-10 animate-spin rounded-full border-4 border-brand-line border-t-brand-navy"
            />
            <h1 className="mt-6 text-2xl font-extrabold text-brand-navy">
              {platform === "android"
                ? "Redirection vers Google Play…"
                : "Redirection vers l'App Store…"}
            </h1>
            <p className="mt-3 text-[15px] text-brand-navySoft" role="status">
              Ouverture de la fiche de Sophia — Culture générale. Si rien ne se passe, utilise les
              boutons ci-dessous.
            </p>
            <div className="mt-8 w-full max-w-sm">
              <StoreButtons />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
              Télécharger Sophia — Culture générale
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-navySoft">
              L'application est gratuite sur iOS et Android. Scanne le QR code avec ton téléphone ou
              choisis ton store.
            </p>
            <div className="mt-8 rounded-3xl bg-card p-6 shadow-card">
              {pageUrl ? (
                <QRCodeSVG
                  value={pageUrl}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#1B3054"
                  aria-label="QR code vers la page de téléchargement de Sophia — Culture générale"
                />
              ) : (
                <div className="size-[168px]" />
              )}
            </div>
            <div className="mt-8 w-full max-w-sm">
              <StoreButtons />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
