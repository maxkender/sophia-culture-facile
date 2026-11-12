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

- Only admins have a space here: src/lib/account-role.ts homeFor sends admins to /hub/slideshows and everyone else to /account-not-set-up; why: the site is slideshow-only.

- Slideshow pay zones: country_zones/pay_zones drive slideshow_applications.zone by trigger; the guide is merged server-side (slideshow-zones.functions.ts) so no other zone figures reach the client. UGC never uses zones.
- Creator-facing forms use the shared creator-validation utility before showing failures; why: raw validation, database, or payment-provider errors must never reach creators.
- Hub scheduled jobs live in src/lib/hub-automation.server.ts behind /api/public/cron/ugc/$job with job_locks leases; why: one authenticated entry point and no overlapping runs.
- The OS bridge is live for slideshow posters (17/10): contract signature triggers createPosterInOs (failure never blocks signing; Retry on the card); weekly rows stay an explicit admin action; why: only poster creation is automatic, money never moves by itself.
- Slideshows use slideshows.server.ts/functions.ts and slideshow_applications, never creators. Signing saves startMondayAtSignature with signature/status before OS so dates agree. vitest.config.ts skips RPC transforms for mocked handler tests.
- No components defined inside render around inputs; save on button/blur; why: remounts broke typing.

- Slideshows uses its own PosterGuideEditor with poster labels and zone merge fields; why: keep author editing pages unchanged.
- Slideshow CRM styling is scoped by slides-crm; shared detail Sheets reuse PosterCard and all existing server actions, and Rates uses an opt-in compact view; why: keep other tracks, settings, public pages and lifecycle behavior unchanged.

- Slideshow landing/form copy for all 30 languages comes only from src/i18n/slideshow-pages.json via slideshow-pages.ts (EN/FR keep historic URLs, others /{urlCode}/creators/slideshow[/apply]); why: one final translated source, no hardcoded strings.
- Public slideshow pay previews reuse getSlideshowPayInfo and carry only a validated ISO country query into the form; why: show existing rates before applying without changing payouts or storing personal data.
- Slideshow OS referral codes use separate expiring browser storage and slideshow_applications.ref, then non-blocking request.waitUntil notifications and the existing signing payload; why: preserve other tracks and application success.
- OS email and Brevo event receivers are authenticated TanStack public server routes using the existing Brevo credential, never Lovable's managed generic sender; why: external OS-authored referral messages need provider headers and event tracking without changing existing email call sites.
- Ruul journey uses a dedicated protected route and pure read model in ruul-journey.ts, with OS referral mapping isolated in normalizeReferral; why: tracking must not change slideshow lifecycle and incomplete OS timestamps must never be invented.
- Slideshow acquisition attribution is isolated in slideshow-attribution.ts and mirrored by its database trigger; last UTM touch wins, declared answers stay separate, and marketing consent gates identifiers/Meta with browser-generated shared Lead UUIDs; why: tracking must remain auditable without altering applications or other funnels.
- Site is slideshow-only: other tracks' routes were removed (tables kept; code before 2908c0bc) , / and /{lang} for every slideshow language show the mini HomeLanding (copy in src/i18n/home-landing.json, test keeps it in sync with SLIDESHOW_LANGUAGES) (CTA keeps ref/utm) and src/server.ts 301s old creator URLs to the slideshow page; why: the rest of sophia-culture.com goes to another project.
- Slideshow auto-accept lives in slideshow-auto-accept.ts (pure rule, also drives Hub reason badges) and .server.ts (runs before acknowledgement on submit and via the hourly slides-auto-accept cron, max 100, audited in activity_log); it always calls acceptSlideshowApplication and marks decided_via='auto' because decided_by is a profile uuid; why: one acceptance path.
- Every absolute link comes from SITE_URL in src/config/site.ts (server code may override via env SITE_URL); why: the domain moved once already and must change in one place.
- Admin auth email callbacks use admin-auth-links.ts with the current origin and public /auth or /reset-password paths; /auth validates the recovered user's role before routing, so removed author paths and anonymous account creation are not used.

- Poster email layout is isolated in slideshow-email-render.ts; Paris Sunday-midnight cutoff dates are shared in slideshow-start.ts; why: one deadline calculation across acceptance, signing and reminders without changing other email layouts.
- Poster templates share the Help footer and one payment-copy helper; reminder jobs preserve the seven-day no-backfill window and report send/timeline failures, with no arbitrary 500-row cut; why: consistent messages and observable reminders without contacting historical applicants.
