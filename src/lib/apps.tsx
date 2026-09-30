import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { platformName } from "./platforms";
export * from "./platforms";

export type AppRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_path: string | null;
  primary_color: string | null;
  accent_color: string | null;
  domain: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
  taap_url: string | null;
  short_description: string | null;
  users_line: string | null;
  creators_line: string | null;
  active: boolean;
};

export const SOPHIA_APP_ID = "00000000-0000-4000-8000-000000000001";
export const APPS_KEY = ["apps"] as const;

export function useApps() {
  return useQuery({
    queryKey: APPS_KEY,
    queryFn: async () => {
      const { data } = await supabase.from("apps").select("*").order("created_at");
      return (data ?? []) as AppRow[];
    },
    staleTime: 5 * 60_000,
  });
}

export function appLogoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("app-logos").getPublicUrl(path).data.publicUrl;
}

/* ---------- admin selector (Sophia / UnSwipe / All), remembered per user ---------- */
const PREF_KEY = "creators_app";
const LOCAL_KEY = "sophia.admin.creatorsApp";
export const ADMIN_APP_KEY = ["admin-app-selector"] as const;

export function useAdminApp() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ADMIN_APP_KEY,
    queryFn: async () => {
      const local = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_KEY) : null;
      const { data } = await supabase.from("admin_ui_prefs").select("value").eq("key", PREF_KEY).maybeSingle();
      return ((data?.value as string | null) ?? local ?? "all") as string;
    },
    staleTime: Infinity,
  });
  const value = q.data ?? "all"; // "all" or an app id
  async function set(next: string) {
    qc.setQueryData(ADMIN_APP_KEY, next);
    window.localStorage.setItem(LOCAL_KEY, next);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from("admin_ui_prefs").upsert({ user_id: data.user.id, key: PREF_KEY, value: next as never, updated_at: new Date().toISOString() });
  }
  return { appId: value === "all" ? null : value, value, set };
}

/** Filter rows by the admin selector. */
export function byApp<T extends { app_id?: string | null }>(rows: T[] | null | undefined, appId: string | null): T[] {
  if (!rows) return [];
  return appId ? rows.filter((r) => r.app_id === appId) : rows;
}

export function AdminAppSelector({ collapsed }: { collapsed?: boolean }) {
  const { data: apps } = useApps();
  const { value, set } = useAdminApp();
  const options = [...(apps ?? []).filter((a) => a.active).map((a) => ({ id: a.id, label: a.name })), { id: "all", label: "All" }];
  return (
    <div className="mx-3 mt-2" role="group" aria-label="App">
      {collapsed ? null : <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-brand-navySoft">App</p>}
      <div className="flex flex-wrap gap-1 rounded-xl bg-portal-bg p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => void set(o.id)}
            className={cn(
              "min-h-8 flex-1 rounded-lg px-2 py-1 text-xs font-bold transition",
              value === o.id ? "bg-brand-navy text-card shadow-sm" : "text-brand-navy hover:bg-brand-navy/10",
            )}
          >
            {collapsed ? o.label.slice(0, 1) : o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Required app field for create forms: prefilled from the selector, locked when one app is selected. */
export function AppField({ value, onChange, id = "app-field" }: { value: string; onChange: (v: string) => void; id?: string }) {
  const { data: apps } = useApps();
  const { appId } = useAdminApp();
  const current = appId ?? value;
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-brand-navy">
      App
      <select
        id={id}
        required
        disabled={Boolean(appId)}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm disabled:opacity-70"
      >
        {(apps ?? []).filter((a) => a.active).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </label>
  );
}

/** Returns the app id a create form should save: the selector's app if set, else the form's value. */
export function useCreateAppId(formValue: string | undefined) {
  const { appId } = useAdminApp();
  return appId ?? formValue ?? SOPHIA_APP_ID;
}

/* ---------- badges ---------- */
export function AppBadge({ appId, className }: { appId: string | null | undefined; className?: string }) {
  const { data: apps } = useApps();
  const app = apps?.find((a) => a.id === appId);
  if (!app) return null;
  const color = app.primary_color || undefined;
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold", !color && "border-brand-navy/30 text-brand-navy", className)}
      style={color ? { borderColor: color, color } : undefined}
    >
      <span aria-hidden="true" className="size-2 rounded-full" style={{ background: color ?? "currentColor" }} />
      {app.name}
    </span>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function PlatformBadge({ platform, className }: { platform: string | null | undefined; className?: string }) {
  const name = platformName(platform);
  if (!name) return null;
  const Icon = name === "TikTok" ? TikTokIcon : name === "Instagram" ? InstagramIcon : name === "YouTube" ? YoutubeIcon : null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-2.5 py-1 text-sm font-bold text-card", className)}>
      {Icon ? <Icon /> : null}
      {name}
    </span>
  );
}

