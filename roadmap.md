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
- [x] Test end-to-end, clean test records, republish

# Brief Studio + Assets (Oct 11)
- [x] Studio page /hub/learn/briefs/<id|new>, 7 steps, phone preview, score /10
- [x] Assets library, bucket creator-assets, brief/campaign/creator links, 12 "to film" placeholders
- [x] Creator Fichiers section + zip, Home "Kit de démarrage"
- [x] Brief rapide, Brief depuis une vidéo (links + file frames), Briefs list filters/columns/bulk
- [x] Video Reviews brief checks, Sidekick Open in Studio, UnSwipe multi-platform formats
- [x] E2E admin/creator test, republish

# Hub split into spaces + OS bridge (Oct 11)
- [ ] P1. Space switcher UGC/Slideshows/Influencers, /hub/<space>/..., 301s, per-space nav/home/accent/mobile bar, shared Settings (access codes per app+platform)
- [ ] P2. Slideshow applications: new columns/statuses, ack email (6 langs), form fields (2nd phone, langue, 4 questions), grouped list + score, timeline card, Accept/Reject/Keep warm, slideshow-accept flow, pool expiry job 10:00
- [ ] P3. Weekly pay zones A14/15 B10/11 C7/8, country map, public page/guide/contract weekly
- [ ] P4. Posters view + os_snapshots 06:30, weekly payouts job Mon 07:00, approve/pay/export, tokenized payout-method link
- [ ] P5. os-bridge (OS_HUB_SECRET, retries, os_calls log), Settings → Connections → Sophia OS card
- [ ] P6. Access code follows creator job app (UnSwipe iOS vs Sophia), app name shown, CSV import with app+platform
- [ ] Test signed in (admin + creator), mobile, republish
