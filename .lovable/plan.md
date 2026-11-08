# Sophia Studio v2: plan

The goal: authors write courses in the app's block format, the desk reviews them, and the Studio publishes them to the app through the bridge. Creator/UGC/slideshow/influencer, the public site, `/start` and the existing API endpoints are not touched. The legacy `/auteurs` flow keeps working for existing rows.

## Answers to section 8

### 1. Passes (your split, with one change)
Pass A carries a lot, so I moved the schema-only pieces forward and kept the UI separate.

| Pass | Content | Testable after the pass |
|---|---|---|
| A. Data and journey | Migrations (`studio_courses`, `studio_jobs`, `studio_stats_cache`, new `profiles` columns, public `creator-photos` bucket and policies), RLS, `/auteurs/join` sign-up (password and magic link), 6-step resumable wizard, "Become a teacher" CTA, invited professors routed into the pre-filled wizard, desk view of onboarding progress, approve/suspend | Sign up, resume mid-way, sign the agreement, invite path pre-filled; Vitest on onboarding gates and slug rules |
| B. Editor core | Shared V2 schema and rules module (one source for editor, submit and payload), editor at `/auteurs/studio/$id` (top bar, outline, section/block cards, drag to reorder, block forms, bold/glossary helpers), autosave (2 s), Checks tab with scroll-to-block, Preview tab in the app's reader style, "Preview on phone" | Write a 5-section course; checks turn green or red live; Vitest on every §4 rule |
| C. Assets and side panels | Commons search server function (license, type and width filters, credit extraction), Images tab and hero picker, pasted URL with manual credit, glossary panel that detects `[[terms]]` automatically, sources panel, optional quiz panel | Pick an image and get the credit filled in; Vitest on credit extraction from a recorded real API sample |
| D. Review and publishing | Submit (agreement gate) and asynchronous pre-review (deterministic checks + LLM pass + daily-cached catalog similarity), V2 items in the review queue, review page (preview, report, decision box), Accept and publish, `jobs-dispatch`, webhook route, Refresh button, 2-minute poll while publishing, re-publish, language chips, notifications and activity log | Full cycle against the bridge once `PUBLISH_API_KEY` is set; Vitest on the payload builder, webhook auth (missing/wrong/right) and status transitions |
| E. Figures and desk settings | Creator dashboard following the mock-up (KPIs, 7/28/90-day toggle, reads chart with recharts, My courses table, drop-off by section, languages, quiz items), stats cache (1-hour TTL), desk settings (slugs, verified badge, public photo, bridge status card) | Figures for a real slug; Vitest on cache TTL |

Screenshots at 1280 px come at the end of each pass, from a sandbox author account. I delete all test rows afterwards.

### 2. Keeping V2 and legacy apart for authors
- "My courses" shows one list with a format badge ("Sophia Studio" vs "Archive · 5 screens").
- Legacy courses become read-only archive cards, except `assigned`, `in_progress` and `changes_requested` rows, which keep opening the legacy editor so no work in progress gets stranded. Your suggestion only covered `in_progress`.
- "New course" always creates a V2 draft. The legacy creation path is hidden but not deleted.
- The two editors live on different URLs and use different layouts: three columns for V2, five screens for legacy. A V2 course can never open in the legacy editor, or the reverse.
- On the desk side, the queue shows a format tag. V2 items open the new review page; legacy items keep the current page.

### 3. Keeping `PUBLISH_API_KEY` server-only
- One file, `src/lib/studio-bridge.server.ts`, is the only place that reads `process.env.PUBLISH_API_KEY`, and only inside its functions. The `.server.ts` suffix keeps it out of the browser bundle.
- Callers are admin-only server functions (publish, refresh, dispatch, stats) and the webhook route. Each loads the bridge helper inside its handler, after the admin or author check.
- Nothing returns the key or the raw request headers. Bridge errors are mapped to the `errors[]` list and a status before they reach the browser.
- A Vitest case checks that the built client assets do not contain the string `PUBLISH_API_KEY`. A ripgrep check keeps `.functions.ts` files from reading it at module scope.
- `STUDIO_WEBHOOK_SECRET` follows the same pattern: constant-time comparison, and 401 when it is not set.

### 4. Corrections and gaps I found
- **Language count**: the mock-up says "25 languages"; the contract says 29 targets plus the origin language. I will show the number the bridge returns (`languages.length`), not a fixed figure.
- **Length target**: the mock-up says "aim for 400 to 700 words"; §4 says 500 to 900. Please pick one. I will put it in config as an amber check, not a blocking one.
- **Mock-up checks not in §4**: "title phrased as a question", "at least one image", "one image per section at most" and "3 to 8 glossary terms" are not rules in §4. I will treat them as amber or info hints that never block submission, because the bridge does not require them. The "Propose" action on the takeaway check would call the existing AI set-up to draft a sentence for the author to accept.
- **Roles**: `profiles.role` currently stores `admin`/`author`, and the database blocks users from changing it. Desk checks will keep going through `account-role.ts` and that database check. `creator_status` is a business status, not a permission.
- **Agreement**: §5.0 says to sign `documents` slug `creator-agreement`, but that slug is the UGC/slideshow creator agreement in this project. The existing author contract uses its own document and `contracts` table. I propose authors keep signing the **author** agreement through the existing `signAgreement` path. Please confirm which text applies.
- **Approval is not a gate**: a pending creator can submit. The desk approves the person on their first acceptance. Accept will offer "approve creator too" with one click, and `verified` is sent as-is.
- **Re-publishing an accepted course**: editing a `published` course creates a new working version (`version + 1`). The live row is only replaced when the re-publish is accepted, so the app keeps showing the approved text in the meantime.
- **Re-publish payload**: sections keep the ids the bridge returned (stored on the row), so only changed segments get retranslated. A new course sends no ids, as the contract says.
- **Photo**: the author photo is copied to the public bucket at publish time. It is resized to JPEG ≤ 1600 px on the server without a native image library (a Worker-safe approach). If that is not possible, the copy is made as-is and flagged.
- **Webhooks without retry**: the 2-minute poll plus Refresh button cover lost events. Job events are stored with a cap of 200, and duplicates (same step, language and status) are ignored.
- **Catalog cache**: stored in `studio_stats_cache` under the key `catalog:fr` with a 24-hour TTL, so no new table is needed.
- **Pre-review timing**: it runs in the submit request with a time budget. A short loading state appears, then "Report ready", with no queue worker. The LLM part goes through the Lovable AI Gateway, like the current `aiReview`.
- **Google sign-in**: authors currently use email/password only. I will add Google sign-in in pass A unless you would rather keep it as a follow-up.
- **UI language**: a new `src/i18n/studio.tsx` dictionary in the same style as `creator-app.tsx`. Legacy pages are unchanged.

## What I need from the owner
- Secrets in Project Settings → Secrets: `PUBLISH_API_KEY` (the value you have) and `STUDIO_WEBHOOK_SECRET` (a strong random value, also entered on the app side).
- Webhook URL to configure on the app side: `https://sophia-culture.com/api/public/studio/job-events` (live once published).
- Answers on: word-count target, which agreement text applies, and Google sign-in now or later.

## Technical notes
- New code: `src/lib/studio/*` (schema/rules shared, `*.functions.ts`, `*.server.ts`), `src/components/studio/*`, routes under the existing authenticated `/auteurs` tree plus `/auteurs/join`. The webhook goes at `src/routes/api/public/studio/job-events.ts`, a new file; existing API routes are untouched.
- RLS: authors get select/insert/update on their own `studio_courses` only while the status is `draft` or `changes_requested`. Status changes go only through server functions. The desk gets full access through the existing admin check. `studio_jobs` and `studio_stats_cache` can be read by the desk (authors read their own jobs through a security-definer view); only the service role writes to them.
- Drag and drop: a small dependency (`@dnd-kit`) unless you prefer up/down buttons.
- I do not publish anything; you publish after review.
