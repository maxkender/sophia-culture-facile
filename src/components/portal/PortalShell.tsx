import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePortalProfile } from "./usePortal";
import { useNavCounts } from "./useNavCounts";
import { ADMIN_NAV, AUTHOR_NAV, sectionLabel, type NavGroup } from "./nav";
import { CommandPalette } from "./CommandPalette";
import { Banner, PortalCard } from "./ui";

const COLLAPSE_KEY = "sophia.portal.sidebar.collapsed";

export type Crumb = { label: string; to?: string };

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "S"
  );
}

function isNavActive(pathname: string, item: { to: string; exact?: boolean }): boolean {
  return item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function SidebarNav({
  groups,
  counts,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  counts: Partial<Record<string, number>>;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Portal" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.heading}>
          {collapsed ? (
            <div className="mx-3 mb-2 h-px bg-brand-line" />
          ) : (
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-navySoft/70">
              {group.heading}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const count = item.badge ? (counts[item.badge] ?? 0) : 0;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: Boolean(item.exact) }}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-navySoft transition hover:bg-brand-navy/5 hover:text-brand-navy",
                      collapsed && "justify-center px-0",
                    )}
                    activeProps={{
                      className: cn(
                        "flex items-center gap-3 rounded-xl bg-brand-navy px-3 py-2.5 text-sm font-semibold text-card hover:bg-brand-navy hover:text-card",
                        collapsed && "justify-center px-0",
                      ),
                    }}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {collapsed ? (
                      <span className="sr-only">{item.label}</span>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {count > 0 ? (
                          <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-bold text-card">
                            {count}
                          </span>
                        ) : null}
                      </>
                    )}
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

export function PortalShell({
  children,
  adminOnly = false,
  breadcrumb,
  action,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  breadcrumb?: Crumb[];
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePortalProfile();
  const profile = data?.profile ?? null;
  const isAdmin = profile?.role === "admin";
  const groups = isAdmin ? ADMIN_NAV : AUTHOR_NAV;
  const counts = useNavCounts(Boolean(isAdmin), profile?.id);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  const name = profile?.full_name ?? data?.email ?? "";
  const crumbs: Crumb[] = breadcrumb?.length ? breadcrumb : [{ label: sectionLabel(pathname, groups) }];

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-brand-navy/5",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-card">
            {initials(name)}
          </span>
          {collapsed ? null : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-brand-navy">{name}</span>
              <span className="mt-0.5 inline-flex rounded-full bg-portal-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-portal-accent">
                {isAdmin ? "Admin" : "Author"}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem asChild>
          <Link to="/auteurs/profile">
            <User className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/auteurs/guide">
            <CircleHelp className="size-4" /> Help
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-portal-bg">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} isAdmin={Boolean(isAdmin)} />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-brand-line bg-card lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
          <Link to="/auteurs" aria-label="Sophia author portal">
            {collapsed ? (
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-navy text-sm font-bold text-card">
                S
              </span>
            ) : (
              <Logo />
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav groups={groups} counts={counts} collapsed={collapsed} />
        </div>
        <div className="border-t border-brand-line p-3">
          {userMenu}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-brand-navySoft transition hover:bg-brand-navy/5",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {collapsed ? null : "Collapse"}
          </button>
        </div>
      </aside>

      <div className={cn(collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-brand-line bg-card/95 backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 py-2 sm:px-6">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-card p-0">
                <SheetTitle className="sr-only">Portal navigation</SheetTitle>
                <div className="flex h-16 items-center px-4">
                  <Logo />
                </div>
                <div className="px-3 pb-4">
                  <SidebarNav
                    groups={groups}
                    counts={counts}
                    collapsed={false}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </div>
                <div className="border-t border-brand-line p-3">{userMenu}</div>
              </SheetContent>
            </Sheet>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex flex-wrap items-center gap-1 text-sm">
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                      {index > 0 ? <span className="text-brand-navySoft/60">/</span> : null}
                      {crumb.to && !last ? (
                        <Link to={crumb.to} className="font-semibold text-brand-navySoft hover:text-portal-accent">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={last ? "font-bold text-brand-navy" : "font-semibold text-brand-navySoft"}>
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-brand-line px-3.5 py-2 text-sm text-brand-navySoft transition hover:border-portal-accent/40 hover:text-brand-navy sm:flex"
            >
              <Search className="size-4" aria-hidden="true" />
              Search
              <span className="rounded bg-portal-bg px-1.5 py-0.5 text-[10px] font-bold">⌘K</span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-5" />
            </Button>
            {action}
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          {isLoading ? (
            <PortalCard>
              <p className="text-sm text-brand-navySoft">Loading…</p>
            </PortalCard>
          ) : !profile ? (
            <Banner tone="warning" title="This account is not linked to an author record">
              Ask the Sophia editorial desk for your invite link, then open it while signed in with this email address.
            </Banner>
          ) : adminOnly && !isAdmin ? (
            <Banner tone="error" title="Admin access only">
              This page is reserved for the editorial desk.
            </Banner>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
