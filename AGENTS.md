UGC acceptance/onboarding mutations use authenticated server functions to validate invitations, progress and post ownership.
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
- Prospects grid prefs/views live in admin_ui_prefs; why: follow the admin across devices.

- Space routing is decided by src/lib/account-role.ts (admin > author > creator > none) in the /auteurs gate, the creator space and both login pages; why: one login never shows the wrong space.

- Slideshow pay zones: country_zones/pay_zones drive slideshow_applications.zone by trigger; the guide is merged server-side (slideshow-zones.functions.ts) so no other zone figures reach the client. UGC never uses zones.
- Creator-facing forms use the shared creator-validation utility before showing failures; why: raw validation, database, or payment-provider errors must never reach creators.
- Hub scheduled jobs live in src/lib/hub-automation.server.ts behind /api/public/cron/ugc/$job with job_locks leases; why: one authenticated entry point and no overlapping runs.
- Sidekick (src/lib/sidekick.functions.ts) answers only through whitelisted tools scoped to the selected app, never arbitrary SQL; all are read-only except create_fast_lane, which reuses the fast-lane server helper; why: numbers must come from real data and admins must not leak data across apps.
- UGC applications never auto-accept: public forms only insert a pending creator_applications row + acknowledgement email; creator, login, code and welcome email are created only by admin Accept (ugc-accept.server.ts). Fast lane (fast-lane.functions.ts, FAST_LANE_ENABLED=false) and its /j page (kept in /dormant) are switched off; why: the owner validates every applicant himself.
- Brief assets live in public.assets + private bucket creator-assets; creators get files only through signed links from assetLinks (RLS-checked); why: files stay private and app-scoped.
- Hub is split into three spaces (/hub/ugc, /hub/slideshows, /hub/influencers) defined in src/components/hub/spaces.ts; only the shell, Assistant and /hub/settings are shared; why: UGC, slideshow posters and influencers are separate businesses.
- The OS bridge is live for slideshow posters (17/10): contract signature triggers createPosterInOs (failure never blocks signing; Retry on the card); weekly rows stay an explicit admin action; why: only poster creation is automatic, money never moves by itself.
- Slideshows use slideshows.server.ts/functions.ts and slideshow_applications, never creators. Signing saves startMondayAtSignature with signature/status before OS so dates agree. vitest.config.ts skips RPC transforms for mocked handler tests.
- Creator store codes are handed out only through src/lib/access-codes.server.ts assignAppCode, filtered by the app of the creator's job; why: a creator must never receive another app's code.
- UGC video format definitions live in public.ugc_formats; briefs.style remains the format key and style_data stores shot content; the editor reads definition structures, and plan assets sync to brief_assets on save; why: owner-editable definitions drive editing while existing briefs remain compatible.
- Inspiration (src/lib/inspirations.server.ts + inspirations.functions.ts) is the one video-ingest pipeline: Apify fetch → private bucket inspirations → ElevenLabs transcript → AI analysis; its 1-minute cron is armed on enqueue and unscheduled when the queue drains, and "Brief depuis une vidéo" reuses it for TikTok/Instagram links; why: every analysed video lands in one place and nothing polls when idle.
- Creator space i18n: `t`/`L` from src/i18n/creator-app.tsx (dict keyed by source text); Hub stays English; why: one UI, two languages.
- No components defined inside render around inputs; save on button/blur; why: remounts broke typing.
- UGC programme overview uses UgcOverview, never the legacy mixed CreatorsDashboard; why: author-side legacy code remains untouched and slideshow/influencer counts stay outside UGC.

- Slideshows uses its own PosterGuideEditor with poster labels and zone merge fields; why: keep author editing pages unchanged.
- Slideshow CRM styling is scoped by slides-crm; shared detail Sheets reuse PosterCard and all existing server actions, and Rates uses an opt-in compact view; why: keep other tracks, settings, public pages and lifecycle behavior unchanged.

- UGC drafts: creators insert only 'submitted' creator_drafts rows; admins review (ugc-drafts.functions.ts); post links need a validated draft when draft_required; why: owner approves every video.
- Slideshow landing/form copy for all 30 languages comes only from src/i18n/slideshow-pages.json via slideshow-pages.ts (EN/FR keep historic URLs, others /{urlCode}/creators/slideshow[/apply]); why: one final translated source, no hardcoded strings.
- Public slideshow pay previews reuse getSlideshowPayInfo and carry only a validated ISO country query into the form; why: show existing rates before applying without changing payouts or storing personal data.
- Slideshow OS referral codes use separate expiring browser storage and slideshow_applications.ref, then non-blocking request.waitUntil notifications and the existing signing payload; why: preserve other tracks and application success.
- OS email and Brevo event receivers are authenticated TanStack public server routes using the existing Brevo credential, never Lovable's managed generic sender; why: external OS-authored referral messages need provider headers and event tracking without changing existing email call sites.
- The /start web-to-app funnel copy, options, quiz and placeholder prices live only in src/config/onboarding.ts, its styles are scoped under `.ob-*`, and events go through src/lib/onboarding-events.ts with `src` attached; why: copy can be rewritten without touching components and the funnel stays isolated from the site and creator flows.
- Sophia Studio v2 (block-format courses) lives in studio_* tables, src/lib/studio/*, src/components/studio/* and src/i18n/studio*.tsx; legacy courses/screens/sources stay untouched, onboarding progress is profiles.onboarding_step (the /auteurs gate resumes /auteurs/join until "done"), and creator_status/creator_slug/creator_verified are desk-only fields enforced by guard_profile_privileges; why: new flow without breaking legacy authors.
