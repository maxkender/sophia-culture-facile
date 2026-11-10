import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, Banknote, Bot, ChevronsUpDown, GraduationCap, Home, Images, Megaphone, MessageSquare, MoreHorizontal, Plus,
  Search, Settings, Share2, Star, Target, Users, X, LogOut, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAdminApp, useApps } from "@/lib/apps";
import { usePortalProfile } from "@/components/portal/usePortal";
import { useSetupChecklist } from "./hub-data";
import { lastSpace, SPACE_ACCENT, SPACE_HOME, SPACE_KEY, SPACE_LABEL, SPACE_NAV, SPACES, spaceOf, type NavItem, type Space } from "./spaces";

type Item = NavItem;
const SHARED_TITLES: Record<string, [string, string]> = {
  "/hub/settings": ["Settings", "OS connection, team and security"],
};

function isActive(pathname: string, i: Item) {
  return i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`);
}

function SpaceSwitcher({ space }: { space: Space }) {
  const navigate = useNavigate();
  const go = (s: Space) => { window.localStorage.setItem(SPACE_KEY, s); void navigate({ to: SPACE_HOME[s] } as never); };
  return (
    <>
      <div role="tablist" aria-label="Space" className="hidden grid-cols-3 gap-1 rounded-xl bg-portal-bg p-1 lg:grid">
        {SPACES.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={s === space} onClick={() => go(s)}
            className={cn("truncate rounded-lg px-0.5 py-1.5 text-[10px] font-bold tracking-tight", s === space ? cn(SPACE_ACCENT[s].bg, "text-card") : "text-brand-navySoft hover:text-brand-navy")}>{SPACE_LABEL[s]}</button>
        ))}
      </div>
      <select aria-label="Space" value={space} onChange={(e) => go(e.target.value as Space)} className="h-9 rounded-lg border border-brand-line bg-card px-2 text-sm font-bold lg:hidden">
        {SPACES.map((s) => <option key={s} value={s}>{SPACE_LABEL[s]}</option>)}
      </select>
    </>
  );
}

function AppSwitcher() {
  const { data: apps = [] } = useApps();
  const { value, set } = useAdminApp();
  const current = apps.find((a) => a.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-brand-line bg-portal-bg px-3 py-2.5 text-left">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-navy text-xs font-extrabold text-card">{(current?.name ?? "All").slice(0, 2)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-brand-navy">{current?.name ?? "All apps"}</span>
            <span className="block text-[11px] text-brand-navySoft">App shown in the Hub</span>
          </span>
          <ChevronsUpDown className="size-4 text-brand-navySoft" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {apps.filter((a) => a.active).map((a) => <DropdownMenuItem key={a.id} onSelect={() => void set(a.id)}>{a.name}</DropdownMenuItem>)}
        <DropdownMenuItem onSelect={() => void set("all")}>All apps</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["hub", "search-index"],
    enabled: open,
    queryFn: async () => {
      const s = await supabase.from("slideshow_applications").select("id, full_name, country").limit(500);
      return { slides: s.data ?? [] };
    },
  });
  const go = (to: string, params?: Record<string, string>, search?: Record<string, string>) => { onOpenChange(false); void navigate({ to, params, search } as never); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search slideshows…" />
      <CommandList>
        <CommandEmpty>No result.</CommandEmpty>
        {SPACES.map((sp) => <CommandGroup key={sp} heading={`${SPACE_LABEL[sp]} · pages`}>{SPACE_NAV[sp].map((i) => <CommandItem key={i.to} value={`${SPACE_LABEL[sp]} ${i.label}`} onSelect={() => go(i.to)}>{i.label}</CommandItem>)}</CommandGroup>)}
        <CommandGroup heading="Slideshows · applications & posters">{data?.slides.map((s) => <CommandItem key={s.id} value={`slideshow ${s.full_name} ${s.country}`} onSelect={() => go("/hub/slideshows/applications", undefined, { id: s.id })}>{s.full_name} · {s.country}</CommandItem>)}</CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

const BANNER_KEY = "sophia.hub.banner.dismissed";

export function SetupBanner() {
  const steps = useSetupChecklist();
  const [hidden, setHidden] = useState(true);
  useEffect(() => setHidden(window.localStorage.getItem(BANNER_KEY) === "1"), []);
  const next = steps.find((s) => !s.done);
  if (hidden || !next) return null;
  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 bg-brand-navy px-4 py-2.5 text-sm text-card" data-testid="hub-banner">
      <p className="min-w-0 flex-1 truncate">Next step: <b>{next.title}</b></p>
      <Button asChild size="sm" variant="secondary"><Link to={next.to}>Open</Link></Button>
      <button type="button" aria-label="Dismiss" className="p-2" onClick={() => { window.localStorage.setItem(BANNER_KEY, "1"); setHidden(true); }}><X className="size-4" /></button>
    </div>
  );
}

export function HubShell({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = usePortalProfile();
  const profile = me?.profile;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState(false);
  const [stored, setStored] = useState<Space>("slideshows");
  useEffect(() => setStored(lastSpace()), []);
  const space: Space = spaceOf(pathname) ?? stored;
  useEffect(() => { const s = spaceOf(pathname); if (s) window.localStorage.setItem(SPACE_KEY, s); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isLoading) return <div className="min-h-screen bg-portal-bg" />;
  if (profile?.role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center bg-portal-bg p-6 text-center text-brand-navy"><p>This space is for admins only. <Link className="font-bold underline" to="/auth">Sign in</Link></p></div>;
  }

  const nav = SPACE_NAV[space];
  const shared = Object.keys(SHARED_TITLES).find((k) => pathname.startsWith(`${k}/`) || (k === "/hub/settings" && pathname === k) || (k === "/hub/ugc/referrals" && pathname === k));
  const hit = [...nav].sort((a, b) => b.to.length - a.to.length).find((i) => isActive(pathname, i));
  const [title, lead] = shared ? SHARED_TITLES[shared]! : hit ? [hit.label, hit.lead] : ["Hub", ""];
  const accent = SPACE_ACCENT[space];
  const name = (profile as { full_name?: string | null }).full_name ?? "Admin";

  async function signOut() {
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-portal-bg">
      <GlobalSearch open={search} onOpenChange={setSearch} />
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-brand-line bg-card lg:flex">
        <div className="space-y-3 px-4 pt-4"><div className="flex items-center gap-2"><Logo /><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-card", accent.bg)} data-testid="space-badge">{SPACE_LABEL[space]}</span></div></div>
        <nav aria-label={`${SPACE_LABEL[space]} navigation`} className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {nav.map((i) => {
            const Icon = i.icon;
            return <Link key={i.to} to={i.to as never} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", isActive(pathname, i) ? cn(accent.bg, "text-card") : "text-brand-navy hover:bg-brand-navy/10")}><Icon className="size-4" aria-hidden="true" /><span className="flex-1">{i.label}</span></Link>;
          })}
        </nav>
        <div className="space-y-1 border-t border-brand-line p-3">
          <AppSwitcher />
          <Link to="/hub/settings" className={cn("flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold", pathname.startsWith("/hub/settings") ? "bg-brand-navy text-card" : "text-brand-navy hover:bg-brand-navy/10")}><Settings className="size-4" />Settings</Link>
          <div className="flex items-center gap-2 px-1">
            <span className="flex size-8 items-center justify-center rounded-full bg-portal-accent text-xs font-bold text-card">{name.slice(0, 1)}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-navy">{name}</span>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="pb-20 lg:pb-0 lg:pl-60">
        
        <header className="safe-top border-b border-brand-line bg-card">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold text-brand-navy">{title}</h1>
              {space !== "slideshows" ? <p className="hidden truncate text-xs text-brand-navySoft sm:block">{lead}</p> : null}
            </div>
            <button type="button" onClick={() => setSearch(true)} className="hidden min-h-10 w-72 items-center gap-2 rounded-full border border-brand-line bg-portal-bg px-4 text-sm text-brand-navySoft md:flex">
              <Search className="size-4" /> <span className="flex-1 text-left">Search Hub</span><span className="text-[10px] font-bold">⌘K</span>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setSearch(true)}><Search className="size-5" /></Button>
          </div>
        </header>
        <main className={cn("safe-bottom mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6", space === "slideshows" && "slides-crm")}>{children}</main>
      </div>

      <nav aria-label="Hub mobile" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-brand-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.filter((i) => i.mobile).map((i) => {
          const Icon = i.icon;
          return (
            <Link key={i.label} to={i.to as never} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold", isActive(pathname, i) ? accent.text : "text-brand-navySoft")}>
              <Icon className="size-5" />{i.label}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-brand-navySoft"><MoreHorizontal className="size-5" />More</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            {nav.filter((i) => !i.mobile).map((i) => <DropdownMenuItem key={i.label} onSelect={() => void navigate({ to: i.to } as never)}>{i.label}</DropdownMenuItem>)}
            <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/settings" })}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
