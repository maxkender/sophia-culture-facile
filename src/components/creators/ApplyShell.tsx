import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export function ApplyShell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-surface" lang="en">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 md:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy md:text-4xl">{title}</h1>
        {lead ? <p className="mt-3 text-base leading-relaxed text-brand-navySoft">{lead}</p> : null}
        {children}
        <p className="mt-8 text-xs text-brand-navySoft">
          Your application is stored by Vik Studios to process it and contact you about it. See our{" "}
          <Link to="/en/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-brand-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-extrabold text-brand-navy">{title}</h2>
      <div className="mt-4 grid gap-5">{children}</div>
    </section>
  );
}

export function Confirmation({ text }: { text: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-brand-line bg-card p-6">
      <p className="flex items-start gap-2 text-lg font-extrabold text-brand-navy">
        <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0" /> {text}
      </p>
    </div>
  );
}

export function YesNo({ id, value, onChange }: { id: string; value: "" | "yes" | "no"; onChange: (v: "yes" | "no") => void }) {
  return (
    <div role="radiogroup" id={id} className="flex gap-3">
      {(["yes", "no"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`h-11 min-w-24 rounded-full border px-5 text-sm font-bold ${
            value === v ? "border-brand-navy bg-brand-navy text-brand-onNavy" : "border-brand-line bg-card text-brand-navy"
          }`}
        >
          {v === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

/** Hidden from people, tempting for bots. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
