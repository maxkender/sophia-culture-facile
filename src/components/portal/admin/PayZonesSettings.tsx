import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalCard } from "../ui";
import { ZONE_BADGE } from "@/lib/slideshow-guide";

type Zone = "A" | "B" | "C";
const KEY = ["portal", "admin", "pay-zones"];

export function PayZonesSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const [z, c] = await Promise.all([
        supabase.from("pay_zones").select("*").order("zone"),
        supabase.from("country_zones").select("*").order("zone").order("country_name"),
      ]);
      return { zones: z.data ?? [], countries: c.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: KEY });
  const [draft, setDraft] = useState({ code: "", name: "", zone: "A" as Zone, ceiling: false });

  async function saveZone(zone: string, patch: Record<string, number | null>) {
    const { error } = await supabase.from("pay_zones").update({ ...patch, updated_at: new Date().toISOString() }).eq("zone", zone);
    if (error) toast.error("Could not save."); else { toast.success("Saved."); void refresh(); }
  }
  async function saveCountry(code: string, patch: { zone?: string; ceiling_applies?: boolean }) {
    const { error } = await supabase.from("country_zones").update(patch).eq("country_code", code);
    if (error) toast.error("Could not save."); else void refresh();
  }
  async function removeCountry(code: string) {
    if (!confirm("Remove this country? It will have no zone.")) return;
    const { error } = await supabase.from("country_zones").delete().eq("country_code", code);
    if (error) toast.error("Could not remove."); else void refresh();
  }
  async function addCountry() {
    const code = draft.code.trim().toUpperCase();
    if (code.length !== 2 || !draft.name.trim()) { toast.error("Enter a 2-letter code and an English name."); return; }
    const { error } = await supabase.from("country_zones").insert({ country_code: code, country_name: draft.name.trim(), zone: draft.zone, ceiling_applies: draft.ceiling });
    if (error) toast.error("Could not add (maybe already listed)."); else { setDraft({ code: "", name: "", zone: "A", ceiling: false }); void refresh(); }
  }

  return (
    <PortalCard className="md:col-span-2">
      <p className="text-sm font-bold text-brand-navy">Pay zones (slideshow track only)</p>
      <p className="mt-1 text-xs text-brand-navySoft">Figures in USD. A country not listed has no zone and cannot be accepted without a manual zone.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-brand-navySoft"><th className="py-2">Zone</th><th>Trial</th><th>Monthly</th><th>Ceiling</th><th>Posts/day</th></tr></thead>
          <tbody>
            {data?.zones.map((z) => (
              <tr key={z.zone} className="border-t border-brand-line">
                <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ZONE_BADGE[z.zone]}`}>Zone {z.zone}</span></td>
                {(["trial_amount", "monthly_amount", "ceiling_amount", "posts_per_day"] as const).map((f) => (
                  <td key={f} className="pr-2">
                    <Input
                      type="number" min="0" step={f === "posts_per_day" ? "1" : "0.01"} className="h-9 w-24"
                      defaultValue={z[f] ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        if (v === (z[f] === null ? null : Number(z[f]))) return;
                        if (v === null && f !== "ceiling_amount") return;
                        void saveZone(z.zone, { [f]: v });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm font-bold text-brand-navy">Countries ({data?.countries.length ?? 0})</p>
      <div className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-brand-line">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="sticky top-0 bg-card"><tr className="text-left text-xs uppercase text-brand-navySoft"><th className="p-2">Code</th><th>Country</th><th>Zone</th><th>Ceiling applies</th><th /></tr></thead>
          <tbody>
            {data?.countries.map((c) => (
              <tr key={c.country_code} className="border-t border-brand-line">
                <td className="p-2 font-mono text-xs">{c.country_code}</td>
                <td>{c.country_name}</td>
                <td>
                  <Select value={c.zone} onValueChange={(v) => void saveCountry(c.country_code, { zone: v })}>
                    <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{["A", "B", "C"].map((z) => <SelectItem key={z} value={z}>Zone {z}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td><Checkbox checked={c.ceiling_applies} onCheckedChange={(v) => void saveCountry(c.country_code, { ceiling_applies: v === true })} /></td>
                <td><Button type="button" size="sm" variant="ghost" onClick={() => void removeCountry(c.country_code)}>Remove</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input className="w-20" placeholder="FR" maxLength={2} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
        <Input className="w-48" placeholder="Country name (English)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <Select value={draft.zone} onValueChange={(v) => setDraft({ ...draft, zone: v as Zone })}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>{["A", "B", "C"].map((z) => <SelectItem key={z} value={z}>Zone {z}</SelectItem>)}</SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={draft.ceiling} onCheckedChange={(v) => setDraft({ ...draft, ceiling: v === true })} /> Ceiling</label>
        <Button type="button" size="sm" onClick={() => void addCountry()}>Add country</Button>
      </div>
    </PortalCard>
  );
}
