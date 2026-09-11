import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { appStoreHref, PLAY_STORE_URL } from "@/config/links";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StoreButtons } from "@/components/site/StoreButtons";
import { canonical, meta } from "@/lib/seo";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/telecharger")({
  head: () => ({
    meta: meta({
      title: "Télécharger Sophia — Culture générale (iOS et Android)",
      description:
        "Télécharge Sophia — Culture générale gratuitement sur l'App Store ou Google Play. L'application française de culture générale : cours courts, quiz et entraînement quotidien.",
      url: "/telecharger",
    }),
    links: [canonical("/telecharger")],
  }),
  component: Telecharger,
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
  const { t } = useI18n();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setPageUrl(window.location.href);
    if (p === "ios" || p === "android") {
      const target = p === "ios" ? appStoreHref() : PLAY_STORE_URL;
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
              {platform === "android" ? t.download.redirectAndroid : t.download.redirectIos}
            </h1>
            <p className="mt-3 text-[15px] text-brand-navySoft" role="status">
{t.download.redirectText}
            </p>
            <div className="mt-8 w-full max-w-sm">
              <StoreButtons />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
              {t.download.title}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-navySoft">
{t.download.text}
            </p>
            <div className="mt-8 rounded-3xl bg-card p-6 shadow-card">
              {pageUrl ? (
                <QRCodeSVG
                  value={pageUrl}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#1B3054"
                  aria-label={t.download.qrAlt}
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
