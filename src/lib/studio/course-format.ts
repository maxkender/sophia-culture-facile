/**
 * Sophia Studio v2: the app's block course format and its rules.
 * One source of truth for the editor checks, submit (Pass D) and the bridge payload builder.
 * Browser-safe: no server imports.
 */

export const SUBJECTS = ["histoire", "sciences", "litterature", "art", "mythologie", "comprendreLeMonde"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_LABEL: Record<Subject, { en: string; fr: string }> = {
  histoire: { en: "History", fr: "Histoire" },
  sciences: { en: "Science", fr: "Sciences" },
  litterature: { en: "Literature", fr: "Littérature" },
  art: { en: "Art", fr: "Art" },
  mythologie: { en: "Mythology", fr: "Mythologie" },
  comprendreLeMonde: { en: "Understanding the world", fr: "Comprendre le monde" },
};

export const SUBCATEGORY_SUGGESTIONS: Partial<Record<Subject, string[]>> = {
  histoire: [
    "Antiquité & Moyen Âge",
    "Époque moderne & XIXe siècle",
    "Révolutions & conflits modernes",
    "Guerre froide & monde contemporain",
  ],
  sciences: ["Découvertes qui ont changé le monde", "La Terre et l'Univers", "Notre quotidien expliqué"],
};

export const APP_LANGS = [
  "fr", "en", "es", "de", "pt", "pt-PT", "it", "tr", "pl", "ro", "nl", "el", "sv", "hu", "bg",
  "cs", "da", "nb", "ru", "hr", "sl", "sk", "sr", "ar", "he", "fi", "et", "lt", "lv", "ja",
] as const;

export const GLOSSARY_CLASSES = ["referenceHistorique", "concept", "evenementConnexe", "personnage", "lieuInstitution"] as const;
export type GlossaryClass = (typeof GLOSSARY_CLASSES)[number];
export const GLOSSARY_CLASS_LABEL: Record<GlossaryClass, { en: string; fr: string }> = {
  referenceHistorique: { en: "Historical reference", fr: "Référence historique" },
  concept: { en: "Concept", fr: "Concept" },
  evenementConnexe: { en: "Related event", fr: "Événement connexe" },
  personnage: { en: "Person", fr: "Personnage" },
  lieuInstitution: { en: "Place or institution", fr: "Lieu ou institution" },
};

export const BLOCK_TYPES = ["paragraph", "heading", "image", "timeline", "funFact", "takeaway", "quote"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const LIMITS = {
  title: [3, 160],
  subtitle: 80,
  subcategory: 80,
  description: [20, 600],
  hook: 200,
  sections: [2, 12],
  sectionTitle: 120,
  blockText: 5000,
  sourceText: [3, 400],
  glossaryExplanation: [10, 600],
  words: [500, 900],
  glossaryTerms: [3, 8],
  quiz: [6, 10],
} as const;

export type Credit = { title?: string; author?: string; license?: string; source?: string };
export type TimelineEvent = { date: string; title: string; detail?: string };

/** `_key` is a local editor key, never sent to the bridge. */
export type Block =
  | { _key?: string; type: "paragraph"; text: string }
  | { _key?: string; type: "heading"; text: string }
  | { _key?: string; type: "image"; image_url: string; caption?: string; credit?: Credit; fullBleed?: boolean }
  | { _key?: string; type: "timeline"; events: TimelineEvent[] }
  | { _key?: string; type: "funFact"; text: string }
  | { _key?: string; type: "takeaway"; text: string }
  | { _key?: string; type: "quote"; text: string; attribution?: string };

/** `id` is the bridge's section id, kept after first publication. */
export type Section = { _key?: string; id?: string; title: string; free?: boolean; blocks: Block[] };
export type Hero = { image_url?: string; ratio?: "16:9"; hook?: string; credit?: Credit };
export type Source = { text: string; url?: string };
export type GlossaryEntry = { term: string; classification: string; explanation: string };

export type QuizQuestion = {
  id?: string;
  type: "mcq" | "trueFalse" | "chronological" | "numericSlider" | "percentageSlider";
  question: string;
  explanation: string;
  options?: string[];
  correctIndex?: number;
  items?: string[];
  correctValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  tolerance?: number;
  unit?: string;
};

export type StudioCourseContent = {
  title: string;
  subtitle?: string | null;
  subject?: string | null;
  subcategory?: string | null;
  description: string;
  hero: Hero;
  sections: Section[];
  sources: Source[];
  glossary: GlossaryEntry[];
  quiz?: QuizQuestion[] | null;
};

export type Severity = "error" | "warn" | "info";
export type Issue = {
  rule: string;
  severity: Severity;
  /** Bridge-style path, e.g. `sections[2].blocks[0].text`. */
  path: string;
  en: string;
  fr: string;
  /** Extra value for actions, e.g. the missing glossary term. */
  data?: string;
};

/* ---------------------------------------------------------------- helpers */

const len = (s: string | null | undefined) => [...(s ?? "")].length;
const isHttps = (u: string | null | undefined) => {
  if (!u) return false;
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/** Case- and accent-insensitive key for glossary matching. */
export function termKey(term: string): string {
  return term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Every `[[term]]` used in a text, in order. */
export function glossaryRefs(text: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^[\]]+?)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push((m[1] ?? "").trim());
  return out;
}

export function boldBalanced(text: string): boolean {
  return ((text.match(/\*\*/g) ?? []).length) % 2 === 0;
}

export function bracketsBalanced(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length - 1; i++) {
    const two = text.slice(i, i + 2);
    if (two === "[[") {
      if (depth) return false;
      depth = 1;
      i++;
    } else if (two === "]]") {
      if (!depth) return false;
      depth = 0;
      i++;
    }
  }
  return depth === 0;
}

export const EM_DASH = "—";
/** Replace em dashes with a comma (between words) or a hyphen. */
export function fixEmDash(text: string): string {
  return text.replace(/\s*—\s*/g, (m, offset: number, whole: string) => (offset === 0 || offset + m.length >= whole.length ? "" : ", "));
}

/** Visible words: markers removed, tokens with at least one letter or digit. */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const plain = text.replace(/\*\*/g, "").replace(/\[\[|\]\]/g, "");
  return plain.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function blockWords(b: Block): number {
  switch (b.type) {
    case "paragraph":
    case "heading":
    case "funFact":
    case "takeaway":
      return countWords(b.text);
    case "quote":
      return countWords(b.text) + countWords(b.attribution);
    case "timeline":
      return (b.events ?? []).reduce((n, e) => n + countWords(e.title) + countWords(e.detail), 0);
    case "image":
      return 0;
  }
}

export function sectionWords(s: Section): number {
  return countWords(s.title) + (s.blocks ?? []).reduce((n, b) => n + blockWords(b), 0);
}

export function courseWords(c: Pick<StudioCourseContent, "sections">): number {
  return (c.sections ?? []).reduce((n, s) => n + sectionWords(s), 0);
}

/** Every inline-marked text in the course with its path. */
function markedTexts(c: StudioCourseContent): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [{ path: "description", text: c.description ?? "" }];
  (c.sections ?? []).forEach((s, si) =>
    (s.blocks ?? []).forEach((b, bi) => {
      if (b.type === "paragraph" || b.type === "funFact" || b.type === "takeaway" || b.type === "quote")
        out.push({ path: `sections[${si}].blocks[${bi}].text`, text: b.text ?? "" });
    }),
  );
  return out;
}

/** Every author-written string in the course, for the em-dash rule. */
export function allTexts(c: StudioCourseContent): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const push = (path: string, text: string | null | undefined) => {
    if (text) out.push({ path, text });
  };
  push("title", c.title);
  push("subtitle", c.subtitle);
  push("subcategory", c.subcategory);
  push("description", c.description);
  push("hero.hook", c.hero?.hook);
  (c.sections ?? []).forEach((s, si) => {
    push(`sections[${si}].title`, s.title);
    (s.blocks ?? []).forEach((b, bi) => {
      const p = `sections[${si}].blocks[${bi}]`;
      if ("text" in b) push(`${p}.text`, b.text);
      if (b.type === "quote") push(`${p}.attribution`, b.attribution);
      if (b.type === "image") push(`${p}.caption`, b.caption);
      if (b.type === "timeline")
        (b.events ?? []).forEach((e, ei) => {
          push(`${p}.events[${ei}].date`, e.date);
          push(`${p}.events[${ei}].title`, e.title);
          push(`${p}.events[${ei}].detail`, e.detail);
        });
    });
  });
  (c.sources ?? []).forEach((s, i) => push(`sources[${i}].text`, s.text));
  (c.glossary ?? []).forEach((g, i) => {
    push(`glossary[${i}].term`, g.term);
    push(`glossary[${i}].explanation`, g.explanation);
  });
  return out;
}

/** Glossary terms used in the text but without an entry (deduplicated, first spelling kept). */
export function missingGlossaryTerms(c: StudioCourseContent): string[] {
  const have = new Set((c.glossary ?? []).map((g) => termKey(g.term ?? "")));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { text } of markedTexts(c))
    for (const t of glossaryRefs(text)) {
      const k = termKey(t);
      if (!have.has(k) && !seen.has(k)) {
        seen.add(k);
        out.push(t);
      }
    }
  return out;
}

export function usedGlossaryKeys(c: StudioCourseContent): Set<string> {
  const s = new Set<string>();
  for (const { text } of markedTexts(c)) for (const t of glossaryRefs(text)) s.add(termKey(t));
  return s;
}

/* ------------------------------------------------------------------ rules */

export function validateCourse(c: StudioCourseContent): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, rule: string, path: string, en: string, fr: string) =>
    issues.push({ severity, rule, path, en, fr });
  const err = (rule: string, path: string, en: string, fr: string) => add("error", rule, path, en, fr);

  // Metadata
  const tl = len(c.title?.trim());
  if (tl < LIMITS.title[0] || tl > LIMITS.title[1])
    err("title.length", "title", "The title needs 3 to 160 characters.", "Le titre doit faire entre 3 et 160 caractères.");
  if (len(c.subtitle) > LIMITS.subtitle)
    err("subtitle.length", "subtitle", "The subtitle is limited to 80 characters.", "Le sous-titre est limité à 80 caractères.");
  if (!c.subject || !(SUBJECTS as readonly string[]).includes(c.subject))
    err("subject", "subject", "Choose a subject.", "Choisissez une matière.");
  if (!c.subcategory?.trim())
    err("subcategory.required", "subcategory", "Add a subcategory.", "Ajoutez une sous-catégorie.");
  else if (len(c.subcategory) > LIMITS.subcategory)
    err("subcategory.length", "subcategory", "The subcategory is limited to 80 characters.", "La sous-catégorie est limitée à 80 caractères.");
  const dl = len(c.description?.trim());
  if (dl < LIMITS.description[0] || dl > LIMITS.description[1])
    err("description.length", "description", "The description needs 20 to 600 characters.", "La description doit faire entre 20 et 600 caractères.");
  if (len(c.hero?.hook) > LIMITS.hook)
    err("hook.length", "hero.hook", "The hook is limited to 200 characters.", "L'accroche est limitée à 200 caractères.");
  if (c.hero?.image_url && !isHttps(c.hero.image_url))
    err("image.https", "hero.image_url", "The cover image must be an https link.", "L'image de couverture doit être un lien https.");
  if (c.hero?.ratio && c.hero.ratio !== "16:9")
    err("hero.ratio", "hero.ratio", "The cover ratio must be 16:9.", "Le format de la couverture doit être 16:9.");

  // Sections
  const sections = c.sections ?? [];
  if (sections.length < LIMITS.sections[0] || sections.length > LIMITS.sections[1])
    err("sections.count", "sections", `A course has 2 to 12 sections (now ${sections.length}).`, `Un cours compte 2 à 12 sections (actuellement ${sections.length}).`);

  let takeaways = 0;
  const takeawayPaths: { si: number; bi: number }[] = [];
  sections.forEach((s, si) => {
    const sp = `sections[${si}]`;
    const n = si + 1;
    if (!s.title?.trim()) err("section.title.required", `${sp}.title`, `Section ${n} needs a title.`, `La section ${n} n'a pas de titre.`);
    else if (len(s.title) > LIMITS.sectionTitle)
      err("section.title.length", `${sp}.title`, `Section ${n}: the title is limited to 120 characters.`, `Section ${n} : le titre est limité à 120 caractères.`);
    if (!s.blocks?.length) err("section.blocks", sp, `Section ${n} has no block yet.`, `La section ${n} n'a encore aucun bloc.`);
    let images = 0;
    (s.blocks ?? []).forEach((b, bi) => {
      const bp = `${sp}.blocks[${bi}]`;
      const where = { en: `Section ${n}, block ${bi + 1}`, fr: `Section ${n}, bloc ${bi + 1}` };
      if (!(BLOCK_TYPES as readonly string[]).includes(b.type)) {
        err("block.type", bp, `${where.en}: unknown block type.`, `${where.fr} : type de bloc inconnu.`);
        return;
      }
      if ("text" in b) {
        if (!b.text?.trim()) err("block.text.required", `${bp}.text`, `${where.en} is empty.`, `${where.fr} est vide.`);
        else if (len(b.text) > LIMITS.blockText)
          err("block.text.length", `${bp}.text`, `${where.en}: text is limited to 5,000 characters.`, `${where.fr} : le texte est limité à 5 000 caractères.`);
      }
      if (b.type === "takeaway") {
        takeaways++;
        takeawayPaths.push({ si, bi });
      }
      if (b.type === "image") {
        images++;
        if (!isHttps(b.image_url))
          err("image.https", `${bp}.image_url`, `${where.en}: choose an image (https link).`, `${where.fr} : choisissez une image (lien https).`);
        if (b.caption && len(b.caption) > LIMITS.blockText)
          err("block.text.length", `${bp}.caption`, `${where.en}: caption too long.`, `${where.fr} : légende trop longue.`);
      }
      if (b.type === "timeline") {
        const ev = b.events ?? [];
        if (ev.length < 2)
          err("timeline.events", bp, `${where.en}: a timeline needs at least 2 events.`, `${where.fr} : une frise demande au moins 2 événements.`);
        ev.forEach((e, ei) => {
          if (!e.date?.trim() || !e.title?.trim())
            err("timeline.event", `${bp}.events[${ei}]`, `${where.en}: event ${ei + 1} needs a date and a title.`, `${where.fr} : l'événement ${ei + 1} demande une date et un titre.`);
          if (len(e.detail) > LIMITS.blockText)
            err("block.text.length", `${bp}.events[${ei}].detail`, `${where.en}: event detail too long.`, `${where.fr} : détail trop long.`);
        });
      }
    });
    if (images > 1)
      add("info", "hint.images.perSection", sp, `Section ${n} has ${images} images; one per section reads best.`, `La section ${n} contient ${images} images ; une par section se lit mieux.`);
  });

  // Exactly one takeaway, in the last section.
  if (takeaways === 0)
    err("takeaway.count", sections.length ? `sections[${sections.length - 1}]` : "sections", "Add one Key takeaway block in the last section.", "Ajoutez un bloc « À retenir » dans la dernière section.");
  else if (takeaways > 1)
    err("takeaway.count", `sections[${takeawayPaths[1]!.si}].blocks[${takeawayPaths[1]!.bi}]`, `Keep a single Key takeaway (now ${takeaways}).`, `Gardez un seul « À retenir » (actuellement ${takeaways}).`);
  else if (takeawayPaths[0]!.si !== sections.length - 1)
    err("takeaway.position", `sections[${takeawayPaths[0]!.si}].blocks[${takeawayPaths[0]!.bi}]`, "Move the Key takeaway to the last section.", "Déplacez « À retenir » dans la dernière section.");

  // Inline markers
  for (const { path, text } of markedTexts(c)) {
    if (!boldBalanced(text)) err("bold.balanced", path, "A ** bold marker is not closed.", "Un marqueur de gras ** n'est pas fermé.");
    if (!bracketsBalanced(text)) err("brackets.balanced", path, "A [[ glossary ]] marker is not closed.", "Un marqueur de glossaire [[ ]] n'est pas fermé.");
  }

  // Em dash anywhere
  for (const { path, text } of allTexts(c))
    if (text.includes(EM_DASH)) err("emdash", path, "Replace the em dash (—) with a comma or a full stop.", "Remplacez le tiret long (—) par une virgule ou un point.");

  // Glossary
  for (const term of missingGlossaryTerms(c)) {
    const at = markedTexts(c).find((t) => glossaryRefs(t.text).some((r) => termKey(r) === termKey(term)));
    issues.push({ severity: "error", rule: "glossary.missing", path: at?.path ?? "glossary", data: term, en: `“${term}” is marked [[ ]] but has no glossary entry.`, fr: `« ${term} » est marqué [[ ]] mais n'a pas d'entrée dans le glossaire.` });
  }
  const used = usedGlossaryKeys(c);
  const seenTerms = new Set<string>();
  (c.glossary ?? []).forEach((g, i) => {
    const gp = `glossary[${i}]`;
    const k = termKey(g.term ?? "");
    if (!k) err("glossary.term", `${gp}.term`, `Glossary entry ${i + 1} needs a term.`, `L'entrée ${i + 1} du glossaire n'a pas de terme.`);
    else if (seenTerms.has(k)) err("glossary.duplicate", `${gp}.term`, `“${g.term}” appears twice in the glossary.`, `« ${g.term} » apparaît deux fois dans le glossaire.`);
    seenTerms.add(k);
    if (!(GLOSSARY_CLASSES as readonly string[]).includes(g.classification))
      err("glossary.classification", `${gp}.classification`, `Choose a type for “${g.term || i + 1}”.`, `Choisissez un type pour « ${g.term || i + 1} ».`);
    const el = len(g.explanation?.trim());
    if (el < LIMITS.glossaryExplanation[0] || el > LIMITS.glossaryExplanation[1])
      err("glossary.explanation", `${gp}.explanation`, `“${g.term || i + 1}”: the explanation needs 10 to 600 characters.`, `« ${g.term || i + 1} » : l'explication doit faire entre 10 et 600 caractères.`);
    if (k && !used.has(k))
      add("info", "hint.glossary.unused", `${gp}.term`, `“${g.term}” is in the glossary but not marked in the text.`, `« ${g.term} » est dans le glossaire mais n'est pas marqué dans le texte.`);
  });

  // Sources
  (c.sources ?? []).forEach((s, i) => {
    const l = len(s.text?.trim());
    if (l < LIMITS.sourceText[0] || l > LIMITS.sourceText[1])
      err("source.text", `sources[${i}].text`, `Source ${i + 1} needs 3 to 400 characters.`, `La source ${i + 1} doit faire entre 3 et 400 caractères.`);
    if (s.url && !isHttps(s.url))
      err("source.url", `sources[${i}].url`, `Source ${i + 1}: the link must start with https://.`, `Source ${i + 1} : le lien doit commencer par https://.`);
  });

  // Quiz (optional)
  if (c.quiz) issues.push(...validateQuiz(c.quiz));

  // Hints that never block
  const words = courseWords(c);
  if (words < LIMITS.words[0] || words > LIMITS.words[1])
    add("warn", "hint.words", "sections", `The course has ${words} words; app courses usually run 500 to 900.`, `Le cours compte ${words} mots ; les cours de l'app font en général 500 à 900 mots.`);
  if (!(c.sources ?? []).length)
    add("warn", "hint.sources", "sources", "Add at least one source.", "Ajoutez au moins une source.");
  if (c.title?.trim() && !c.title.trim().endsWith("?"))
    add("info", "hint.title.question", "title", "Titles phrased as a question tend to draw more readers.", "Un titre sous forme de question attire souvent plus de lecteurs.");
  if (!sections.some((s) => (s.blocks ?? []).some((b) => b.type === "image")))
    add("info", "hint.images.none", "sections", "Add at least one image inside the course.", "Ajoutez au moins une image dans le cours.");
  const g = (c.glossary ?? []).length;
  if (g < LIMITS.glossaryTerms[0] || g > LIMITS.glossaryTerms[1])
    add("info", "hint.glossary.count", "glossary", `3 to 8 glossary terms work best (now ${g}).`, `3 à 8 termes de glossaire fonctionnent le mieux (actuellement ${g}).`);

  return issues;
}

export function validateQuiz(quiz: QuizQuestion[]): Issue[] {
  const out: Issue[] = [];
  const err = (rule: string, path: string, en: string, fr: string) => out.push({ severity: "error", rule, path, en, fr });
  if (quiz.length < LIMITS.quiz[0] || quiz.length > LIMITS.quiz[1])
    err("quiz.count", "quiz", `A quiz has 6 to 10 questions (now ${quiz.length}).`, `Un quiz compte 6 à 10 questions (actuellement ${quiz.length}).`);
  quiz.forEach((q, i) => {
    const p = `quiz[${i}]`;
    const n = i + 1;
    if (!q.question?.trim() || !q.explanation?.trim())
      err("quiz.text", p, `Question ${n} needs a question and an explanation.`, `La question ${n} demande un énoncé et une explication.`);
    const opts = q.options ?? [];
    switch (q.type) {
      case "mcq":
        if (opts.length < 3 || opts.length > 5 || opts.some((o) => !o?.trim()))
          err("quiz.mcq.options", `${p}.options`, `Question ${n}: give 3 to 5 options.`, `Question ${n} : donnez 3 à 5 options.`);
        if (q.correctIndex !== 0)
          err("quiz.mcq.correct", `${p}.correctIndex`, `Question ${n}: the correct option goes first.`, `Question ${n} : la bonne réponse se place en premier.`);
        break;
      case "trueFalse":
        if (opts.length !== 2 || opts.some((o) => !o?.trim()))
          err("quiz.tf.options", `${p}.options`, `Question ${n}: give the words for True and False.`, `Question ${n} : indiquez les mots Vrai et Faux.`);
        if (q.correctIndex !== 0 && q.correctIndex !== 1)
          err("quiz.tf.correct", `${p}.correctIndex`, `Question ${n}: pick True or False as the answer.`, `Question ${n} : choisissez Vrai ou Faux comme réponse.`);
        break;
      case "chronological": {
        const items = q.items ?? [];
        if (items.length < 3 || items.length > 6 || items.some((o) => !o?.trim()))
          err("quiz.chrono.items", `${p}.items`, `Question ${n}: give 3 to 6 items in the correct order.`, `Question ${n} : donnez 3 à 6 éléments dans le bon ordre.`);
        if (items.some((o) => /\b\d{3,4}\b/.test(o ?? "")))
          err("quiz.chrono.dates", `${p}.items`, `Question ${n}: remove dates from the item labels.`, `Question ${n} : retirez les dates des éléments.`);
        break;
      }
      case "numericSlider":
      case "percentageSlider": {
        const pct = q.type === "percentageSlider";
        const nums = [q.correctValue, q.sliderMin, q.sliderMax, q.tolerance];
        if (nums.some((v) => typeof v !== "number" || !Number.isFinite(v)))
          err("quiz.slider.values", p, `Question ${n}: fill in the value, minimum, maximum and tolerance.`, `Question ${n} : renseignez valeur, minimum, maximum et tolérance.`);
        else if (!(q.sliderMin! < q.sliderMax! && q.correctValue! >= q.sliderMin! && q.correctValue! <= q.sliderMax! && q.tolerance! >= 0))
          err("quiz.slider.range", p, `Question ${n}: the value must sit between the minimum and the maximum.`, `Question ${n} : la valeur doit être comprise entre le minimum et le maximum.`);
        if (pct && (q.sliderMin !== 0 || q.sliderMax !== 100 || q.unit !== "%"))
          err("quiz.pct.range", p, `Question ${n}: a percentage runs from 0 to 100 with the unit %.`, `Question ${n} : un pourcentage va de 0 à 100 avec l'unité %.`);
        if (!pct && !q.unit?.trim())
          err("quiz.slider.unit", `${p}.unit`, `Question ${n}: add a unit.`, `Question ${n} : ajoutez une unité.`);
        break;
      }
      default:
        err("quiz.type", `${p}.type`, `Question ${n}: unknown question type.`, `Question ${n} : type de question inconnu.`);
    }
  });
  return out;
}

export const blockingIssues = (issues: Issue[]) => issues.filter((i) => i.severity === "error");

/* ----------------------------------------------------------- normalising */

function stripKey<T extends { _key?: string }>(o: T): Omit<T, "_key"> {
  const { _key, ...rest } = o;
  void _key;
  return rest;
}

const clean = (s: string | null | undefined) => (s ?? "").trim();

/**
 * The `course` object for the bridge: editor keys stripped, first section free,
 * empty optional fields dropped, section ids only when `withIds` (re-publish).
 */
export function toBridgeCourse(c: StudioCourseContent, opts: { appCourseId?: string | null; withIds?: boolean } = {}) {
  const hero: Hero = { ratio: "16:9" };
  if (c.hero?.image_url) hero.image_url = c.hero.image_url;
  if (clean(c.hero?.hook)) hero.hook = clean(c.hero?.hook);
  if (c.hero?.credit) hero.credit = c.hero.credit;
  return {
    ...(opts.appCourseId ? { id: opts.appCourseId } : {}),
    title: clean(c.title),
    ...(clean(c.subtitle) ? { subtitle: clean(c.subtitle) } : {}),
    subject: c.subject,
    subcategory: clean(c.subcategory),
    description: clean(c.description),
    hero,
    sections: (c.sections ?? []).map((s, i) => ({
      ...(opts.withIds && s.id ? { id: s.id } : {}),
      title: clean(s.title),
      free: i === 0,
      blocks: (s.blocks ?? []).map((b) => {
        const x = stripKey(b) as Record<string, unknown>;
        for (const k of Object.keys(x)) if (x[k] === "" || x[k] === undefined) delete x[k];
        return x;
      }),
    })),
    sources: (c.sources ?? []).map((s) => (clean(s.url) ? { text: clean(s.text), url: clean(s.url) } : { text: clean(s.text) })),
    glossary: (c.glossary ?? []).map((g) => ({ term: clean(g.term), classification: g.classification, explanation: clean(g.explanation) })),
  };
}

/** A new empty block of the given type. */
export function newBlock(type: BlockType, key: string): Block {
  switch (type) {
    case "image":
      return { _key: key, type, image_url: "", caption: "" };
    case "timeline":
      return { _key: key, type, events: [{ date: "", title: "" }, { date: "", title: "" }] };
    case "quote":
      return { _key: key, type, text: "", attribution: "" };
    default:
      return { _key: key, type, text: "" } as Block;
  }
}

/** Read a row's jsonb into typed content with stable editor keys. */
export function fromRow(row: {
  title: string; subtitle: string | null; subject: string | null; subcategory: string | null;
  description: string; hero: unknown; sections: unknown; sources: unknown; glossary: unknown; quiz: unknown;
}, makeKey: () => string): StudioCourseContent {
  const sections = (Array.isArray(row.sections) ? row.sections : []) as Section[];
  return {
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    subject: row.subject ?? "",
    subcategory: row.subcategory ?? "",
    description: row.description ?? "",
    hero: (row.hero && typeof row.hero === "object" ? row.hero : {}) as Hero,
    sections: sections.map((s) => ({ ...s, _key: s._key ?? makeKey(), blocks: (s.blocks ?? []).map((b) => ({ ...b, _key: b._key ?? makeKey() })) })),
    sources: (Array.isArray(row.sources) ? row.sources : []) as Source[],
    glossary: (Array.isArray(row.glossary) ? row.glossary : []) as GlossaryEntry[],
    quiz: (Array.isArray(row.quiz) ? row.quiz : null) as QuizQuestion[] | null,
  };
}

/** Split text into plain / bold / glossary spans for rendering. */
export type Span = { text: string; bold?: boolean; term?: boolean };
export function inlineSpans(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|\[\[([^[\]]+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      // bold may itself contain a glossary term
      for (const inner of inlineSpans(m[1])) out.push({ ...inner, bold: true });
    } else out.push({ text: m[2] ?? "", term: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
