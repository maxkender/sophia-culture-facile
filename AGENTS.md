UGC creator acceptance and onboarding mutations use authenticated server functions; why: creator invitations, progress, and post ownership must be validated server-side.
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Creator data uses separate tables and /creators, /fr/createurs, /en/creators routes; never reuse author tables, to prevent mixing.
- Public creator forms write through server functions in src/lib/creator-apply.functions.ts (honeypot + IP/email rate limit, service role); the tables have no anon policies.
- Creator Account Agreement lives in `documents` (slug `creator-agreement`); the slideshow variant is derived in code by dropping clause 5 and renumbering — keep one text, never two.
- Public creator application forms use distinct localized routes (`/fr/candidature-*`, `/en/*-application`); legacy `/creators/*/apply` paths only detect language and redirect.
- Authors admin uses ADMIN_AUTHOR_NAV only; creator tracks use /hub, with reciprocal sidebar-bottom links and 301s from old creator-admin URLs; why: keep spaces separate.
- Prospects grid prefs and saved views live in admin_ui_prefs (per user); why: choices must follow the admin across devices.

- Space routing is decided by src/lib/account-role.ts (admin > author > creator > none) in the /auteurs gate, the creator space and both login pages; why: one shared login must never show a person the wrong space.

- Slideshow pay zones: country_zones/pay_zones drive slideshow_applications.zone by trigger; the guide is merged server-side (slideshow-zones.functions.ts) so no other zone figures reach the client. UGC never uses zones.
- Creator-facing forms use the shared creator-validation utility before showing failures; why: raw validation, database, or payment-provider errors must never reach creators.
- Creator Hub scheduled work (daily post detection, dormancy, brief drop, budget cap, referrals) lives in src/lib/hub-automation.server.ts behind /api/public/cron/ugc/$job with job_locks leases; why: one authenticated entry point and no overlapping runs.
- Sidekick (src/lib/sidekick.functions.ts) answers only through whitelisted tools scoped to the selected app, never arbitrary SQL; all are read-only except create_fast_lane, which reuses the fast-lane server helper; why: numbers must come from real data and admins must not leak data across apps.
- UGC applications never auto-accept: public forms only insert a pending creator_applications row + acknowledgement email; creator, login, code and welcome email are created only by admin Accept (ugc-accept.server.ts). Fast lane (fast-lane.functions.ts, FAST_LANE_ENABLED=false) and its /j page (kept in /dormant) are switched off; why: the owner validates every applicant himself.
- Brief assets live in public.assets + private bucket creator-assets; creators get files only through signed links from assetLinks (RLS-checked); why: files stay private and app-scoped.
- Hub is split into three spaces (/hub/ugc, /hub/slideshows, /hub/influencers) defined in src/components/hub/spaces.ts; only the shell, Assistant and /hub/settings are shared; why: UGC, slideshow posters and influencers are separate businesses.
- The OS bridge has a server-side dormant guard; slideshow snapshot/weekly cron entry points are disabled and weekly rows are prepared by an explicit admin action; why: hiding UI alone must not trigger external calls or automatic work.
- Slideshow poster lifecycle, OS snapshots and weekly payouts live in src/lib/slideshows.server.ts + slideshows.functions.ts; poster payout details are stored on slideshow_applications (posters are not creators); why: posters never mix with creator tables.
- Creator store codes are handed out only through src/lib/access-codes.server.ts assignAppCode, filtered by the app of the creator's job; why: a creator must never receive another app's code.
- UGC briefs carry briefs.style (5 styles) + briefs.style_data jsonb; per-style fields, score and creator rendering live in src/lib/brief-studio.ts and BriefPreview StyledPlans; plan assets are synced into brief_assets on save; why: one model drives editor, score and creator view.
- Inspiration (src/lib/inspirations.server.ts + inspirations.functions.ts) is the one video-ingest pipeline: Apify fetch → private bucket inspirations → ElevenLabs transcript → AI analysis; its 1-minute cron is armed on enqueue and unscheduled when the queue drains, and "Brief depuis une vidéo" reuses it for TikTok/Instagram links; why: every analysed video lands in one place and nothing polls when idle.
- Creator space i18n: `t`/`L` from src/i18n/creator-app.tsx (dict keyed by source text); Hub stays English; why: one UI, two languages.
- Never define components inside render around inputs; save on button/blur; why: remounts broke typing.
- UGC programme overview uses UgcOverview, never the legacy mixed CreatorsDashboard; why: author-side legacy code remains untouched and slideshow/influencer counts stay outside UGC.

- Slideshows uses its own PosterGuideEditor with poster labels and zone merge fields; why: keep author editing pages unchanged.
