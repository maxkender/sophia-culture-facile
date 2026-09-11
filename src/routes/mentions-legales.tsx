import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";
import { meta } from "@/lib/seo";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: meta({
      title: "Mentions légales | Sophia — Culture générale",
      description:
        "Mentions légales du site de Sophia — Culture générale, application mobile éditée par Vik Studios SAS, France.",
      url: "/mentions-legales",
    }),
    links: [{ rel: "canonical", href: "/mentions-legales" }],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">Mentions légales</h1>
        <div className="mt-8 flex flex-col gap-6 rounded-3xl bg-card p-7 text-[15px] leading-relaxed text-brand-navySoft shadow-card md:p-10">
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Éditeur du site</h2>
            <p className="mt-2">
              {COMPANY}, société par actions simplifiée de droit français, éditrice de l'application
              mobile Sophia — Culture générale.
            </p>
            <p className="mt-2">
              Adresse du siège social : <em>À COMPLÉTER</em>. Numéro SIREN / SIRET :{" "}
              <em>À COMPLÉTER</em>. Numéro de TVA intracommunautaire : <em>À COMPLÉTER</em>. Capital
              social : <em>À COMPLÉTER</em>.
            </p>
            <p className="mt-2">
              Directeur de la publication : <em>À COMPLÉTER</em>. Contact :{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Hébergement</h2>
            <p className="mt-2">
              Hébergeur du site : <em>À COMPLÉTER</em> (raison sociale, adresse et téléphone).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Propriété intellectuelle</h2>
            <p className="mt-2">
              L'ensemble des contenus du site et de l'application Sophia — Culture générale
              (textes, quiz, marques, logo, interfaces) est protégé et reste la propriété de{" "}
              {COMPANY}, sauf mention contraire. <em>Section à compléter.</em>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
