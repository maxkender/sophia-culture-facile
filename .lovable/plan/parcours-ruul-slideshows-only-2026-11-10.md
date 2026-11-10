# Parcours Ruul — Slideshows only

## What to build
- Add **Parcours Ruul** to the Slideshows menu, preserving all other spaces and existing actions.
- One searchable table per person, joining applications, OS referrals when available, stored OS snapshots and paid slideshow weeks.
- Show all requested date steps, current step, elapsed days and plain-language next action. Mark actionable waits over 48 hours red; ended journeys and Portugal grey.
- Add funnel counts, red count, this-week signed/Ruul/paid totals, all requested filters and filtered CSV export.
- Application rows open the existing poster card. Referral-only rows show their details until an application exists.
- Show **Referral data not connected yet** if the OS action is missing or unavailable; applications still work.

## Assumptions and limits
- Hub content stays English except the requested page name.
- Referral response field names are not yet specified: isolate their mapping so the OS team can confirm its final JSON shape.
- Match by normalized email or a unique referral code, never by referrer's shared code alone when it could merge different people.
- Stored OS snapshots contain last-post dates, not guaranteed first-post or login dates. Show the earliest observed post explicitly as observed; do not invent a login date.
- Portugal is closed in this tracker only: no acceptance, email, payout or lifecycle changes.
- No applications, signatures, invitations, payments or publication during testing.

## Technical approach
- Dedicated protected route with URL-backed filters and TanStack Query loading.
- Read-only authenticated server function and a pure journey aggregation module with focused rule tests.
- Reuse the existing OS bridge and poster Sheet; no schema changes.
- Verify using an authorized Hub account on desktop and mobile, including filters, export and opening a poster card.
