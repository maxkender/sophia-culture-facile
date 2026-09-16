import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { AuthorByline } from "@/components/site/AuthorByline";
import { subjectLabel } from "@/config/subjects";
import { useLang } from "@/i18n";
import { publicText } from "@/i18n/public-content";
import { courseRoute } from "@/i18n/routes";
import type { PublicCourseCard } from "@/lib/public-content.functions";

/** Index des cours publiés : la langue du visiteur d'abord, les autres sur demande. */
export function PublishedCoursesHub({ courses }: { courses: PublicCourseCard[] }) {
  const lang = useLang();
  const text = publicText(lang);
  const [subject, setSubject] = useState<string>("all");
  const [showOther, setShowOther] = useState(false);

  const inLang = courses.filter((c) => c.language === lang);
  const other = courses.filter((c) => c.language !== lang);
  const pool = showOther ? [...inLang, ...other] : inLang;

  const subjects = [...new Set(pool.map((c) => c.subject_area).filter(Boolean))] as string[];
  const filters = [
    { id: "all", label: text.all, count: pool.length },
    ...subjects.map((id) => ({
      id,
      label: subjectLabel(id),
      count: pool.filter((c) => c.subject_area === id).length,
    })),
  ];
  const visible = subject === "all" ? pool : pool.filter((c) => c.subject_area === subject);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-surface">
        <div className="mx-auto w-full max-w-5xl px-5 py-12 md:py-16">
          <h1 className="text-3xl font-extrabold leading-tight text-brand-navy md:text-5xl">
            {text.hubTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-brand-navySoft">
            {text.hubIntro}
          </p>

          {pool.length === 0 ? (
            <p className="mt-10 text-[17px] text-brand-navySoft">{text.empty}</p>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSubject(filter.id)}
                    aria-pressed={subject === filter.id}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      subject === filter.id
                        ? "bg-brand-navy text-white"
                        : "bg-card text-brand-navy shadow-card hover:bg-brand-navy/5"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {other.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowOther((v) => !v)}
                  aria-pressed={showOther}
                  className="mt-4 text-sm font-bold text-brand-navy underline-offset-4 hover:underline"
                >
                  {showOther ? text.otherLangHide : text.otherLangShow} ({other.length})
                </button>
              ) : null}

              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {visible.map((course) => (
                  <li key={`${course.language}-${course.slug}`}>
                    <div className="flex h-full flex-col rounded-3xl bg-card p-6 shadow-card">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-pink">
                        {subjectLabel(course.subject_area)}
                        {course.language !== lang ? ` · ${text.otherLangBadge}` : ""}
                      </span>
                      <Link
                        to={courseRoute(course.language)}
                        params={{ slug: course.slug }}
                        hrefLang={course.language}
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
