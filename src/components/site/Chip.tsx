import type { LucideIcon } from "lucide-react";

type Tone = "purple" | "blue" | "pink";

const TONES: Record<Tone, string> = {
  purple: "bg-brand-purple/15 text-brand-purple",
  blue: "bg-brand-blue/12 text-brand-blue",
  pink: "bg-brand-pink/25 text-brand-navy",
};

export function Chip({
  icon: Icon,
  children,
  tone = "blue",
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${TONES[tone]}`}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
      {children}
    </span>
  );
}
