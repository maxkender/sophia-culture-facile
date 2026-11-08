import { ArrowRight } from "lucide-react";

/** Announcement bar on the "become a teacher" pages pointing to the Studio sign-up. */
export function StudioCta({ lang }: { lang: "fr" | "en" }) {
  const fr = lang === "fr";
  return (
    <div className="bg-brand-navy px-5 py-3 text-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm">
        <span className="font-semibold">{fr ? "Écrivez des cours pour l'app Sophia, publiés dans toutes ses langues." : "Write courses for the Sophia app, published in every app language."}</span>
        <a href="/auteurs/join" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-card px-4 font-bold text-brand-navy">
          {fr ? "Rejoindre Sophia Studio" : "Join Sophia Studio"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
