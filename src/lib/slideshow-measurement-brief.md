# Slideshow recruiting measurement

Outcome: a genuinely saved slideshow application, standard Meta Lead. No optimization, campaign creation, spending or publication authorized.

Implemented: 30-day first touch with paid-over-organic replacement, nullable UTM/fbclid/landing/source fields, database source trigger, source filters/badges/cards/CSV, recruiting-only explicit marketing choice, GPC refusal, success-only stored event UUID and ID-only Pixel helper. fbclid is retained only after marketing acceptance; withdrawal removes it. No form answers/name/email are shared with Meta.

Tests: 45 focused tests passed; mocked successful/failed/honeypot submissions, consent blocking, attribution expiry/precedence and existing referral/journey regressions. Browser checked landing-to-form attribution, optional ad answer, reject/accept/withdraw, mobile overflow, authenticated Hub filters/CSV and not-connected note. No production application/email or Meta conversion sent.

Connection gap: public configuration remains connected=false; CAPI transport is intentionally a no-op. Existing META_ADS_TOKEN is not repurposed. No accessible app connector or Pixel ID was verified. Link Meta and confirm its supported server transport before enabling either reporting path. Keep event_time from the saved row and event_id equal on browser/server; recheck event-time and latest consent before any send/retry.

Privacy gap: recruiting notice names Meta and shared technical data, purpose and withdrawal. Shared public privacy pages were not changed due scope; update their Meta disclosure before enabling tracking. Retain consent evidence, check dataset restrictions in Events Manager, accept Business Tools Terms, and allow withdrawal through Cookie settings/contact for CRM leads.

Provider receipt, deduplication and published-domain installation remain unverified until connection and publish. Other-language marketing notice/option labels currently fall back to English except FR (and selected translated options); original form copy remains untouched.

Ads URL: https://vik-studios-creators.com/en/creators/slideshow?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}