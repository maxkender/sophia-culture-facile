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
- Creator programme data (creator_applications, slideshow_applications, later creators/briefs/posts) lives in its own tables and routes (/creators, /fr/createurs, /en/creators); never reuse author tables — the two sides must never mix.
- Public creator forms write through server functions in src/lib/creator-apply.functions.ts (honeypot + IP/email rate limit, service role); the tables have no anon policies.
- Creator Account Agreement lives in `documents` (slug `creator-agreement`); the slideshow variant is derived in code by dropping clause 5 and renumbering — keep one text, never two.
- Public creator application forms use distinct localized routes (`/fr/candidature-*`, `/en/*-application`); legacy `/creators/*/apply` paths only detect language and redirect.
- Admin spaces: authors admin uses ADMIN_AUTHOR_NAV only; all creator tracks (UGC, slideshow, influencer) live in the /hub shell, linked both ways at the sidebar bottom; old creator-admin URLs 301 into Hub sections; why: authors and creators must stay visually separate.
- Prospects grid prefs and saved views live in admin_ui_prefs (per user); why: choices must follow the admin across devices.

- Space routing is decided by src/lib/account-role.ts (admin > author > creator > none) in the /auteurs gate, the creator space and both login pages; why: one shared login must never show a person the wrong space.

- Slideshow pay zones: country_zones/pay_zones drive slideshow_applications.zone by trigger; the guide is merged server-side (slideshow-zones.functions.ts) so no other zone figures reach the client. UGC never uses zones.
- Creator-facing forms use the shared creator-validation utility before showing failures; why: raw validation, database, or payment-provider errors must never reach creators.
- Creator Hub scheduled work (daily post detection, dormancy, brief drop, budget cap, referrals) lives in src/lib/hub-automation.server.ts behind /api/public/cron/ugc/$job with job_locks leases; why: one authenticated entry point and no overlapping runs.
- Sidekick (src/lib/sidekick.functions.ts) answers only through whitelisted tools scoped to the selected app, never arbitrary SQL; all are read-only except create_fast_lane, which reuses the fast-lane server helper; why: numbers must come from real data and admins must not leak data across apps.
- Fast lane (src/lib/fast-lane.server.ts + fast-lane.functions.ts) is the only passwordless path: a 14-day one-time creators.fast_lane_token at /j/<token> signs the agreement and returns a server-generated magic-link token hash the browser exchanges with verifyOtp; why: pre-validated creators skip forms and passwords without a second account flow.
- Brief assets live in public.assets + private bucket creator-assets; creators get files only through signed links from assetLinks (RLS-checked); why: files stay private and app-scoped.
- Hub is split into three spaces (/hub/ugc, /hub/slideshows, /hub/influencers) defined in src/components/hub/spaces.ts; only the shell, Assistant and /hub/settings are shared; why: UGC, slideshow posters and influencers are separate businesses.
- Every Sophia OS call goes through src/lib/os-bridge.server.ts (OS_HUB_SECRET, 3 retries, logged in os_calls); screens read cached os_snapshots, never the OS live; why: the secret stays server-side and pages never depend on OS uptime.
- Slideshow poster lifecycle, OS snapshots and weekly payouts live in src/lib/slideshows.server.ts + slideshows.functions.ts; poster payout details are stored on slideshow_applications (posters are not creators); why: posters never mix with creator tables.
- Creator store codes are handed out only through src/lib/access-codes.server.ts assignAppCode, filtered by the app of the creator's job; why: a creator must never receive another app's code.
- UGC briefs carry briefs.style (5 styles) + briefs.style_data jsonb; per-style fields, score and creator rendering live in src/lib/brief-studio.ts and BriefPreview StyledPlans; plan assets are synced into brief_assets on save; why: one model drives editor, score and creator view.
