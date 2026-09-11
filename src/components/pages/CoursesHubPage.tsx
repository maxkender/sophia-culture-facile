import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { DownloadCta } from "@/components/site/DownloadCta";
import { getCategories, getCourses } from "@/content/api";
import { fill, useI18n } from "@/i18n";
import { coursePath } from "@/i18n/routes";

/** Hub des cours : liste complète + filtre par catégorie. */
export function CoursesHubPage() {
  const { lang, t } = useI18n();
  const courses = useMemo(() => getCourses(lang), [lang]);
  const categories = useMemo(() => getCategories(lang), [lang]);
  const [active, setActive] = useState<string>("all");

  const visible = active === "all" ? courses : courses.filter((c) => c.categoryId === active);

  const filters = [{ id: "all", label: t.courses.all, count: courses.length }, ...categories];

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-surface">
        <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
          <h1 className="text-4xl font-extrabold leading-tight text-brand-navy md:text-6xl">
            {t.courses.hubTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-brand-navySoft">
            {t.courses.hubSubtitle}
          </p>

          <div
            role="group"
            aria-label={t.courses.filterAria}
            className="mt-9 flex flex-wrap gap-2"
          >
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(f.id)}
                aria-pressed={active === f.id}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  active === f.id
                    ? "bg-brand-navy text-brand-onNavy"
                    : "border border-brand-line text-brand-navy hover:bg-brand-navy/5"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <ul aria-label={t.courses.listAria} className="mt-10 grid gap-5 md:grid-cols-2">
            {visible.map((course) => (
              <li key={course.slug}>
                <Link
                  to={lang === "fr" ? "/cours/$slug" : "/en/lessons/$slug"}
                  params={{ slug: course.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-card transition-transform duration-200 hover:-translate-y-1"
                >
                  <img
                    src={course.heroImage.src}
                    alt={course.heroImage.alt}
                    width={course.heroImage.width}
                    height={course.heroImage.height}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[1200/630] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <span className="w-fit rounded-full bg-brand-pink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-navy">
                      {course.category}
                    </span>
                    <h2 className="mt-4 text-xl font-extrabold leading-snug text-brand-navy">
                      {course.title}
                    </h2>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-brand-navySoft">
                      {course.excerpt}
                    </p>
                    <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-navySoft">
                      <Clock aria-hidden="true" className="size-4" />
                      {fill(t.courses.readingTime, {
                        minutes: String(course.readingTimeMinutes),
                      })}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-navy">
                      {t.courses.read}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

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
