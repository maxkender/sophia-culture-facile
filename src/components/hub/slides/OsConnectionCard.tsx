import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveOsBaseUrl, testOsConnection } from "@/lib/slideshows.functions";
import { OS_NOT_CONNECTED, useOsStatus } from "./useOs";
import { SlideshowMetaStatus } from "./SlideshowMetaStatus";

export function OsConnectionCard() {
  const qc = useQueryClient();
  const { data } = useOsStatus();
  const test = useServerFn(testOsConnection); const save = useServerFn(saveOsBaseUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const val = url ?? data?.baseUrl ?? "";
  return (
    <div className="space-y-3 rounded-2xl bg-card p-5 shadow-portal" data-testid="os-card">
      <div className="flex items-center gap-2"><h3 className="font-extrabold text-brand-navy">Sophia OS</h3>
        <span className={data?.connected ? "rounded-full bg-portal-green/15 px-2 py-0.5 text-xs font-bold text-portal-green" : "rounded-full bg-portal-amber/20 px-2 py-0.5 text-xs font-bold"}>{data?.connected ? "Secret set" : "Not connected"}</span></div>
      <p className="text-sm text-brand-navySoft">Creates posters in the OS, reads their weekly posts and active counts. Secret name: <code>OS_HUB_SECRET</code> (its value is never shown).</p>
      {!data?.connected ? <p className="text-sm font-semibold text-portal-amber">{OS_NOT_CONNECTED}.</p> : null}
      <div className="flex flex-wrap gap-2">
        <input aria-label="OS base URL" value={val} onChange={(e) => setUrl(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm" />
        <Button variant="outline" onClick={async () => { try { await save({ data: { url: val } }); toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "os-status"] }); } catch { toast.error("Use a full https:// address."); } }}>Save</Button>
        <Button disabled={busy || !data?.connected} onClick={async () => {
          setBusy(true);
          try { const r = await test(); if (r.ok) toast.success(`Connected${r.version ? ` · OS ${r.version}` : ""}`); else toast.error(r.error); void qc.invalidateQueries({ queryKey: ["hub", "os-status"] }); }
          finally { setBusy(false); }
        }}>Test connection</Button>
      </div>
      <p className="text-xs text-brand-navySoft">Last sync: {data?.lastSync ? new Date(data.lastSync).toLocaleString("en-GB") : "never"} · Last error: {data?.lastError ?? "none"}</p>
      <p className="text-xs text-brand-navySoft">Hiring manager alerts: {data?.slack ? "Slack (SLACK_WEBHOOK_URL set)" : "email to the hiring manager (add SLACK_WEBHOOK_URL in Settings → Secrets for Slack)"}</p>
      {data?.calls.length ? <ul className="space-y-1 text-xs">{data.calls.map((c: { created_at: string; action: string; ok: boolean; error: string | null; ms: number | null }, i: number) => <li key={i}>{new Date(c.created_at).toLocaleString("en-GB")} · {c.action} · {c.ok ? "ok" : `failed: ${c.error}`} · {c.ms} ms</li>)}</ul> : null}
      <SlideshowMetaStatus />
    </div>
  );
}
