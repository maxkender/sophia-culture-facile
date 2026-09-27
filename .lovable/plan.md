# UGC creator programme — build plan

A second product surface, kept separate from authors in data and routes, reusing the shell, auth, messaging, notifications, announcements and design system. Given the size, it ships in four stages, each published when done so nothing half-built goes live.

## Stage 1 — Public page and application form (publish)
- `/fr/createurs` and `/en/creators` landing page, bilingual, hreflang + canonicals, added to the sitemap; `/creators` follows the same language detection as the root.
- Minimum age 18 everywhere (landing requirement, form block "You need to be at least 18 to apply."); no mention of 16.
- `/creators/apply` (English only): the form exactly as specified, local autosave, age and requirements blocks, video link or upload (mp4/mov, 200 MB, progress bar), consent + privacy link, confirmation screen.
- Honeypot field and rate limit (per email and per IP, stored server-side) on a public server function that writes the application.
- No creator handles or example accounts anywhere.
- Home page (fr/en): outlined "Devenir créateur" / "Become a creator" button beside the download button, same size, above the fold; plain link in the footer.
- Home page reviews replaced by the three App Store reviews verbatim, five stars, name and "App Store"; English page shows your faithful translations with "Reviews translated from French. Original wording on the App Store."

## Stage 2 — Data model
- Add `creator` to the role enum; add `space` (author | creator, default author) to conversations, announcements, notifications; existing rows stay author.
- New tables: creator_applications, creators, briefs, brief_assignments, posts, calls, call_rsvps, payments (schema only, no screens).
- Row security: admins see everything; creators see only their own rows and briefs/calls assigned to them; applications are insert-only from the public form.
- Every application and creator carries `country` and `assigned_hm_id`; all admin queries go through one helper so a future hiring-manager country filter is a single addition.
- Private storage bucket `creator-videos`.
- Triggers for notifications: new brief, post feedback, post approved, new message, new announcement (creators); new application, post logged, RSVP (admin, creator space). The 24h call reminder runs from a scheduled job.

## Stage 3 — Admin, creators mode (publish)
- Mode switcher "Authors | Creators" under the logo, remembered; sidebar swaps contents. Dashboard, Messages, Settings, Announcements and Activity log filter by mode.
- Dashboard, Applications (table, filters, search, bulk actions, detail page with inline video, autosaving notes, status actions, HM assignment, accept → creator + invite link with copy), Creators (table + editable page with weekly bar, posts, briefs, RSVPs, notes, log, actions), Briefs (list, editor, draft/publish, duplicate), Posts (queue, embed where possible, approve/flag/not counting, manual views/likes), Calls (list, create, RSVPs, attendance).
- Every action logged to the activity log.

## Stage 4 — Creator space `/creators/app` (publish)
- Invite claim identical to authors, with the "I confirm the details above are accurate and that I am at least 18." declaration; iOS fixed.
- Home (weekly bar, newest brief, next call, pending feedback, access code card), Briefs (detail, "I posted this", Skip with reason), My posts (log form, amber feedback with reply), Calls (RSVP), Messages, Profile. Bell and banners scoped to creator space.
- Authors can never reach creator pages and vice versa.

## Stage 5 — Reference library (publish with stage 4)
- Tables reference_accounts and reference_videos with the shared four-value category, tags, pinned, active; `reference_video_id` on posts; a brief-to-video link table.
- Admin "Library" page under CRÉATEURS: Accounts and Videos tabs, platform/category/tag filters, pinned first then newest. Account cards (handle parsed from URL, colour per category, follower count, video count); video cards with thumbnail from TikTok/Instagram oEmbed via a server function, platform-coloured placeholder otherwise. Add, edit, deactivate inline; bulk add from pasted URLs.
- Creator "Library" page between Briefs and My posts: read-only, category legend with your four lines, "Use this" opens the log-a-post form linked to the video.
- Brief editor gets a reference-video picker; briefs show attached videos as a strip of cards.
- Admin dashboard block: library size by category and the five most-used videos this month.
- Instagram oEmbed normally needs a Meta app token; without one, Instagram cards use the placeholder.

## Stage 6 — Monthly payments (publish)
- Tables payout_profiles, rate_cards, payment_lines, payout_batches, payout_statements (replacing the earlier placeholder payments table, left unused). Bank and payout fields readable only by the creator and admins; guardian consent, view screenshots and statements in private storage.
- Rules: approving a post creates an accrued line from the rate card active on the post date; day-7 prompt for views + screenshot computes the bonus from tiers (capped); day 14 without views → bonus zero, flagged "views not reported"; post removed before day 30 → line cancelled; missing/unverified profile, or missing SIRET for FR → held with the reason; a line stays held "payouts not enabled" until Stripe payouts are enabled or a Wise/PayPal profile is verified. A daily scheduled job applies the day-14 and hold rules.
- Admin: Settings > Rate cards (new card with effective date, past lines untouched); Payments page with Accrued (grouped by creator, amber holds, release/cancel/edit views with note), Batches (month → verified lines, grouped by creator, currency and app; Wise bulk CSV and PayPal Mass Pay CSV; export → in batch; "Mark as paid" with reference → paid + statements), Statements (filter, download). Creator page gets a Payments block with Verify.
- Creator: Profile > Payout details (method fields, payee, tax country, SIRET when FR, one-line reason each, green Verified tag); Earnings page (month accrued per video, holds in plain words, views to report with upload, past statements).
- Statement PDF generated in the browser at "Mark as paid" and stored: Vik Studios header, creator and payee, month, video table, footer "Payment statement for services rendered as an independent creator."

## Stage 6b — Stripe Connect Express (primary payout rail)
- payout_profiles: method stripe | wise | paypal (default stripe), stripe_account_id, onboarding/payouts/details booleans, last checked. No guardian fields anywhere.
- New projects here cannot use separate backend functions, so these are built as server endpoints inside the app (same as the AI reviewer), inert until the keys are added: create account + onboarding link, refresh status on return, Express dashboard login link, batch transfers (one per creator, metadata batch/creator/month/app breakdown, failures isolated and shown to the admin), and a signature-verified webhook for account.updated and transfer.reversed at https://sophia-culture.com/api/public/stripe/webhook.
- Settings: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, documented on the admin setup page with the webhook URL.
- Creator: "Set up payouts with Stripe" button, green "Payouts enabled", amber "Finish your Stripe setup", "Manage on Stripe"; small link reveals Wise/PayPal fallback.
- Admin: method and Stripe status on each creator row; batch page counts Stripe transfers vs CSV; grey note on application and creator pages when the country is not on Stripe's Express list (editable list in Settings).

## Stage 7 — Outreach pipeline (publish)
- Tables creator_prospects, prospect_touches, outreach_templates; admin-only.
- Prospects page under CRÉATEURS before Applications: CSV import with column mapping and duplicate skip (TikTok handle, email) with a count; quick add; table with the filters listed and a kanban by status.
- Prospect page: editable fields, direct links, touch history, "Log a touch" with template fill ({first_name}, {handle}, {app}) and copy button, next action date, status, HM.
- Templates manager. "Convert to application" creates a prefilled application and links it; public applications are auto-matched by email or handle and set the prospect to applied.
- Dashboard block: prospects by status, touches this week, contacted → applied rate.

## Assumptions to correct if wrong
- Creators get Apple codes from the same real pool as authors (no codes invented). If the pool runs short, the card says a code is coming.
- Posts count toward the weekly target by posted date, Monday–Sunday UTC; "not counting" and flagged posts are excluded.
- Hiring managers are chosen from existing admin users only.
- TikTok/Instagram embeds use their official embed links; anything else shows a plain link.
- No rate card figures are invented: until you add a card, approved posts create lines at 0 and are held "no rate card".
- Wise/PayPal files follow their published bulk formats; nothing is sent to Wise or PayPal automatically — you upload the files yourself.
- Prospect list is imported by you; nothing is scraped by the app.

## Not built (as requested)
- Hiring-manager role (data is ready for it).

## Delivery
Stages publish one at a time as each is finished; given the size, this runs over several working sessions, and I will report what is live after each.
