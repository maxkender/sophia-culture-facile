import { APP_STORE_URL, COMPANY, PLAY_STORE_URL, SITE_NAME } from "@/config/links";
import { OG_IMAGE_URL, SITE_URL, absUrl } from "@/config/site";
import { FAQ_ITEMS } from "@/components/site/Faq";

export function meta({
  title,
  description,
  url,
  noindex = false,
}: {
  title: string;
  description: string;
  /** Chemin de la route, ex. "/telecharger". */
  url: string;
  noindex?: boolean;
}) {
  const canonicalUrl = absUrl(url);
  const tags = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "fr_FR" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: OG_IMAGE_URL },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE_URL },
  ];
  if (noindex) tags.push({ name: "robots", content: "noindex, follow" });
  return tags;
}

/** Balise <link rel="canonical"> absolue pour une route. */
export function canonical(path: string) {
  return { rel: "canonical", href: absUrl(path) };
}

export const mobileApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "@id": `${SITE_URL}/#app`,
  name: SITE_NAME,
  alternateName: "Sophia culture générale",
  url: absUrl("/"),
  image: OG_IMAGE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "iOS, Android",
  inLanguage: "fr",
  description:
    "Sophia — Culture générale est une application mobile française gratuite pour apprendre la culture générale chaque jour : cours courts, quiz et révision quotidienne en histoire, sciences, société, géopolitique et culture.",
  downloadUrl: absUrl("/telecharger"),
  installUrl: [PLAY_STORE_URL, APP_STORE_URL],
  sameAs: [
    PLAY_STORE_URL,
    APP_STORE_URL,
    // Ajouter ici les URLs des réseaux sociaux de l'application.
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: COMPANY,
  legalName: COMPANY,
  url: SITE_URL,
  logo: OG_IMAGE_URL,
  address: { "@type": "PostalAddress", addressCountry: "FR" },
  sameAs: [
    PLAY_STORE_URL,
    APP_STORE_URL,
    // Ajouter ici les URLs des réseaux sociaux de Vik Studios SAS.
  ],
  makesOffer: {
    "@type": "Offer",
    itemOffered: { "@id": `${SITE_URL}/#app` },
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export function ldScript(schema: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(schema) };
}
