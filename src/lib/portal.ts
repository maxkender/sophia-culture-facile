import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Screen = Database["public"]["Tables"]["screens"]["Row"];
export type Source = Database["public"]["Tables"]["sources"]["Row"];
export type AccessCode = Database["public"]["Tables"]["access_codes"]["Row"];
export type Contract = Database["public"]["Tables"]["contracts"]["Row"];

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(course: Pick<Course, "due_date" | "status">): boolean {
  if (!course.due_date) return false;
  if (course.status === "accepted" || course.status === "published") return false;
  return new Date(course.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Splits a body on **bold** markers. Returns alternating plain/bold parts. */
export function boldParts(text: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match = regex.exec(text);
  while (match) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), bold: false });
    parts.push({ text: match[1] ?? "", bold: true });
    last = match.index + match[0].length;
    match = regex.exec(text);
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false });
  return parts;
}

export function inviteUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/auteurs/invite?token=${encodeURIComponent(token)}`;
}

export function newInviteToken(): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `inv_${raw.replace(/-/g, "").slice(0, 24)}`;
}
