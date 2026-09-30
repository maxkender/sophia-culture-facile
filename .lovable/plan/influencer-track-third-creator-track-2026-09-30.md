# Influencer track (third creator track)

This is roughly the size of the whole UGC programme. I'll build it in four phases and publish at the end of each, so something useful goes live early instead of everything at once at the end.

## Phase 1: Public entry and applications (goes live first)
- Third card on the chooser (FR/EN), with your exact wording.
- Landing page in FR/EN: `/en/creators/influencer` and `/fr/createurs/influenceur`. `/creators/influencer` will detect the visitor's language and redirect, the same way the other tracks work.
- Application form with every field you listed. The form checks the rules before submitting: at least one platform, a follower count for each platform given, average views when TikTok is given, up to 4 niches, at least one post link, and agency details when "represented by an agency" is Yes. It also has the honeypot, rate limit, optional media-kit upload and a confirmation page.
- Admin: an "Influencer applications" queue. It shows the tier, largest platform, followers, average views, rate, niches and agency, and sorts by followers. Accepting creates the influencer record, calculates the tier and generates an invite link.
- New applications are matched to Prospects by email or handle, and Prospects gets an "influencer" track filter.

## Phase 2: Contracts, onboarding and the influencer space
- Master Agreement stored word for word as a versioned document. Admins see a note that it hasn't been reviewed by a lawyer, pointing at clauses 4 and 9.
- Influencer space at `/creators/influencer/app`, using the same shell as the creator space. It has the three onboarding steps (rules, agreement, payouts), plus Home, Profile (with availability, media kit, rate card and agency details), Messages and the 7-point rules.
- Sign-in routing gets a new "influencer" role, so one login always lands the person in the right space.

## Phase 3: Briefs, offers and deals
- Admin: Briefs & offers. You can create a brief (with a plain-English rights picker and reference videos) and send offers to up to 10 influencers. Prices are prefilled with their rate plus the rights fee. You can also accept a counter, send a new counter or withdraw an offer.
- Influencer: Offers page with Accept, Counter and Decline, marked as viewed when opened, with an expiry countdown. Briefs board with an "I'd do this" button.
- Deals: admin kanban and deal page. A Deal Sheet is generated from the accepted offer, and production can't start until it's signed. After that come the draft (approve or request changes), the post URL with a Verify button, metrics at 48h, 7 days and 30 days with screenshots, CPM worked out automatically, and the Spark Ads code. Actions: cancel with a reason, extend the deadline, mark completed.
- Influencer deal page showing the next step at each stage.

## Phase 4: Money, performance and settings
- Completing a deal creates a payment line, or two when the offer is split 50/50.
- New payout method "invoice": the influencer or their agency uploads a PDF, and an admin marks it paid with a date and reference. There's also an "agency" payee option. Stripe stays the default.
- Earnings page for influencers. Admin Influencers grid and influencer page, with deal history, CPM, attribution, tracked link and promo code.
- Manual attribution entry. Performance dashboard: spend, CPM, CPI, charts, leaderboards and a date filter.
- Settings: rights-fee percentages (25/50/75), split threshold (€500), offer expiry (5 days), tier boundaries, niche list, and disclosure wording per country. France is seeded with your wording.

## Points I'm assuming (tell me if any are wrong)
- **Payments table names**: your spec says `payment_lines` and `payout_profiles`, but the database actually uses creator payout items and creator payout profiles. I'll extend those, not create new ones, so all creator payouts stay in one pipeline.
- **Kept separate**: influencer data goes in its own tables and never touches author, UGC or slideshow data. The reference library, messaging, notifications, announcements and Stripe setup are shared.
- **No invented rates or prices**: only the percentages and thresholds you gave are used.
- **Your figures**: "200,000 active users" and "a hundred creators" will go on the public page exactly as written.
- **Deal Sheets**: no lawyer has reviewed them either, and they carry the same admin-only note.

## Technical notes
- About 12 new tables: applications, influencers, briefs, offers, deals, deliverables, metrics, attribution, deal sheets, settings, interest flags and invoices. They'll use security rules and permissions that follow the existing creator setup. There will be private storage folders for media kits, drafts, metric screenshots and invoices.
- The server side will follow the existing creator programme's pattern. Public forms will use the same honeypot and rate-limit approach, and creator-facing errors will go through the shared validation helper.
- Two new sidebar sections will be added to the admin creators mode, with badges.
