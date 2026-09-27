# Roadmap

## UGC creator programme (27 Sep)
- [x] Public creators landing (fr/en), chooser, UGC + slideshow landing pages and application forms (localized routes)
- [x] Creator data model (creators, briefs, posts, calls) — isolated from author tables
- [x] Creator space /creators/app: invite claim, onboarding checklist (examples → agreement → account → first post), briefs, log post, feedback, calls
- [x] UGC acceptance automation: editable acceptance email, invite link, four-step checklist, pipeline progress
- [x] Acceptance email actually sends (verified sender domain notify.sophia-culture.com; admin toast falls back to copied link on failure)
- [x] Admin creators mode (dashboard, applications, creators, briefs, posts, calls, announcements, messages)
- [x] Reference library (admin bulk add, categories, pin/hide; creator "Use this")
- [x] Slideshow track: applications admin queue, per-country rate table, single-use signing links, filter, regeneration
- [x] Weekly guides with video/file attachments (private storage, signed URLs)
- [x] Creator payouts: payout profiles, rate cards, batches/statements, Wise/PayPal exports
- [x] Outreach pipeline: import, dedupe, statuses, touches, auto-match, stats
- [x] Minimum age 18 everywhere; guardian fields removed
- [x] Home page: "Devenir créateur / Become a creator" CTA + footer link; real App Store reviews
- [x] Creator forms: free-choice TikTok username guidance and clear email, phone, link and action error messages

## Waiting on the user (not buildable by us)
- [ ] Creator payout rates — admin enters them in-app; never invented
- [ ] Stripe: live key saved; switch to a test key before payment testing / first real payout run
- [ ] Review French marketing/creator copy (translation spot-check)

## E2E follow-up (27 Sep)
- [x] "Handed to [HM] for Upwork onboarding" on slideshow applications
- [x] Invite page: already-set-up / expired / invalid states, 18+ tick box, forgot password
- [x] Briefs to selected creators (assignments) + creator notifications; "I posted this" / Skip with reason
- [x] Post approval prices the post from the dated rate card in force, or holds it; batches exclude held posts and split by payout method
- [x] Day-7 views entry; call RSVP + 24h reminder banner; Wise/PayPal fallback
- [x] TikTok thumbnails (Instagram needs a Meta token)
- [x] "Continue your application?" prompt; funnel events (dataLayer + data attributes)
- [ ] Bonus tiers from views — waiting on the tiers
- [ ] Emailed 24h call reminders — in-app banner only for now
