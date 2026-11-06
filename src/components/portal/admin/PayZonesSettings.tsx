import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalCard } from "../ui";
import { Country, DetailSheet } from "@/components/hub/slides/Crm";
import { ZONE_BADGE } from "@/lib/slideshow-guide";

type Zone = "A" | "B" | "C";
const KEY = ["portal", "admin", "pay-zones"];

export function PayZonesSettings({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const [openZone, setOpenZone] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
    const { error } = await supabase
      .from("pay_zones")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("zone", zone);
    if (error) toast.error("Could not save.");
    else {
      toast.success("Saved.");
      void refresh();
    }
  }
  async function saveCountry(code: string, patch: { zone?: string; ceiling_applies?: boolean }) {
    const { error } = await supabase.from("country_zones").update(patch).eq("country_code", code);
    if (error) toast.error("Could not save.");
    else void refresh();
  }
  async function removeCountry(code: string) {
    if (!confirm("Remove this country? It will have no zone.")) return;
    const { error } = await supabase.from("country_zones").delete().eq("country_code", code);
    if (error) toast.error("Could not remove.");
    else void refresh();
  }
  async function addCountry() {
    const code = draft.code.trim().toUpperCase();
    if (code.length !== 2 || !draft.name.trim()) {
      toast.error("Enter a 2-letter code and an English name.");
      return;
    }
    const { error } = await supabase
      .from("country_zones")
      .insert({
        country_code: code,
        country_name: draft.name.trim(),
        zone: draft.zone,
        ceiling_applies: draft.ceiling,
      });
    if (error) toast.error("Could not add (maybe already listed).");
    else {
      setDraft({ code: "", name: "", zone: "A", ceiling: false });
      void refresh();
    }
  }

  if (compact)
    return (
      <div className="space-y-3">
        <p className="crm-count">
          {data?.zones.length ?? 0} zones · {data?.countries.length ?? 0} countries
        </p>
        <div className="crm-toolbar">
          <input
            className="crm-search"
            aria-label="Search rates countries"
            placeholder="Search countries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setOpenZone("A")}>
            Add country
          </Button>
        </div>
        <div className="crm-table">
          <table className="min-w-[650px] text-left" data-testid="slides-rates">
            <thead className="text-xs text-brand-navySoft">
              <tr>
                <th>Zone</th>
                <th>Weekly rate (USD)</th>
                <th>Countries</th>
              </tr>
            </thead>
            <tbody>
              {data?.zones.map((z) => (
                <tr key={z.zone} className="border-t border-brand-line">
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => setOpenZone(z.zone)}>
                      {z.zone}
                    </Button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label={`Weekly rate ${z.zone}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 w-24"
                        defaultValue={z.weekly_amount ?? ""}
                        onBlur={(e) => {
                          if (e.target.value && Number(e.target.value) !== Number(z.weekly_amount))
                            void saveZone(z.zone, { weekly_amount: Number(e.target.value) });
                        }}
                      />
                      <span className="text-xs text-brand-navySoft">First week</span>
                      <Input
                        aria-label={`First week rate ${z.zone}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 w-24"
                        defaultValue={z.first_week_amount ?? ""}
                        onBlur={(e) => {
                          if (
                            e.target.value &&
                            Number(e.target.value) !== Number(z.first_week_amount)
                          )
                            void saveZone(z.zone, { first_week_amount: Number(e.target.value) });
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="flex max-w-lg flex-wrap gap-2">
                      {data.countries
                        .filter(
                          (c) =>
                            c.zone === z.zone &&
                            `${c.country_code} ${c.country_name}`
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                        )
                        .map((c) => (
                          <span key={c.country_code}>
                            <Country country={c.country_code} />
                          </span>
                        ))}
                      <Button size="sm" variant="link" onClick={() => setOpenZone(z.zone)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DetailSheet
          open={Boolean(openZone)}
          onClose={() => setOpenZone(null)}
          title={`Zone ${openZone ?? ""}`}
          description="Countries and posting rate"
        >
          <label className="flex items-center gap-2 text-sm">
            Posts/day
            <Input
              aria-label="Posts per day"
              type="number"
              min="0"
              className="w-24"
              defaultValue={data?.zones.find((z) => z.zone === openZone)?.posts_per_day ?? ""}
              onBlur={(e) => {
                if (openZone && e.target.value)
                  void saveZone(openZone, { posts_per_day: Number(e.target.value) });
              }}
            />
          </label>
          <div className="crm-table mt-4">
            <table className="min-w-[440px] text-left">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Zone</th>
                  <th>Ceiling</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.countries
                  .filter((c) => c.zone === openZone)
                  .map((c) => (
                    <tr key={c.country_code} className="border-t border-brand-line">
                      <td>
                        <Country country={c.country_code} />
                      </td>
                      <td>
                        <Select
                          value={c.zone}
                          onValueChange={(v) => void saveCountry(c.country_code, { zone: v })}
                        >
                          <SelectTrigger className="h-8 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["A", "B", "C"].map((z) => (
                              <SelectItem key={z} value={z}>
                                {z}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <Checkbox
                          aria-label={`Ceiling ${c.country_code}`}
                          checked={c.ceiling_applies}
                          onCheckedChange={(v) =>
                            void saveCountry(c.country_code, { ceiling_applies: v === true })
                          }
                        />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void removeCountry(c.country_code)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              className="w-20"
              placeholder="FR"
              maxLength={2}
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
            <Input
              className="w-48"
              placeholder="Country name (English)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Select
              value={draft.zone}
              onValueChange={(v) => setDraft({ ...draft, zone: v as Zone })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C"].map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={draft.ceiling}
                onCheckedChange={(v) => setDraft({ ...draft, ceiling: v === true })}
              />
              Ceiling
            </label>
            <Button size="sm" onClick={() => void addCountry()}>
              Add country
            </Button>
          </div>
        </DetailSheet>
      </div>
    );

  return (
    <PortalCard className="md:col-span-2">
      <p className="text-sm font-bold text-brand-navy">Weekly pay per zone</p>
      <p className="mt-1 text-xs text-brand-navySoft">
        Figures in USD per week, 2 posts a day, 7 days a week. The first week pays the first-week
        figure. A country not listed has no zone: "country not open" (still kept in the pool).
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-brand-navySoft">
              <th className="py-2">Zone</th>
              <th>Per week</th>
              <th>First week</th>
              <th>Posts/day</th>
            </tr>
          </thead>
          <tbody>
            {data?.zones.map((z) => (
              <tr key={z.zone} className="border-t border-brand-line">
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ZONE_BADGE[z.zone]}`}
                  >
                    Zone {z.zone}
                  </span>
                </td>
                {(["weekly_amount", "first_week_amount", "posts_per_day"] as const).map((f) => (
                  <td key={f} className="pr-2">
                    <Input
                      type="number"
                      min="0"
                      step={f === "posts_per_day" ? "1" : "0.01"}
                      className="h-9 w-24"
                      defaultValue={z[f] ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        if (v === (z[f] === null ? null : Number(z[f]))) return;
                        if (v === null) return;
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

      <p className="mt-6 text-sm font-bold text-brand-navy">
        Countries ({data?.countries.length ?? 0})
      </p>
      <div className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-brand-line">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-left text-xs uppercase text-brand-navySoft">
              <th className="p-2">Code</th>
              <th>Country</th>
              <th>Zone</th>
              <th>Ceiling (legacy)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.countries.map((c) => (
              <tr key={c.country_code} className="border-t border-brand-line">
                <td className="p-2 font-mono text-xs">{c.country_code}</td>
                <td>{c.country_name}</td>
                <td>
                  <Select
                    value={c.zone}
                    onValueChange={(v) => void saveCountry(c.country_code, { zone: v })}
                  >
                    <SelectTrigger className="h-9 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C"].map((z) => (
                        <SelectItem key={z} value={z}>
                          Zone {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td>
                  <Checkbox
                    checked={c.ceiling_applies}
                    onCheckedChange={(v) =>
                      void saveCountry(c.country_code, { ceiling_applies: v === true })
                    }
                  />
                </td>
                <td>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void removeCountry(c.country_code)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          className="w-20"
          placeholder="FR"
          maxLength={2}
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
        />
        <Input
          className="w-48"
          placeholder="Country name (English)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <Select value={draft.zone} onValueChange={(v) => setDraft({ ...draft, zone: v as Zone })}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["A", "B", "C"].map((z) => (
              <SelectItem key={z} value={z}>
                Zone {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={draft.ceiling}
            onCheckedChange={(v) => setDraft({ ...draft, ceiling: v === true })}
          />{" "}
          Ceiling
        </label>
        <Button type="button" size="sm" onClick={() => void addCountry()}>
          Add country
        </Button>
      </div>
    </PortalCard>
  );
}
