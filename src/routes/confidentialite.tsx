import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";
import { canonical, meta } from "@/lib/seo";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: meta({
      title: "Politique de confidentialité | Sophia — Culture générale",
      description:
        "Politique de confidentialité de Sophia — Culture générale, application mobile d'apprentissage éditée par Vik Studios SAS.",
      url: "/confidentialite",
    }),
    links: [canonical("/confidentialite")],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
          Politique de confidentialité
        </h1>
        <div className="mt-8 flex flex-col gap-6 rounded-3xl bg-card p-7 text-[15px] leading-relaxed text-brand-navySoft shadow-card md:p-10">
          <p>
            Cette page décrit la manière dont {COMPANY} traite les données personnelles des
            utilisateurs de l'application Sophia — Culture générale et de ce site.{" "}
            <em>Document à compléter avant publication.</em>
          </p>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Données collectées</h2>
            <p className="mt-2">
              <em>À COMPLÉTER</em> : nature des données collectées (compte, progression, données
              techniques), finalités et bases légales.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Durée de conservation</h2>
            <p className="mt-2">
              <em>À COMPLÉTER</em> : durées de conservation par catégorie de données.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Sous-traitants et mesure d'audience</h2>
            <p className="mt-2">
              <em>À COMPLÉTER</em> : hébergeur, outils d'analyse, transferts éventuels hors Union
              européenne.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">Vos droits</h2>
            <p className="mt-2">
              Conformément au RGPD, vous disposez de droits d'accès, de rectification, d'effacement,
              d'opposition et de portabilité. Pour les exercer, écrivez à{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              . <em>Section à compléter.</em>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
