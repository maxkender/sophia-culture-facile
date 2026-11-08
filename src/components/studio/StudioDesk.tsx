import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PortalCard } from "@/components/portal/ui";
import { formatDate, formatDateTime } from "@/lib/portal";
import { setCreatorStatus } from "@/lib/studio/onboarding.functions";
import { ONBOARDING_STEPS, resumeStep, stepIndex } from "@/lib/studio/onboarding";

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-portal-amber/15 text-portal-amber",
  approved: "bg-portal-green/10 text-portal-green",
  suspended: "bg-portal-red/10 text-portal-red",
};

export function CreatorStatusPill({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_CLASS[status] ?? ""}`}>{status}</span>;
}

/** Desk: Studio onboarding progress, signed agreement and approve/suspend for one author. */
export function StudioCreatorCard({ authorId }: { authorId: string }) {
  const qc = useQueryClient();
  const change = useServerFn(setCreatorStatus);
  const { data } = useQuery({
    queryKey: ["studio", "desk", "creator", authorId],
    queryFn: async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("onboarding_step, creator_status, creator_slug, self_registered, writing_lang, created_at").eq("id", authorId).maybeSingle(),
        supabase.from("contracts").select("document_version, signed_at").eq("author_id", authorId).maybeSingle(),
      ]);
      return { p, c };
    },
  });
  if (!data?.p) return null;
  const { p, c } = data;
  const step = resumeStep(p.onboarding_step);
  async function set(status: "approved" | "suspended" | "pending") {
    try { await change({ data: { profileId: authorId, status } }); toast.success(`Creator ${status}`); await qc.invalidateQueries({ queryKey: ["studio", "desk"] }); }
    catch { toast.error("The status could not be changed."); }
  }
  return (
    <PortalCard className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-portal-accent">Sophia Studio</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CreatorStatusPill status={p.creator_status} />
            <span className="text-sm text-brand-navySoft">{p.self_registered ? `Self sign-up · ${formatDate(p.created_at)}` : "Invited by the desk"}</span>
            {p.creator_slug ? <code className="rounded bg-portal-bg px-2 py-0.5 text-xs">{p.creator_slug}</code> : null}
          </div>
        </div>
        <div className="flex gap-2">
          {p.creator_status !== "approved" ? <Button size="pillSm" variant="pillPink" onClick={() => void set("approved")}>Approve creator</Button> : null}
          {p.creator_status !== "suspended" ? <Button size="pillSm" variant="pillSecondary" onClick={() => void set("suspended")}>Suspend</Button> : <Button size="pillSm" variant="pillSecondary" onClick={() => void set("pending")}>Lift suspension</Button>}
        </div>
      </div>
      <ol className="mt-5 flex flex-wrap gap-2" aria-label="Onboarding progress">
        {ONBOARDING_STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${i < stepIndex(step) || step === "done" ? "bg-portal-green/10 text-portal-green" : i === stepIndex(step) ? "bg-brand-navy text-card" : "bg-brand-line text-brand-navySoft"}`}>{i + 1}. {s}</li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-brand-navySoft">
        Agreement: {c ? <>version <strong className="text-brand-navy">{c.document_version}</strong> signed {formatDateTime(c.signed_at)}</> : <span className="font-semibold text-portal-amber">not signed</span>}
        {p.writing_lang ? <> · Writes in <strong className="text-brand-navy">{p.writing_lang}</strong></> : null}
      </p>
    </PortalCard>
  );
}

/** Desk: recent self sign-ups waiting for approval, shown above the applications list. */
export function StudioSignups() {
  const { data } = useQuery({
    queryKey: ["studio", "desk", "signups"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, display_name, email, onboarding_step, creator_status, created_at").eq("self_registered", true).neq("creator_status", "approved").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  if (!data?.length) return null;
  return (
    <PortalCard className="mb-6">
      <p className="text-sm font-bold text-brand-navy">New Studio sign-ups · {data.length}</p>
      <ul className="mt-3 divide-y divide-brand-line">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div>
              <Link to="/auteurs/admin/authors/$authorId" params={{ authorId: r.id }} className="font-bold text-brand-navy hover:underline">{r.display_name ?? r.full_name}</Link>
              <span className="ml-2 text-brand-navySoft">{r.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-navySoft">Step: {resumeStep(r.onboarding_step)} · {formatDate(r.created_at)}</span>
              <CreatorStatusPill status={r.creator_status} />
            </div>
          </li>
        ))}
      </ul>
    </PortalCard>
  );
}
