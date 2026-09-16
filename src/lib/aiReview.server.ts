/**
 * The AI first pass over a submitted course.
 *
 * The prompt is deliberately self-contained: it carries the format rules, the reader,
 * the house voice and the banned habits, plus the verbatim text of the reference
 * courses. The existing course library is never sent — one course in, notes out.
 *
 * Environment variables (all read at call time, never on the client):
 *   AI_REVIEW_API_KEY            key for the model provider (falls back to LOVABLE_API_KEY)
 *   AI_REVIEW_MODEL              model name, defaults to google/gemini-3.1-flash-lite
 *   AI_REVIEW_BASE_URL           optional, defaults to the Lovable AI gateway
 *   AI_REVIEW_EXAMPLE_COURSE_IDS comma-separated ids of the reference courses
 */
import type { AiReviewResult } from "./aiReview";

export type ReferenceCourse = {
  title: string;
  subtitle: string | null;
  screens: { screen_number: number; screen_title: string | null; body: string | null }[];
};

export type CourseUnderReview = {
  title: string;
  subtitle: string | null;
  brief: string | null;
  screens: { screen_number: number; screen_title: string | null; body: string | null }[];
  sources: { claim: string | null; reference: string | null; page: string | null }[];
};

const WORDS_MIN = 100;
const WORDS_MAX = 140;
const COURSE_MIN = 500;
const COURSE_MAX = 700;

const RULES = `You are the first reader of a course submitted to Sophia, a general-knowledge app.
You write editorial guidance for a human editor. You do not decide anything. You never produce a verdict,
a score, or an approval, and nothing you write reaches the author on its own.

FORMAT RULES
- A course is exactly five screens.
- 500 to 700 words in total, 100 to 140 words per screen.
- The course title is a question.
- Each screen title is a statement, never a question, never a label.
- Screen 1 opens on a tension: something that does not add up, and that the reader wants resolved.
- Screens 2, 3 and 4 each carry one idea, and each answers something the previous screen raised.
- Screen 5 draws the consequence. It does not summarise what came before.

THE READER
- 18 to 25 years old, no background in the subject, reading on a phone, in a few spare minutes.
- They will keep exactly one idea from the course. Everything serves that one idea.

THE HOUSE VOICE
- Short sentences.
- Present tense for historical events.
- Second person, or no pronoun at all.
- Every technical term explained in half a sentence, the first time it appears, in the same sentence.
- Two figures per screen at most.
- Orders of magnitude rather than decimals.

BANNED HABITS (verbatim from the writing guide)
- Announcing the plan ("in this course we will see...").
- Summarising ("to sum up...", "as we have seen...").
- Academic hedging ("it could be argued", "some historians consider", "arguably", "to some extent").
- Piling up dates and proper nouns.
- Flat chronology: one thing after another with no cause.

YOU ARE NOT A FACT-CHECKER. YOU ARE A FLAGGER.
This is the most important instruction here, and it is repeated on purpose.
In the claims section you list factual claims a reader would question, or that carry risk.
For each one you say why a human should check it, and whether the author's own source list appears to cover it.
You must NOT say a claim is false. You must NOT offer a correction. You must NOT state any fact of your own,
not even one you are sure of. You must NOT write "in fact", "actually", or "the correct figure is".
You point at what a human should check. You never check it. Again: you are not a fact-checker, you are a flagger.

REGISTER NOTES
Quote the author's actual words, exactly as written, so the editor can find them in the text. For each quote say
what breaks the house voice and offer a rewrite in the house voice.

Plain English, concrete, no praise, no padding. Never free prose outside the JSON structure asked for.`;

function renderScreens(screens: ReferenceCourse["screens"]): string {
  return [...screens]
    .sort((a, b) => a.screen_number - b.screen_number)
    .map(
      (screen) =>
        `Screen ${screen.screen_number} — ${screen.screen_title || "(no title)"}\n${screen.body || "(empty)"}`,
    )
    .join("\n\n");
}

export function buildSystemPrompt(examples: ReferenceCourse[]): string {
  if (examples.length === 0) {
    return `${RULES}\n\nNo reference course text is configured yet. Judge against the rules above alone.`;
  }
  const rendered = examples
    .map(
      (course, index) =>
        `REFERENCE COURSE ${index + 1}\nTitle: ${course.title}${
          course.subtitle ? `\nSubtitle: ${course.subtitle}` : ""
        }\n\n${renderScreens(course.screens)}`,
    )
    .join("\n\n---\n\n");
  return `${RULES}\n\nThese are the reference courses. They are the format. Judge the submission against them.\n\n${rendered}`;
}

export function buildUserPrompt(course: CourseUnderReview): string {
  const sources =
    course.sources.length === 0
      ? "The author listed no sources."
      : course.sources
          .map(
            (source, index) =>
              `${index + 1}. Claim: ${source.claim ?? "—"} | Source: ${source.reference ?? "—"}${
                source.page ? `, p. ${source.page}` : ""
              }`,
          )
          .join("\n");

  return `COURSE UNDER REVIEW

Title: ${course.title}
Subtitle: ${course.subtitle ?? "—"}

Brief given to the author:
${course.brief ?? "—"}

${renderScreens(course.screens)}

SOURCES LISTED BY THE AUTHOR
${sources}

WHAT TO RETURN — JSON only, matching the schema.

structure: one entry for each of these checks, in this order — "Title asks a question", "Screen titles are statements",
"Screen 1 opens on a tension", "Each screen answers the previous", "Screen 5 opens out rather than summarising".
verdict is "pass" or "flag"; note is one line.

register: every phrase that breaks the house voice or uses a banned habit, quoting the author verbatim.

accessibility: technical terms used without explanation, sentences that need re-reading, screens carrying more than
two figures.

claims: factual claims a reader would question or that carry risk. Say why a human should check each one, and whether
the author's source list appears to cover it. Do not say whether the claim is true or false. Do not correct it.
Do not state facts of your own. You are a flagger, not a fact-checker.

overall: three to five sentences of guidance for the editor, in plain English, naming the single most useful change.`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["structure", "register", "accessibility", "claims", "overall"],
  properties: {
    structure: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["check", "verdict", "note"],
        properties: {
          check: { type: "string" },
          verdict: { type: "string", enum: ["pass", "flag"] },
          note: { type: "string" },
        },
      },
    },
    register: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["screen", "quote", "issue", "rewrite"],
        properties: {
          screen: { type: "integer" },
          quote: { type: "string" },
          issue: { type: "string" },
          rewrite: { type: "string" },
        },
      },
    },
    accessibility: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["screen", "kind", "quote", "note"],
        properties: {
          screen: { type: "integer" },
          kind: { type: "string", enum: ["unexplained_term", "hard_sentence", "too_many_figures"] },
          quote: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["screen", "claim", "why", "source_coverage"],
        properties: {
          screen: { type: "integer" },
          claim: { type: "string" },
          why: { type: "string" },
          source_coverage: { type: "string", enum: ["appears covered", "not covered", "unclear"] },
        },
      },
    },
    overall: { type: "string" },
  },
} as const;

function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Counting is not a language task, so length is measured here rather than by the model. */
export function measureLength(screens: CourseUnderReview["screens"]): AiReviewResult["length"] {
  const perScreen = [1, 2, 3, 4, 5].map((number) => {
    const words = countWords(screens.find((item) => item.screen_number === number)?.body);
    const flag: AiReviewResult["length"]["screens"][number]["flag"] =
      words === 0 ? "empty" : words < WORDS_MIN ? "short" : words > WORDS_MAX ? "long" : "ok";
    return { screen: number, words, flag };
  });
  const words = perScreen.reduce((sum, item) => sum + item.words, 0);
  return {
    screens: perScreen,
    total: { words, flag: words < COURSE_MIN ? "short" : words > COURSE_MAX ? "long" : "ok" },
  };
}

export function reviewModel(): string {
  return process.env["AI_REVIEW_MODEL"] || "google/gemini-3.1-flash-lite";
}

export function reviewExampleIds(): string[] {
  return (process.env["AI_REVIEW_EXAMPLE_COURSE_IDS"] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Calls the model and returns the four judged sections. Length is added by the caller. */
export async function callReviewModel(
  system: string,
  user: string,
): Promise<Omit<AiReviewResult, "length">> {
  const apiKey = process.env["AI_REVIEW_API_KEY"] || process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI_REVIEW_API_KEY is not set.");
  const baseUrl = process.env["AI_REVIEW_BASE_URL"] || "https://ai.gateway.lovable.dev/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: reviewModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "course_review", strict: true, schema: RESPONSE_SCHEMA },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[ai-review] model error", response.status, detail.slice(0, 500));
    if (response.status === 429) throw new Error("The model is rate limited. Try again in a minute.");
    if (response.status === 402) throw new Error("The model account is out of credit.");
    throw new Error(`The model refused the request (${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = payload?.choices?.[0]?.message?.content ?? "";
  let parsed: Partial<AiReviewResult>;
  try {
    parsed = JSON.parse(raw) as Partial<AiReviewResult>;
  } catch {
    console.error("[ai-review] unparsable answer", raw.slice(0, 500));
    throw new Error("The model did not return usable notes. Try again.");
  }

  return {
    structure: parsed.structure ?? [],
    register: parsed.register ?? [],
    accessibility: parsed.accessibility ?? [],
    claims: parsed.claims ?? [],
    overall: parsed.overall ?? "",
  };
}
