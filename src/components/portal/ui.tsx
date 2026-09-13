import { useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, type CourseStatus } from "@/config/portal";
import { boldParts, downloadText } from "@/lib/portal";

export function PortalCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-portal bg-card p-6 shadow-portal", className)}>{children}</div>
  );
}

export function PageTitle({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">{title}</h1>
        {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-navySoft">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

const STATUS_CLASS: Record<CourseStatus, string> = {
  assigned: "bg-brand-surfaceStrong text-brand-navySoft",
  in_progress: "bg-portal-accent/10 text-portal-accent",
  submitted: "bg-brand-navy/10 text-brand-navy",
  changes_requested: "bg-portal-amber/15 text-portal-amber",
  accepted: "bg-portal-green/10 text-portal-green",
  published: "bg-portal-green/15 text-portal-green",
};

export function StatusPill({ status }: { status: CourseStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Banner({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "success" | "error";
  title: string;
  children?: ReactNode;
}) {
  const toneClass = {
    info: "border-portal-accent/30 bg-portal-accent/5 text-brand-navy",
    warning: "border-portal-amber/40 bg-portal-amber/10 text-brand-navy",
    success: "border-portal-green/30 bg-portal-green/8 text-brand-navy",
    error: "border-portal-red/30 bg-portal-red/8 text-brand-navy",
  }[tone];
  return (
    <div className={cn("rounded-portal border p-5", toneClass)}>
      <p className="text-sm font-bold">{title}</p>
      {children ? <div className="mt-1 text-sm leading-relaxed text-brand-navySoft">{children}</div> : null}
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="pillSecondary"
      size="pillSm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function BoldText({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((part, index) =>
        part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}


export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <PortalCard className="text-center">
      <p className="text-sm font-bold text-brand-navy">{title}</p>
      {text ? <p className="mt-1 text-sm text-brand-navySoft">{text}</p> : null}
    </PortalCard>
  );
}
