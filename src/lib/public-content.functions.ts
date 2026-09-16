import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authorPath, coursePath } from "@/i18n/routes";

/**
 * Lecture publique des cours publiés.
 *
 * Tout passe par le client administrateur côté serveur : aucune politique
 * anonyme n'est ouverte sur les tables du portail.
 */

export type PublicAuthor = {
  slug: string | null;
  display_name: string;
  display_title: string | null;
  institution: string | null;
  short_bio: string | null;
  photo_url: string | null;
  country: string | null;
  orcid: string | null;
  personal_site: string | null;
  scholar_url: string | null;
};

export type PublicCourseCard = {
  slug: string;
  language: "fr" | "en";
  alternate_slug: string | null;
  title: string;
  subtitle: string | null;
  subject_area: string | null;
  published_at: string | null;
  author: PublicAuthor | null;
};

export type PublicScreen = { screen_number: number; screen_title: string | null; body: string | null };

export type PublicCourse = PublicCourseCard & {
  public_full_text: boolean;
  screens: PublicScreen[];
  sources: { claim: string | null; reference: string | null; page: string | null }[];
};

export type PublicEducation = {
  degree: string | null;
  field: string | null;
  institution: string | null;
  year: string | null;
};

const PHOTO_TTL = 60 * 60 * 24 * 7;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function signPhoto(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const supabaseAdmin = await admin();
  const { data } = await supabaseAdmin.storage.from("author-photos").createSignedUrl(path, PHOTO_TTL);
  return data?.signedUrl ?? null;
}

type ProfileRow = {
  public_slug: string | null;
  display_name: string | null;
  full_name: string;
  display_title: string | null;
  institution: string | null;
  short_bio: string | null;
  bio: string | null;
  photo_url: string | null;
  country: string | null;
  orcid: string | null;
  personal_site: string | null;
  scholar_url: string | null;
};

const PROFILE_FIELDS =
  "id, public_slug, display_name, full_name, display_title, institution, short_bio, bio, photo_url, country, orcid, personal_site, scholar_url";

async function toPublicAuthor(row: ProfileRow | null): Promise<PublicAuthor | null> {
  if (!row) return null;
  return {
    slug: row.public_slug,
    display_name: row.display_name || row.full_name,
    display_title: row.display_title,
    institution: row.institution,
    short_bio: row.short_bio ?? null,
    photo_url: await signPhoto(row.photo_url),
    country: row.country,
    orcid: row.orcid,
    personal_site: row.personal_site,
    scholar_url: row.scholar_url,
  };
}

/** Tous les cours publiés, du plus récent au plus ancien. */
export const listPublishedCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCourseCard[]> => {
    const supabaseAdmin = await admin();
    const { data } = await supabaseAdmin
      .from("courses")
      .select(`slug, language, alternate_slug, title, subtitle, subject_area, published_at, author:profiles!courses_author_id_fkey(${PROFILE_FIELDS})`)
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false });

    const rows = (data ?? []) as unknown as (Omit<PublicCourseCard, "author"> & { author: ProfileRow | null })[];
    return Promise.all(
      rows.map(async (row) => ({
        slug: row.slug,
        language: row.language,
        alternate_slug: row.alternate_slug,
        title: row.title,
        subtitle: row.subtitle,
        subject_area: row.subject_area,
        published_at: row.published_at,
        author: await toPublicAuthor(row.author),
      })),
    );
  },
);

/** Un cours publié avec ses cinq écrans, ou null. */
export const getPublishedCourse = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }): Promise<{ course: PublicCourse; related: PublicCourseCard[] } | null> => {
    const supabaseAdmin = await admin();
    const { data: row } = await supabaseAdmin
      .from("courses")
      .select(
        `id, slug, language, alternate_slug, title, subtitle, subject_area, published_at, public_full_text, author:profiles!courses_author_id_fkey(${PROFILE_FIELDS})`,
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!row) return null;

    const course = row as unknown as {
      id: string;
      slug: string;
      language: "fr" | "en";
      alternate_slug: string | null;
      title: string;
      subtitle: string | null;
      subject_area: string | null;
      published_at: string | null;
      public_full_text: boolean;
      author: ProfileRow | null;
    };

    const [{ data: screens }, { data: sources }, { data: relatedRows }] = await Promise.all([
      supabaseAdmin
        .from("screens")
        .select("screen_number, screen_title, body")
        .eq("course_id", course.id)
        .order("screen_number"),
      supabaseAdmin.from("sources").select("claim, reference, page").eq("course_id", course.id).order("created_at"),
      supabaseAdmin
        .from("courses")
        .select(`slug, language, alternate_slug, title, subtitle, subject_area, published_at, author:profiles!courses_author_id_fkey(${PROFILE_FIELDS})`)
        .eq("status", "published")
        .eq("subject_area", course.subject_area ?? "")
        .eq("language", course.language)
        .neq("slug", course.slug)
        .limit(3),
    ]);

    const author = await toPublicAuthor(course.author);
    const related = await Promise.all(
      ((relatedRows ?? []) as unknown as (Omit<PublicCourseCard, "author"> & { author: ProfileRow | null })[]).map(
        async (item) => ({
          slug: item.slug,
          language: item.language,
          alternate_slug: item.alternate_slug,
          title: item.title,
          subtitle: item.subtitle,
          subject_area: item.subject_area,
          published_at: item.published_at,
          author: await toPublicAuthor(item.author),
        }),
      ),
    );

    return {
      course: {
        slug: course.slug,
        language: course.language,
        alternate_slug: course.alternate_slug,
        title: course.title,
        subtitle: course.subtitle,
        subject_area: course.subject_area,
        published_at: course.published_at,
        public_full_text: course.public_full_text,
        author,
        screens: (screens ?? []) as PublicScreen[],
        sources: (sources ?? []) as PublicCourse["sources"],
      },
      related,
    };
  });

/** Page publique d'un auteur : profil, diplômes et cours publiés. */
export const getPublishedAuthor = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ author: PublicAuthor; education: PublicEducation[]; courses: PublicCourseCard[] } | null> => {
      const supabaseAdmin = await admin();
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .eq("public_slug", data.slug)
        .maybeSingle();
      if (!row) return null;
      const profile = row as unknown as ProfileRow & { id: string };

      const [{ data: education }, { data: courses }] = await Promise.all([
        supabaseAdmin
          .from("education_records")
          .select("degree, field, institution, year")
          .eq("profile_id", profile.id)
          .order("order_index"),
        supabaseAdmin
          .from("courses")
          .select("slug, language, alternate_slug, title, subtitle, subject_area, published_at")
          .eq("author_id", profile.id)
          .eq("status", "published")
          .not("slug", "is", null)
          .order("published_at", { ascending: false }),
      ]);

      const author = (await toPublicAuthor(profile))!;
      if ((courses ?? []).length === 0) return null;

      return {
        author,
        education: (education ?? []) as PublicEducation[],
        courses: ((courses ?? []) as Omit<PublicCourseCard, "author">[]).map((course) => ({ ...course, author })),
      };
    },
  );

/** Entrées de sitemap des cours publiés et des pages auteurs. */
export const getPublishedSitemapEntries = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ path: string; lastmod: string }[]> => {
    const supabaseAdmin = await admin();
    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("slug, language, alternate_slug, updated_at, author:profiles!courses_author_id_fkey(public_slug, updated_at)")
      .eq("status", "published")
      .not("slug", "is", null);

    const rows = ((courses ?? []) as unknown as {
      slug: string;
      language: "fr" | "en";
      alternate_slug: string | null;
      updated_at: string;
      author: { public_slug: string | null; updated_at: string } | null;
    }[]);

    const entries = new Map<string, string>();
    for (const row of rows) {
      entries.set(coursePath(row.language, row.slug), row.updated_at.slice(0, 10));
      if (row.author?.public_slug) {
        entries.set(
          authorPath(row.language, row.author.public_slug),
          row.author.updated_at.slice(0, 10),
        );
      }
    }
    return [...entries.entries()].map(([path, lastmod]) => ({ path, lastmod }));
  },
);
