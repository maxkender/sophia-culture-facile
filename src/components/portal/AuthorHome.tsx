import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileSignature, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDate, isOverdue, type Course } from "@/lib/portal";
import type { CourseStatus } from "@/config/portal";
import { usePortalProfile } from "./usePortal";
import { Banner, CopyButton, EmptyState, PageTitle, PortalCard, StatusPill } from "./ui";

export function AuthorHome() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const signed = Boolean(me?.signedAt);

  const { data: courses = [] } = useQuery({
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

  const firstName = (profile?.full_name ?? "").split(" ")[0] ?? "";

  return (
    <div>
      <PageTitle
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        lead="Your access code, the writing guide and your commissioned courses. Everything else — fees, invoices and messages — stays in Upwork."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <PortalCard>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
            <KeyRound className="size-4" aria-hidden="true" />
            Your access code
          </p>
          {profile?.access_code ? (
            <>
              <p className="mt-4 font-mono text-lg font-bold tracking-wide text-brand-navy">{profile.access_code}</p>
              <p className="mt-1 text-xs text-brand-navySoft">
                {profile.platform === "android" ? "Google Play" : "App Store"} — one-time use
              </p>
              <p className="mt-3 rounded-2xl bg-portal-bg px-3 py-2 text-xs leading-relaxed text-brand-navy">
                <span className="font-bold">Important:</span> this code starts a free trial subscription, not a
                lifetime one. Cancel the subscription in your{" "}
                {profile.platform === "android" ? "Google Play" : "App Store"} account settings before the trial ends
                if you do not want to be charged.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton value={profile.access_code} label="Copy code" />
                {profile.access_redeem_url ? (
                  <Button asChild variant="pill" size="pillSm">
                    <a href={profile.access_redeem_url} target="_blank" rel="noreferrer noopener">
                      Redeem
                    </a>
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-brand-navySoft">No code has been issued to you yet.</p>
          )}
        </PortalCard>

        <PortalCard>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
            <BookOpen className="size-4" aria-hidden="true" />
            Writing guide
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">
            How a five-screen course is built, the house voice, and what we check before accepting.
          </p>
          <Button asChild variant="pillSecondary" size="pillSm" className="mt-4">
            <Link to="/auteurs/guide">Read the guide</Link>
          </Button>
        </PortalCard>

        <PortalCard>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
            <FileSignature className="size-4" aria-hidden="true" />
            Author agreement
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">
            {signed
              ? `Signed on ${formatDate(me?.signedAt)}. The document stays available.`
              : "Not signed yet. You need to sign before you can write."}
          </p>
          <Button asChild variant={signed ? "pillSecondary" : "pill"} size="pillSm" className="mt-4">
            <Link to="/auteurs/contract">{signed ? "View agreement" : "Read and sign"}</Link>
          </Button>
        </PortalCard>
      </div>

      {!signed ? (
        <div className="mt-6">
          <Banner tone="warning" title="Your courses are read-only until the agreement is signed">
            Open the author agreement, read it and sign at the bottom. Your commissioned courses are already listed
            below.
          </Banner>
        </div>
      ) : null}

      <h2 className="mt-12 text-xl font-extrabold text-brand-navy">Your courses</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <EmptyState title="No courses yet" text="The editorial desk will assign your first course shortly." />
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              to="/auteurs/courses/$courseId"
              params={{ courseId: course.id }}
              className="rounded-portal bg-card p-6 shadow-portal transition hover:ring-2 hover:ring-portal-accent/30"
            >
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
