import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Sophia, c'est quoi ?",
    answer:
      "Sophia — Culture générale est une application mobile française d'apprentissage de la culture générale. Elle propose des cours courts, des quiz et un entraînement quotidien sur l'histoire, les sciences, la société, la géopolitique et la culture. L'application est éditée par Vik Studios SAS, société établie en France.",
  },
  {
    question: "Sophia est-elle gratuite ?",
    answer:
      "Oui, Sophia — Culture générale est gratuite au téléchargement. Les cours et les quiz de base sont accessibles sans payer. Aucun paiement n'est demandé pour commencer à apprendre.",
  },
  {
    question: "Sur quels téléphones fonctionne Sophia ?",
    answer:
      "Sophia — Culture générale fonctionne sur les smartphones iOS et Android. L'application se télécharge depuis l'App Store d'Apple et depuis le Google Play Store. Elle s'utilise aussi sur iPad et sur les tablettes Android.",
  },
  {
    question: "Quels sujets sont couverts ?",
    answer:
      "Sophia — Culture générale couvre l'histoire, les sciences, la société, la géopolitique et la culture. Chaque thème est découpé en dossiers de cinq chapitres courts. De nouveaux dossiers sont ajoutés régulièrement.",
  },
  {
    question: "Qui a créé Sophia ?",
    answer:
      "Sophia — Culture générale est créée et éditée par Vik Studios SAS, une société française. L'ensemble des contenus de l'application est rédigé en français. Vik Studios SAS est l'unique éditeur de l'application.",
  },
  {
    question: "Sophia a-t-elle un lien avec le robot Sophia ?",
    answer:
      "Non. Sophia — Culture générale est une application mobile d'apprentissage et n'a aucun lien avec le robot humanoïde Sophia de Hanson Robotics. Elle n'a pas non plus de lien avec l'université Sophia de Tokyo, ni avec le programme sophia d'accompagnement des malades chroniques de l'Assurance Maladie.",
  },
  {
    question: "Combien de temps faut-il par jour ?",
    answer:
      "Cinq à dix minutes par jour suffisent pour progresser avec Sophia — Culture générale. Un chapitre se lit en quelques minutes et se termine par un quiz rapide. La régularité compte plus que la durée de chaque session.",
  },
  {
    question: "Faut-il créer un compte ?",
    answer:
      "Vous pouvez commencer à lire les cours de Sophia — Culture générale dès l'ouverture de l'application. Créer un compte permet de sauvegarder votre progression, votre série de jours et votre rang. Le compte est gratuit.",
  },
];

export function Faq({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-3xl bg-card shadow-card"
          >
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
