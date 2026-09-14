import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue, type Course, type Profile } from "@/lib/portal";
import { STATUS_LABEL, type CourseStatus } from "@/config/portal";
import { EmptyState, PageTitle, PortalCard, StatusPill } from "../ui";

const FILTERS: ("all" | CourseStatus)[] = [
  "all",
  "assigned",
  "in_progress",
  "submitted",
  "changes_requested",
  "accepted",
  "published",
];

export function CoursesList() {
  const [status, setStatus] = useState<"all" | CourseStatus>("all");
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "admin", "courses"],
    queryFn: async () => {
      const [{ data: courses }, { data: authors }] = await Promise.all([
        supabase.from("courses").select("*").order("updated_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      return {
        courses: (courses ?? []) as Course[],
        authors: (authors ?? []) as Pick<Profile, "id" | "full_name">[],
      };
    },
  });

  const authorName = (id: string | null) =>
    (data?.authors ?? []).find((author) => author.id === id)?.full_name ?? "Unassigned";

  const needle = query.trim().toLowerCase();
  const courses = (data?.courses ?? []).filter((course) => {
    if (status !== "all" && course.status !== status) return false;
    if (!needle) return true;
    return `${course.title} ${course.lot_code ?? ""} ${course.subject_area ?? ""} ${authorName(course.author_id)}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div>
      <PageTitle title="Courses" lead="Every commissioned course across all authors." />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              status === value
                ? "bg-brand-navy text-card"
                : "bg-card text-brand-navySoft shadow-portal hover:text-brand-navy",
            )}
          >
            {value === "all" ? "All" : STATUS_LABEL[value]}
          </button>
        ))}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses"
          className="ml-auto w-56"
        />
      </div>

      {isLoading ? null : courses.length === 0 ? (
        <EmptyState title="No course matches" text="Change the filter or clear the search." />
      ) : (
        <PortalCard className="p-0">
          <ul className="divide-y divide-brand-line">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  to="/auteurs/admin/courses/$courseId"
                  params={{ courseId: course.id }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-portal-bg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                      {course.lot_code ?? "—"} · {course.subject_area ?? "—"}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-brand-navy">{course.title}</p>
                    <p className="mt-0.5 text-xs text-brand-navySoft">{authorName(course.author_id)}</p>
                  </div>
                  <p className={cn("text-xs", isOverdue(course) ? "font-bold text-portal-red" : "text-brand-navySoft")}>
                    Due {formatDate(course.due_date)}
                  </p>
                  <StatusPill status={course.status as CourseStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </PortalCard>
      )}
    </div>
  );
}
