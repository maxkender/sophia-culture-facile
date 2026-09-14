/**
 * Export du contenu publié pour l'application mobile.
 * Lecture seule, protégé par la clé APP_EXPORT_KEY.
 */

const PHOTO_TTL = 60 * 60 * 24 * 7;

/** Renvoie une réponse 401 si la clé est absente ou fausse, sinon null. */
export function unauthorised(request: Request): Response | null {
  const expected = process.env["APP_EXPORT_KEY"];
  if (!expected) return Response.json({ error: "export_key_not_configured" }, { status: 503 });
  const url = new URL(request.url);
  const provided = request.headers.get("x-api-key") ?? url.searchParams.get("key") ?? "";
  if (provided !== expected) return Response.json({ error: "unauthorised" }, { status: 401 });
  return null;
}

export type ExportedCourse = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  subject_area: string | null;
  published_at: string | null;
  updated_at: string;
  public_full_text: boolean;
  screens: { screen_number: number; screen_title: string | null; body: string | null; image_idea: string | null }[];
  sources: { claim: string | null; reference: string | null; page: string | null }[];
  author: {
    display_name: string | null;
    display_title: string | null;
    institution: string | null;
    photo_url: string | null;
  } | null;
};

export async function exportedCourses({
  since,
  slug,
}: {
  since?: string | null;
  slug?: string;
}): Promise<ExportedCourse[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let query = supabaseAdmin
    .from("courses")
    .select(
      "id, slug, title, subtitle, subject_area, published_at, updated_at, public_full_text, author:profiles!courses_author_id_fkey(display_name, full_name, display_title, institution, photo_url)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (slug) query = query.eq("slug", slug);
  if (since) query = query.gt("updated_at", since);

  const { data } = await query;
  const rows = (data ?? []) as unknown as (Omit<ExportedCourse, "screens" | "sources" | "author"> & {
    author: {
      display_name: string | null;
      full_name: string;
      display_title: string | null;
      institution: string | null;
      photo_url: string | null;
    } | null;
  })[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [{ data: screens }, { data: sources }] = await Promise.all([
    supabaseAdmin
      .from("screens")
      .select("course_id, screen_number, screen_title, body, image_idea")
      .in("course_id", ids)
      .order("screen_number"),
    supabaseAdmin.from("sources").select("course_id, claim, reference, page").in("course_id", ids),
  ]);

  return Promise.all(
    rows.map(async (row) => {
      let photo: string | null = null;
      if (row.author?.photo_url) {
        const { data: signed } = await supabaseAdmin.storage
          .from("author-photos")
          .createSignedUrl(row.author.photo_url, PHOTO_TTL);
        photo = signed?.signedUrl ?? null;
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle,
        subject_area: row.subject_area,
        published_at: row.published_at,
        updated_at: row.updated_at,
        public_full_text: row.public_full_text,
        screens: ((screens ?? []) as { course_id: string }[])
          .filter((screen) => screen.course_id === row.id)
          .map(({ course_id: _ignored, ...rest }) => rest) as ExportedCourse["screens"],
        sources: ((sources ?? []) as { course_id: string }[])
          .filter((source) => source.course_id === row.id)
          .map(({ course_id: _ignored, ...rest }) => rest) as ExportedCourse["sources"],
        author: row.author
          ? {
              display_name: row.author.display_name || row.author.full_name,
              display_title: row.author.display_title,
              institution: row.author.institution,
              photo_url: photo,
            }
          : null,
      };
    }),
  );
}
