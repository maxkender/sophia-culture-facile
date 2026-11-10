import { UserPlus,
  BarChart3, Banknote, BookOpen, CalendarCheck, ClipboardList, ExternalLink, FileSignature, GraduationCap, Handshake, Home, Inbox, Lightbulb,
  Map as MapIcon, Megaphone, MessageSquare, Percent, Settings, Shield, Star, Target, Users, type LucideIcon,
} from "lucide-react";

// Payouts entries are hidden while payments are off (hub_settings.payments_enabled); routes redirect home.
export type Space = "slideshows";
export const SPACES: Space[] = ["slideshows"];
export const SPACE_LABEL: Record<Space, string> = { slideshows: "Slideshows" };
export const SPACE_HOME: Record<Space, string> = { slideshows: "/hub/slideshows" };
/** Accent used only on the active nav item, the space badge and small chips. */
export const SPACE_ACCENT: Record<Space, { bg: string; text: string; soft: string }> = {
  slideshows: { bg: "bg-space-slides", text: "text-space-slides", soft: "bg-space-slides/10" },
};

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean; mobile?: boolean; lead: string };

export const SPACE_NAV: Record<Space, NavItem[]> = {
  slideshows: [
    { to: "/hub/slideshows", label: "Home", icon: Home, exact: true, mobile: true, lead: "This week across every zone" },
    { to: "/hub/slideshows/parcours-ruul", label: "Parcours Ruul", icon: CalendarCheck, mobile: true, lead: "From referral to payment" },
    { to: "/hub/slideshows/applications", label: "Applications", icon: Inbox, mobile: true, lead: "Pick posters one by one, country by country" },
    { to: "/hub/slideshows/posters", label: "Posters", icon: Users, mobile: true, lead: "Signed posters, start Monday and manual checklist" },
    { to: "/hub/slideshows/payouts", label: "Payouts", icon: Percent, lead: "Weekly Ruul file for started posters" },
    { to: "/hub/slideshows/rates", label: "Rates", icon: Percent, lead: "Weekly pay per zone and country map" },
    { to: "/hub/slideshows/guide", label: "Guide & links", icon: BookOpen, lead: "Poster guide and links" },
  ],
};

export const SPACE_KEY = "sophia.hub.space";
export function spaceOf(pathname: string): Space | null {
  if (pathname.startsWith("/hub/slideshows")) return "slideshows";
  return null;
}
export function lastSpace(): Space {
  if (typeof window === "undefined") return "slideshows";
  const v = window.localStorage.getItem(SPACE_KEY);
  return SPACES.includes(v as Space) ? (v as Space) : "slideshows";
}
