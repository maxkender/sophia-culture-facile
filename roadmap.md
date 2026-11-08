# Sophia OS referrals (Nov 8)
- [x] Add authenticated OS email endpoint and authenticated Brevo event receiver; 29 focused tests pass, unauthorized POST/GET browser checks pass.
- [x] Persist referral codes for exactly 30 days, save nullable slideshow application ref, and forward on submission/signing. Phone/desktop landing → form verified without submission; existing signing tested with mocks only.
- [x] Test without real sends, applications, or signatures; no publication. Production URL after publication: https://sophia-culture.com/api/public/os-email.
- [ ] Activate Sophia-domain sending and events — blocked: Brevo has no Sophia sender/domain; owner must verify sophia-culture.com in Brevo. Receiver registration requires publication and authenticated Brevo webhook configuration; not performed to avoid publishing unrelated pending changes.

# Sophia slideshow presentation (Nov 6)
- [x] Replace public pay range with country-specific remuneration before applying; country carried into form. FR/AR 390px and EN 1440px verified, 3 country-selection tests passed. No submission or publication.
- [x] Slideshow admin CRM: six-item menu/legacy redirects, compact Home, Applications/Posters Sheets and bulk controls, Payouts/Rates/Guide. All pages checked at 1440/390px; confirmations/guide typing checked; 22 isolated tests passed. No real decisions/emails/payments executed; real payout approval remains unverified (no draft rows). Not published.
- [x] Replace plush with transparent cutout, remove specified Sophia sentences; EN/FR 1440/900/390px checks passed without overlap or horizontal scroll, reduced motion verified. Not published.
- [x] Sophia-only colored logo, plush, stats, subject copy and marker highlights; desktop/390px checks. Not published.

# UGC additions (Oct 12)
- [ ] Replace saved-format UI with five editable video format definitions; update admin/creator terminology, QA and publish
- [x] Notion ↔ Inspiration sync (settings card, Notion tab, cron every 10 min, classifier tests)
- [x] Create brief from inspiration (prefilled draft, reference panel, disabled reasons)
- [x] Brief library tabs Formats/Drafts/Ready/Published/Archived, row actions, publish confirmation, autosave
- [ ] Real Notion import — waits on NOTION_TOKEN + sharing the Notion page with the integration

# Creator space simplification (Oct 12)
- [x] Hide Missions/Tasks/Calls/Messages/Rules from nav; new sidebar; reference-video tab removed
- [x] terms_visible + Conditions FR/EN; amounts hidden unless visible (Juliette only)
- [x] All creators enrolled in all active apps; "My apps & codes" page; Assets category
- [ ] Full FR/EN string sweep of every creator page/email
- [ ] Stripe end-to-end loop — waits on STRIPE_WEBHOOK_SECRET + webhook endpoint, and test vs live mode decision
- [ ] Phone QA FR/EN signed in — waits on test-account sign-in approval
- [x] Slideshow form: remove Upwork question (has_upwork nullable)
- [x] Slideshow acknowledgement email depends on country open/closed/OS unreachable
- [x] Ruul cohort: logins email Getting paid + #ruul-cohort, Added in Ruul records only, notify owner/Slack, card "Cohort"

# Slideshow signature start Monday (Oct 17)
- [x] Recompute Monday at signature, update six acceptance texts, verify date tests and request publication; no real signing or email.

# Slideshow Monday payments (Oct 17)
- [x] Update six-language acceptance/logins payment wording and first payment (+7 days); 18 mocked tests pass, no sends; rates, Slack links and forms preserved.
- [ ] Publish Monday-payment update.
