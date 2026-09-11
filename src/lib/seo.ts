import { APP_STORE_URL, COMPANY, PLAY_STORE_URL, SITE_NAME } from "@/config/links";
import { FAQ_ITEMS } from "@/components/site/Faq";

export function meta({
  title,
  description,
  url,
  noindex = false,
}: {
  title: string;
  description: string;
  url: string;
  noindex?: boolean;
}) {
  const tags = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "fr_FR" },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (noindex) tags.push({ name: "robots", content: "noindex, follow" });
  return tags;
}

export const mobileApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: SITE_NAME,
  alternateName: "Sophia culture générale",
  applicationCategory: "EducationalApplication",
  operatingSystem: "iOS, Android",
  inLanguage: "fr",
  description:
    "Sophia — Culture générale est une application mobile française gratuite pour apprendre la culture générale chaque jour : cours courts, quiz et révision quotidienne en histoire, sciences, société, géopolitique et culture.",
  downloadUrl: PLAY_STORE_URL,
  installUrl: [PLAY_STORE_URL, APP_STORE_URL],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: {
    "@type": "Organization",
    name: COMPANY,
    address: { "@type": "PostalAddress", addressCountry: "FR" },
  },
  publisher: { "@type": "Organization", name: COMPANY },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY,
  legalName: COMPANY,
  address: { "@type": "PostalAddress", addressCountry: "FR" },
  makesOffer: {
    "@type": "Offer",
    itemOffered: { "@type": "MobileApplication", name: SITE_NAME },
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export function ldScript(schema: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(schema) };
}
