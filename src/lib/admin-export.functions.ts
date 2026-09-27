import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { countWords } from "@/lib/portal";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || data.role !== "admin") throw new Error("forbidden");
  return { supabaseAdmin };
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n");
}

/** CSV of every validated (accepted or published) course, with professor info and the full course text. */
export const exportValidatedCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; csv: string }> => {
    const { supabaseAdmin } = await assertAdmin(context.userId);

    const [{ data: courses, error }, { data: screens }, { data: sources }] = await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id, title, subtitle, lot_code, subject_area, status, language, published_at, author_id, did_you_know")
        .in("status", ["accepted", "published"])
        .order("title"),
      supabaseAdmin
        .from("screens")
        .select("course_id, screen_number, screen_title, body")
        .order("course_id")
        .order("screen_number"),
      supabaseAdmin
        .from("sources")
        .select("course_id, claim, reference, page")
        .order("created_at"),
    ]);
    if (error) throw new Error("Could not read courses.");

    const authorIds = [...new Set((courses ?? []).map((c) => c.author_id).filter(Boolean))] as string[];
    const [{ data: authors }, { data: education }] = await Promise.all([
      authorIds.length
        ? supabaseAdmin.from("profiles").select("id, display_name, full_name, title, institution").in("id", authorIds)
        : Promise.resolve({ data: [] as never[] }),
      authorIds.length
        ? supabaseAdmin.from("education_records").select("profile_id, degree, field, institution, year").in("profile_id", authorIds).order("order_index")
        : Promise.resolve({ data: [] as never[] }),
    ]);

    const authorById = new Map((authors ?? []).map((a) => [a.id, a]));
    const educationById = new Map<string, string>();
    for (const record of education ?? []) {
      const label = [record.degree, record.field, record.institution, record.year].filter(Boolean).join(" - ");
      educationById.set(record.profile_id, educationById.has(record.profile_id) ? `${educationById.get(record.profile_id)} | ${label}` : label);
    }

    const screensByCourse = new Map<string, { screen_number: number; screen_title: string | null; body: string | null }[]>();
    for (const screen of screens ?? []) {
      const list = screensByCourse.get(screen.course_id) ?? [];
      list.push(screen);
      screensByCourse.set(screen.course_id, list);
    }
    const sourcesByCourse = new Map<string, { claim: string | null; reference: string | null; page: string | null }[]>();
    for (const source of sources ?? []) {
      const list = sourcesByCourse.get(source.course_id) ?? [];
      list.push(source);
      sourcesByCourse.set(source.course_id, list);
    }

    /** Same plain text as the admin/author "Copy course" button. */
    function buildFullText(course: {
      title: string; subtitle: string | null; lot_code: string | null; subject_area: string | null; did_you_know: string[] | null;
    }, authorName: string): string {
      const ordered = [...(screensByCourse.get(course.id) ?? [])].sort(
        (a, b) => (a.screen_number ?? 0) - (b.screen_number ?? 0),
      );
      const blocks: string[] = [];

      const header = [course.title.trim()];
      if (course.subtitle?.trim()) header.push(course.subtitle.trim());
      blocks.push(header.join("\n"));

      const meta = [authorName.trim() || null, course.lot_code?.trim() || null, course.subject_area?.trim() || null]
        .filter(Boolean)
        .join(" · ");
      if (meta) blocks.push(meta);

      ordered.forEach((screen, index) => {
        const number = screen.screen_number ?? index + 1;
        const body = (screen.body ?? "").trim();
        blocks.push(`SCREEN ${number} — ${(screen.screen_title ?? "").trim() || "Untitled"}${body ? `\n${body}` : ""}`);
      });

      const facts = (course.did_you_know ?? []).map((fact) => fact.trim()).filter(Boolean);
      if (facts.length > 0) blocks.push(["DID YOU KNOW", ...facts].join("\n"));

      const sourceLines = (sourcesByCourse.get(course.id) ?? [])
        .map((source) => {
          const parts = [source.claim?.trim(), source.reference?.trim()].filter(Boolean).join(" — ");
          const page = source.page?.trim();
          return page ? `${parts}${parts ? ", " : ""}p. ${page}` : parts;
        })
        .filter(Boolean);
      if (sourceLines.length > 0) blocks.push(["SOURCES", ...sourceLines].join("\n"));

      const totalWords = ordered.reduce((sum, screen) => sum + countWords(screen.body), 0);
      blocks.push(`Total: ${totalWords} words`);

      return blocks.join("\n\n");
    }

    const rows = (courses ?? []).map((course) => {
      const author = course.author_id ? authorById.get(course.author_id) : undefined;
      const authorName = String(author?.display_name ?? author?.full_name ?? "");
      return [
        course.title,
        course.subtitle ?? "",
        course.subject_area,
        course.status,
        course.language,
        authorName,
        author?.title ?? "",
        author?.institution ?? "",
        course.author_id ? (educationById.get(course.author_id) ?? "") : "",
        course.published_at ?? "",
        buildFullText(course, authorName),
      ];
    });

    return {
      filename: "cours_valides.csv",
      csv: toCsv(
        [
          "course_title", "subtitle", "subject_area", "status", "language", "professor", "professor_title",
          "institution", "formation", "published_at", "full_text",
        ],
        rows,
      ),
    };
  });

/** CSV with one row per page of every validated course: page number, page title and full content. */
export const exportCoursePages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; csv: string }> => {
    const { supabaseAdmin } = await assertAdmin(context.userId);

    const [{ data: courses, error }, { data: screens }, { data: sources }] = await Promise.all([
      supabaseAdmin
        .from("courses")
        .select("id, title, subtitle, subject_area, language")
        .in("status", ["accepted", "published"])
        .order("title"),
      supabaseAdmin
        .from("screens")
        .select("course_id, screen_number, screen_title, body")
        .order("course_id")
        .order("screen_number"),
      supabaseAdmin
        .from("sources")
        .select("course_id, claim, reference, page")
        .order("created_at"),
    ]);
    if (error) throw new Error("Could not read courses.");

    const screensByCourse = new Map<string, { screen_number: number; screen_title: string | null; body: string | null }[]>();
    for (const screen of screens ?? []) {
      const list = screensByCourse.get(screen.course_id) ?? [];
      list.push(screen);
      screensByCourse.set(screen.course_id, list);
    }
    const sourcesByCourse = new Map<string, string>();
    for (const source of sources ?? []) {
      const parts = [source.claim?.trim(), source.reference?.trim()].filter(Boolean).join(" — ");
      const page = source.page?.trim();
      const label = page ? `${parts}${parts ? ", " : ""}p. ${page}` : parts;
      if (!label) continue;
      const current = sourcesByCourse.get(source.course_id);
      sourcesByCourse.set(source.course_id, current ? `${current}\n${label}` : label);
    }

    const rows: unknown[][] = [];
    for (const course of courses ?? []) {
      for (const page of screensByCourse.get(course.id) ?? []) {
        rows.push([
          course.title,
          course.subtitle ?? "",
          course.subject_area ?? "",
          course.language ?? "",
          page.screen_number,
          page.screen_title ?? "",
          page.body ?? "",
          sourcesByCourse.get(course.id) ?? "",
          course.did_you_know ?? "",
        ]);
      }
    }

    return {
      filename: "cours_pages.csv",
      csv: toCsv(
        ["course_title", "subtitle", "subject_area", "language", "page_number", "page_title", "content", "sources", "did_you_know"],
        rows,
      ),
    };
  });

/** CSV with everything known about each author, including a temporary download link for their photo. */
export const exportAuthors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; csv: string }> => {
    const { supabaseAdmin } = await assertAdmin(context.userId);

    const [{ data: authors, error }, { data: education }, { data: contracts }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("role", "author").order("full_name"),
      supabaseAdmin.from("education_records").select("profile_id, degree, field, institution, year").order("order_index"),
      supabaseAdmin.from("contracts").select("author_id, signed_at, document_version"),
    ]);
    if (error) throw new Error("Could not read authors.");

    const educationById = new Map<string, string>();
    for (const record of education ?? []) {
      const label = [record.degree, record.field, record.institution, record.year].filter(Boolean).join(" - ");
      educationById.set(record.profile_id, educationById.has(record.profile_id) ? `${educationById.get(record.profile_id)} | ${label}` : label);
    }
    const contractById = new Map((contracts ?? []).map((c) => [c.author_id, c]));

    // Signed photo links stay valid for 7 days so the CSV can be shared internally.
    const photoPaths = (authors ?? []).map((a) => a.photo_url).filter(Boolean) as string[];
    const photoUrls = new Map<string, string>();
    if (photoPaths.length) {
      const { data: signed } = await supabaseAdmin.storage
        .from("author-photos")
        .createSignedUrls(photoPaths, 60 * 60 * 24 * 7);
      for (const row of signed ?? []) if (row.path && row.signedUrl) photoUrls.set(row.path, row.signedUrl);
    }

    const rows = (authors ?? []).map((a) => {
      const contract = contractById.get(a.id);
      return [
        a.full_name,
        a.display_name ?? "",
        a.email ?? "",
        a.title ?? "",
        a.display_title ?? "",
        a.institution ?? "",
        educationById.get(a.id) ?? "",
        a.country ?? "",
        a.bio ?? "",
        a.short_bio ?? "",
        a.orcid ?? "",
        a.personal_site ?? "",
        a.scholar_url ?? "",
        a.platform ?? "",
        a.upwork_status,
        a.photo_url ? (photoUrls.get(a.photo_url) ?? "") : "",
        a.activated_at ? "activated" : a.invite_token ? "invited" : "not invited",
        contract ? `signed ${contract.document_version} on ${contract.signed_at}` : "not signed",
        a.examples_reviewed_at ?? "",
        a.guide_read_at ?? "",
        a.created_at,
      ];
    });

    return {
      filename: "profs_export.csv",
      csv: toCsv(
        [
          "full_name", "display_name", "email", "title", "byline", "institution", "formation",
          "country", "bio", "short_bio", "orcid", "personal_site", "scholar_url", "platform",
          "upwork_status", "photo_url", "account_status", "agreement", "examples_read_at",
          "guide_read_at", "created_at",
        ],
        rows,
      ),
    };
  });
