import {
  Activity,
  Code2,
  Compass,
  BookMarked,
  BookOpen,
  FileSignature,
  FileText,
  Home,
  KeyRound,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageSquare,
  Settings,
  Sparkles,
  UserCircle,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavBadge =
  | "review"
  | "myCourses"
  | "codes"
  | "applications"
  | "requests"
  | "messages"
  | "adminMessages";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: NavBadge;
};

export type NavGroup = { heading: string; items: NavItem[] };

export const AUTHOR_NAV: NavGroup[] = [
  {
    heading: "Espace",
    items: [
      { to: "/auteurs", label: "Home", icon: Home, exact: true },
      { to: "/auteurs/courses", label: "My courses", icon: Library, badge: "myCourses" },
      { to: "/auteurs/open", label: "Open courses", icon: Compass },
      { to: "/auteurs/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
      { to: "/auteurs/examples", label: "Examples", icon: Sparkles },
      { to: "/auteurs/profile", label: "Profile", icon: UserCircle },
    ],
  },
  {
    heading: "Ressources",
    items: [
      { to: "/auteurs/guide", label: "Writing guide", icon: BookOpen },
      { to: "/auteurs/contract", label: "Contract", icon: FileSignature },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    heading: "Pilotage",
    items: [
      { to: "/auteurs/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/auteurs/admin/review", label: "Review queue", icon: UserCheck, badge: "review" },
      { to: "/auteurs/admin/messages", label: "Messages", icon: MessageSquare, badge: "adminMessages" },
    ],
  },
  {
    heading: "Contenu",
    items: [
      { to: "/auteurs/admin/authors", label: "Authors", icon: Users },
      { to: "/auteurs/admin/courses", label: "Courses", icon: BookMarked },
      { to: "/auteurs/admin/pool", label: "Unassigned courses", icon: Compass, badge: "requests" },
      { to: "/auteurs/admin/applications", label: "Applications", icon: FileText, badge: "applications" },
    ],
  },
  {
    heading: "Ressources",
    items: [
      { to: "/auteurs/admin/documents", label: "Documents", icon: Library },
      { to: "/auteurs/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/auteurs/admin/codes", label: "Access codes", icon: KeyRound, badge: "codes" },
    ],
  },
  {
    heading: "Système",
    items: [
      { to: "/auteurs/admin/activity", label: "Activity log", icon: Activity },
      { to: "/auteurs/admin/api", label: "App export API", icon: Code2 },
      { to: "/auteurs/admin/ai-review", label: "AI reviewer", icon: Sparkles },
      { to: "/auteurs/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function sectionLabel(pathname: string, groups: NavGroup[]): string {
  const items = groups.flatMap((group) => group.items);
  const match = items
    .filter((item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? "Portal";
}
