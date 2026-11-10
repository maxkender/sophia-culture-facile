# Roadmap

## Done
- Slideshow Sophia app source: classification, declared fallback, badges/filters/CSV and FR/EN link checks completed; 49 tests passed, authenticated Hub filters checked, no application submitted or publication.
- Pass 2 — /start web-to-app funnel rebuilt to the iOS onboarding spec (30 steps, FR/EN, paywalls A/B, taap.it success, dataLayer events with ?src, resume, noindex). Tested end-to-end at 390px; not published.

## Open
- Meta slideshow: pixel 1755822698850602 enabled behind consent; last-UTM attribution, identifiers, browser UUID deduplication, Source column and matching payload built. 54 tests and mocked pixel consent/browser checks passed. CAPI transport still disabled: no available Meta connection, META_CAPI_TOKEN absent; real successful submission/provider receipt and privacy disclosure remain unverified. Not published.
- Parcours Ruul: OS team must enable parrainages and confirm final referral field names; exact first-login/first-post dates also need OS timestamps. Table, filters/CSV and authenticated mobile/desktop checks completed; not published.
- Sophia Studio v2: Pass A done; Pass B done (editor, checks, preview, autosave, drag, shared rules). Next: C Commons/glossary/sources/quiz, D submit/pre-review/review/publish/webhook, E figures+desk settings.
- Studio Pass D: send creator.photo_url as a 7-day signed link from private author-photos (owner decision; no public bucket).
- Studio: Google sign-in follow-up (provider not configured today).
- Studio: owner to add secrets PUBLISH_API_KEY and STUDIO_WEBHOOK_SECRET before Pass D.
- Pass 1 — marketing redesign built (home, app page, download page), not published. Open: owner reviews copy keys; real images in public/onboarding/; author bios; Lighthouse to measure on the published build.
- Replace the 42 placeholder images in public/onboarding/ with the real asset files (owner has them).
