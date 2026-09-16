/** Textes des pages publiques alimentées par la base (cours publiés, auteurs). */

import type { Lang } from "./routes";

export const PUBLIC_TEXT = {
  fr: {
    home: "Accueil",
    breadcrumb: "Fil d'Ariane",
    hub: "Les cours",
    hubTitle: "Les cours de Sophia",
    hubIntro:
      "Des cours courts de culture générale, écrits et signés par des universitaires et des spécialistes.",
    all: "Tous les cours",
    read: "Lire",
    empty: "Les premiers cours arrivent très bientôt.",
    otherLangShow: "Afficher aussi les cours en anglais",
    otherLangHide: "Masquer les cours en anglais",
    otherLangBadge: "En anglais",
    sources: "Sources",
    next: "À lire ensuite",
    allCourses: "Tous les cours",
    truncated:
      "La suite de ce cours se lit dans l'application, avec le quiz et la révision quotidienne.",
    ctaTitle: "Lisez-le sur votre téléphone, avec le quiz et la révision quotidienne",
    ctaText:
      "Sophia transforme chaque cours en cinq minutes par jour : un quiz après la lecture, puis des rappels espacés pour ne rien oublier.",
    ctaButton: "Télécharger l'application",
    education: "Formation",
    authorCourses: "Ses cours sur Sophia",
    personalSite: "Site personnel",
  },
  en: {
    home: "Home",
    breadcrumb: "Breadcrumb",
    hub: "Lessons",
    hubTitle: "Sophia lessons",
    hubIntro:
      "Short general knowledge lessons, written and signed by academics and specialists.",
    all: "All lessons",
    read: "Read",
    empty: "The first lessons are coming very soon.",
    otherLangShow: "Also show lessons written in French",
    otherLangHide: "Hide lessons written in French",
    otherLangBadge: "In French",
    sources: "Sources",
    next: "Read next",
    allCourses: "All lessons",
    truncated: "The rest of this lesson is in the app, with the quiz and daily revision.",
    ctaTitle: "Read it on your phone, with the quiz and daily revision",
    ctaText:
      "Sophia turns every lesson into five minutes a day: a quiz once you have read it, then spaced reminders so none of it fades.",
    ctaButton: "Download the app",
    education: "Education",
    authorCourses: "Their lessons on Sophia",
    personalSite: "Personal website",
  },
} satisfies Record<Lang, Record<string, string>>;

export function publicText(lang: Lang) {
  return PUBLIC_TEXT[lang];
}
