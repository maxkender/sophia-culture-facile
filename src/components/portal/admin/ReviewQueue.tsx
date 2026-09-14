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
        .in("status", ["submitted", "changes_requested"])
        .order("submitted_at");
      const { data: authors } = await supabase.from("profiles").select("id, full_name");
      return {
        courses: (courses ?? []) as Course[],
        authors: (authors ?? []) as Pick<Profile, "id" | "full_name">[],
      };
    },
  });

  const all = data?.courses ?? [];
  const submitted = all.filter((course) => course.status === "submitted");
  const returned = all.filter((course) => course.status === "changes_requested");
  const authorById = new Map((data?.authors ?? []).map((author) => [author.id, author.full_name]));

  const row = (course: Course) => (
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
      <p className="text-xs text-brand-navySoft">
        {course.status === "submitted"
          ? `Submitted ${formatDateTime(course.submitted_at)}`
          : `Changes requested · last submitted ${formatDateTime(course.submitted_at)}`}
      </p>
    </li>
  );

  return (
    <div>
      <PageTitle title="Review queue" lead="Courses waiting for a decision from the editorial desk." />
      {all.length === 0 ? (
        <EmptyState title="Nothing to review" text="Submitted courses will appear here." />
      ) : (
        <div className="space-y-6">
          <PortalCard>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
              Waiting for a decision ({submitted.length})
            </h2>
            {submitted.length === 0 ? (
              <p className="mt-3 text-sm text-brand-navySoft">Nothing submitted right now.</p>
            ) : (
              <ul className="mt-2 divide-y divide-brand-line">{submitted.map(row)}</ul>
            )}
          </PortalCard>

          {returned.length > 0 ? (
            <PortalCard>
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
                Back with the author ({returned.length})
              </h2>
              <ul className="mt-2 divide-y divide-brand-line">{returned.map(row)}</ul>
            </PortalCard>
          ) : null}
        </div>
      )}
    </div>
  );
}
