import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eur } from "./hub-data";

const card = "rounded-2xl bg-card p-5 shadow-portal";

export function Affiliates() {
  const { data } = useQuery({
    queryKey: ["hub", "affiliates"],
    queryFn: async () => {
      const [r, adj] = await Promise.all([
        supabase.from("referrals").select("*, referrer:creators!referrals_referrer_creator_id_fkey(full_name), referee:creators!referrals_referee_creator_id_fkey(full_name)").order("created_at", { ascending: false }),
        supabase.from("payout_adjustments").select("creator_id, amount, reason, period").like("reason", "Referral:%"),
      ]);
      return { refs: r.data ?? [], adj: adj.data ?? [] };
    },
  });
  const refs = data?.refs ?? [];
  const now = Date.now();
  const earnedBy = (id: string, name: string) => (data?.adj ?? []).filter((a) => a.creator_id === id && a.reason.includes(name)).reduce((s, a) => s + Number(a.amount), 0);
  const total = (data?.adj ?? []).reduce((s, a) => s + Number(a.amount), 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[["Referrals", String(refs.length)], ["Still earning", String(refs.filter((r) => new Date(r.ends_at).getTime() > now).length)], ["Paid out to referrers", eur(total)]].map(([k, v]) => (
          <div key={k} className={card}><p className="text-xs text-brand-navySoft">{k}</p><p className="text-2xl font-extrabold text-brand-navy">{v}</p></div>
        ))}
      </div>
      <div className={card}>
        <h2 className="font-extrabold text-brand-navy">How it works</h2>
        <p className="mt-1 text-sm text-brand-navySoft">Each creator shares their link from Profile (…/creators?ref=handle). When someone who used it is accepted, the referrer earns 10% of that person's earnings for 60 days, added as a line on their monthly payout.</p>
      </div>
      <div className={`${card} overflow-x-auto`}>
        {refs.length === 0 ? <p className="text-sm text-brand-navySoft">No referrals yet.</p> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-brand-navySoft"><tr><th className="py-2">Referrer</th><th>Referred creator</th><th>Link</th><th>Window</th><th>Rate</th><th className="text-right">Earned</th></tr></thead>
            <tbody className="divide-y divide-brand-line">{refs.map((r) => {
              const refName = (r.referee as { full_name?: string } | null)?.full_name ?? "";
              const live = new Date(r.ends_at).getTime() > now;
              return (
                <tr key={r.id}>
                  <td className="py-2 font-semibold text-brand-navy">{(r.referrer as { full_name?: string } | null)?.full_name}</td>
                  <td>{refName}</td><td className="text-xs">?ref={r.ref_handle}</td>
                  <td className="text-xs">{new Date(r.starts_at).toLocaleDateString()} → {new Date(r.ends_at).toLocaleDateString()} {live ? <span className="ml-1 rounded-full bg-portal-green/10 px-2 text-portal-green">live</span> : null}</td>
                  <td>{Math.round(Number(r.rate) * 100)}%</td>
                  <td className="text-right font-bold">{eur(earnedBy(r.referrer_creator_id, refName))}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
