# Roadmap

- [x] Localize UGC/slideshow application forms in French and English; add dedicated localized routes and current-language flag switcher

- [x] Rewrite author-home access-code card: bold store-not-Sophia first line, platform-dependent numbered steps, closing line, small grey "wrong phone type" line
- [x] Apply same correction to other places the code / redemption appears (Examples page callout, claim page platform note, profile platform card)
- [x] Read-only: report Raphael Seguin's invite URL, access code, redeem URL, store; regenerate token if missing/consumed

## UGC creator programme (27 Sep)
- [~] UGC acceptance automation: editable acceptance email, password-creation invite, four-step onboarding checklist, automatic pipeline progress, and mandatory post logging reminder (email delivery awaiting sender-domain setup)
- [x] Public creators landing (fr/en) + /creators/apply form
- [x] Creator data model (creators, briefs, posts, calls)
- [ ] Admin creators mode (dashboard, applications, creators, briefs, posts, calls, announcements, messages)
- [x] Creator space /creators/app (basic: invite claim, briefs, log post, feedback, calls)
- [x] Reference library (basic: admin bulk add, pin, deactivate; creator "Use this")
- [x] Home page: "Devenir créateur / Become a creator" outlined button next to download + footer link
- [x] Home page: replace testimonials with the three real App Store reviews (EN translated, with note)
- [ ] Creator payments: payout profiles, rate cards, payment lines, monthly batches (Wise + PayPal CSV), statements PDF, Earnings page
- [x] Outreach pipeline (basic: import, dedupe, status, touches, auto-match, stats)
- [x] Minimum age 18 everywhere; remove all guardian fields/UI/hold reason
- [ ] Stripe Connect Express payouts (onboarding, status refresh, dashboard link, transfers per batch, webhook, country note config)
- [ ] Admin "Stripe setup" checklist page (9 persisted steps, live balance vs accrued, editable countries list)
- [~] Slideshow track (public pages, form, table, rate table done; admin page pending): /creators chooser, /creators/slideshow landing + short form, slideshow_applications, admin page, country rate table, prospect matching; UGC moves to /creators/ugc
