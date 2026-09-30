# Multi-app layer: Sophia + UnSwipe

One platform, one set of creators and one admin, with an app switch — no copying. This is built in four phases and published after each one. Phases run back to back without stopping.

## Assumptions (tell me if any are wrong)
- **UnSwipe domain:** starts as `unswipe.app` and can be edited in Settings > Apps. Until it points here, the UnSwipe pages live at `/creators/unswipe/...` on sophia-culture.com.
- **No UnSwipe marketing site in this project:** so I only expose `/creators/unswipe` for the UnSwipe site to link to.
- **Mapping your list to today's tables:**
  - "rate_cards" = the creator rate table plus slideshow country rates
  - "reference_accounts" = the reference library (accounts and videos share one table)
  - "payout_items" = UGC/slideshow payout lines plus influencer payout items
- **Colours, logo and store links for UnSwipe:** left empty until you fill them. The "200,000 users" and "a hundred creators" sentences are hidden for UnSwipe until filled.
- **Existing data:** every existing row becomes Sophia, and every current creator and influencer is enrolled in Sophia only.

## Phase 1 — Foundations
- New **apps** list, seeded with Sophia (current values) and UnSwipe (your tagline and description).
- Every brief, post, offer, deal, rate, payout line, reference, application, access code and announcement is tagged with an app. Everything existing is set to Sophia. Prospects map `sophia`/`unswipe` to the right app.
- **Enrolment per person:** creators and influencers get a checkbox per app, set by admin on their page. They see briefs only from apps they are enrolled in; this is enforced in the database, not just hidden on screen.
- **Managed accounts:** a creator can register several, each tagged with an app, with the new sentence on the Account setup page.
- Contracts, rules, payout profiles and Stripe stay per person.

## Phase 2 — Admin
- **App selector:** Sophia / UnSwipe / All under the Authors/Creators switch. Default is All, and your choice is remembered across devices.
- **Filtering:** every creators-mode list, board, count and badge follows the selector.
- **Create forms** (brief, rate, reference, announcement) get a required app field. It is prefilled from the selector and locked when one app is selected.
- **Dashboard:** in All mode it shows the numbers side by side per app. Performance gets an app filter, an app breakdown and a platform filter.
- **Settings > Apps:** edit each app, upload a logo, or add a new app.
- **Disclosure wording** per country and per platform, seeded for France (TikTok / Instagram as specified).

## Phase 3 — Public pages and spaces
- **Branded public pages:** the chooser, three landings and three forms pick their app from the domain or the `/creators/unswipe/...` address. They show the app's name, description, colours and logo, and every application is saved with that app.
- **App badges:** briefs, offers and deals show an app badge in the app's colour and name, with an app filter on Briefs and Deals. Library items show their app tag.
- **Earnings:** grouped by app with a subtotal each. Statements and the monthly batch list the app on every line.
- **Access codes:** one card per enrolled app on the creator home. UnSwipe shows "Code coming soon" until its codes are imported.
- **Platform:** shown prominently with a TikTok or Instagram icon and name everywhere. Platform filter on the deals board and the posts review queue. The rights text on offers mentions Spark Ads (TikTok) or partnership ads and the branded-content tool (Instagram).

## Phase 4 — Test on the live site, fix, publish
1. Switch the selector to UnSwipe
2. Create a UnSwipe UGC brief
3. Enrol the test creator in UnSwipe
4. The creator sees the brief badged UnSwipe
5. The brief disappears when that enrolment is turned off
6. Log a post against the brief
7. Approve it
8. The payout line carries app UnSwipe
9. The monthly batch groups it separately
10. `/creators/unswipe/ugc` shows UnSwipe branding and copy

Each step is reported PASS or FAIL. Failures are fixed, then the site is published again.

## Technical details
- `apps` table readable by the public (safe columns only), editable by admins. The logo goes in a new public `app-logos` storage bucket.
- `app_id uuid not null default <sophia id> references apps` is added to each tagged table. It is filled in during the same migration, and indexes are added.
- The new tables `creator_apps` and `influencer_apps` are protected by row-level security. The creator/influencer brief rules are updated to require an active enrolment in the brief's app. `influencer_can_see_brief` also checks enrolment.
- The payout creation code and the post price-setting trigger copy `app_id` from the brief or deal onto payout lines.
- Brand is worked out in one shared helper: host → app by `domain`, else the path prefix `/creators/unswipe`, else Sophia. Public form server functions take the app slug and re-check it on the server.
- The admin selector is saved in `admin_ui_prefs` and exposed through one shared state used by every creators-mode list.
- Disclosure wording moves from a per-country setting to per-country-and-platform, kept inside the existing influencer settings row.
