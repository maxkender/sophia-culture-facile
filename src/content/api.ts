/**
 * Accès aux cours. Seul point d'entrée pour les composants et les routes.
 *
 * La source de données actuelle est le fichier d'exemple `courses.ts`.
 * Quand les vrais cours seront exportés depuis la base, il suffira de
 * changer l'implémentation de ces fonctions : aucune page à modifier.
 */

import type { Lang } from "@/i18n/routes";
import { COURSES, type Course } from "./courses";

/** Tous les cours d'une langue, du plus récent au plus ancien. */
export function getCourses(lang: Lang): Course[] {
  return COURSES.filter((c) => c.locale === lang).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** Un cours par langue + slug, ou undefined s'il n'existe pas. */
export function getCourse(lang: Lang, slug: string): Course | undefined {
  return COURSES.find((c) => c.locale === lang && c.slug === slug);
}

/** Catégories présentes dans une langue, avec le nombre de cours. */
export function getCategories(lang: Lang): { id: string; label: string; count: number }[] {
  const map = new Map<string, { id: string; label: string; count: number }>();
  for (const course of getCourses(lang)) {
    const entry = map.get(course.categoryId);
    if (entry) entry.count += 1;
    else map.set(course.categoryId, { id: course.categoryId, label: course.category, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Jusqu'à trois cours liés : ceux déclarés, complétés par la même catégorie. */
export function getRelatedCourses(course: Course, limit = 3): Course[] {
  const pool = getCourses(course.locale).filter((c) => c.slug !== course.slug);
  const declared = course.relatedSlugs
    .map((slug) => pool.find((c) => c.slug === slug))
    .filter((c): c is Course => Boolean(c));
  const sameCategory = pool.filter(
    (c) => c.categoryId === course.categoryId && !declared.includes(c),
  );
  const rest = pool.filter((c) => !declared.includes(c) && !sameCategory.includes(c));
  return [...declared, ...sameCategory, ...rest].slice(0, limit);
}

/** Slugs d'une langue — utilisé pour la génération du sitemap. */
export function getCourseSlugs(lang: Lang): string[] {
  return getCourses(lang).map((c) => c.slug);
}

/** Entrées de sitemap : chemin, date de mise à jour et équivalent dans l'autre langue. */
export function getCourseSitemapEntries(): {
  slug: string;
  locale: Lang;
  alternateSlug: string;
  updatedAt: string;
}[] {
  return COURSES.map(({ slug, locale, alternateSlug, updatedAt }) => ({
    slug,
    locale,
    alternateSlug,
    updatedAt,
  }));
}

export type { Course } from "./courses";
