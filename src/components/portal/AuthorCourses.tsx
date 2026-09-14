import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Course } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { CourseCard, ExamplesLockNotice } from "./CourseCards";
import { EmptyState, PageTitle } from "./ui";

export function AuthorCourses() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const locked = Boolean(profile) && !profile?.examples_reviewed_at;

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
      {locked ? (
        <div className="mb-6">
          <ExamplesLockNotice />
        </div>
      ) : null}
      {isLoading ? null : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          text="The editorial desk will assign your first course shortly. Nothing to do for now."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} locked={locked} />
          ))}
        </div>
      )}
    </div>
  );
}
