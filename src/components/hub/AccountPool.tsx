import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Accounts returned by dormant creators: rotate the password, then reassign to another creator. */
export function AccountPool() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["hub", "account-pool"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("account_pool").select("*, from:creators!account_pool_from_creator_id_fkey(full_name)").neq("status", "assigned").order("created_at", { ascending: false }),
        supabase.from("creators").select("id, full_name").eq("track", "ugc").not("user_id", "is", null).is("dormant_at", null),
      ]);
      return { pool: p.data ?? [], creators: c.data ?? [] };
    },
  });
  if (!data?.pool.length) return null;
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "account-pool"] });
  return (
    <section className="rounded-2xl bg-card p-5 shadow-portal">
      <h2 className="font-extrabold text-brand-navy">Account pool ({data.pool.length})</h2>
      <p className="text-xs text-brand-navySoft">Returned after 14 days without a post. Rotate the password first, then reassign.</p>
      <ul className="mt-3 divide-y divide-brand-line text-sm">{data.pool.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
          <span className="font-semibold text-brand-navy">{a.platform} @{a.handle}</span>
          <span className="text-xs text-brand-navySoft">from {(a.from as { full_name?: string } | null)?.full_name ?? "—"}</span>
          {a.status === "needs_rotation" ? (
            <Button size="sm" variant="outline" className="ml-auto" onClick={async () => { await supabase.from("account_pool").update({ status: "available", password_rotated_at: new Date().toISOString() }).eq("id", a.id); toast.success("Marked as rotated"); reload(); }}>Password rotated</Button>
          ) : (
            <select aria-label="Reassign to" className="ml-auto h-9 rounded-lg border px-2 text-sm" defaultValue="" onChange={async (e) => {
              const id = e.target.value; if (!id) return;
              const col = a.platform === "tiktok" ? "tiktok_handle" : "instagram_handle";
              const { error } = await supabase.from("creators").update({ [col]: a.handle } as never).eq("id", id);
              if (error) { toast.error("Could not reassign."); return; }
              await supabase.from("account_pool").update({ status: "assigned", assigned_creator_id: id }).eq("id", a.id);
              toast.success("Reassigned — share the new password through the creator's credentials page."); reload();
            }}><option value="">Reassign to…</option>{data.creators.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
          )}
        </li>
      ))}</ul>
    </section>
  );
}
