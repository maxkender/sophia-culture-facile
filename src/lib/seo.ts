import { APP_STORE_URL, COMPANY, PLAY_STORE_URL } from "@/config/links";
import { OG_IMAGE_URL, SITE_URL, absUrl } from "@/config/site";
import { fr } from "@/i18n/fr";
import { en } from "@/i18n/en";
import { pathFor, type Lang, type RouteKey } from "@/i18n/routes";

export const BRAND = { fr: "Sophia, culture générale", en: "Sophia: General Knowledge" } as const;

/** Balises meta d'une page, propres à sa version linguistique. */
export function meta({
  title,
  description,
  lang,
  key,
  noindex = false,
}: {
  title: string;
  description: string;
  lang: Lang;
  key: RouteKey;
  noindex?: boolean;
}) {
  const url = absUrl(pathFor(key, lang));
  const tags = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: BRAND[lang] },
    { property: "og:locale", content: lang === "fr" ? "fr_FR" : "en_US" },
    { property: "og:locale:alternate", content: lang === "fr" ? "en_US" : "fr_FR" },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE_URL },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: BRAND[lang] },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE_URL },
  ];
  if (noindex) tags.push({ name: "robots", content: "noindex, follow" });
  return tags;
}

/** Canonique de la version linguistique + alternates hreflang (jamais croisées). */
export function langLinks(key: RouteKey, lang: Lang) {
  const frUrl = absUrl(pathFor(key, "fr"));
  const enUrl = absUrl(pathFor(key, "en"));
  return [
    { rel: "canonical", href: absUrl(pathFor(key, lang)) },
    { rel: "alternate", hrefLang: "fr", href: frUrl },
    { rel: "alternate", hrefLang: "en", href: enUrl },
    { rel: "alternate", hrefLang: "x-default", href: enUrl },
  ];
}

const DESCRIPTIONS: Record<Lang, string> = {
  fr: "Sophia, culture générale est l'application mobile française gratuite pour apprendre la culture générale chaque jour : cours courts, quiz et révision quotidienne.",
  en: "Sophia: General Knowledge is a free mobile app for learning something new every day: five-minute lessons, a quiz after each one, and a streak that keeps you going.",
};

export function organizationSchema(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY,
    legalName: COMPANY,
    url: SITE_URL,
    logo: OG_IMAGE_URL,
    inLanguage: lang,
    address: { "@type": "PostalAddress", addressCountry: "FR" },
    sameAs: [
      PLAY_STORE_URL,
      APP_STORE_URL,
      // Ajouter ici les URLs des réseaux sociaux de Vik Studios SAS.
    ],
    makesOffer: {
      "@type": "Offer",
      itemOffered: { "@id": `${absUrl(pathFor("home", lang))}#app` },
    },
  };
}

export function faqSchema(lang: Lang) {
  const items = lang === "fr" ? fr.faq : en.faq;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absUrl(pathFor("home", lang))}#faq`,
    inLanguage: lang,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function ldScript(schema: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(schema) };
}
