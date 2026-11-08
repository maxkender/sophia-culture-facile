// @ts-nocheck -- fixture mutation by index; the rules module itself is fully typed.
import { describe, expect, it } from "vitest";
import {
  countWords, courseWords, fixEmDash, inlineSpans, missingGlossaryTerms, toBridgeCourse, validateCourse,
  type StudioCourseContent, type QuizQuestion,
} from "./course-format";

const para = (text: string) => ({ type: "paragraph" as const, text });

function base(): StudioCourseContent {
  return {
    title: "Pourquoi la Joconde sourit-elle ?",
    subtitle: "1503",
    subject: "art",
    subcategory: "Œuvres iconiques",
    description: "Le sourire le plus célèbre du monde cache une **technique** de peintre.",
    hero: { hook: "Un sourire qui change quand on le regarde.", ratio: "16:9" },
    sections: [
      { title: "Introduction", blocks: [para("Léonard utilise le [[sfumato]] pour adoucir les contours.")] },
      { title: "La technique", blocks: [para("Des couches très fines de glacis."), { type: "image", image_url: "https://upload.wikimedia.org/a.jpg" }] },
      { title: "Ce qu'il faut retenir", blocks: [{ type: "takeaway", text: "Le sourire naît du **flou** voulu." }] },
    ],
    sources: [{ text: "W. Thompson, The French Review, 2000.", url: "https://example.org" }],
    glossary: [{ term: "Sfumato", classification: "concept", explanation: "Technique de dégradés très doux." }],
    quiz: null,
  };
}
const errors = (c: StudioCourseContent) => validateCourse(c).filter((i) => i.severity === "error");
const rules = (c: StudioCourseContent) => errors(c).map((i) => i.rule);

describe("V2 course rules (§4)", () => {
  it("a valid course has no blocking issue", () => {
    expect(errors(base())).toEqual([]);
  });

  it("title is 3 to 160 characters", () => {
    expect(rules({ ...base(), title: "Ab" })).toContain("title.length");
    expect(rules({ ...base(), title: "x".repeat(161) })).toContain("title.length");
    expect(rules({ ...base(), title: "Abc" })).not.toContain("title.length");
  });

  it("subtitle is optional and at most 80 characters", () => {
    expect(rules({ ...base(), subtitle: "" })).not.toContain("subtitle.length");
    expect(rules({ ...base(), subtitle: "x".repeat(81) })).toContain("subtitle.length");
  });

  it("subject is one of the six values", () => {
    expect(rules({ ...base(), subject: "cuisine" })).toContain("subject");
    for (const s of ["histoire", "sciences", "litterature", "art", "mythologie", "comprendreLeMonde"])
      expect(rules({ ...base(), subject: s })).not.toContain("subject");
  });

  it("subcategory is at most 80 characters", () => {
    expect(rules({ ...base(), subcategory: "x".repeat(81) })).toContain("subcategory.length");
  });

  it("description is 20 to 600 characters", () => {
    expect(rules({ ...base(), description: "Trop court." })).toContain("description.length");
    expect(rules({ ...base(), description: "x".repeat(601) })).toContain("description.length");
  });

  it("hook is at most 200 characters", () => {
    expect(rules({ ...base(), hero: { hook: "x".repeat(201) } })).toContain("hook.length");
  });

  it("2 to 12 sections", () => {
    const c = base();
    expect(rules({ ...c, sections: [c.sections[2]] })).toContain("sections.count");
    const many = Array.from({ length: 12 }, (_, i) => ({ title: `S${i}`, blocks: [para("Texte.")] }));
    many[11] = c.sections[2];
    expect(rules({ ...c, sections: many })).not.toContain("sections.count");
    expect(rules({ ...c, sections: [...many, c.sections[0]] })).toContain("sections.count");
  });

  it("each section has a title of at most 120 characters and at least one block", () => {
    const c = base();
    c.sections[1] = { title: "", blocks: [] };
    expect(rules(c)).toEqual(expect.arrayContaining(["section.title.required", "section.blocks"]));
    c.sections[1] = { title: "x".repeat(121), blocks: [para("ok")] };
    expect(rules(c)).toContain("section.title.length");
  });

  it("block texts are at most 5000 characters", () => {
    const c = base();
    c.sections[1].blocks[0] = para("a".repeat(5001));
    expect(rules(c)).toContain("block.text.length");
  });

  it("exactly one takeaway, in the last section", () => {
    const none = base();
    none.sections[2].blocks = [para("Fin.")];
    expect(rules(none)).toContain("takeaway.count");
    const two = base();
    two.sections[2].blocks.push({ type: "takeaway", text: "Encore." });
    expect(rules(two)).toContain("takeaway.count");
    const early = base();
    early.sections[0].blocks.push({ type: "takeaway", text: "Trop tôt." });
    early.sections[2].blocks = [para("Fin.")];
    expect(rules(early)).toContain("takeaway.position");
  });

  it("no em dash anywhere", () => {
    const c = base();
    c.sections[1].blocks[0] = para("Un mot — un autre.");
    expect(errors(c).find((i) => i.rule === "emdash")?.path).toBe("sections[1].blocks[0].text");
    expect(rules({ ...base(), title: "Léonard — peintre ?" })).toContain("emdash");
    expect(rules({ ...base(), glossary: [{ ...base().glossary[0], explanation: "Une technique — douce et fine." }] })).toContain("emdash");
    expect(fixEmDash("Un mot — un autre.")).toBe("Un mot, un autre.");
  });

  it("** must be balanced", () => {
    const c = base();
    c.sections[1].blocks[0] = para("Un **gras pas fermé.");
    expect(rules(c)).toContain("bold.balanced");
  });

  it("[[ ]] must be balanced", () => {
    const c = base();
    c.sections[1].blocks[0] = para("Un [[terme pas fermé.");
    expect(rules(c)).toContain("brackets.balanced");
    c.sections[1].blocks[0] = para("Un terme]] mal ouvert.");
    expect(rules(c)).toContain("brackets.balanced");
  });

  it("every [[term]] has a glossary entry, case- and accent-insensitive", () => {
    const c = base();
    c.sections[1].blocks[0] = para("Le [[Glacis]] et le [[SFUMATO]].");
    expect(missingGlossaryTerms(c)).toEqual(["Glacis"]);
    expect(rules(c)).toContain("glossary.missing");
    c.glossary.push({ term: "glacís", classification: "concept", explanation: "Couche transparente de peinture." });
    expect(rules(c)).not.toContain("glossary.missing");
  });

  it("glossary classification is one of the five values", () => {
    const c = base();
    c.glossary[0].classification = "technique";
    expect(rules(c)).toContain("glossary.classification");
    for (const k of ["referenceHistorique", "concept", "evenementConnexe", "personnage", "lieuInstitution"]) {
      c.glossary[0].classification = k;
      expect(rules(c)).not.toContain("glossary.classification");
    }
  });

  it("glossary explanation is 10 to 600 characters", () => {
    const c = base();
    c.glossary[0].explanation = "Court.";
    expect(rules(c)).toContain("glossary.explanation");
  });

  it("image_url must be https", () => {
    const c = base();
    c.sections[1].blocks[1] = { type: "image", image_url: "http://example.org/a.jpg" };
    expect(rules(c)).toContain("image.https");
    expect(rules({ ...base(), hero: { image_url: "http://x.org/a.jpg" } })).toContain("image.https");
  });

  it("timeline needs at least 2 events", () => {
    const c = base();
    c.sections[1].blocks.push({ type: "timeline", events: [{ date: "1503", title: "Début" }] });
    expect(rules(c)).toContain("timeline.events");
  });

  it("sources text is 3 to 400 characters", () => {
    expect(rules({ ...base(), sources: [{ text: "ab" }] })).toContain("source.text");
    expect(rules({ ...base(), sources: [{ text: "x".repeat(401) }] })).toContain("source.text");
  });

  it("the 500 to 900 word target is a warning, never blocking", () => {
    const w = validateCourse(base()).find((i) => i.rule === "hint.words");
    expect(w?.severity).toBe("warn");
    const long = base();
    long.sections[1].blocks[0] = para(Array.from({ length: 600 }, () => "mot").join(" "));
    expect(validateCourse(long).some((i) => i.rule === "hint.words")).toBe(false);
  });

  it("mock-up hints are info only", () => {
    const c = base();
    c.title = "La Joconde";
    c.sections[1].blocks = [para("Texte.")];
    const hints = validateCourse(c).filter((i) => i.rule.startsWith("hint.") && i.rule !== "hint.words" && i.rule !== "hint.sources");
    expect(hints.map((h) => h.rule)).toEqual(expect.arrayContaining(["hint.title.question", "hint.images.none", "hint.glossary.count"]));
    expect(hints.every((h) => h.severity === "info")).toBe(true);
  });
});

describe("optional quiz", () => {
  const mcq = (o: Partial<QuizQuestion> = {}): QuizQuestion => ({ type: "mcq", question: "Q ?", explanation: "Parce que.", options: ["a", "b", "c"], correctIndex: 0, ...o });
  it("6 to 10 questions", () => {
    expect(rules({ ...base(), quiz: [mcq()] })).toContain("quiz.count");
    expect(rules({ ...base(), quiz: Array.from({ length: 6 }, () => mcq()) })).not.toContain("quiz.count");
  });
  it("mcq: 3 to 5 options, correct first", () => {
    const r = rules({ ...base(), quiz: [mcq({ options: ["a", "b"] }), mcq({ correctIndex: 1 })] });
    expect(r).toEqual(expect.arrayContaining(["quiz.mcq.options", "quiz.mcq.correct"]));
  });
  it("trueFalse: two words, index 0 or 1", () => {
    const r = rules({ ...base(), quiz: [{ type: "trueFalse", question: "Q", explanation: "E", options: ["Vrai"], correctIndex: 2 }] });
    expect(r).toEqual(expect.arrayContaining(["quiz.tf.options", "quiz.tf.correct"]));
  });
  it("chronological: 3 to 6 items, no dates", () => {
    const r = rules({ ...base(), quiz: [{ type: "chronological", question: "Q", explanation: "E", items: ["Prise de la Bastille 1789", "b"] }] });
    expect(r).toEqual(expect.arrayContaining(["quiz.chrono.items", "quiz.chrono.dates"]));
  });
  it("sliders: values in range; percentage is 0 to 100 with %", () => {
    const r = rules({ ...base(), quiz: [
      { type: "numericSlider", question: "Q", explanation: "E", correctValue: 50, sliderMin: 60, sliderMax: 10, tolerance: 1, unit: "m" },
      { type: "percentageSlider", question: "Q", explanation: "E", correctValue: 50, sliderMin: 0, sliderMax: 90, tolerance: 5, unit: "%" },
    ] });
    expect(r).toEqual(expect.arrayContaining(["quiz.slider.range", "quiz.pct.range"]));
  });
});

describe("helpers", () => {
  it("word counts ignore markers", () => {
    expect(countWords("Le **sfumato** de [[Léonard]] — vraiment.")).toBe(5);
    expect(courseWords(base())).toBeGreaterThan(10);
  });
  it("inline spans split bold and glossary terms", () => {
    expect(inlineSpans("a **b** [[c]]")).toEqual([{ text: "a " }, { text: "b", bold: true }, { text: " " }, { text: "c", term: true }]);
  });
  it("bridge course: keys stripped, first section free, no ids for a new course", () => {
    const c = base();
    c.sections = c.sections.map((s, i) => ({ ...s, _key: `k${i}`, id: `sec${i}`, free: i === 2 }));
    const out = toBridgeCourse(c);
    expect(out.sections.map((s) => s.free)).toEqual([true, false, false]);
    expect(JSON.stringify(out)).not.toContain("_key");
    expect("id" in out.sections[0]).toBe(false);
    expect(toBridgeCourse(c, { withIds: true, appCourseId: "course_1_x" }).sections[0]).toHaveProperty("id", "sec0");
  });
});
