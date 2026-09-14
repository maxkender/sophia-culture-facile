import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, GraduationCap, Globe } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { subjectLabel } from "@/config/subjects";
import type { PublicAuthor, PublicCourseCard, PublicEducation } from "@/lib/public-content.functions";

/** Page publique d'un auteur : qui il est, ses diplômes, ses cours. */
export function PublicAuthorPage({
  author,
  education,
  courses,
}: {
  author: PublicAuthor;
  education: PublicEducation[];
  courses: PublicCourseCard[];
}) {
  const links = [
    author.orcid
      ? {
          href: author.orcid.startsWith("http") ? author.orcid : `https://orcid.org/${author.orcid}`,
          label: "ORCID",
          icon: GraduationCap,
        }
      : null,
    author.personal_site ? { href: author.personal_site, label: "Site personnel", icon: Globe } : null,
    author.scholar_url ? { href: author.scholar_url, label: "Google Scholar", icon: ExternalLink } : null,
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-surface">
        <div className="mx-auto w-full max-w-[760px] px-5 py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-6">
            {author.photo_url ? (
              <img
                src={author.photo_url}
                alt={author.display_name}
                loading="lazy"
                decoding="async"
                className="size-24 rounded-full object-cover"
              />
            ) : null}
            <div>
              <h1 className="text-3xl font-extrabold leading-tight text-brand-navy md:text-4xl">
                {author.display_name}
              </h1>
              {author.display_title ? (
                <p className="mt-2 text-[17px] leading-relaxed text-brand-navySoft">{author.display_title}</p>
              ) : null}
              {author.institution ? (
                <p className="text-[15px] text-brand-navySoft">{author.institution}</p>
              ) : null}
            </div>
          </div>

          {links.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-3">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={link.label}
                    title={link.label}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-card text-brand-navy shadow-card hover:bg-brand-navy/10"
                  >
                    <link.icon aria-hidden="true" className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {author.short_bio ? (
            <p className="mt-8 text-[18px] leading-[1.8] text-brand-navy/85">{author.short_bio}</p>
          ) : null}

          {education.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">Formation</h2>
              <ul className="mt-4 space-y-3 text-[16px] leading-relaxed">
                {education.map((record, index) => (
                  <li key={index} className="text-brand-navy">
                    <span className="font-bold">
                      {[record.degree, record.field].filter(Boolean).join(", ")}
                    </span>
                    {record.institution ? (
                      <span className="text-brand-navySoft"> — {record.institution}</span>
                    ) : null}
                    {record.year ? <span className="text-brand-navySoft"> ({record.year})</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-navySoft">
              Ses cours sur Sophia
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Link
                    to="/cours/$slug"
                    params={{ slug: course.slug }}
                    className="group flex h-full flex-col rounded-3xl bg-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-pink">
                      {subjectLabel(course.subject_area)}
                    </span>
                    <span className="mt-3 flex-1 text-lg font-extrabold leading-snug text-brand-navy">
                      {course.title}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-navy">
                      Lire
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
