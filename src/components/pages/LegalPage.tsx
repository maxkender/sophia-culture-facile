import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";
import { fill, useI18n } from "@/i18n";

export function LegalPage() {
  const { t } = useI18n();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">{t.legal.title}</h1>
        <div className="mt-8 flex flex-col gap-6 rounded-3xl bg-card p-7 text-[15px] leading-relaxed text-brand-navySoft shadow-card md:p-10">
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.legal.editorTitle}</h2>
            <p className="mt-2">{fill(t.legal.editorText, { company: COMPANY })}</p>
            <p className="mt-2">
              <em>{t.legal.editorDetails}</em>
            </p>
            <p className="mt-2">
              <em>{t.legal.director}</em>{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.legal.hostTitle}</h2>
            <p className="mt-2">
              <em>{t.legal.hostText}</em>
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.legal.ipTitle}</h2>
            <p className="mt-2">{fill(t.legal.ipText, { company: COMPANY })}</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
