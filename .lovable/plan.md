# UGC creator programme — build plan

A second product surface, kept separate from authors in data and routes, reusing the shell, auth, messaging, notifications, announcements and design system. Given the size, it ships in four stages, each published when done so nothing half-built goes live.

## Stage 1 — Public page and application form (publish)
- `/fr/createurs` and `/en/creators` landing page, bilingual, hreflang + canonicals, added to the sitemap; `/creators` follows the same language detection as the root.
- `/creators/apply` (English only): the form exactly as specified, local autosave, age and requirements blocks, video link or upload (mp4/mov, 200 MB, progress bar), consent + privacy link, confirmation screen.
- Honeypot field and rate limit (per email and per IP, stored server-side) on a public server function that writes the application.
- No creator handles or example accounts anywhere.

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
- Invite claim identical to authors, with the "I confirm the details above are accurate and I am at least 16" declaration; iOS fixed.
- Home (weekly bar, newest brief, next call, pending feedback, access code card), Briefs (detail, "I posted this", Skip with reason), My posts (log form, amber feedback with reply), Calls (RSVP), Messages, Profile. Bell and banners scoped to creator space.
- Authors can never reach creator pages and vice versa.

## Stage 5 — Reference library (publish with stage 4)
- Tables reference_accounts and reference_videos with the shared four-value category, tags, pinned, active; `reference_video_id` on posts; a brief-to-video link table.
- Admin "Library" page under CRÉATEURS: Accounts and Videos tabs, platform/category/tag filters, pinned first then newest. Account cards (handle parsed from URL, colour per category, follower count, video count); video cards with thumbnail from TikTok/Instagram oEmbed via a server function, platform-coloured placeholder otherwise. Add, edit, deactivate inline; bulk add from pasted URLs.
- Creator "Library" page between Briefs and My posts: read-only, category legend with your four lines, "Use this" opens the log-a-post form linked to the video.
- Brief editor gets a reference-video picker; briefs show attached videos as a strip of cards.
- Admin dashboard block: library size by category and the five most-used videos this month.
- Instagram oEmbed normally needs a Meta app token; without one, Instagram cards use the placeholder.

## Assumptions to correct if wrong
- Creators get Apple codes from the same real pool as authors (no codes invented). If the pool runs short, the card says a code is coming.
- Posts count toward the weekly target by posted date, Monday–Sunday UTC; "not counting" and flagged posts are excluded.
- Hiring managers are chosen from existing admin users only.
- TikTok/Instagram embeds use their official embed links; anything else shows a plain link.

## Not built (as requested)
- Payments screens, hiring-manager role.
