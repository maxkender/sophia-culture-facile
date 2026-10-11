import {
  BarChart3, Banknote, BookOpen, CalendarCheck, ClipboardList, ExternalLink, FileSignature, GraduationCap, Handshake, Home, Inbox, Lightbulb,
  Map as MapIcon, Megaphone, MessageSquare, Percent, Shield, Star, Target, Users, type LucideIcon,
} from "lucide-react";

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
    { to: "/hub/ugc/campaigns", label: "Campaigns", icon: Target, mobile: true, lead: "Campaigns, jobs, applicants and video reviews" },
    { to: "/hub/ugc/creators", label: "Creators", icon: Users, mobile: true, lead: "Directory, applications, prospects and the fast lane" },
    { to: "/hub/ugc/messages", label: "Messages", icon: MessageSquare, mobile: true, lead: "Conversations with applicants and creators" },
    { to: "/hub/ugc/ads", label: "Ads", icon: Megaphone, lead: "Turn the best creator videos into paid ads" },
    { to: "/hub/ugc/analytics", label: "Analytics", icon: BarChart3, lead: "Views, posts and cost" },
    { to: "/hub/ugc/payouts", label: "Payouts", icon: Banknote, lead: "Monthly creator payouts through Stripe" },
    { to: "/hub/ugc/library", label: "Library", icon: GraduationCap, lead: "Formats, briefs, files, references and templates" },
    { to: "/hub/ugc/inspiration", label: "Inspiration", icon: Lightbulb, lead: "Imported TikToks and Reels, transcribed and analysed" },
  ],
  slideshows: [
    { to: "/hub/slideshows", label: "Home", icon: Home, exact: true, mobile: true, lead: "This week across every zone" },
    { to: "/hub/slideshows/applications", label: "Applications", icon: Inbox, mobile: true, lead: "Pick posters one by one, country by country" },
    { to: "/hub/slideshows/posters", label: "Posters", icon: Users, mobile: true, lead: "Signed posters, start Monday and manual checklist" },
    { to: "/hub/slideshows/managers", label: "Hiring managers & zones", icon: MapIcon, lead: "Who looks after which zone" },
    { to: "/hub/slideshows/rates", label: "Rates", icon: Percent, lead: "Weekly pay per zone and country map" },
    { to: "/hub/slideshows/payouts", label: "Payouts", icon: Banknote, mobile: true, lead: "Weekly poster payouts" },
    { to: "/hub/slideshows/guide", label: "Guide & templates", icon: BookOpen, lead: "Poster Guide and email texts" },
    { to: "/hub/slideshows/platform", label: "Old platform", icon: ExternalLink, lead: "The previous slideshow platform" },
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
    { to: "/hub/influencers/payouts", label: "Payouts", icon: FileSignature, lead: "Influencer invoices and payouts" },
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
