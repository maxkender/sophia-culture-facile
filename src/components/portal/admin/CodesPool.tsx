import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, type AccessCode, type Profile } from "@/lib/portal";
import { Banner, PageTitle, PortalCard } from "../ui";

type Platform = "ios" | "android";
type CodeRow = { code: string; redeem_url: string | null; platform: Platform; state: "available" };

const CODE_FILE = "/access-codes/app-store-codes.csv";
const BATCH_SIZE = 500;

function parseCsv(text: string, platform: Platform): CodeRow[] {
  const seen = new Set<string>();
  const rows: CodeRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.toLowerCase().startsWith("code,")) continue;
    const parts = line.split(",").map((part) => part.trim());
    const code = parts[0] ?? "";
    if (!code || seen.has(code)) continue;
    seen.add(code);
    rows.push({ code, redeem_url: parts[1] || null, platform, state: "available" });
  }
  return rows;
}

export function CodesPool() {
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState("");
  const [pastePlatform, setPastePlatform] = useState<Platform>("android");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const { data } = useQuery({
    queryKey: ["portal", "admin", "codes"],
    queryFn: async () => {
      const countFor = async (state: string) =>
        (await supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("state", state)).count ?? 0;
      const [available, assigned, sent, { data: recent }, { data: authors }] = await Promise.all([
        countFor("available"),
        countFor("assigned"),
        countFor("sent"),
        supabase.from("access_codes").select("*").neq("state", "available").order("assigned_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id, full_name, platform"),
      ]);
      return {
        counts: { available, assigned, sent },
        recent: (recent ?? []) as AccessCode[],
        authors: (authors ?? []) as Pick<Profile, "id" | "full_name" | "platform">[],
      };
    },
  });

  const counts = data?.counts ?? { available: 0, assigned: 0, sent: 0 };
  const recent = data?.recent ?? [];
  const authorById = new Map((data?.authors ?? []).map((author) => [author.id, author]));

  const mismatched = recent.filter((code) => {
    const author = code.assigned_to ? authorById.get(code.assigned_to) : null;
    return Boolean(author) && author!.platform !== code.platform;
  });

  async function insertRows(rows: CodeRow[]) {
    setProgress({ done: 0, total: rows.length });
    let inserted = 0;
    for (let index = 0; index < rows.length; index += BATCH_SIZE) {
      const batch = rows.slice(index, index + BATCH_SIZE);
      const { data: added, error } = await supabase
        .from("access_codes")
        .upsert(batch, { onConflict: "code", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      inserted += added?.length ?? 0;
      setProgress({ done: Math.min(index + BATCH_SIZE, rows.length), total: rows.length });
    }
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "codes"] });
    return inserted;
  }

  async function importFile() {
    setImporting(true);
    try {
      const response = await fetch(CODE_FILE);
      if (!response.ok) throw new Error("missing");
      const rows = parseCsv(await response.text(), "ios");
      if (rows.length === 0) {
        toast.error("The code file is empty. Add the App Store codes to it first.");
        return;
      }
      const inserted = await insertRows(rows);
      toast.success(`${inserted} new code(s) added. ${rows.length - inserted} were already in the pool.`);
    } catch {
      toast.error("The code file could not be imported.");
    } finally {
      setImporting(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  async function importPasted() {
    const rows = parseCsv(csv, pastePlatform);
    if (rows.length === 0) {
      toast.error("No codes found in that list.");
      return;
    }
    setImporting(true);
    try {
      const inserted = await insertRows(rows);
      setCsv("");
      toast.success(`${inserted} new code(s) added. ${rows.length - inserted} were already in the pool.`);
    } catch {
      toast.error("The codes could not be imported.");
    } finally {
      setImporting(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  async function markSent(id: string) {
    await supabase.from("access_codes").update({ state: "sent" }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "codes"] });
  }

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <PageTitle title="Access codes" lead="One-time codes handed to authors so they can open the app." />

      <div className="grid gap-4 sm:grid-cols-3">
        {(["available", "assigned", "sent"] as const).map((state) => (
          <PortalCard key={state}>
            <p className="text-sm font-semibold capitalize text-brand-navySoft">{state}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-navy">{counts[state].toLocaleString("en-GB")}</p>
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
        <h2 className="text-lg font-extrabold text-brand-navy">App Store code file</h2>
        <p className="mt-2 max-w-2xl text-sm text-brand-navySoft">
          Imports the App Store codes stored in the project. Codes already in the pool are skipped, so it is safe to run
          it more than once.
        </p>
        <Button type="button" variant="pill" size="pillSm" className="mt-4" disabled={importing} onClick={importFile}>
          {importing ? "Importing…" : "Import the code file"}
        </Button>
        {importing && progress.total > 0 ? (
          <div className="mt-4 max-w-md">
            <div className="h-2 w-full overflow-hidden rounded-full bg-portal-bg">
              <div className="h-full rounded-full bg-portal-accent transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-brand-navySoft">
              {progress.done.toLocaleString("en-GB")} of {progress.total.toLocaleString("en-GB")} rows processed
            </p>
          </div>
        ) : null}
      </PortalCard>

      <PortalCard className="mt-6">
        <h2 className="text-lg font-extrabold text-brand-navy">Paste or upload codes</h2>
        <p className="mt-2 text-sm text-brand-navySoft">One per line, in the format CODE,redeem_url.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="paste-platform">Platform</Label>
            <Select value={pastePlatform} onValueChange={(value) => setPastePlatform(value as Platform)}>
              <SelectTrigger id="paste-platform" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="code-file" className="pt-2">CSV file</Label>
            <input
              id="code-file"
              type="file"
              accept=".csv,text/csv"
              className="text-sm text-brand-navySoft"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setCsv(await file.text());
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-csv">Codes</Label>
            <Textarea id="code-csv" rows={8} value={csv} onChange={(event) => setCsv(event.target.value)} />
          </div>
        </div>
        <Button type="button" variant="pillSecondary" size="pillSm" className="mt-4" disabled={importing} onClick={importPasted}>
          Import pasted codes
        </Button>
      </PortalCard>

      <PortalCard className="mt-6 overflow-x-auto">
        <h2 className="text-lg font-extrabold text-brand-navy">Assigned and sent</h2>
        <table className="mt-4 w-full min-w-3xl text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
            <tr>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Platform</th>
              <th className="py-3 pr-4">State</th>
              <th className="py-3 pr-4">Assigned to</th>
              <th className="py-3 pr-4">Assigned</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-brand-navySoft">No code has been assigned yet.</td>
              </tr>
            ) : (
              recent.map((code) => (
                <tr key={code.id}>
                  <td className="py-3 pr-4 font-mono text-xs font-bold text-brand-navy">{code.code}</td>
                  <td className="py-3 pr-4 text-brand-navySoft">{code.platform === "android" ? "Android" : "iOS"}</td>
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
              ))
            )}
          </tbody>
        </table>
      </PortalCard>
    </div>
  );
}
