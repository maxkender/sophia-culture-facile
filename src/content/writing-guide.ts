import { GUIDE_VERSION } from "@/config/portal";
import type { DocSection } from "./author-agreement";

export const GUIDE_TITLE = "Sophia writing guide";
export const GUIDE_SUBTITLE = `How to write a five-screen course — version ${GUIDE_VERSION}`;

export const GUIDE_SECTIONS: DocSection[] = [
  {
    title: "The shape of a course",
    paragraphs: [
      "A Sophia course is five screens. A reader goes through it in about five minutes, on a phone, usually standing up. Each screen is one idea, fully resolved, that can be read without the previous one open in front of them.",
      "Aim for 70 to 100 words per screen and around 500 words in total. Under 70 words a screen feels thin; over 120 it stops fitting comfortably on a phone.",
    ],
  },
  {
    title: "The five-screen arc",
    paragraphs: [
      "Screen 1 sets the situation and gives the reader a reason to care. Screens 2 to 4 carry the substance: the mechanism, the turning point, the consequence. Screen 5 closes with what changed, or what is still open.",
      "Avoid the encyclopaedia arc — birth, works, death. Prefer the arc of a single question answered.",
    ],
  },
  {
    title: "Voice",
    paragraphs: [
      "Write for an intelligent adult who is not a specialist. Short sentences. Concrete nouns. No jargon unless you define it in the same sentence.",
      "Do not address the reader as a student, do not use exclamation marks, and do not open a screen with a rhetorical question.",
      "Dates and figures are there to anchor, not to fill. One or two per screen is usually enough.",
    ],
  },
  {
    title: "Screen titles",
    paragraphs: [
      "Every screen needs a short title, three to six words, that says what the screen is about rather than teasing it. Titles are displayed above the text in the app.",
    ],
  },
  {
    title: "Formatting",
    paragraphs: [
      "The only formatting available is bold, written with double asterisks around the words, like **this**. Use it once or twice per course at most, for a term the reader should retain.",
      "No headings, no lists, no links, no italics inside the body text.",
    ],
  },
  {
    title: "Image ideas",
    paragraphs: [
      "Each screen has an optional one-line image idea. Describe what should be shown, not what it should feel like: 'metal type arranged in a composing stick' rather than 'the excitement of invention'.",
    ],
  },
  {
    title: "Sources",
    paragraphs: [
      "Sources are optional but strongly encouraged, especially for figures, dates and contested claims. For each one, give the claim in a few words, the reference, and the page if you have it.",
      "One reliable academic or institutional reference is worth more than five web pages.",
    ],
  },
  {
    title: "Before you submit",
    paragraphs: [
      "Read the five screens end to end, out loud if you can. Check that each screen has a title and a body, that no screen repeats another, and that the last screen lands somewhere.",
      "Once you submit, the course becomes read-only while the editorial desk reviews it. If we ask for changes, the course reopens with our comment at the top.",
    ],
  },
];

export function guidePlainText(): string {
  const lines = [GUIDE_TITLE, GUIDE_SUBTITLE, ""];
  for (const section of GUIDE_SECTIONS) {
    lines.push(section.title, "");
    for (const paragraph of section.paragraphs) lines.push(paragraph, "");
  }
  return lines.join("\n");
}
