import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, type Course, type Profile } from "@/lib/portal";
import { EmptyState, PageTitle, PortalCard } from "../ui";

export function ReviewQueue() {
  const { data } = useQuery({
    queryKey: ["portal", "admin", "review"],
    queryFn: async () => {
      const { data: courses } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "submitted")
        .order("submitted_at");
      const { data: authors } = await supabase.from("profiles").select("id, full_name");
      return {
        courses: (courses ?? []) as Course[],
        authors: (authors ?? []) as Pick<Profile, "id" | "full_name">[],
      };
    },
  });

  const courses = data?.courses ?? [];
  const authorById = new Map((data?.authors ?? []).map((author) => [author.id, author.full_name]));

  return (
    <div>
      <PageTitle title="Review queue" lead="Courses waiting for a decision from the editorial desk." />
      {courses.length === 0 ? (
        <EmptyState title="Nothing to review" text="Submitted courses will appear here." />
      ) : (
        <PortalCard>
          <ul className="divide-y divide-brand-line">
            {courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <Link
                    to="/auteurs/admin/review/$courseId"
                    params={{ courseId: course.id }}
                    className="text-base font-bold text-portal-accent hover:underline"
                  >
                    {course.title}
                  </Link>
                  <p className="text-xs text-brand-navySoft">
                    {authorById.get(course.author_id ?? "") ?? "Unassigned"} · {course.lot_code ?? "—"} · due{" "}
                    {formatDate(course.due_date)}
                  </p>
                </div>
                <p className="text-xs text-brand-navySoft">Submitted {formatDateTime(course.submitted_at)}</p>
              </li>
            ))}
          </ul>
        </PortalCard>
      )}
    </div>
  );
}
