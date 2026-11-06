import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { countryCodeOf } from "@/config/countries";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { STATUS_LABEL } from "./useOs";

export const shortDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "—";
export function Country({ country }: { country: string }) {
  const iso = countryCodeOf(country);
  const flag = iso ? [...iso].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("") : "";
  return <span title={country} className="whitespace-nowrap">{flag} {iso ?? country}</span>;
}
export function StatusPill({ status }: { status: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", ["started", "paid", "approved", "os_created"].includes(status) ? "bg-portal-green/10 text-portal-green" : ["rejected", "dropped", "skipped"].includes(status) ? "bg-portal-red/10 text-portal-red" : status === "pending" || status === "draft" ? "bg-portal-amber/10 text-portal-amber" : "bg-space-slides/10 text-space-slides")}>{status === "rejected" ? "Refused" : status === "contract_signed" ? "Signed" : status === "os_created" ? "In OS" : STATUS_LABEL[status] ?? status}</span>;
}
export function DetailSheet({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode }) {
  return <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}><SheetContent className="slides-crm w-full overflow-y-auto bg-card p-4 sm:max-w-xl"><SheetHeader className="mb-4 pr-8 text-left"><SheetTitle>{title}</SheetTitle><SheetDescription className="break-all">{description}</SheetDescription></SheetHeader>{children}</SheetContent></Sheet>;
}