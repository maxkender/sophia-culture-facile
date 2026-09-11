import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";
import { fill, useI18n } from "@/i18n";

export function PrivacyPage() {
  const { t } = useI18n();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold text-brand-navy md:text-4xl">{t.privacy.title}</h1>
        <div className="mt-8 flex flex-col gap-6 rounded-3xl bg-card p-7 text-[15px] leading-relaxed text-brand-navySoft shadow-card md:p-10">
          <p>{fill(t.privacy.intro, { company: COMPANY })}</p>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.privacy.dataTitle}</h2>
            <p className="mt-2">
              <em>{t.privacy.dataText}</em>
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.privacy.retentionTitle}</h2>
            <p className="mt-2">
              <em>{t.privacy.retentionText}</em>
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.privacy.processorsTitle}</h2>
            <p className="mt-2">
              <em>{t.privacy.processorsText}</em>
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-brand-navy">{t.privacy.rightsTitle}</h2>
            <p className="mt-2">
              {t.privacy.rightsText}{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
