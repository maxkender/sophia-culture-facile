import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-surface px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <Link to="/" aria-label="Retour à l’accueil" className="mb-10 w-fit">
          <Logo />
        </Link>
        <section className="rounded-lg border border-brand-line bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-3xl font-extrabold text-brand-navy">{title}</h1>
          {intro ? <p className="mt-2 text-sm leading-relaxed text-brand-navySoft">{intro}</p> : null}
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}