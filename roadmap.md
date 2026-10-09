# Roadmap — UGC pipeline rebuild (Oct 2026)

- [x] Urgent Oct 6 correction: personal UGC handles/display names/bios, no onboarding link; Rules point 1 and agreement v3 clause 2 updated and read back; no admin brand restrictions; clean build and guidance checks. Deployment requested. Creator-page visual check blocked by available admin session redirect.

- [ ] A. ?src= source field on UGC application
- [ ] B. Brevo welcome / decline emails, send log, resend, editable templates
- [ ] C. Per-creator settings + compliance Creators dashboard
- [ ] D. Onboarding checklist rebuilt (6 steps, shared email + IG + TikTok, Slack, WhatsApp opt-in)
- [ ] E. Agreement v3 (clauses 2 & 4), re-sign request banner
- [ ] F. Apify jobs (compliance weekly, D+7 daily), external_posts, run log, cost estimate, Integrations page
- [ ] G. EUR payment model, monthly compute + preview, creator earnings breakdown
- [ ] H. Rules v2 text
- [ ] I. Briefs extended fields, Week planner, briefs grid, brief library + swaps, Scripts performance
- [ ] J. Access-code import (BLOCKED: CSV not uploaded)
- [ ] K. Test run (Brevo/Apify steps BLOCKED until keys added)

# Creator Hub rebuild (Oct 9)
- [x] Phase 1: /hub shell, Home, Campaigns (tabs, wizard, job modal, applicants, requests, jobs, video reviews), Discover, Messages, old URLs redirect, seeded Sophia UGC FR campaign + job, public /jobs/<slug>
- [ ] Phase 1 gaps: job apply flow with inline contract (Open jobs), Brevo email on decline/invite, Apify follower scrape on apply, oEmbed thumbnails, invite landing /jobs/invite/<token>
- [ ] Phase 2: Ads module, Payouts rebuild (budget cap, statements), creator dashboard mirror, tiers & awards
- [ ] Phase 3: Analytics, Affiliates, Learn, automation (daily scrape, /go links, fraud flags, dormancy), then publish

# Completion pass (Oct 9, 12:34)
- [x] A. Sidekick drawer + server fn with whitelisted tools, threads
- [x] B. Public UGC page rebuilt (earnings, leaderboard, tiers, 60s form → open job, FAQ), FR/EN
- [x] C. Leaderboard/challenge/streak cards on creator Home; Challenges tab + winner payout/award
- [x] D. Brevo nurture sequence J0/J+2/J+7, daily 09:00, editable in Templates
- [x] E. 20-course brief generation, Briefs list refresh, reference_library (81 rows), DM templates
- [x] F. Sidebar headings language, delete test applicant, Get started steps 4/5, security scan, republish

# Fast lane (Oct 9, 19:31)
- [x] Admin "Add validated creator" (single + bulk) with pay block, Discover + "+" menu
- [x] /j/<token> page, Entrer → sign-in, steps 1-2 done, expired page
- [x] Email-link login on /creators/login, optional password on Profile
- [x] Fiche Fast lane block, Générer un lien for creators/applicants/prospects, editable pay, "Tes conditions"
- [x] Sidekick create_fast_lane
- [ ] Test end-to-end, clean test records, republish
