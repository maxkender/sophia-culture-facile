import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SL, studioLang } from "@/i18n/studio";
import type { Issue } from "@/lib/studio/course-format";

const GROUPS: { prefix: string[]; en: string; fr: string }[] = [
  { prefix: ["title.", "subtitle.", "subject", "subcategory.", "description.", "hook.", "hero."], en: "Title and card details", fr: "Titre et fiche du cours" },
  { prefix: ["sections.", "section.", "block.", "timeline."], en: "2 to 12 sections, each with a title and content", fr: "2 à 12 sections, chacune avec un titre et du contenu" },
  { prefix: ["takeaway."], en: "One Key takeaway, in the last section", fr: "Un seul « À retenir », dans la dernière section" },
  { prefix: ["emdash"], en: "No em dash (—)", fr: "Aucun tiret long (—)" },
  { prefix: ["bold.", "brackets."], en: "Bold and glossary markers are closed", fr: "Marqueurs de gras et de glossaire fermés" },
  { prefix: ["glossary."], en: "Every [[term]] has a glossary entry", fr: "Chaque [[terme]] a son entrée de glossaire" },
  { prefix: ["image."], en: "Images use https links", fr: "Les images utilisent des liens https" },
  { prefix: ["source."], en: "Sources are complete", fr: "Les sources sont complètes" },
  { prefix: ["quiz."], en: "Quiz (optional) is valid", fr: "Le quiz (facultatif) est valide" },
];

const ICON = {
  error: <XCircle className="size-4 shrink-0 text-portal-red" />,
  warn: <AlertTriangle className="size-4 shrink-0 text-portal-amber" />,
  info: <Info className="size-4 shrink-0 text-portal-accent" />,
};

export function ChecksPanel({
  issues, onShow, onFixEmDash, onAddGlossary, disabled,
}: {
  issues: Issue[]; onShow: (path: string) => void; onFixEmDash: () => void; onAddGlossary: (term: string) => void; disabled: boolean;
}) {
  const fr = studioLang() === "fr";
  const errors = issues.filter((i) => i.severity === "error");
  const rest = issues.filter((i) => i.severity !== "error").sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "warn" ? -1 : 1));
  const passing = GROUPS.filter((g) => !errors.some((e) => g.prefix.some((p) => e.rule.startsWith(p))));

  const row = (i: Issue, k: number) => (
    <li key={`${i.rule}-${i.path}-${k}`} className={cn("flex items-start gap-2 rounded-lg border p-2.5 text-sm",
      i.severity === "error" ? "border-portal-red/25 bg-portal-red/5" : i.severity === "warn" ? "border-portal-amber/30 bg-portal-amber/8" : "border-brand-line bg-card")}>
      {ICON[i.severity]}
      <span className="min-w-0 flex-1 leading-snug text-brand-navy">{fr ? i.fr : i.en}</span>
      <span className="flex shrink-0 gap-1">
        {!disabled && i.rule === "emdash" ? <ActionBtn onClick={onFixEmDash}>{SL("Fix", "Corriger")}</ActionBtn> : null}
        {!disabled && i.rule === "glossary.missing" && i.data ? <ActionBtn onClick={() => onAddGlossary(i.data!)}>{SL("Add", "Ajouter")}</ActionBtn> : null}
        <ActionBtn onClick={() => onShow(i.path)} subtle>{SL("Show", "Voir")}</ActionBtn>
      </span>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl p-3 text-sm font-bold", errors.length ? "bg-portal-red/8 text-portal-red" : "bg-portal-green/10 text-portal-green")}>
        {errors.length
          ? SL(`${errors.length} to fix before sending for review`, `${errors.length} à corriger avant l'envoi en relecture`)
          : SL("Everything required is in place", "Tout ce qui est obligatoire est en place")}
      </div>
      {errors.length ? <ul className="space-y-1.5">{errors.map(row)}</ul> : null}
      {rest.length ? (
        <div>
          <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">{SL("Suggestions (never blocking)", "Suggestions (jamais bloquantes)")}</p>
          <ul className="space-y-1.5">{rest.map(row)}</ul>
        </div>
      ) : null}
      {passing.length ? (
        <ul className="space-y-1">
          {passing.map((g) => (
            <li key={g.en} className="flex items-center gap-2 px-1 text-sm text-brand-navySoft">
              <CheckCircle2 className="size-4 shrink-0 text-portal-green" />{fr ? g.fr : g.en}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ActionBtn({ onClick, children, subtle }: { onClick: () => void; children: React.ReactNode; subtle?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-md px-2 py-0.5 text-xs font-bold", subtle ? "text-portal-accent hover:bg-portal-accent/10" : "bg-brand-navy text-brand-onNavy hover:opacity-90")}>
      {children}
    </button>
  );
}
