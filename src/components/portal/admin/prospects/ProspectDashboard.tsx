import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PortalCard } from "../../ui";
import { countryLabel, DAY, FUNNEL, todayIso, type Enriched, type Hm, type Touch } from "./model";

const REACHED: Record<string, number> = { new: 0, contacted: 1, unreachable: 1, not_interested: 2, replied: 2, interested: 3, applied: 4, converted: 5 };

export function ProspectDashboard({ rows, touches, hms }: { rows: Enriched[]; touches: Touch[]; hms: Hm[] }) {
  const stats = useMemo(() => {
    const ids = new Set(rows.map((r) => r.id));
    const scoped = touches.filter((t) => ids.has(t.prospect_id));
    const weekAgo = Date.now() - 7 * DAY;
    // Funnel counts are cumulative: anyone who reached a later step also passed earlier ones.
    const funnel = FUNNEL.map((_, i) => rows.filter((r) => (REACHED[r.status] ?? 0) >= i).length);
    const count = (key: (r: Enriched) => string | null) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = key(r) || "unknown";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };
    const days: { day: string; touches: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      days.push({ day: d.slice(5), touches: scoped.filter((t) => t.created_at.slice(0, 10) === d).length });
    }
    const weekTouches = scoped.filter((t) => new Date(t.created_at).getTime() > weekAgo);
    const firstTouch = new Map<string, string>();
    for (const t of scoped) {
      const prev = firstTouch.get(t.prospect_id);
      if (!prev || t.created_at < prev) firstTouch.set(t.prospect_id, t.created_at);
    }
    const contactedWeek = [...firstTouch.values()].filter((d) => new Date(d).getTime() > weekAgo).length;
    const repliesWeek = weekTouches.filter((t) => /repl|répon/i.test(t.channel + " " + (t.message ?? "")) || t.channel === "reply").length;
    const overdue = rows.filter((r) => r.next_action_on && r.next_action_on < todayIso()).length;
    const hmRows = [...hms, { id: "", full_name: "Unassigned" }].map((h) => {
      const held = rows.filter((r) => (r.assigned_hm_id ?? "") === h.id);
      const heldIds = new Set(held.map((r) => r.id));
      return {
        name: h.full_name ?? h.id,
        held: held.length,
        touches: weekTouches.filter((t) => heldIds.has(t.prospect_id)).length,
        conversions: held.filter((r) => r.status === "converted").length,
      };
    }).filter((h) => h.held > 0);
    return {
      funnel,
      tracks: count((r) => r.track),
      countries: count((r) => (r.country ? countryLabel(r.country) : null)).slice(0, 10),
      days,
      contactedWeek,
      repliesWeek,
      overdue,
      hmRows,
    };
  }, [rows, touches, hms]);

  const chartTick = { fontSize: 11, fill: "var(--brand-navy-soft)" };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PortalCard className="p-4 lg:col-span-3">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-navySoft">Funnel · {rows.length} prospects in view</p>
        <div className="flex flex-wrap items-stretch gap-2">
          {FUNNEL.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 ? (
                <span className="text-xs font-bold text-brand-navySoft">
                  → {stats.funnel[i - 1] ? Math.round((stats.funnel[i]! / stats.funnel[i - 1]!) * 100) : 0}%
                </span>
              ) : null}
              <div className="min-w-24 rounded-xl bg-brand-surface px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-brand-navySoft">{step}</p>
                <p className="text-xl font-extrabold text-brand-navy">{stats.funnel[i]}</p>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>
      {[
        ["Contacted this week", stats.contactedWeek],
        ["Replies this week", stats.repliesWeek],
        ["Overdue next actions", stats.overdue],
      ].map(([label, n]) => (
        <PortalCard key={label} className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{label}</p>
          <p className={`text-3xl font-extrabold ${label === "Overdue next actions" && Number(n) > 0 ? "text-portal-red" : "text-brand-navy"}`}>{n}</p>
        </PortalCard>
      ))}
      <PortalCard className="p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">By track wanted</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.tracks}>
            <XAxis dataKey="name" tick={chartTick} />
            <YAxis allowDecimals={false} tick={chartTick} width={28} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--portal-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </PortalCard>
      <PortalCard className="p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">Top countries</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.countries} layout="vertical">
            <XAxis type="number" allowDecimals={false} tick={chartTick} />
            <YAxis type="category" dataKey="name" tick={chartTick} width={110} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--brand-purple)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </PortalCard>
      <PortalCard className="p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">Touches per day · 30 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={stats.days}>
            <CartesianGrid stroke="var(--brand-line)" vertical={false} />
            <XAxis dataKey="day" tick={chartTick} interval={6} />
            <YAxis allowDecimals={false} tick={chartTick} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="touches" stroke="var(--portal-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </PortalCard>
      <PortalCard className="p-4 lg:col-span-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">Hiring managers</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-brand-navySoft">
              <th className="py-1">HM</th><th>Prospects held</th><th>Touches this week</th><th>Conversions</th>
            </tr>
          </thead>
          <tbody>
            {stats.hmRows.map((h) => (
              <tr key={h.name} className="border-t border-brand-line">
                <td className="py-1.5 font-semibold text-brand-navy">{h.name}</td><td>{h.held}</td><td>{h.touches}</td><td>{h.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalCard>
    </div>
  );
}
