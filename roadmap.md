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
- [ ] Recompute Monday at signature, update six acceptance texts, verify date tests and publish; no real signing or email.
