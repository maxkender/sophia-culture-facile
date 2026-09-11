import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { DownloadCta } from "@/components/site/DownloadCta";
import { getRelatedCourses, type Course } from "@/content/api";
import { fill, useI18n } from "@/i18n";
import { pathFor } from "@/i18n/routes";

/** Formate une date ISO selon la langue de la page. */
function formatDate(iso: string, lang: "fr" | "en") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Barre fine et fixe indiquant l'avancée dans la lecture. */
function ReadingProgress({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
    >
      <div
        className="h-full bg-brand-pink transition-[width] duration-150 motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function CoursePage({ course }: { course: Course }) {
  const { lang, t } = useI18n();
  const related = getRelatedCourses(course);
  const hubPath = pathFor("courses", lang);
  const detailRoute = lang === "fr" ? "/cours/$slug" : "/en/lessons/$slug";

  return (
    <>
      <ReadingProgress label={t.courses.progressAria} />
      <SiteHeader />
      <main className="bg-brand-surface">
        <article className="mx-auto w-full max-w-[680px] px-5 py-10 md:py-14">
          <nav aria-label={t.courses.breadcrumbAria} className="text-xs text-brand-navySoft">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={pathFor("home", lang)} className="hover:underline">
                  {t.courses.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={hubPath} className="hover:underline">
                  {t.courses.hubLink}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-brand-navy">{course.category}</li>
            </ol>
          </nav>

          <span className="mt-6 inline-block rounded-full bg-brand-pink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-navy">
            {course.category}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-brand-navy md:text-[2.6rem]">
            {course.title}
          </h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-brand-navySoft">
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden="true" className="size-4" />
              {fill(t.courses.readingTime, { minutes: String(course.readingTimeMinutes) })}
            </span>
            <span>
              {fill(t.courses.updated, { date: formatDate(course.updatedAt, lang) })}
            </span>
          </p>

          <p className="mt-6 text-[18px] leading-relaxed text-brand-navySoft">{course.excerpt}</p>

          <img
            src={course.heroImage.src}
            alt={course.heroImage.alt}
            width={course.heroImage.width}
            height={course.heroImage.height}
            loading="lazy"
            decoding="async"
            className="mt-8 aspect-[1200/630] w-full rounded-3xl object-cover"
          />

          {course.chapters.map((chapter, i) => (
            <section key={chapter.title} className="mt-10">
              <h2 className="text-2xl font-extrabold leading-snug text-brand-navy">
                {chapter.title}
              </h2>
              <p className="mt-4 text-[18px] leading-[1.75] text-brand-navy/85">{chapter.body}</p>

              {i === 1 && (
                <aside className="mt-10 rounded-3xl border border-brand-line bg-card p-6">
                  <p className="text-lg font-extrabold leading-snug text-brand-navy">
                    {t.courses.inlineCtaTitle}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-brand-navySoft">
                    {t.courses.inlineCtaText}
                  </p>
                  <div className="mt-5 max-w-xs">
                    <DownloadCta variant="pillPink" size="pillSm">
                      {t.courses.inlineCtaButton}
                    </DownloadCta>
                  </div>
                </aside>
              )}
            </section>
          ))}

          <section className="mt-14 border-t border-brand-line pt-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">
              {t.courses.sourcesTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-[15px]">
              {course.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 font-semibold text-brand-navy underline-offset-4 hover:underline"
                  >
                    {source.label}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <section className="mx-auto w-full max-w-5xl px-5 pb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">
            {t.courses.relatedTitle}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  to={detailRoute}
                  params={{ slug: item.slug }}
                  className="group flex h-full flex-col rounded-3xl bg-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
                >
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-pink">
                    {item.category}
                  </span>
                  <span className="mt-3 flex-1 text-lg font-extrabold leading-snug text-brand-navy">
                    {item.title}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-navy">
                    {t.courses.read}
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
              to={hubPath}
              className="text-sm font-bold text-brand-navy underline-offset-4 hover:underline"
            >
              {t.courses.backToHub}
            </Link>
          </p>
        </section>

        <section className="bg-brand-pink">
          <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center">
            <h2 className="text-3xl font-extrabold leading-tight text-brand-navy md:text-5xl">
              {t.courses.finalCtaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-brand-navy/80">
              {t.courses.finalCtaText}
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <DownloadCta size="pillLg" className="w-full">
                {t.courses.finalCtaButton}
              </DownloadCta>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <div className="h-20 md:hidden" aria-hidden="true" />
      <MobileCtaBar />
    </>
  );
}
