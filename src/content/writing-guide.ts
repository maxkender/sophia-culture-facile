import { GUIDE_VERSION } from "@/config/portal";

export const GUIDE_TITLE = "Sophia writing guide";
export const GUIDE_SUBTITLE = `How to write a five-screen course — version ${GUIDE_VERSION}`;

export const GUIDE_ALERT = {
  heading: "DO THIS FIRST",
  lead: "Open the Sophia app and read three or four courses in your own subject area before you write a single word.",
  body: "Your access code is on your home page. Ten minutes in the app will teach you more about the format than this whole guide, and it is the single best thing you can do to avoid a round of corrections. Nothing else here makes proper sense until you have seen a real course on a real phone.",
};

export type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { header: [string, string]; rows: [string, string][] };
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: "Before you start",
    paragraphs: [
      "Each course is published under the author's name, with their title and qualifications, and where the format allows a short biography and a photograph. That is the point of commissioning a person rather than generating the text.",
      "An author who would prefer not to be identified should say so immediately, because it changes the arrangement entirely.",
      "Authors keep the right to teach, publish and speak on the same topics. Nothing is exclusive to their ideas, only to the specific text.",
    ],
  },
  {
    title: "Who reads this",
    paragraphs: [
      "The reader is 18 to 25, knows nothing about the subject, and is intelligent. All three matter equally.",
      "They read on a phone, five to ten minutes at a time. They are not revising for an exam and they will not take notes. What they keep is one idea.",
      "The whole job is to write so that someone with no background understands every sentence on first reading. No technical term without a short explanation right beside it, no assumed knowledge, no sentence that needs re-reading.",
      "The test: read it aloud. If you run out of breath the sentence is too long. If you hesitate on a word the reader stops there.",
    ],
  },
  {
    title: "The five screens",
    paragraphs: [
      "There are exactly five. The reader taps Continue between them and does not go back.",
      "Screen 1 opens, with a short line under the title setting up the question, then two paragraphs: one or two concrete figures to frame the scale, then where the answer will come from.",
      "Screens 2 to 4 explain, one idea per screen, each answering something the screen before raised.",
      "Screen 5 closes by drawing the consequence or widening the frame. It does not summarise.",
      "Each screen carries its own title. The course title is a question, the screen titles are statements, short ones.",
      "Length: 100 to 140 words per screen, 500 to 700 for the whole course.",
      "Bold two or three expressions per screen, the terms and numbers that carry the explanation, nothing else.",
      "Authors do not source images. Where a screen would benefit, write one line saying what it should show.",
    ],
  },
  {
    title: "How to write",
    bullets: [
      "Short sentences, one idea each. Cut when in doubt.",
      "Present tense for historical events.",
      "Address the reader as \"you\" or avoid the pronoun. Never a formal register.",
      "Explain every technical word where it first appears, in half a sentence, not a heavy parenthesis.",
      "Two figures per screen at most.",
      "Orders of magnitude beat decimals: \"about a quarter\", not \"24.7%\".",
      "A concrete comparison beats an abstract quantity.",
      "Where the science or history is genuinely unsettled, say so and say who disagrees. That is different from hedging.",
      "Where most people believe something wrong, address it head-on, but do not force it: most courses simply explain.",
    ],
  },
  {
    title: "What gets sent back",
    table: {
      header: ["What we send back", "Why"],
      rows: [
        ["Announcing the plan (\"we will see that\", \"first of all\")", "The reader needs the path, not the map."],
        ["Summarising (\"in conclusion\", \"to sum up\")", "Screen 5 opens out, it does not close down."],
        [
          "Hedging (\"it would seem that\", \"some authors have suggested\")",
          "If it is established say it, if it is contested say who contests it.",
        ],
        ["Piling up", "Three dates and four proper nouns on one screen and the reader stops."],
        ["Flat chronology (\"then\", \"next\", \"finally\")", "A course that only advances in date order is a summary."],
      ],
    },
  },
  {
    title: "Where you write",
    paragraphs: [
      "Everything happens in this author space. There is no document to send back.",
      "Courses are already waiting. The author writes directly in the page and the work saves itself every few seconds.",
      "Each course page has the title and subtitle already filled in and editable, a note from us above the editor saying what the course should cover, five numbered blocks each with a screen title, body text and an optional image suggestion, a live word count per screen and for the course, a sources section, and a Submit button that unlocks once all five screens have a title and a body.",
      "Bold is written with double asterisks and checked with the preview toggle. That is the only formatting.",
      "We handle layout, illustration, integration and the audio version.",
    ],
  },
  {
    title: "Sources",
    paragraphs: [
      "Sources are optional and not published, but fill them in. It is the single thing that makes editing fast instead of slow, and it protects both sides if a claim is challenged after publication.",
      "One row per non-obvious claim: the claim, the book or article, the page.",
      "A counter-intuitive claim needs a firmer source than an ordinary one, because it is the one a reader will check.",
      "Where the field genuinely disagrees with itself, say so in the text and say who holds which position.",
    ],
  },
];

export const GUIDE_CLOSING =
  "These rules exist to get from you what nobody else can write. If one of them stops you saying something that matters, tell us rather than working around it. We will adjust.";

export function guidePlainText(): string {
  const lines = [GUIDE_TITLE, GUIDE_SUBTITLE, "", GUIDE_ALERT.heading, GUIDE_ALERT.lead, GUIDE_ALERT.body, ""];
  for (const section of GUIDE_SECTIONS) {
    lines.push(section.title, "");
    for (const paragraph of section.paragraphs ?? []) lines.push(paragraph, "");
    for (const bullet of section.bullets ?? []) lines.push(`- ${bullet}`);
    if (section.bullets) lines.push("");
    if (section.table) {
      for (const [left, right] of section.table.rows) lines.push(`- ${left} — ${right}`);
      lines.push("");
    }
  }
  lines.push(GUIDE_CLOSING, "");
  return lines.join("\n");
}
