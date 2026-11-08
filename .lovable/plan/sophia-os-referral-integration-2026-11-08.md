# Sophia OS referral integration

## Scope
Only add referral tracking and the OS email connection. Preserve page appearance, application decisions, contracts, payments, and other tracks.

## Email connection
- Add a POST-only `os-email` endpoint, authenticate `x-hub-secret` against the existing `OS_HUB_SECRET` with constant-time comparison, and validate the supplied action and email fields.
- Use the existing Brevo setup for both HTML and plain text, the supplied display name, tags, and one-click unsubscribe headers. Return the provider message ID or an appropriate error without logging email content.
- Verify whether Brevo already has an authorized sender on `sophia-culture.com`. The current shared sender is on `vikstudios.com`; do not change it or assume the Lovable-verified email domain is also verified with Brevo.
- Add authenticated forwarding for Brevo opened, clicked, and bounced events to the OS. Provider webhook registration requires a published receiver and provider access; report any outstanding setup instead of claiming events are live.

## Referral tracking
- Capture valid `ref` query codes on recruiting pages in local storage for 30 days, preserve them through application links, and attach them on submission.
- Add a nullable `ref` column to `slideshow_applications`, the existing poster application store, without touching author/UGC application tables or the separate referral-name question.
- Notify the existing OS `hub-posteurs` endpoint of a saved application with `{ action: "candidature", email, ref }`. Failures must not affect application success.
- Include the saved `ref` in the existing `creer_posteur` payload after signing.

## Technical constraint
This project does not allow creating new Supabase Edge Functions. Implement the equivalent authenticated endpoint at `/api/public/os-email` using the supported server routes, not `/functions/v1/os-email`. Its production URL will be `https://sophia-culture.com/api/public/os-email` after publication. No unrelated unpublished changes will be published automatically.

## Verification
Add focused tests for authentication, validation, event mapping, exact 30-day expiry, referral persistence, and non-blocking OS failure. Verify landing-to-form tracking on phone and desktop without submitting an application, sending an email, creating a poster, or signing a contract.