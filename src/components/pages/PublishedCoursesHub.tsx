import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { AuthorByline } from "@/components/site/AuthorByline";
import { SUBJECT_AREAS, subjectLabel } from "@/config/subjects";
import type { PublicCourseCard } from "@/lib/public-content.functions";

/** Index public des cours publiés, filtrable par domaine. */
export function PublishedCoursesHub({ courses }: { courses: PublicCourseCard[] }) {
  const [active, setActive] = useState<string>("all");
  const counts = new Map<string, number>();
  for (const course of courses) {
    const key = course.subject_area ?? "";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const filters = [
    { id: "all", label: "Tous les cours", count: courses.length },
    ...SUBJECT_AREAS.filter((area) => counts.get(area)).map((area) => ({
      id: area,
      label: subjectLabel(area),
      count: counts.get(area) ?? 0,
    })),
  ];
  const visible = active === "all" ? courses : courses.filter((course) => course.subject_area === active);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-surface">
        <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
          <h1 className="text-4xl font-extrabold leading-tight text-brand-navy md:text-6xl">
            Les cours de Sophia
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-brand-navySoft">
            Chaque cours est écrit par un universitaire ou un spécialiste, signé de son nom, et relu avant
            publication. À lire ici, à réviser dans l'application.
          </p>

          {courses.length === 0 ? (
            <p className="mt-12 rounded-3xl bg-card p-8 text-[17px] leading-relaxed text-brand-navySoft shadow-card">
              Les premiers cours arrivent bientôt. En attendant, l'application en propose déjà plusieurs
              centaines.
            </p>
          ) : (
            <>
              <div role="group" aria-label="Filtrer par domaine" className="mt-9 flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActive(filter.id)}
                    aria-pressed={active === filter.id}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      active === filter.id
                        ? "bg-brand-navy text-white"
                        : "bg-card text-brand-navy hover:bg-brand-navy/10"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {visible.map((course) => (
                  <li key={course.slug}>
                    <div className="flex h-full flex-col rounded-3xl bg-card p-6 shadow-card">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-pink">
                        {subjectLabel(course.subject_area)}
                      </span>
                      <Link
                        to="/cours/$slug"
                        params={{ slug: course.slug }}
                        className="group mt-3 text-xl font-extrabold leading-snug text-brand-navy"
                      >
                        {course.title}
                        <ArrowRight
                          aria-hidden="true"
                          className="ml-2 inline size-4 transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                      {course.subtitle ? (
                        <p className="mt-3 flex-1 text-[15px] leading-relaxed text-brand-navySoft">
                          {course.subtitle}
                        </p>
                      ) : (
                        <span className="flex-1" />
                      )}
                      {course.author ? (
                        <div className="mt-6 border-t border-brand-line pt-4">
                          <AuthorByline author={course.author} size="sm" />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
