import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, isOverdue, type Course } from "@/lib/portal";
import type { CourseStatus } from "@/config/portal";
import { usePortalProfile } from "./usePortal";
import { EmptyState, PageTitle, StatusPill } from "./ui";

export function AuthorCourses() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["portal", "my-courses", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("author_id", profile!.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageTitle title="My courses" lead="Every course commissioned to you, in the order we would like them written." />
      {isLoading ? null : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          text="The editorial desk will assign your first course shortly. Nothing to do for now."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              to="/auteurs/courses/$courseId"
              params={{ courseId: course.id }}
              className="rounded-portal bg-card p-6 shadow-portal transition hover:ring-2 hover:ring-portal-accent/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                    {course.lot_code ?? "—"} · {course.subject_area ?? "—"}
                  </p>
                  <p className="mt-2 text-lg font-bold leading-snug text-brand-navy">{course.title}</p>
                  {course.subtitle ? <p className="mt-1 text-sm text-brand-navySoft">{course.subtitle}</p> : null}
                </div>
                <StatusPill status={course.status as CourseStatus} />
              </div>
              <p className={`mt-4 text-sm ${isOverdue(course) ? "font-bold text-portal-red" : "text-brand-navySoft"}`}>
                Due {formatDate(course.due_date)}
                {isOverdue(course) ? " — past due" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
