import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n";

export type FaqItem = { question: string; answer: string };

export function Faq({ items }: { items?: FaqItem[] }) {
  const { t } = useI18n();
  const list = items ?? t.faq;
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {list.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question} className="overflow-hidden rounded-3xl bg-card shadow-card">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-button-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold text-brand-navy"
              >
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className={`size-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              hidden={!isOpen}
              className="px-6 pb-6 text-[15px] leading-relaxed text-brand-navySoft"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
