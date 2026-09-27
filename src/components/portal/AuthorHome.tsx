import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, type Course } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { CourseCard, ExamplesLockNotice } from "./CourseCards";
import { CopyButton, EmptyState, PageTitle, PortalCard } from "./ui";
import { AnnouncementBanners } from "./Announcements";

const TAAP_LINK = "https://taap.it/sophia.culture";

function StepCard({
  number,
  title,
  done,
  highlight = false,
  muted = false,
  children,
}: {
  number: number;
  title: string;
  done?: boolean;
  highlight?: boolean;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <PortalCard
      className={cn(
        "flex gap-5",
        done ? "opacity-70" : "",
        highlight ? "ring-2 ring-portal-accent/40" : "",
        muted ? "bg-portal-bg shadow-none ring-1 ring-brand-line" : "",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
          done ? "bg-portal-green/12 text-portal-green" : "bg-brand-navy text-white",
        )}
        aria-hidden="true"
      >
        {done ? <Check className="size-5" /> : number}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-extrabold leading-snug text-brand-navy">{title}</h3>
        {children}
      </div>
    </PortalCard>
  );
}

function DoneLine({ at, label }: { at: string | null | undefined; label: string }) {
  return (
    <p className="mt-3 text-sm font-semibold text-portal-green">
      {label} {at ? `on ${formatDate(at)}` : ""}
    </p>
  );
}

export function AuthorHome() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const signed = Boolean(me?.signedAt);
  const examplesDone = Boolean(profile?.examples_reviewed_at);
  const guideDone = Boolean(profile?.guide_read_at);
  const doneCount = [examplesDone, guideDone, signed].filter(Boolean).length + 1;
  const totalSteps = 3;

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
  const needAttention = courses.filter((course) => course.status === "changes_requested");

  return (
    <div>
      <PageTitle
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        lead="Everything you need is here: the app, the format, the guide, your commissioned courses and your messages with the editorial desk. Fees and invoices stay in Upwork."
      />

      {needAttention.length > 0 ? (
        <div className="mb-6 rounded-portal border-2 border-portal-amber bg-portal-amber/10 p-5">
          <p className="flex items-center gap-2 text-base font-extrabold text-brand-navy">
            <AlertTriangle className="size-5 text-portal-amber" aria-hidden="true" />
            {needAttention.length === 1 ? "One course needs your attention" : `${needAttention.length} courses need your attention`}
          </p>
          <ul className="mt-3 space-y-2">
            {needAttention.map((course) => (
              <li key={course.id} className="text-sm text-brand-navy">
                <Link
                  to="/auteurs/courses/$courseId"
                  params={{ courseId: course.id }}
                  className="font-bold text-portal-accent underline underline-offset-2"
                >
                  {course.title}
                </Link>
                {course.review_comment ? (
                  <span className="text-brand-navySoft"> — {course.review_comment}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="-mt-4 mb-6 text-xs text-brand-navySoft/80">
        Bookmark this page: sophia-culture.com/auteurs/login is where you sign in from now on.
      </p>

      {profile ? <AnnouncementBanners profileId={profile.id} /> : null}

      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold text-brand-navy">Before you write</h2>
        <p className="text-sm font-bold text-brand-navySoft">
          Step {Math.min(doneCount, totalSteps)} of {totalSteps}
        </p>
      </div>

      <div className="space-y-4">
        <StepCard number={1} title="Read two real Sophia courses" done={examplesDone} highlight={!examplesDone}>
          <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">
            Two published courses, screen by screen. This is the single best thing you can do before writing, and it is
            required before your courses open.
          </p>
          {examplesDone ? (
            <DoneLine at={profile?.examples_reviewed_at} label="Reviewed" />
          ) : null}
          <Button asChild variant={examplesDone ? "pillSecondary" : "pill"} size="pillSm" className="mt-4">
            <Link to="/auteurs/examples">{examplesDone ? "Read them again" : "Read the examples"}</Link>
          </Button>
        </StepCard>

        <StepCard number={2} title="Read the writing guide" done={guideDone}>
          <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">
            Short. The format, the length, how to write for this reader, and the things that get sent back.
          </p>
          {guideDone ? <DoneLine at={profile?.guide_read_at} label="Opened" /> : null}
          <Button asChild variant={guideDone ? "pillSecondary" : "pill"} size="pillSm" className="mt-4">
            <Link to="/auteurs/guide">{guideDone ? "Open the guide" : "Read the guide"}</Link>
          </Button>
        </StepCard>

        <StepCard number={3} title="Read and sign the agreement" done={signed}>
          <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">
            {signed
              ? `Signed on ${formatDate(me?.signedAt)}. The document stays available.`
              : "Not signed yet. You can still start writing your courses now."}
          </p>
          <Button asChild variant={signed ? "pillSecondary" : "pill"} size="pillSm" className="mt-4">
            <Link to="/auteurs/contract">{signed ? "View agreement" : "Read and sign"}</Link>
          </Button>
        </StepCard>
      </div>

      <PortalCard className="mt-8 bg-portal-bg shadow-none ring-1 ring-brand-line">
        <h3 className="text-lg font-extrabold leading-snug text-brand-navy">Want to read more Sophia courses?</h3>
        {profile?.platform ? (
          <p className="mt-2 text-base font-extrabold leading-relaxed text-brand-navy">
            {profile.platform === "ios"
              ? "Your code goes into the App Store, not into the Sophia app."
              : "Your code goes into the Play Store, not into the Sophia app."}
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold leading-relaxed text-portal-amber">
            Tell us whether you use an iPhone or an Android phone on{" "}
            <Link to="/auteurs/profile" className="underline">
              your profile page
            </Link>{" "}
            and we will give you a code for the right store.
          </p>
        )}

        {profile?.access_code ? (
          <>
            <p className="mt-4 rounded-2xl bg-card px-4 py-3 font-mono text-xl font-bold tracking-[0.12em] text-brand-navy">
              {profile.access_code}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton value={profile.access_code} label="Copy code" />
              {profile.access_redeem_url ? (
                <Button asChild variant="pillSecondary" size="pillSm">
                  <a href={profile.access_redeem_url} target="_blank" rel="noreferrer noopener">
                    Redeem
                  </a>
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-base font-bold text-brand-navy">
              {profile?.is_test ? "Code de test, non fonctionnel" : "Your code is on its way"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-navySoft">
              {profile?.is_test
                ? "This is the internal test profile: no store code is attached to it."
                : "The editorial desk will add it here as soon as it is issued. Nothing to do on your side."}
            </p>
          </>
        )}

        {profile?.platform && profile?.access_code ? (
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-navySoft">
            <li>Open the {profile.platform === "ios" ? "App Store" : "Play Store"}, not Sophia</li>
            <li>Tap your profile picture, top right</li>
            <li>
              {profile.platform === "ios" ? "Choose Redeem Gift Card or Code" : "Choose Payments and subscriptions"}
            </li>
            <li>{profile.platform === "ios" ? "Choose Enter Code Manually" : "Choose Redeem code"}</li>
            <li>Paste the code above</li>
          </ol>
        ) : null}

        <div className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-brand-line">
          <p className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-brand-navy">
            <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Searching for Sophia will bury you in results. This link goes straight to the right listing:
          </p>
          <a
            href={TAAP_LINK}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-lg font-extrabold text-portal-accent underline underline-offset-4"
          >
            taap.it/sophia.culture
          </a>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">
          Then open Sophia and everything is unlocked. There is no trial to select and nothing to type inside the app
          itself.
        </p>
        <p className="mt-3 text-xs text-brand-navySoft/70">
          Wrong phone type? Change it on your{" "}
          <Link to="/auteurs/profile" className="underline">
            Profile page
          </Link>{" "}
          and your code will swap itself.
        </p>
      </PortalCard>

      <h2 className="mt-12 text-xl font-extrabold text-brand-navy">Your courses</h2>
      {!examplesDone && courses.length > 0 ? (
        <div className="mt-4">
          <ExamplesLockNotice />
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <EmptyState title="No courses yet" text="The editorial desk will assign your first course shortly." />
        ) : (
          courses.map((course) => <CourseCard key={course.id} course={course} locked={!examplesDone} />)
        )}
      </div>
    </div>
  );
}
