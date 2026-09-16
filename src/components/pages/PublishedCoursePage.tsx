import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { DownloadCta } from "@/components/site/DownloadCta";
import { AuthorByline } from "@/components/site/AuthorByline";
import { subjectLabel } from "@/config/subjects";
import { publicText } from "@/i18n/public-content";
import { courseRoute, pathFor } from "@/i18n/routes";
import { boldParts } from "@/lib/portal";
import type { PublicCourse, PublicCourseCard } from "@/lib/public-content.functions";

function Rich({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((part, index) =>
        part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

/** Un cours publié, rendu comme un article continu, dans sa propre langue. */
export function PublishedCoursePage({
  course,
  related,
}: {
  course: PublicCourse;
  related: PublicCourseCard[];
}) {
  const lang = course.language;
  const text = publicText(lang);
  const screens = course.public_full_text ? course.screens : course.screens.slice(0, 1);
  const truncated = !course.public_full_text && course.screens.length > 1;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-surface" lang={lang}>
        <article className="mx-auto w-full max-w-[680px] px-5 py-10 md:py-14">
          <nav aria-label={text.breadcrumb} className="text-xs text-brand-navySoft">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={pathFor("home", lang)} className="hover:underline">
                  {text.home}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={pathFor("courses", lang)} className="hover:underline">
                  {text.hub}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-brand-navy">{subjectLabel(course.subject_area)}</li>
            </ol>
          </nav>

          <span className="mt-6 inline-block rounded-full bg-brand-pink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-navy">
            {subjectLabel(course.subject_area)}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-brand-navy md:text-[2.6rem]">
            {course.title}
          </h1>

          {course.subtitle ? (
            <p className="mt-4 text-[18px] leading-relaxed text-brand-navySoft">{course.subtitle}</p>
          ) : null}

          {course.author ? (
            <div className="mt-7 border-y border-brand-line py-5">
              <AuthorByline author={course.author} />
            </div>
          ) : null}

          {screens.map((screen) => (
            <section key={screen.screen_number} className="mt-10">
              {screen.screen_title ? (
                <h2 className="text-2xl font-extrabold leading-snug text-brand-navy">{screen.screen_title}</h2>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-[19px] leading-[1.8] text-brand-navy/85">
                <Rich text={screen.body ?? ""} />
              </p>
            </section>
          ))}

          {truncated ? (
            <p className="mt-10 rounded-3xl bg-card p-6 text-[16px] leading-relaxed text-brand-navySoft shadow-card">
              {text.truncated}
            </p>
          ) : null}

          {course.sources.length > 0 && course.public_full_text ? (
            <section className="mt-14 border-t border-brand-line pt-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">
                {text.sources}
              </h2>
              <ul className="mt-4 space-y-3 text-[15px]">
                {course.sources.map((source, index) => (
                  <li key={index}>
                    <p className="font-semibold text-brand-navy">{source.claim}</p>
                    <p className="text-brand-navySoft">
                      {source.reference}
                      {source.page ? `, p. ${source.page}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <aside className="mt-12 rounded-3xl border border-brand-line bg-card p-7">
            <p className="text-xl font-extrabold leading-snug text-brand-navy">{text.ctaTitle}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navySoft">{text.ctaText}</p>
            <div className="mt-6 max-w-xs">
              <DownloadCta variant="pillPink" size="pillSm">
                {text.ctaButton}
              </DownloadCta>
            </div>
          </aside>
        </article>

        {related.length > 0 ? (
          <section className="mx-auto w-full max-w-5xl px-5 pb-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">
              {text.next}
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={courseRoute(item.language)}
                    params={{ slug: item.slug }}
                    className="group flex h-full flex-col rounded-3xl bg-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-pink">
                      {subjectLabel(item.subject_area)}
                    </span>
                    <span className="mt-3 flex-1 text-lg font-extrabold leading-snug text-brand-navy">
                      {item.title}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-navy">
                      {text.read}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8">
              <Link
                to={pathFor("courses", lang)}
                className="text-sm font-bold text-brand-navy underline-offset-4 hover:underline"
              >
                {text.allCourses}
              </Link>
            </p>
          </section>
        ) : null}
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
