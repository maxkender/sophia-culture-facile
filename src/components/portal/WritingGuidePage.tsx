import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUIDE_VERSION } from "@/config/portal";
import {
  GUIDE_ALERT,
  GUIDE_CLOSING,
  GUIDE_SECTIONS,
  GUIDE_SUBTITLE,
  GUIDE_TITLE,
  guidePlainText,
} from "@/content/writing-guide";
import { downloadText } from "@/lib/portal";
import { PageTitle, PortalCard } from "./ui";

export function WritingGuidePage() {
  return (
    <div>
      <PageTitle
        title="Writing guide"
        lead="What a Sophia course looks like, how the five screens work together and what we check before accepting."
      />

      <div
        role="alert"
        className="rounded-portal border-2 border-portal-red bg-portal-red/8 p-6 shadow-portal sm:p-8"
      >
        <p className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-wide text-portal-red">
          <AlertTriangle className="size-5" aria-hidden="true" />
          {GUIDE_ALERT.heading}
        </p>
        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-portal-red">{GUIDE_ALERT.lead}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-navy">{GUIDE_ALERT.body}</p>
      </div>

      <PortalCard className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy">{GUIDE_TITLE}</h2>
            <p className="mt-1 text-sm text-brand-navySoft">{GUIDE_SUBTITLE}</p>
          </div>
          <Button
            type="button"
            variant="pillSecondary"
            size="pillSm"
            onClick={() => downloadText(`sophia-writing-guide-${GUIDE_VERSION}.txt`, guidePlainText())}
          >
            <Download className="size-4" aria-hidden="true" />
            Download
          </Button>
        </div>

        <div className="mt-8 max-w-3xl space-y-8">
          {GUIDE_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-base font-bold text-brand-navy">{section.title}</h3>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="mt-2 text-sm leading-7 text-brand-navySoft">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-7 text-brand-navySoft">
                      <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-portal-accent" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.table ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                      <tr>
                        <th className="py-2 pr-6">{section.table.header[0]}</th>
                        <th className="py-2">{section.table.header[1]}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {section.table.rows.map(([left, right]) => (
                        <tr key={left}>
                          <td className="py-3 pr-6 align-top font-semibold text-brand-navy">{left}</td>
                          <td className="py-3 align-top leading-6 text-brand-navySoft">{right}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}

          <p className="border-t border-brand-line pt-6 text-sm font-semibold leading-7 text-brand-navy">
            {GUIDE_CLOSING}
          </p>
        </div>
      </PortalCard>
    </div>
  );
}
