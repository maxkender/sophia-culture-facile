import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Banknote, Bell, BookOpen, Clapperboard, Home, Library, Lock, LogOut, Menu, MessageSquare, Search,
  Smartphone, UserCircle, Video, CalendarDays, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getMyPhotoUrl } from "@/lib/creator-app.functions";
import { useCreator } from "./useCreator";

type Badge = "briefs" | "posts" | "calls" | "messages";
type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean; badge?: Badge; gate?: "steps" | "payouts" };

export const CREATOR_NAV: { heading: string; items: Item[] }[] = [
  {
    heading: "Espace",
    items: [
      { to: "/creators/app", label: "Home", icon: Home, exact: true },
      { to: "/creators/app/briefs", label: "Briefs", icon: Clapperboard, badge: "briefs", gate: "steps" },
      { to: "/creators/app/library", label: "Library", icon: Library, gate: "steps" },
      { to: "/creators/app/posts", label: "My posts", icon: Video, badge: "posts", gate: "steps" },
      { to: "/creators/app/calls", label: "Calls", icon: CalendarDays, badge: "calls", gate: "steps" },
      { to: "/creators/app/earnings", label: "Earnings", icon: Banknote, gate: "payouts" },
      { to: "/creators/app/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
    ],
  },
  {
    heading: "Ressources",
    items: [
      { to: "/creators/app/rules", label: "Rules", icon: BookOpen },
      { to: "/creators/app/account", label: "Account setup", icon: Smartphone },
      { to: "/creators/app/profile", label: "Profile", icon: UserCircle },
    ],
  },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "S";
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { counts, steps } = useCreator();
  return (
    <nav aria-label="Creator space" className="flex flex-col gap-6">
      {CREATOR_NAV.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-navySoft/70">{group.heading}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const locked = (item.gate === "steps" && !steps.unlocked) || (item.gate === "payouts" && !(steps.unlocked && steps.payouts));
              const count = item.badge ? counts[item.badge] : 0;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      active ? "bg-brand-navy text-white shadow-sm" : "text-brand-navy hover:bg-brand-navy/10",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {locked ? <Lock className="size-3.5 opacity-60" aria-label="Locked" /> : count > 0 ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-white text-brand-navy" : "bg-brand-navy text-card")}>{count}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function CreatorBell() {
  const { notes, reload } = useCreator();
  const unread = notes.filter((n) => !n.read_at);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-portal-amber px-1 text-[10px] font-bold text-brand-navy">{unread.length}</span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
          <p className="text-sm font-bold text-brand-navy">Notifications</p>
          {unread.length > 0 ? (
            <button type="button" className="text-xs font-semibold text-portal-accent hover:underline" onClick={async () => {
              await supabase.from("creator_notifications").update({ read_at: new Date().toISOString() }).in("id", unread.map((n) => n.id));
              reload();
            }}>Mark all read</button>
          ) : null}
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {notes.length === 0 ? <li className="px-4 py-6 text-center text-sm text-brand-navySoft">Nothing yet.</li> : notes.map((n) => (
            <li key={n.id} className={cn("border-b border-brand-line px-4 py-3 text-sm", !n.read_at && "bg-portal-amber/10")}>
              <p className="text-brand-navy">{n.body}</p>
              <p className="mt-1 text-xs text-brand-navySoft">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function CreatorShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { me, briefs, counts } = useCreator();
  const pending = Object.values(counts ?? {}).reduce((a: number, b) => a + (Number(b) || 0), 0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const photoFn = useServerFn(getMyPhotoUrl);
  const { data: photo } = useQuery({ queryKey: ["creator-photo", me.photo_path], queryFn: () => photoFn() });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((o) => !o); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/creators/login", replace: true });
  }

  const all = CREATOR_NAV.flatMap((g) => g.items);
  const current = [...all].sort((a, b) => b.to.length - a.to.length).find((i) => (i.exact ? pathname === i.to : pathname.startsWith(i.to)));

  const user = (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      {photo?.url ? (
        <img src={photo.url} alt="" className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-card">{initials(me.full_name)}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-brand-navy">{me.full_name}</span>
        <span className="mt-0.5 inline-flex rounded-full bg-portal-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-portal-accent">Creator</span>
      </span>
      <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}><LogOut className="size-4" /></Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-portal-bg">
      <CommandDialog open={palette} onOpenChange={setPalette}>
        <CommandInput placeholder="Search pages and briefs…" />
        <CommandList>
          <CommandEmpty>No result.</CommandEmpty>
          <CommandGroup heading="Pages">
            {all.map((i) => (
              <CommandItem key={i.to} onSelect={() => { setPalette(false); void navigate({ to: i.to }); }}>{i.label}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Briefs">
            {briefs.map((b) => (
              <CommandItem key={b.id} value={`brief ${b.title}`} onSelect={() => { setPalette(false); void navigate({ to: "/creators/app/briefs/$briefId", params: { briefId: b.id } }); }}>{b.title}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-brand-line bg-card lg:flex">
        <div className="flex h-16 items-center px-4"><Link to="/creators/app" aria-label="Sophia creator space"><Logo /></Link></div>
        <div className="flex-1 overflow-y-auto px-3 py-4"><Nav /></div>
        <div className="border-t border-brand-line p-3">{user}</div>
      </aside>

      <div className="lg:pl-64">
        <header className="safe-top sticky top-0 z-30 border-b border-brand-line bg-card/95 backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 py-2 sm:px-6">
            <Sheet open={drawer} onOpenChange={setDrawer}>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="relative lg:hidden" aria-label="Open navigation"><Menu className="size-5" />{pending > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-portal-accent px-1 text-[10px] font-bold leading-4 text-card">{pending}</span>}</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-card p-0">
                <SheetTitle className="sr-only">Creator navigation</SheetTitle>
                <div className="flex h-16 items-center px-4"><Logo /></div>
                <div className="px-3 py-4"><Nav onNavigate={() => setDrawer(false)} /></div>
                <div className="border-t border-brand-line p-3">{user}</div>
              </SheetContent>
            </Sheet>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-brand-navy">{current?.label ?? "Creator space"}</p>
            <button type="button" onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-full border border-brand-line px-3.5 py-2 text-sm text-brand-navySoft transition hover:border-portal-accent/40 hover:text-brand-navy sm:flex">
              <Search className="size-4" aria-hidden="true" /> Search
              <span className="rounded bg-portal-bg px-1.5 py-0.5 text-[10px] font-bold">⌘K</span>
            </button>
            <Button type="button" variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setPalette(true)}><Search className="size-5" /></Button>
            <CreatorBell />
          </div>
        </header>
        <main className="safe-bottom mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

/** Wraps pages that stay locked until onboarding steps 1–3 (or step 4 for Earnings) are done. */
export function Locked({ gate, children }: { gate: "steps" | "payouts"; children: ReactNode }) {
  const { steps } = useCreator();
  const missing = !steps.rules
    ? { n: 1, label: "Read the rules", to: "/creators/app/rules" }
    : !steps.signed
      ? { n: 2, label: "Sign the Creator Account Agreement", to: "/creators/app/contract" }
      : !steps.account
        ? { n: 3, label: "Set up your Sophia account", to: "/creators/app/account" }
        : gate === "payouts" && !steps.payouts
          ? { n: 4, label: "Set up payouts", to: "/creators/app/profile" }
          : null;
  if (!missing) return <>{children}</>;
  return (
    <div className="rounded-portal border border-portal-amber/40 bg-portal-amber/10 p-6">
      <p className="flex items-center gap-2 text-base font-extrabold text-brand-navy"><Lock className="size-4" /> This page is locked</p>
      <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">
        {gate === "payouts"
          ? "Earnings open once onboarding steps 1 to 3 are done and your payout details are set up (step 4)."
          : "Briefs, the library, your posts and calls open once the first three onboarding steps are done: rules, agreement and account setup."}
      </p>
      <Button asChild className="mt-4"><Link to={missing.to}>Go to step {missing.n}: {missing.label}</Link></Button>
    </div>
  );
}
