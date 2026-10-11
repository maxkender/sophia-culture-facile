import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAdminApp } from "@/lib/apps";
import { Button } from "@/components/ui/button";

/** UGC-only overview; the legacy mixed dashboard remains outside this space. */
export function UgcOverview() {
  const { appId } = useAdminApp();
  const { data } = useQuery({
    queryKey: ["hub", "ugc", "overview", appId],
    queryFn: async () => {
      let query = supabase.from("creator_applications").select("id, full_name, country, status, created_at").order("created_at", { ascending: false });
      if (appId) query = query.eq("app_id", appId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
  return <section className="space-y-4">
    <h2 className="text-lg font-bold text-brand-navy">UGC programme overview</h2>
    <dl className="flex gap-8 text-brand-navy"><div><dt className="text-sm text-brand-navySoft">UGC applications</dt><dd className="text-3xl font-bold">{data?.length ?? "…"}</dd></div><div><dt className="text-sm text-brand-navySoft">Pending</dt><dd className="text-3xl font-bold">{data?.filter((a) => a.status === "pending").length ?? "…"}</dd></div></dl>
    <Button asChild size="sm"><Link to="/hub/ugc/creators" search={{ view: "applications" }}>Open UGC applications</Link></Button>
    <h3 className="font-bold text-brand-navy">Latest UGC applications</h3>
    <ul className="divide-y divide-brand-line">{data?.slice(0, 8).map((a) => <li key={a.id} className="flex justify-between gap-3 py-3 text-sm"><span className="text-brand-navy">{a.full_name}<span className="block text-xs text-brand-navySoft">{a.country} · {new Date(a.created_at).toLocaleDateString("en-GB")}</span></span><span className="text-brand-navySoft">{a.status}</span></li>)}</ul>
    {data?.length === 0 ? <p className="text-sm text-brand-navySoft">No UGC applications yet.</p> : null}
  </section>;
}