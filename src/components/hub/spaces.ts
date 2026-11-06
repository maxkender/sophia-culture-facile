import { UserPlus,
  BarChart3, Banknote, BookOpen, CalendarCheck, ClipboardList, ExternalLink, FileSignature, GraduationCap, Handshake, Home, Inbox, Lightbulb,
  Map as MapIcon, Megaphone, MessageSquare, Percent, Settings, Shield, Star, Target, Users, type LucideIcon,
} from "lucide-react";

// Payouts entries are hidden while payments are off (hub_settings.payments_enabled); routes redirect home.
export type Space = "ugc" | "slideshows" | "influencers";
export const SPACES: Space[] = ["ugc", "slideshows", "influencers"];
export const SPACE_LABEL: Record<Space, string> = { ugc: "UGC", slideshows: "Slideshows", influencers: "Influencers" };
export const SPACE_HOME: Record<Space, string> = { ugc: "/hub/ugc", slideshows: "/hub/slideshows", influencers: "/hub/influencers" };
/** Accent used only on the active nav item, the space badge and small chips. */
export const SPACE_ACCENT: Record<Space, { bg: string; text: string; soft: string }> = {
  ugc: { bg: "bg-space-ugc", text: "text-space-ugc", soft: "bg-space-ugc/10" },
  slideshows: { bg: "bg-space-slides", text: "text-space-slides", soft: "bg-space-slides/10" },
  influencers: { bg: "bg-space-infl", text: "text-space-infl", soft: "bg-space-infl/10" },
};

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean; mobile?: boolean; lead: string };

export const SPACE_NAV: Record<Space, NavItem[]> = {
  ugc: [
    { to: "/hub/ugc", label: "Home", icon: Home, exact: true, mobile: true, lead: "What needs you today" },
    { to: "/hub/ugc/inspiration", label: "Inspiration", icon: Lightbulb, mobile: true, lead: "Videos to learn from — one button makes a brief" },
    { to: "/hub/ugc/briefs", label: "Briefs", icon: ClipboardList, mobile: true, lead: "The briefs you write for creators" },
    { to: "/hub/ugc/library", label: "Library", icon: GraduationCap, lead: "Formats, files, hooks and CTAs" },
    { to: "/hub/ugc/applications", label: "Applications", icon: UserPlus, lead: "Pending UGC applications — accept or reject" },
    { to: "/hub/ugc/creators", label: "Creators", icon: Users, lead: "Active creators" },
    { to: "/hub/ugc/posts", label: "Posts", icon: Inbox, mobile: true, lead: "Validate drafts and posts; views are recorded at J+7" },
    { to: "/hub/settings", label: "Settings", icon: Settings, lead: "Shooting rules, descriptions, emails, apps & codes, Notion, team" },
  ],
  slideshows: [
    { to: "/hub/slideshows", label: "Home", icon: Home, exact: true, mobile: true, lead: "This week across every zone" },
    { to: "/hub/slideshows/applications", label: "Applications", icon: Inbox, mobile: true, lead: "Pick posters one by one, country by country" },
    { to: "/hub/slideshows/posters", label: "Posters", icon: Users, mobile: true, lead: "Signed posters, start Monday and manual checklist" },
    { to: "/hub/slideshows/payouts", label: "Payouts", icon: Percent, lead: "Weekly Ruul file for started posters" },
    { to: "/hub/slideshows/rates", label: "Rates", icon: Percent, lead: "Weekly pay per zone and country map" },
    { to: "/hub/slideshows/guide", label: "Guide & links", icon: BookOpen, lead: "Poster guide and links" },
  ],
  influencers: [
    { to: "/hub/influencers", label: "Home", icon: Home, exact: true, mobile: true, lead: "Deals overview" },
    { to: "/hub/influencers/applications", label: "Applications", icon: Inbox, lead: "New influencer applications" },
    { to: "/hub/influencers/influencers", label: "Influencers", icon: Star, mobile: true, lead: "Influencer profiles" },
    { to: "/hub/influencers/offers", label: "Offers", icon: ClipboardList, lead: "Briefs and offers" },
    { to: "/hub/influencers/deals", label: "Deals", icon: Handshake, mobile: true, lead: "Every deal and its deliverables" },
    { to: "/hub/influencers/messages", label: "Messages", icon: MessageSquare, mobile: true, lead: "Conversations with influencers" },
    { to: "/hub/influencers/attribution", label: "Attribution", icon: CalendarCheck, lead: "Attribution and performance" },
    { to: "/hub/influencers/settings", label: "Rights & settings", icon: Shield, lead: "Usage rights, defaults and master agreement" },
  ],
};

export const SPACE_KEY = "sophia.hub.space";
export function spaceOf(pathname: string): Space | null {
  if (pathname.startsWith("/hub/slideshows")) return "slideshows";
  if (pathname.startsWith("/hub/influencers")) return "influencers";
  if (pathname.startsWith("/hub/ugc")) return "ugc";
  return null;
}
export function lastSpace(): Space {
  if (typeof window === "undefined") return "ugc";
  const v = window.localStorage.getItem(SPACE_KEY);
  return SPACES.includes(v as Space) ? (v as Space) : "ugc";
}
