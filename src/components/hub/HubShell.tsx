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
import { NotificationBell } from "@/components/portal/NotificationBell";
import { useSetupChecklist } from "./hub-data";
import { SidekickDrawer } from "./Sidekick";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean; disabled?: boolean; pill?: string; mobile?: boolean };
const ADS_NEW_UNTIL = "2026-10-25";
export const HUB_NAV: Item[] = [
  { to: "/hub", label: "Home", icon: Home, exact: true, mobile: true },
  { to: "#assistant", label: "Assistant", icon: Bot },
  { to: "/hub/campaigns", label: "Campaigns", icon: Target, mobile: true },
  { to: "/hub/discover", label: "Creators", icon: Users, mobile: true },
  { to: "/hub/slideshows", label: "Slideshows", icon: Images },
  { to: "/hub/influencers", label: "Influencers", icon: Star },
  { to: "/hub/messages", label: "Messages", icon: MessageSquare, mobile: true },
  { to: "/hub/ads", label: "Ads", icon: Megaphone, ...(new Date().toISOString().slice(0, 10) < ADS_NEW_UNTIL ? { pill: "New" } : {}) },
  { to: "/hub/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/hub/payouts", label: "Payouts", icon: Banknote },
  { to: "/hub/affiliates", label: "Referrals", icon: Share2 },
  { to: "/hub/learn", label: "Library", icon: GraduationCap },
  { to: "/hub/settings", label: "Settings", icon: Settings },
];

export const HUB_TITLES: Record<string, [string, string]> = {
  "/hub": ["Home", "What needs you today"],
  "/hub/campaigns": ["Campaigns", "UGC campaigns, jobs, applicants and video reviews"],
  "/hub/discover": ["Creators", "Directory, applications, prospects and the fast lane"],
  "/hub/creators": ["Creators", "Creator file"],
  "/hub/slideshows": ["Slideshows", "Slideshow creators: applications, hiring managers, pay zones and guide"],
  "/hub/influencers": ["Influencers", "Applications, offers, deals and attribution"],
  "/hub/messages": ["Messages", "Conversations with applicants and creators"],
  "/hub/ads": ["Ads", "Turn the best creator videos into paid ads"],
  "/hub/analytics": ["Analytics", "Views, posts and cost"],
  "/hub/payouts": ["Payouts", "Creators, slideshow creators and influencers"],
  "/hub/affiliates": ["Referrals", "Creators who bring other creators"],
  "/hub/learn": ["Library", "Formats, briefs, files, references, guides and templates"],
  "/hub/settings": ["Settings", "Apps, access codes, email, connections and team"],
};

function isActive(pathname: string, i: Item) {
  return i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`);
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
      const [c, p, b, j, s, inf, d] = await Promise.all([
        supabase.from("creators").select("id, full_name").limit(500),
        supabase.from("creator_posts").select("id, url").order("created_at", { ascending: false }).limit(200),
        supabase.from("briefs").select("id, title").limit(300),
        supabase.from("jobs").select("id, title").limit(200),
        supabase.from("slideshow_applications").select("id, full_name, country").limit(500),
        supabase.from("influencers").select("id, display_name").limit(500),
        supabase.from("influencer_deals").select("id, influencers(display_name), influencer_briefs(title)").limit(300),
      ]);
      return { creators: c.data ?? [], posts: p.data ?? [], briefs: b.data ?? [], jobs: j.data ?? [], slides: s.data ?? [], infl: inf.data ?? [], deals: d.data ?? [] };
    },
  });
  const go = (to: string, params?: Record<string, string>, search?: Record<string, string>) => { onOpenChange(false); void navigate({ to, params, search } as never); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search creators, slideshow creators, influencers, briefs, jobs…" />
      <CommandList>
        <CommandEmpty>No result.</CommandEmpty>
        <CommandGroup heading="Pages">{HUB_NAV.filter((i) => !i.disabled && i.to.startsWith("/")).map((i) => <CommandItem key={i.label} onSelect={() => go(i.to)}>{i.label}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Creators">{data?.creators.map((c) => <CommandItem key={c.id} value={`creator ${c.full_name}`} onSelect={() => go("/hub/creators/$creatorId", { creatorId: c.id })}>{c.full_name}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Jobs">{data?.jobs.map((j) => <CommandItem key={j.id} value={`job ${j.title}`} onSelect={() => go("/hub/campaigns")}>{j.title}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Briefs">{data?.briefs.map((b) => <CommandItem key={b.id} value={`brief ${b.title}`} onSelect={() => go("/hub/learn/briefs/$briefId", { briefId: b.id })}>{b.title}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Slideshow creators">{data?.slides.map((s) => <CommandItem key={s.id} value={`slideshow ${s.full_name} ${s.country}`} onSelect={() => go("/hub/slideshows", undefined, { tab: "assign" })}>{s.full_name} · {s.country}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Influencers">{data?.infl.map((i) => <CommandItem key={i.id} value={`influencer ${i.display_name}`} onSelect={() => go("/hub/influencers", undefined, { tab: "influencers", id: i.id })}>{i.display_name}</CommandItem>)}</CommandGroup>
        <CommandGroup heading="Influencer deals">{data?.deals.map((d) => { const n = `${(d.influencers as { display_name?: string } | null)?.display_name ?? ""} · ${(d.influencer_briefs as { title?: string } | null)?.title ?? ""}`; return <CommandItem key={d.id} value={`deal ${n}`} onSelect={() => go("/hub/influencers", undefined, { tab: "deals", id: d.id })}>{n}</CommandItem>; })}</CommandGroup>
        <CommandGroup heading="Posts">{data?.posts.map((p) => <CommandItem key={p.id} value={`post ${p.url}`} onSelect={() => go("/hub/campaigns", undefined)}>{p.url}</CommandItem>)}</CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

const BANNER_KEY = "sophia.hub.banner.dismissed";

function SetupBanner() {
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
  const [sidekick, setSidekick] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isLoading) return <div className="min-h-screen bg-portal-bg" />;
  if (profile?.role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center bg-portal-bg p-6 text-center text-brand-navy"><p>This space is for admins only. <Link className="font-bold underline" to="/auteurs">Back</Link></p></div>;
  }

  const key = Object.keys(HUB_TITLES).sort((a, b) => b.length - a.length).find((k) => pathname === k || pathname.startsWith(`${k}/`)) ?? "/hub";
  const [title, lead] = HUB_TITLES[key] ?? ["Hub", ""];
  const name = (profile as { full_name?: string | null }).full_name ?? "Admin";

  async function signOut() {
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auteurs/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-portal-bg">
      <GlobalSearch open={search} onOpenChange={setSearch} />
      <SidekickDrawer open={sidekick} onOpenChange={setSidekick} />
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-brand-line bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 px-5"><Logo /><span className="rounded-full bg-portal-bg px-2 py-0.5 text-[10px] font-bold uppercase text-brand-navySoft">Hub</span></div>
        <nav aria-label="Creator hub" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {HUB_NAV.map((i) => {
            const Icon = i.icon;
            const cls = cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", i.disabled ? "cursor-not-allowed text-brand-navySoft/50" : isActive(pathname, i) ? "bg-brand-navy text-card" : "text-brand-navy hover:bg-brand-navy/10");
            const inner = <><Icon className="size-4" aria-hidden="true" /><span className="flex-1">{i.label}</span>{i.pill ? <span className="rounded-full bg-portal-accent px-2 py-0.5 text-[10px] font-bold text-card">{i.pill}</span> : null}{i.disabled ? <span className="text-[10px]">Soon</span> : null}</>;
            return i.to === "#assistant" ? <button key={i.label} type="button" onClick={() => setSidekick(true)} className={cn(cls, "w-full text-left")}>{inner}</button> : i.disabled ? <span key={i.label} className={cls} aria-disabled="true">{inner}</span> : <Link key={i.label} to={i.to} className={cls}>{inner}</Link>;
          })}
        </nav>
        <div className="space-y-2 border-t border-brand-line p-3">
          <AppSwitcher />
          <Link to="/auteurs/admin" className="flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-portal-accent hover:bg-brand-navy/10">Passer à l'espace profs →</Link>
          <div className="flex items-center gap-2 px-1">
            <span className="flex size-8 items-center justify-center rounded-full bg-portal-accent text-xs font-bold text-card">{name.slice(0, 1)}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-navy">{name}</span>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="pb-20 lg:pb-0 lg:pl-60">
        <SetupBanner />
        <header className="safe-top border-b border-brand-line bg-card">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold text-brand-navy">{title}</h1>
              <p className="hidden truncate text-xs text-brand-navySoft sm:block">{lead}</p>
            </div>
            <button type="button" onClick={() => setSearch(true)} className="hidden min-h-10 w-72 items-center gap-2 rounded-full border border-brand-line bg-portal-bg px-4 text-sm text-brand-navySoft md:flex">
              <Search className="size-4" /> <span className="flex-1 text-left">Search Hub</span><span className="text-[10px] font-bold">⌘K</span>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setSearch(true)}><Search className="size-5" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" aria-label="Create"><Plus className="size-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/campaigns/create" })}>Campaign</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/campaigns", search: { tab: "jobs", newJob: 1 } as never })}>Job</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/learn/briefs/$briefId", params: { briefId: "new" } })}>Brief</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/discover" })}>Invite creator</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate({ to: "/hub/discover", search: { add: 1 } as never })}>Add validated creator</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="outline" aria-label="Open Assistant" title="Assistant" onClick={() => setSidekick(true)}><Bot className="size-4" /></Button>
            <NotificationBell profileId={profile.id} />
          </div>
        </header>
        <main className="safe-bottom mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>

      <nav aria-label="Hub mobile" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-brand-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {HUB_NAV.filter((i) => i.mobile).map((i) => {
          const Icon = i.icon;
          return (
            <Link key={i.label} to={i.to} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold", isActive(pathname, i) ? "text-portal-accent" : "text-brand-navySoft")}>
              <Icon className="size-5" />{i.label}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-brand-navySoft"><MoreHorizontal className="size-5" />More</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            {HUB_NAV.filter((i) => !i.mobile).map((i) => <DropdownMenuItem key={i.label} onSelect={() => (i.to === "#assistant" ? setSidekick(true) : void navigate({ to: i.to }))}>{i.label}</DropdownMenuItem>)}
            <DropdownMenuItem onSelect={() => void navigate({ to: "/auteurs/admin" })}>Passer à l'espace profs →</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
