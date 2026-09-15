import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { PageTitle, PortalCard } from "./ui";
import sky1 from "@/assets/examples/sky-1.png.asset.json";
import sky2 from "@/assets/examples/sky-2.png.asset.json";
import sky3 from "@/assets/examples/sky-3.png.asset.json";
import sky4 from "@/assets/examples/sky-4.png.asset.json";
import sky5 from "@/assets/examples/sky-5.png.asset.json";
import sky6 from "@/assets/examples/sky-6.png.asset.json";
import sky7 from "@/assets/examples/sky-7.png.asset.json";
import sky8 from "@/assets/examples/sky-8.png.asset.json";
import berlin1 from "@/assets/examples/berlin-1.png.asset.json";
import berlin2 from "@/assets/examples/berlin-2.png.asset.json";
import berlin3 from "@/assets/examples/berlin-3.png.asset.json";
import berlin4 from "@/assets/examples/berlin-4.png.asset.json";
import berlin5 from "@/assets/examples/berlin-5.png.asset.json";
import berlin6 from "@/assets/examples/berlin-6.png.asset.json";
import berlin7 from "@/assets/examples/berlin-7.png.asset.json";
import berlin8 from "@/assets/examples/berlin-8.png.asset.json";

const URLS: Record<string, string> = {
  "sky-1.png": sky1.url,
  "sky-2.png": sky2.url,
  "sky-3.png": sky3.url,
  "sky-4.png": sky4.url,
  "sky-5.png": sky5.url,
  "sky-6.png": sky6.url,
  "sky-7.png": sky7.url,
  "sky-8.png": sky8.url,
  "berlin-1.png": berlin1.url,
  "berlin-2.png": berlin2.url,
  "berlin-3.png": berlin3.url,
  "berlin-4.png": berlin4.url,
  "berlin-5.png": berlin5.url,
  "berlin-6.png": berlin6.url,
  "berlin-7.png": berlin7.url,
  "berlin-8.png": berlin8.url,
};

type Shot = { file: string; label: string };

const SKY: Shot[] = [
  { file: "sky-1.png", label: "Screen 1 of 5" },
  { file: "sky-2.png", label: "Screen 2 of 5" },
  { file: "sky-3.png", label: "Screen 3 of 5" },
  { file: "sky-4.png", label: "Screen 3 of 5 — the “Did you know?” card opened" },
  { file: "sky-5.png", label: "Screen 3 of 5 — scrolled down" },
  { file: "sky-6.png", label: "Screen 4 of 5" },
  { file: "sky-7.png", label: "Screen 5 of 5" },
  { file: "sky-8.png", label: "Screen 5 of 5 — the Key takeaway" },
];

const BERLIN: Shot[] = [
  { file: "berlin-1.png", label: "Screen 1 of 5" },
  { file: "berlin-2.png", label: "Screen 2 of 5" },
  { file: "berlin-3.png", label: "Screen 2 of 5 — the “Did you know?” card opened" },
  { file: "berlin-4.png", label: "Screen 3 of 5" },
  { file: "berlin-5.png", label: "Screen 4 of 5" },
  { file: "berlin-6.png", label: "Screen 4 of 5 — scrolled down" },
  { file: "berlin-7.png", label: "Screen 5 of 5" },
  { file: "berlin-8.png", label: "Screen 5 of 5 — the timeline and the Key takeaway" },
];

function PhoneShot({ shot }: { shot: Shot }) {
  const url = URLS[shot.file];
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <figcaption className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-navySoft">
        {shot.label}
      </figcaption>
      <div className="overflow-hidden rounded-[2rem] border border-brand-line bg-card shadow-portal">
        {url ? (
          <img src={url} alt={shot.label} loading="lazy" className="block w-full" />
        ) : (
          <div className="flex aspect-[9/19.5] flex-col items-center justify-center gap-2 bg-portal-bg px-6 text-center">
            <p className="text-sm font-bold text-brand-navy">Screenshot coming soon</p>
            <p className="font-mono text-xs text-brand-navySoft">{shot.file}</p>
          </div>
        )}
      </div>
    </figure>
  );
}

function Callout({ tone, children }: { tone: "blue" | "red"; children: string }) {
  const cls =
    tone === "blue"
      ? "border-portal-accent/30 bg-portal-accent/5"
      : "border-portal-red/30 bg-portal-red/8";
  return (
    <div className={`rounded-portal border p-5 text-sm leading-relaxed text-brand-navy ${cls}`}>{children}</div>
  );
}

function CourseSection({ title, category, shots }: { title: string; category: string; shots: Shot[] }) {
  return (
    <section className="mt-12">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-navySoft">{category}</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-navy">{title}</h2>
      <div className="mt-8 space-y-10">
        {shots.map((shot) => (
          <PhoneShot key={shot.file} shot={shot} />
        ))}
      </div>
    </section>
  );
}

/** Bottom-of-page confirmation: unlocks the author's courses once both examples have been read. */
function UnlockBlock() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || profile.role !== "author") return null;

  async function unlock() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ examples_reviewed_at: new Date().toISOString() })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Your confirmation could not be saved. Try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("Your courses are open.");
    await navigate({ to: "/auteurs/courses" });
  }

  if (profile.examples_reviewed_at) return null;

  return (
    <PortalCard className="mt-12 border-l-4 border-portal-accent">
      <h2 className="text-lg font-extrabold text-brand-navy">One last thing before you write</h2>
      <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-brand-navy">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
          aria-label="I have read both example courses and I understand the format"
          className="mt-0.5"
        />
        I have read both example courses and I understand the format
      </label>
      <Button
        type="button"
        variant="pill"
        size="pillSm"
        className="mt-5"
        disabled={!checked || saving}
        onClick={() => void unlock()}
      >
        Unlock my courses
      </Button>
    </PortalCard>
  );
}

export function ExamplesPage() {
  const { data: me } = usePortalProfile();
  const reviewedAt = me?.profile?.examples_reviewed_at ?? null;

  return (
    <div>
      {reviewedAt ? (
        <p className="mb-6 rounded-portal border border-portal-green/30 bg-portal-green/8 px-5 py-3 text-sm font-semibold text-portal-green">
          You confirmed you had read these on {formatDate(reviewedAt)}. Come back any time while you write.
        </p>
      ) : null}
      <PageTitle
        title="Two real Sophia courses"
        lead="Read these before you write. This is the format you are writing for."
      />

      <Callout tone="red">
        These are screenshots of the real app. Your access code goes into the App Store or the Play Store, never inside
        the Sophia app itself: it is on your home page. Redeeming it and reading a few courses on your own phone will
        teach you more than any of this.
      </Callout>

      <CourseSection title="Why is the sky blue?" category="Light & atmosphere" shots={SKY} />

      <div className="mt-12">
        <Callout tone="blue">
          Notice the shape. The course title is a question; every screen title is a statement. Screen 4 opens by raising
          an objection to what screen 3 just said, and answers it. Technical terms like Rayleigh scattering are explained
          in the same sentence they appear in, never in a footnote.
        </Callout>
      </div>

      <CourseSection title="The fall of the Berlin Wall" category="1989" shots={BERLIN} />

      <div className="mt-12">
        <Callout tone="blue">
          Same shape on a completely different subject. Screen 1 gives the scale, 28 years and one sentence on
          television. Screens 2 to 4 build the chain: why the wall went up, what cracked, and the exact moment it failed.
          Screen 5 widens out rather than summarising, and the Key takeaway does the summarising instead.
        </Callout>
      </div>

      <UnlockBlock />
    </div>
  );
}
