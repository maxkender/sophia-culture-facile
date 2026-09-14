import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, isOverdue, type Course } from "@/lib/portal";
import type { CourseStatus } from "@/config/portal";
import { PortalCard, StatusPill } from "./ui";

export const EXAMPLES_LOCK_TEXT =
  "Read the two example courses first. They show the format better than any description, and the pieces we send back are almost always from authors who skipped this step. It takes ten minutes.";

/** Shown in place of the editor link while the author has not reviewed the examples. */
export function ExamplesLockNotice() {
  return (
    <PortalCard className="border-l-4 border-portal-amber">
      <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
        <Lock className="size-4" aria-hidden="true" />
        Your courses open after the examples
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-navySoft">{EXAMPLES_LOCK_TEXT}</p>
      <Button asChild variant="pill" size="pillSm" className="mt-4">
        <Link to="/auteurs/examples">Read the examples</Link>
      </Button>
    </PortalCard>
  );
}

function CardBody({ course }: { course: Course }) {
  return (
    <>
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
    </>
  );
}

/** One commissioned course; locked until the author has reviewed the examples. */
export function CourseCard({ course, locked }: { course: Course; locked: boolean }) {
  if (locked) {
    return (
      <div className="rounded-portal bg-card p-6 opacity-80 shadow-portal">
        <CardBody course={course} />
        <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-portal-amber">
          <Lock className="size-3.5" aria-hidden="true" /> Locked until you have read the examples
        </p>
      </div>
    );
  }
  return (
    <Link
      to="/auteurs/courses/$courseId"
      params={{ courseId: course.id }}
      className="rounded-portal bg-card p-6 shadow-portal transition hover:ring-2 hover:ring-portal-accent/30"
    >
      <CardBody course={course} />
    </Link>
  );
}
