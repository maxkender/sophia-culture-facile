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
- Admin sidebar has two modes (ADMIN_AUTHOR_NAV / ADMIN_CREATOR_NAV in nav.ts), picked from the URL then localStorage; why: authors and creators must stay visually separate.
- Prospects grid prefs and saved views live in admin_ui_prefs (per user); why: choices must follow the admin across devices.

- Space routing is decided by src/lib/account-role.ts (admin > author > creator > none) in the /auteurs gate, the creator space and both login pages; why: one shared login must never show a person the wrong space.

- Slideshow pay zones: country_zones/pay_zones drive slideshow_applications.zone by trigger; the guide is merged server-side (slideshow-zones.functions.ts) so no other zone figures reach the client. UGC never uses zones.
- Creator-facing forms use the shared creator-validation utility before showing failures; why: raw validation, database, or payment-provider errors must never reach creators.
- Creator Hub scheduled work (daily post detection, dormancy, brief drop, budget cap, referrals) lives in src/lib/hub-automation.server.ts behind /api/public/cron/ugc/$job with job_locks leases; why: one authenticated entry point and no overlapping runs.
- Sidekick (src/lib/sidekick.functions.ts) answers only through whitelisted tools scoped to the selected app, never arbitrary SQL; all are read-only except create_fast_lane, which reuses the fast-lane server helper; why: numbers must come from real data and admins must not leak data across apps.
- Fast lane (src/lib/fast-lane.server.ts + fast-lane.functions.ts) is the only passwordless path: a 14-day one-time creators.fast_lane_token at /j/<token> signs the agreement and returns a server-generated magic-link token hash the browser exchanges with verifyOtp; why: pre-validated creators skip forms and passwords without a second account flow.
- Brief assets live in public.assets + private bucket creator-assets; creators get files only through signed links from assetLinks (RLS-checked); why: files stay private and app-scoped.
