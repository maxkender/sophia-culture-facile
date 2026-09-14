import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COURSE_FEE_USD, COURSE_STATUSES, STATUS_LABEL, type CourseStatus } from "@/config/portal";
import { formatDate, isOverdue, type Course, type Profile } from "@/lib/portal";
import { PageTitle, PortalCard } from "../ui";

export function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["portal", "admin", "dashboard"],
    queryFn: async () => {
      const [{ data: courses }, { data: authors }, { data: contracts }] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("profiles").select("*").eq("role", "author"),
        supabase.from("contracts").select("author_id"),
      ]);
      const { data: education } = await supabase.from("education_records").select("profile_id");
      return {
        courses: (courses ?? []) as Course[],
        authors: (authors ?? []) as Profile[],
        signedIds: new Set((contracts ?? []).map((row) => row.author_id)),
        withEducation: new Set((education ?? []).map((row) => row.profile_id)),
      };
    },
  });

  // The internal test account must never show up in editorial figures.
  const testIds = new Set((data?.authors ?? []).filter((author) => author.is_test).map((author) => author.id));
  const courses = (data?.courses ?? []).filter((course) => !testIds.has(course.author_id ?? ""));
  // Authors who declined stay in the system but leave the active figures.
  const authors = (data?.authors ?? []).filter((author) => !author.is_test && author.upwork_status !== "declined");
  const assignedCourses = courses.filter((course) => course.author_id);
  const pooledCourses = courses.filter((course) => !course.author_id);
  const unsigned = authors.filter((author) => !data?.signedIds.has(author.id));
  const overdue = courses.filter(isOverdue);
  // A byline counts as complete once it has a title line and at least one degree.
  const hasEducation = (id: string) => Boolean(data?.withEducation.has(id));
  const toConfirm = authors.filter((author) => !author.display_title || !hasEducation(author.id));
  const byAuthor = new Map(authors.map((author) => [author.id, author.full_name]));

  const accepted = authors.filter((author) => author.upwork_status === "accepted").length;
  const awaiting = authors.length - accepted;
  const commissionedValue = courses.length * COURSE_FEE_USD;

  return (
    <div>
      <PageTitle title="Editorial dashboard" lead="Where every commissioned course stands today." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PortalCard>
          <p className="text-sm font-semibold text-brand-navySoft">Courses commissioned</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-navy">{courses.length}</p>
          <p className="mt-1 text-xs text-brand-navySoft">across {authors.length} authors</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-semibold text-brand-navySoft">Accepted on Upwork</p>
          <p className="mt-2 text-3xl font-extrabold text-portal-green">{accepted}</p>
          <p className="mt-1 text-xs text-brand-navySoft">signed on in writing</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-semibold text-brand-navySoft">Awaiting a reply</p>
          <p className="mt-2 text-3xl font-extrabold text-portal-amber">{awaiting}</p>
          <p className="mt-1 text-xs text-brand-navySoft">contacted, no answer yet</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-semibold text-brand-navySoft">Commissioned value</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-navy">
            ${commissionedValue.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs text-brand-navySoft">at ${COURSE_FEE_USD} per course</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-semibold text-brand-navySoft">Examples reviewed</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-navy">
            {authors.filter((author) => author.examples_reviewed_at).length}
            <span className="text-base font-bold text-brand-navySoft"> / {authors.length}</span>
          </p>
          <p className="mt-1 text-xs text-brand-navySoft">authors whose courses are unlocked</p>
        </PortalCard>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COURSE_STATUSES.map((status) => (
          <PortalCard key={status}>
            <p className="text-sm font-semibold text-brand-navySoft">{STATUS_LABEL[status as CourseStatus]}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-navy">
              {courses.filter((course) => course.status === status).length}
            </p>
          </PortalCard>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <PortalCard>
          <h2 className="text-lg font-extrabold text-brand-navy">Agreement not signed</h2>
          <ul className="mt-4 space-y-2">
            {unsigned.length === 0 ? (
              <li className="text-sm text-brand-navySoft">Every author has signed.</li>
            ) : (
              unsigned.map((author) => (
                <li key={author.id} className="text-sm">
                  <Link
                    to="/auteurs/admin/authors/$authorId"
                    params={{ authorId: author.id }}
                    className="font-semibold text-portal-accent hover:underline"
                  >
                    {author.full_name}
                  </Link>
                  <span className="text-brand-navySoft"> — {author.institution ?? "—"}</span>
                </li>
              ))
            )}
          </ul>
        </PortalCard>

        <PortalCard>
          <h2 className="text-lg font-extrabold text-brand-navy">Past due</h2>
          <ul className="mt-4 space-y-2">
            {overdue.length === 0 ? (
              <li className="text-sm text-brand-navySoft">Nothing is late.</li>
            ) : (
              overdue.map((course) => (
                <li key={course.id} className="text-sm text-brand-navy">
                  <span className="font-semibold">{course.title}</span>
                  <span className="text-brand-navySoft">
                    {" "}
                    — {byAuthor.get(course.author_id ?? "") ?? "Unassigned"} · due {formatDate(course.due_date)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </PortalCard>

        <PortalCard className="lg:col-span-2">
          <h2 className="text-lg font-extrabold text-brand-navy">Bylines to confirm</h2>
          <p className="mt-1 text-sm text-brand-navySoft">
            These must be right before anything is published. Nothing is invented here.
          </p>
          <ul className="mt-4 space-y-2">
            {toConfirm.length === 0 ? (
              <li className="text-sm text-brand-navySoft">Every byline and institution is confirmed.</li>
            ) : (
              toConfirm.map((author) => (
                <li key={author.id} className="text-sm">
                  <Link
                    to="/auteurs/admin/authors/$authorId"
                    params={{ authorId: author.id }}
                    className="font-semibold text-portal-accent hover:underline"
                  >
                    {author.full_name}
                  </Link>
                  <span className="font-semibold text-portal-amber">
                    {" "}
                    — {!author.display_title && !hasEducation(author.id)
                      ? "byline and education missing"
                      : !author.display_title
                        ? "byline missing"
                        : "no degree listed"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </PortalCard>
      </div>
    </div>
  );
}
