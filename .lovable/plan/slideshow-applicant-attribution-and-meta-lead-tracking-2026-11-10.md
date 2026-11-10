# Slideshow applicant attribution and Meta Lead tracking

## Scope
Slideshow recruiting landing pages, forms, Applications, poster cards, Parcours Ruul and the slideshow connection section only. No UGC, influencers, authors, /start or publication.

## Build
- Capture the five UTM parameters, fbclid and the landing URL; retain a first-touch record for 30 days. A later paid UTM click replaces an organic touch, but not an earlier paid touch. Preserve parameters between recruiting pages and language switches.
- Add nullable attribution columns and a server-computed source. Referral wins over Meta; Meta wins over other UTM; otherwise direct. Keep all UTM fields even when referral wins.
- Restore an optional localized “How did you hear about us?” selector, including Instagram / Facebook ad, separately from the required referral-person question.
- Show Meta badges, campaign/ad details, source filters and attribution CSV columns. Extend Parcours Ruul to Meta / Referral / Direct / Other.
- Add a small recruiting-only marketing-cookie choice with equally accessible accept/refuse and later withdrawal. Store choice evidence; Global Privacy Control overrides acceptance. fbclid storage, Pixel and server sends require explicit marketing acceptance. With no acceptance, the application still succeeds and ordinary UTM attribution remains available; Meta identifiers are discarded.
- Issue one event ID per saved application. Only genuine successful submissions can produce Lead; honeypot responses never do. Share the event ID between browser and server, and never let tracking failure block submission.
- Add focused attribution, consent, success-only event and deduplication tests plus mobile/desktop checks.

## Meta connection gap
No accessible Meta app connection exists, and no Pixel ID is configured. An existing META_ADS_TOKEN is present, but it is not a verified Pixel/CAPI connection. Do not repurpose it or send production events during tests.

Prepare consent and Pixel wiring with a disabled-by-default server adapter. The server adapter must use the supported Meta connection once linked; do not invent its gateway credentials. Hub displays “Meta tracking not connected” until Pixel and server configuration are both available. Connection setup and provider Test Events receipt remain pending, not claimed complete.

## Ads URL
https://sophia-culture.com/en/creators/slideshow?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}

## Verification limits
Use mocked provider calls and submission tests; no production application, acknowledgement email, live Meta event or publish. Check browser consent rejection/acceptance/withdrawal, parameter persistence, Hub filters and CSV.
