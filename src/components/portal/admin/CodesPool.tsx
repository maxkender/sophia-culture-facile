import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, type AccessCode, type Profile } from "@/lib/portal";
import { Banner, PageTitle, PortalCard } from "../ui";

export function CodesPool() {
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "codes"],
    queryFn: async () => {
      const [{ data: codes }, { data: authors }] = await Promise.all([
        supabase.from("access_codes").select("*").order("code"),
        supabase.from("profiles").select("id, full_name, platform"),
      ]);
      return {
        codes: (codes ?? []) as AccessCode[],
        authors: (authors ?? []) as Pick<Profile, "id" | "full_name" | "platform">[],
      };
    },
  });

  const codes = data?.codes ?? [];
  const counts = {
    available: codes.filter((code) => code.state === "available").length,
    assigned: codes.filter((code) => code.state === "assigned").length,
    sent: codes.filter((code) => code.state === "sent").length,
  };
  const authorById = new Map((data?.authors ?? []).map((author) => [author.id, author]));

  const mismatched = codes.filter((code) => {
    const author = code.assigned_to ? authorById.get(code.assigned_to) : null;
    if (!author) return false;
    const codeIsIos = code.code.toUpperCase().includes("IOS");
    return codeIsIos ? author.platform === "android" : author.platform === "ios";
  });

  async function importCsv() {
    const rows = csv
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("code,"))
      .map((line) => {
        const parts = line.split(",").map((part) => part.trim());
        return { code: parts[0] ?? "", redeem_url: parts[1] || null, state: "available" as const };
      })
      .filter((row) => row.code.length > 0);
    if (rows.length === 0) return;
    const existing = new Set(codes.map((code) => code.code));
    const fresh = rows.filter((row) => !existing.has(row.code));
    if (fresh.length === 0) {
      toast.error("Every code in this list is already in the pool.");
      return;
    }
    const { error } = await supabase.from("access_codes").insert(fresh);
    if (error) {
      toast.error("The codes could not be imported.");
      return;
    }
    setCsv("");
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "codes"] });
    toast.success(`${fresh.length} codes added.`);
  }

  async function markSent(id: string) {
    await supabase.from("access_codes").update({ state: "sent" }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "codes"] });
  }

  return (
    <div>
      <PageTitle title="Access codes" lead="One-time codes handed to authors so they can open the app." />

      <div className="grid gap-4 sm:grid-cols-3">
        {(["available", "assigned", "sent"] as const).map((state) => (
          <PortalCard key={state}>
            <p className="text-sm font-semibold capitalize text-brand-navySoft">{state}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-navy">{counts[state]}</p>
          </PortalCard>
        ))}
      </div>

      {mismatched.length > 0 ? (
        <div className="mt-6">
          <Banner tone="warning" title="Platform mismatch">
            {mismatched.length} code(s) are assigned to an author on the other platform. Check before sending.
          </Banner>
        </div>
      ) : null}

      <PortalCard className="mt-6">
        <h2 className="text-lg font-extrabold text-brand-navy">Import codes</h2>
        <p className="mt-2 text-sm text-brand-navySoft">One per line, in the format CODE,redeem_url.</p>
        <Textarea rows={6} className="mt-4" value={csv} onChange={(event) => setCsv(event.target.value)} aria-label="CSV of codes" />
        <Button type="button" variant="pill" size="pillSm" className="mt-4" onClick={importCsv}>
          Import
        </Button>
      </PortalCard>

      <PortalCard className="mt-6 overflow-x-auto">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
            <tr>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">State</th>
              <th className="py-3 pr-4">Assigned to</th>
              <th className="py-3 pr-4">Assigned</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {codes.map((code) => (
              <tr key={code.id}>
                <td className="py-3 pr-4 font-mono text-xs font-bold text-brand-navy">{code.code}</td>
                <td className="py-3 pr-4 capitalize text-brand-navySoft">{code.state}</td>
                <td className="py-3 pr-4 text-brand-navySoft">
                  {code.assigned_to ? authorById.get(code.assigned_to)?.full_name ?? "—" : "—"}
                </td>
                <td className="py-3 pr-4 text-brand-navySoft">{code.assigned_at ? formatDate(code.assigned_at) : "—"}</td>
                <td className="py-3">
                  {code.state === "assigned" ? (
                    <Button type="button" variant="ghost" size="pillSm" onClick={() => markSent(code.id)}>
                      Mark as sent
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalCard>
    </div>
  );
}
