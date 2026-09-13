import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COURSE_STATUSES, STATUS_LABEL, type CourseStatus } from "@/config/portal";
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
      return {
        courses: (courses ?? []) as Course[],
        authors: (authors ?? []) as Profile[],
        signedIds: new Set((contracts ?? []).map((row) => row.author_id)),
      };
    },
  });

  const courses = data?.courses ?? [];
  const authors = data?.authors ?? [];
  const unsigned = authors.filter((author) => !data?.signedIds.has(author.id));
  const overdue = courses.filter(isOverdue);
  const byAuthor = new Map(authors.map((author) => [author.id, author.full_name]));

  return (
    <div>
      <PageTitle title="Editorial dashboard" lead="Where every commissioned course stands today." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
