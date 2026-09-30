import type { Lang } from "./routes";

export const NICHES = ["history", "science", "culture", "books", "study", "psychology", "self-improvement", "lifestyle", "humour", "news", "other"] as const;
export const POST_LANGUAGES = ["fr", "en", "es", "de", "it", "pt", "ar", "other"] as const;

export const INFLUENCER_COPY = {
  en: {
    card: {
      title: "Influencer",
      lines: [
        "You already have an audience. You post about Sophia on your own account, in your own style, and you are paid per collaboration.",
        "One-off collaborations to start; regular partnerships for the ones that work.",
        "You set your rate. We send you offers. You accept, counter or decline.",
      ],
      cta: "Apply as an influencer",
    },
    metaTitle: "Partner with Sophia as an influencer",
    metaDescription: "Post about Sophia, the general-knowledge app, on your own account and get paid per collaboration at your rate.",
    heroTitle: "Partner with Sophia",
    heroSubtitle: "A general-knowledge app with 200,000 active users, and a hundred creators already posting. We work with influencers who make people curious.",
    cta: "Apply",
    howTitle: "How it works",
    steps: [
      "You apply with your handles and your rate.",
      "We approve and add you to our roster.",
      "When a brief fits you, we send an offer with a price.",
      "You accept, counter or decline.",
      "You post, you report the numbers, you are paid.",
    ],
    buyTitle: "What we buy",
    buy: [
      "The post on your account.",
      "The right to reuse the video as an ad for a set period, stated in every offer.",
    ],
    whoTitle: "Who we look for",
    who: "French-speaking, any size from 5,000 followers, any subject that overlaps with curiosity, learning, culture, science, history, books, study, self-improvement.",
    reqTitle: "Requirements",
    requirements: ["At least 18", "A real audience", "A media kit or recent stats", "A rate"],
    niches: { history: "History", science: "Science", culture: "Culture", books: "Books", study: "Study", psychology: "Psychology", "self-improvement": "Self-improvement", lifestyle: "Lifestyle", humour: "Humour", news: "News", other: "Other" } as Record<string, string>,
    languages: { fr: "French", en: "English", es: "Spanish", de: "German", it: "Italian", pt: "Portuguese", ar: "Arabic", other: "Other" } as Record<string, string>,
  },
  fr: {
    card: {
      title: "Influenceur",
      lines: [
        "Vous avez déjà une audience. Vous parlez de Sophia sur votre propre compte, dans votre style, et vous êtes payé par collaboration.",
        "Des collaborations ponctuelles pour commencer ; des partenariats réguliers quand ça marche.",
        "Vous fixez votre tarif. Nous vous envoyons des offres. Vous acceptez, contre-proposez ou refusez.",
      ],
      cta: "Postuler comme influenceur",
    },
    metaTitle: "Devenir partenaire de Sophia en tant qu'influenceur",
    metaDescription: "Parlez de Sophia, l'appli de culture générale, sur votre propre compte et soyez payé par collaboration, à votre tarif.",
    heroTitle: "Devenez partenaire de Sophia",
    heroSubtitle: "Une appli de culture générale avec 200 000 utilisateurs actifs, et une centaine de créateurs qui publient déjà. Nous travaillons avec des influenceurs qui rendent les gens curieux.",
    cta: "Postuler",
    howTitle: "Comment ça marche",
    steps: [
      "Vous postulez avec vos comptes et votre tarif.",
      "Nous validons et vous ajoutons à notre liste.",
      "Quand un brief vous correspond, nous vous envoyons une offre avec un prix.",
      "Vous acceptez, contre-proposez ou refusez.",
      "Vous publiez, vous remontez les chiffres, vous êtes payé.",
    ],
    buyTitle: "Ce que nous achetons",
    buy: [
      "Le post sur votre compte.",
      "Le droit de réutiliser la vidéo en publicité pendant une durée définie, précisée dans chaque offre.",
    ],
    whoTitle: "Qui nous cherchons",
    who: "Francophone, toute taille à partir de 5 000 abonnés, tout sujet qui recoupe la curiosité, l'apprentissage, la culture, les sciences, l'histoire, les livres, les études, le développement personnel.",
    reqTitle: "Conditions",
    requirements: ["Avoir au moins 18 ans", "Une vraie audience", "Un media kit ou des statistiques récentes", "Un tarif"],
    niches: { history: "Histoire", science: "Sciences", culture: "Culture", books: "Livres", study: "Études", psychology: "Psychologie", "self-improvement": "Développement personnel", lifestyle: "Lifestyle", humour: "Humour", news: "Actualité", other: "Autre" } as Record<string, string>,
    languages: { fr: "Français", en: "Anglais", es: "Espagnol", de: "Allemand", it: "Italien", pt: "Portugais", ar: "Arabe", other: "Autre" } as Record<string, string>,
  },
} satisfies Record<Lang, unknown>;

/** Tier from the largest follower count. */
export function computeTier(max: number, b = { micro: 10000, mid: 50000, macro: 250000, top: 1000000 }) {
  if (max > b.top) return "top";
  if (max >= b.macro) return "macro";
  if (max >= b.mid) return "mid";
  if (max >= b.micro) return "micro";
  return "nano";
}
