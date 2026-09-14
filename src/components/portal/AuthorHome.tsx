import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, type Course } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { CourseCard, ExamplesLockNotice } from "./CourseCards";
import { CopyButton, EmptyState, PageTitle, PortalCard } from "./ui";

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

  return (
    <div>
      <PageTitle
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        lead="Everything you need is here: the app, the format, the guide and your commissioned courses. Fees, invoices and messages stay in Upwork."
      />

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

        <StepCard number={3} title="Read the writing guide" done={guideDone}>
          <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">
            Short. The format, the length, how to write for this reader, and the things that get sent back.
          </p>
          {guideDone ? <DoneLine at={profile?.guide_read_at} label="Opened" /> : null}
          <Button asChild variant={guideDone ? "pillSecondary" : "pill"} size="pillSm" className="mt-4">
            <Link to="/auteurs/guide">{guideDone ? "Open the guide" : "Read the guide"}</Link>
          </Button>
        </StepCard>

        <StepCard number={4} title="Read and sign the agreement" done={signed}>
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
