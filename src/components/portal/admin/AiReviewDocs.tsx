import { PageTitle, PortalCard } from "../ui";

function Code({ children }: { children: string }) {
  return <code className="rounded bg-portal-bg px-1.5 py-0.5 font-mono text-xs text-brand-navy">{children}</code>;
}

const VARS: { name: string; value: string; note: string }[] = [
  {
    name: "AI_REVIEW_API_KEY",
    value: "to fill",
    note: "Key for the model provider. Falls back to LOVABLE_API_KEY when left empty. Server-side only — it is never sent to the browser.",
  },
  {
    name: "AI_REVIEW_MODEL",
    value: "google/gemini-3.1-flash-lite",
    note: "Default when unset. Change it here to swap model without touching the code.",
  },
  {
    name: "AI_REVIEW_BASE_URL",
    value: "https://ai.gateway.lovable.dev/v1",
    note: "Default when unset. Any OpenAI-compatible endpoint works.",
  },
  {
    name: "AI_REVIEW_EXAMPLE_COURSE_IDS",
    value: "to fill",
    note: "Ids of the reference courses, comma separated. Their screens are read from the database and pasted into the prompt verbatim. Leave empty and the reviewer judges against the written rules alone.",
  },
];

export function AiReviewDocs() {
  return (
    <div>
      <PageTitle
        title="AI reviewer"
        lead="A first pass over a submitted course. Guidance for the desk, never a verdict, never a gate."
      />

      <div className="space-y-6">
        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Where it runs</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy">
            It runs server-side, inside this application, as a protected server function rather than a separate
            Supabase edge function: this project no longer accepts new edge functions. The effect is the same — the
            model key lives in an environment variable, is read only on the server, and never reaches the browser.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-brand-navySoft">
            <li>
              Prompt and model call: <Code>src/lib/aiReview.server.ts</Code>
            </li>
            <li>
              Entry point, admin check and caching: <Code>src/lib/aiReview.functions.ts</Code>
            </li>
            <li>
              Stored reviews: the <Code>ai_reviews</Code> table
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy">
            It is inert until the variables below are filled: with no key, the button returns “AI_REVIEW_API_KEY is
            not set” and nothing is called or charged. Read the two files, fill the variables, and it goes live on the
            next publish.
          </p>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Environment variables</h2>
          <div className="mt-4 space-y-4">
            {VARS.map((item) => (
              <div key={item.name} className="border-b border-brand-line pb-4 last:border-0 last:pb-0">
                <p className="font-mono text-xs font-bold text-brand-navy">{item.name}</p>
                <p className="mt-1 text-xs text-brand-navySoft">
                  Current default: <Code>{item.value}</Code>
                </p>
                <p className="mt-1 text-sm text-brand-navy">{item.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-brand-navySoft">
            They are set in the project settings, under Secrets. Nothing needs to be redeployed by hand.
          </p>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Cost per review</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy">
            One call per review. Input: the rules and the two reference courses, about 2,500 tokens, plus the course
            under review, about 900. Output: roughly 600 tokens of notes. At the current price of the default model —
            around $0.10 per million input tokens and $0.40 per million output — that is about{" "}
            <strong>$0.0006 per review</strong>, well under a tenth of a cent. A hundred reviews cost about six cents.
            Re-opening a course costs nothing: the notes are cached against the exact text they were written for, and
            only “Run again” calls the model.
          </p>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">What it will and will not do</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand-navy">
            <li>It never changes a course status, never writes to the author, and never blocks acceptance.</li>
            <li>
              The claims section points at what a human should check. The model is instructed, repeatedly, that it is
              a flagger and not a fact-checker: it never says a claim is false and never states a fact of its own.
            </li>
            <li>
              Reviews are admin-only until you switch “Share with author” on, which shows the wording and readability
              notes on the author's course page, labelled as automated suggestions. The claims section is never
              shared.
            </li>
          </ul>
        </PortalCard>
      </div>
    </div>
  );
}
