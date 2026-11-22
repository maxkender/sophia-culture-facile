# Poster application, job preview, and contract v4

## Scope and safeguards
Update only the slideshow / Ruul program. Keep application questions, rates, payouts, emails, referral/UTM/Meta tracking, acceptance, signing dates, reminders, expiry and Sophia OS actions working as today. No publication, bulk updates, real signatures or creator emails during testing.

Existing contract and slideshow signatures are version **3**. The new slideshow-only agreement will be **version 4**; the shared legacy agreement and all existing signatures remain untouched.

## 1. Required WhatsApp phone and contact consent
- Add a required “WhatsApp phone number” input with a country-code selector, initially matching the applicant’s chosen country; allow a different calling code.
- Validate real phone-number structure both in the form and on the server, normalize to E.164, and display localized errors. This validates the number’s format, not WhatsApp membership or ownership; no verification messages are added.
- Require the checkbox: “I agree to be contacted about my application and my work by WhatsApp, SMS and email.” Save its timestamp on the server, separately from marketing/cookie consent.
- Add nullable application fields `phone_e164` and `whatsapp_consent_at` so historical rows remain valid. Preserve existing `phone` and all other fields; new submissions also keep the legacy phone value compatible with the existing OS `telephone` field.
- Accepted applicants missing a valid phone or recorded contact consent must complete the same input/checkbox before signing. Already-signed applicants are not asked to re-sign or silently changed.
- Add both fields to the authenticated Sophia OS candidate list, the existing application notification, and poster-creation payload. Ensure contact updates are visible to incremental candidate sync, not only full refreshes.

## 2. “What you'll do” animated preview
- Add one reusable phone preview to the program presentation and immediately above the application form; leave the mini homepage unchanged.
- Use an **18-second**, six-step loop with CSS/SVG or the existing animation library, no video file:
  1. Today's prepared slideshow on the dashboard: photos, text and suggested sound.
  2. Download the photos.
  3. Select the photos in TikTok.
  4. Add the supplied text to each photo.
  5. Add the suggested sound and hashtags, then post.
  6. Copy the TikTok link back to the dashboard, with a completion check.
- Show small step labels and the caption: “2 posts a day · about 10 minutes · everything is prepared for you”. Translate these, phone labels, consent and errors across the existing **30 slideshow languages**.
- Preserve the page's existing document-like styling, stable phone dimensions and mobile layout. Reduced-motion users see static steps instead of looping movement.

## 3. New slideshow-only contract
Create a short English master agreement with translated versions using the site's existing 30-language configuration. Keep one authoritative versioned source, separate from the legacy shared agreement.

Include every requested clause:
- Independent contractor; no employment, agency, partnership, exclusivity or guaranteed minimum volume.
- Poster responsible for income declarations, taxes, contributions, fees and local compliance; no withholding by Vik Studios.
- Weekly payment via Ruul for published posts whose links are submitted, at the dashboard rate; Vik Studios pays Ruul fees and fulfils its payment obligation when funds are sent to Ruul; verification/account issues and delays are handled with Ruul support.
- Vik Studios owns program accounts, handles, followers, credentials and content; no credential changes/deletions, immediate access handover at termination, and assignment of post rights.
- Either party may terminate anytime without notice or compensation; only published, validated posts up to termination are payable.
- Age 18+, actual residence in declared country, no VPN, provided content only, Poster Guide and TikTok compliance.
- Confidentiality; poster responsibility for breaches; liability cap of amounts paid in the last four weeks to the extent permitted by law.
- Privacy: name, email, phone, country and post links for operations/payment; collaboration duration plus legal retention; support@vikstudios.com for data requests.
- French law and courts of the registered office.

### Signing experience and records
- Preserve existing token links and the existing start-Monday calculation. Unsigned applicants, including already-accepted applicants, see/sign v4 after publication; existing v3 signatures stay intact.
- Default the contract language from the applicant's country, with a language selector and English fallback. Save the exact language and text shown, not a later reconstruction.
- Add the five bold summary lines immediately above the signature button and require “I have read and accept the contract”, enforced on the server as well as on-screen.
- Reuse existing signature storage for `document_version`, `signed_at`, `signature_ip`, `contract_lang` and `contract_snapshot`; persist the full displayed contract text at signing. Never trust a client-supplied snapshot or version.
- Keep the signature durable before OS creation; existing OS failure recording/retry behaviour remains unchanged.

## Company details and legal limitations
The project already identifies **Vik Studios SAS**, so use **Vik Studios** and **SAS** rather than inventing replacements. Registration number and registered address are missing: retain **[SIREN]** and **[REGISTERED ADDRESS]** and list them in the final report.

This is implementation of your requested wording, not confirmation that every clause is enforceable. Legal review is recommended before using v4, particularly the contractor classification, payment-to-Ruul discharge, rights assignment, liability cap and jurisdiction clauses. No actual payment calculation or data-retention job is changed.

## Technical implementation
- Shared client/server phone validation using a browser/Worker-compatible phone-number library; one reusable phone/consent input.
- Additive database changes only, with no rewriting of old contacts or signatures. Keep private application data behind the current server-only write paths and authenticated OS access.
- Main integration points: `creator-apply.functions.ts`, `creator-agreement.functions.ts`, `os-candidatures.server.ts`, `os-referral.server.ts`, `slideshows.server.ts`, slideshow presentation/application components and the token signing page.
- Scope signature-form changes through slideshow-only options or a dedicated form so legacy agreement rendering is unaffected.
- Record the new contract boundary in project architecture notes and maintain the roadmap.

## Validation and handover
- Add and run focused tests for E.164 normalization (including +36201234567), invalid/missing phones, required consent/server timestamp, historical-row compatibility, and signing blocked until contact/contract consent is complete.
- Test exact OS field additions and incremental sync while keeping existing payload fields and every existing action (`accept`, `refuse`, `expire`, `remind_signature`, `move_start`, `ruul_email`) unchanged.
- Test version 4 selection, version mismatch rejection, immutable full-text/language/time/IP snapshots, preservation of version 3 records, and unchanged start dates/OS retry behaviour.
- Run existing slideshow/OS/regression tests; inspect the automatic build result.
- Check desktop/mobile application and signing flows with isolated test data and mocked outbound OS/email calls, including translated pages and reduced motion. Do not contact real creators or create a real OS poster.
- Provide screenshots, changed files, exact OS fields, contract version **4**, remaining company placeholders, test results and any external limitation. The owner publishes.

### External dependency
This site can add the fields to its OS responses and outgoing requests. Sophia OS must accept/read `phone_e164` and `whatsapp_consent_at` on its side; verify receipt where accessible and clearly report if external storage/display cannot be checked.
