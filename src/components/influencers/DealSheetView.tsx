import { euros } from "@/lib/influencer-deals";

type Snap = {
  influencer_name?: string; agency?: string | null; brief_title?: string; brief_type?: string; brief_text?: string; angle?: string | null;
  deliverables?: string[]; must_mention?: string[]; draft_approval_required?: boolean; earliest_post_date?: string | null;
  latest_post_date?: string | null; agreed_price?: number; split?: string | null; rights_text?: string; exclusivity?: string | null;
  disclosure?: string; master_agreement_version?: string;
};

export function DealSheetView({ snapshot, adminNote = false }: { snapshot: unknown; adminNote?: boolean }) {
  const s = (snapshot ?? {}) as Snap;
  const rows: [string, string][] = [
    ["Influencer", `${s.influencer_name ?? "—"}${s.agency ? ` (represented by ${s.agency})` : ""}`],
    ["Brief", s.brief_title ?? "—"],
    ["Deliverables", (s.deliverables ?? []).join(", ") || "—"],
    ["Brief type", s.brief_type === "precise" ? "Precise: follow the brief below" : "Freestyle: your own style, within the angle and must-haves below"],
    ["Must mention", (s.must_mention ?? []).join(", ") || "—"],
    ["Draft approval", s.draft_approval_required ? "Yes: do not publish before Sophia approves the draft" : "No"],
    ["Posting window", `${s.earliest_post_date ?? "from signature"} → ${s.latest_post_date ?? "—"}`],
    ["Agreed price", `${euros(s.agreed_price)}${s.split ? `, paid ${s.split}` : ""}`],
    ["Rights", s.rights_text ?? "—"],
    ["Exclusivity", s.exclusivity ?? "None"],
    ["Disclosure", s.disclosure ?? "—"],
    ["Master Agreement", `Version ${s.master_agreement_version ?? "1"}, which governs this Deal Sheet`],
  ];
  return (
    <div className="space-y-4 text-sm">
      {adminNote ? <p className="rounded-xl bg-portal-amber/10 p-3 text-xs text-brand-navy">Not reviewed by a lawyer. Clause 4 (rights) and clause 9 (cancellation) of the Master Agreement are the ones most worth checking.</p> : null}
      <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Deal Sheet</p>
      <dl className="grid gap-3 sm:grid-cols-[180px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-bold text-brand-navy">{k}</dt>
            <dd className="text-brand-navySoft">{v}</dd>
          </div>
        ))}
      </dl>
      {s.angle ? <p className="font-semibold text-brand-navy">{s.angle}</p> : null}
      {s.brief_text ? <p className="whitespace-pre-line rounded-xl bg-brand-navy/5 p-4 text-brand-navy">{s.brief_text}</p> : null}
    </div>
  );
}
