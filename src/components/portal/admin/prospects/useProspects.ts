import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Hm, Prospect, Template, Touch } from "./model";

export const PROSPECTS_KEY = ["portal", "admin", "prospects"] as const;

type Data = { prospects: Prospect[]; touches: Touch[]; hms: Hm[]; templates: Template[] };

export function useProspectsData() {
  return useQuery({
    queryKey: PROSPECTS_KEY,
    queryFn: async (): Promise<Data> => {
      const fetchAll = async <T,>(table: "creator_prospects" | "prospect_touches"): Promise<T[]> => {
        const out: T[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, from + 999);
          if (error) throw error;
          out.push(...((data ?? []) as T[]));
          if (!data || data.length < 1000) break;
        }
        return out;
      };
      const [prospects, touches, hms, templates] = await Promise.all([
        fetchAll<Prospect>("creator_prospects"),
        fetchAll<Touch>("prospect_touches"),
        supabase.from("profiles").select("id, full_name").eq("role", "admin"),
        supabase.from("prospect_templates").select("*").order("name"),
      ]);
      return { prospects, touches, hms: hms.data ?? [], templates: templates.data ?? [] };
    },
  });
}

export function useProspectMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: PROSPECTS_KEY });

  async function update(ids: string[], patch: Partial<Prospect>) {
    qc.setQueryData<Data>(PROSPECTS_KEY, (d) =>
      d ? { ...d, prospects: d.prospects.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)) } : d,
    );
    const { error } = await supabase.from("creator_prospects").update(patch).in("id", ids);
    if (error) {
      toast.error(`Could not save: ${error.message}`);
      refresh();
      return false;
    }
    return true;
  }

  async function logTouches(ids: string[], channel: string, message: string) {
    const { error } = await supabase
      .from("prospect_touches")
      .insert(ids.map((prospect_id) => ({ prospect_id, channel, message })));
    if (error) {
      toast.error(`Could not log: ${error.message}`);
      return false;
    }
    const d = qc.getQueryData<Data>(PROSPECTS_KEY);
    const fresh = (d?.prospects ?? []).filter((p) => ids.includes(p.id) && p.status === "new").map((p) => p.id);
    if (fresh.length) await supabase.from("creator_prospects").update({ status: "contacted" }).in("id", fresh);
    await refresh();
    return true;
  }

  async function remove(ids: string[]) {
    const { error } = await supabase.from("creator_prospects").delete().in("id", ids);
    if (error) return toast.error(`Could not delete: ${error.message}`);
    toast.success(`${ids.length} deleted.`);
    return refresh();
  }

  return { update, logTouches, remove, refresh };
}
