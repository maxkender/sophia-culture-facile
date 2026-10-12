import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMyAppsCodes } from "@/lib/creator-app.functions";
import { L, t as ct } from "@/i18n/creator-app";

export function AppsCodesPage() {
  const fn = useServerFn(getMyAppsCodes);
  const { data, isLoading } = useQuery({ queryKey: ["my-apps-codes"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy">{L("My apps & codes", "Mes apps & codes")}</h1>
      <p className="mt-1 text-sm text-brand-navySoft">{L("Your free access to each app you film for.", "Ton accès gratuit à chaque app pour laquelle tu tournes.")}</p>
      {isLoading ? <p className="mt-6 text-sm text-brand-navySoft">{ct("Loading…")}</p> : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-brand-line bg-card p-5">
              <p className="text-lg font-extrabold text-brand-navy">{a.name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {a.appStore && <a className="font-semibold text-portal-accent underline" href={a.appStore} target="_blank" rel="noopener noreferrer">App Store</a>}
                {a.playStore && <a className="font-semibold text-portal-accent underline" href={a.playStore} target="_blank" rel="noopener noreferrer">Google Play</a>}
              </div>
              {a.codes.length === 0 ? <p className="mt-4 text-sm font-semibold text-brand-navySoft">{L("Code coming soon", "Code à venir")}</p> : a.codes.map((c) => (
                <div key={c.code} className="mt-4 rounded-xl bg-portal-bg p-3">
                  <p className="text-xs font-bold uppercase text-brand-navySoft">{c.platform === "android" ? "Android" : "iOS"}</p>
                  <p className="mt-1 break-all font-mono text-base font-bold text-brand-navy">{c.code}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(c.code); toast.success(L("Copied", "Copié")); }}>{L("Copy", "Copier")}</Button>
                    {c.redeem_url && <Button size="sm" asChild><a href={c.redeem_url} target="_blank" rel="noopener noreferrer">{L("Activate", "Activer")}</a></Button>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
