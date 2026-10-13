import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { drawMyCode, getMyAppsCodes } from "@/lib/creator-app.functions";
import { L, t as ct } from "@/i18n/creator-app";
import { CREATOR_KEY } from "./useCreator";

export function AppsCodesPage() {
  const fn = useServerFn(getMyAppsCodes);
  const draw = useServerFn(drawMyCode);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["my-apps-codes"], queryFn: () => fn() });
  async function get(appId: string, platform: "ios" | "android") {
    setBusy(`${appId}-${platform}`);
    try {
      const r = await draw({ data: { appId, platform } });
      if (r.empty) toast.error(L("No code left for now. We'll add more soon.", "Plus de code disponible pour l'instant. On en ajoute bientôt."));
      else toast.success(L("Your code is ready", "Ton code est prêt"));
      await qc.invalidateQueries({ queryKey: ["my-apps-codes"] });
      await qc.invalidateQueries({ queryKey: CREATOR_KEY });
    } catch {
      toast.error(L("The code could not be fetched. Try again.", "Le code n'a pas pu être récupéré. Réessaie."));
    } finally { setBusy(null); }
  }
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy">{L("My apps & codes", "Mes apps & codes")}</h1>
      <p className="mt-1 text-sm text-brand-navySoft">{L("Get your free code for each app, then activate it on your phone.", "Récupère ton code gratuit pour chaque app, puis active-le sur ton téléphone.")}</p>
      {isLoading ? <p className="mt-6 text-sm text-brand-navySoft">{ct("Loading…")}</p> : !(data ?? []).length ? (
        <p className="mt-6 text-sm text-brand-navySoft">{L("No app yet. Your apps will appear here.", "Pas encore d'app. Tes apps apparaîtront ici.")}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-brand-line bg-card p-5" data-testid={`app-${a.name}`}>
              <p className="text-lg font-extrabold text-brand-navy">{a.name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {a.appStore && <a className="font-semibold text-portal-accent underline" href={a.appStore} target="_blank" rel="noopener noreferrer">App Store</a>}
                {a.playStore && <a className="font-semibold text-portal-accent underline" href={a.playStore} target="_blank" rel="noopener noreferrer">Google Play</a>}
              </div>
              {a.platforms.length === 0 ? <p className="mt-4 text-sm font-semibold text-brand-navySoft">{L("Code coming soon", "Code à venir")}</p> : a.platforms.map((p) => {
                const label = p.platform === "android" ? "Android" : "iOS";
                return (
                  <div key={p.platform} className="mt-4 rounded-xl bg-portal-bg p-3">
                    <p className="text-xs font-bold uppercase text-brand-navySoft">{label}</p>
                    {p.code ? (
                      <>
                        <p className="mt-1 break-all font-mono text-base font-bold text-brand-navy">{p.code.code}</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(p.code!.code); toast.success(L("Copied", "Copié")); }}>{L("Copy", "Copier")}</Button>
                          {p.code.redeem_url && <Button size="sm" asChild><a href={p.code.redeem_url} target="_blank" rel="noopener noreferrer">{L("Activate", "Activer")}</a></Button>}
                        </div>
                      </>
                    ) : (
                      <Button size="sm" className="mt-2" disabled={busy === `${a.id}-${p.platform}`} onClick={() => void get(a.id, p.platform)}>
                        {L(`Get my ${label} code`, `Obtenir mon code ${label}`)}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
