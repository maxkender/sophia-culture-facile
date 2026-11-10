# Vik Studios poster site — cleanup and domain switch (PLAN ONLY)

Restore point: commit `81baf200cffbb78d3d06f4208c4245cdc0e06f32`. No tables, columns or rows are dropped. Removed areas are taken out of routes, navigation and schedules only; the code stays in git history and any shared modules the poster side imports are kept.

## Recommendation for "/"
A permanent 301 from `/` to `/en/creators/slideshow`, and the same for `/fr` → `/fr/createurs/slideshow`. Browser-language detection is avoided because it gives a different result per visitor, which complicates tracking and caching. A separate landing page can come later.

## Branding wording (proposal)
- Site name, page titles, Hub header, email sender name and footer: **"Vik Studios"**.
- Description of the job keeps the app name: "Post slideshows for **Sophia**, a general-knowledge app, and get paid every Monday via Ruul — a Vik Studios creator programme."
- Contract (`creator-agreement` document) and signed text: **not changed** (legal text; any change goes through you separately).
- Email footer: "Vik Studios — slideshow creator programme · vik-studios-creators.com · Reply STOP / unsubscribe".
- Mascot/logo on the poster pages: stays (it represents the Sophia app) unless you send a Vik Studios logo.

## 1. Routes and files

### KEEP
- Public poster pages: `src/routes/en/creators/slideshow.tsx`, `src/routes/fr/createurs/slideshow.tsx`, `src/routes/$lang/creators/slideshow.index.tsx` + `slideshow.apply.tsx`, `src/routes/en/slideshow-application.tsx`, `src/routes/fr/candidature-slideshow.tsx`, the legacy `creators.slideshow.index.tsx` / `creators.slideshow.apply.tsx` (language-detect redirects), `creators.sign.$token.tsx`, `poster-unsubscribe.ts`, `payout.$token.tsx` (used by `slideshows.server.ts` `payoutLink`), `reset-password.tsx`, `auth.tsx` (admin login), `account-not-set-up.tsx`, `__root.tsx`, `sitemap[.]xml.ts` (reduced to poster URLs), `index.tsx` (becomes the redirect).
- One legal/privacy page for the programme: keep `en/privacy.tsx`, `confidentialite.tsx` and the legal-notice pair, rewritten for Vik Studios + Meta pixel/cookies + Ruul (text supplied by you or drafted for your review).
- Hub: `_authenticated/route.tsx`, `_authenticated/hub/route.tsx`, `hub/index.tsx` (redirects to `/hub/slideshows`), `hub/slideshows/*` (index, `$section`, `parcours-ruul`), `hub/settings.tsx` (only the slideshow/OS/Meta cards shown).
- API: `api/public/os-email.ts`, `os-email-events.ts`, `os-candidatures.ts`, `api/public/cron/ugc.$job.ts` (kept at the same path so existing schedules keep working; non-slideshow jobs return 404).
- Libraries: all `slideshow-*`, `slideshows.*`, `os-*`, `brevo.server.ts`, `email-send.server.ts`, `account-role.ts`, `hub-automation.server.ts` (slides jobs + `job_locks`), `creator-apply.functions.ts` (slideshow part), documents/agreement loader, `i18n/slideshow-pages.*`.

### REMOVE (route files deleted; tables kept)
- Sophia marketing: `en/index.tsx`, `fr/index.tsx` (replaced by redirects), `en/sophia-general-knowledge.tsx`, `fr/sophia-culture-generale.tsx`, `sophia-culture-generale.tsx`, `en/lessons/*`, `fr/cours/*`, `cours/*`, `careers.tsx`, `en/careers.tsx`, `fr/careers.tsx`, `jobs.$slug.tsx`, `en/download.tsx`, `fr/telecharger.tsx`, `telecharger.tsx`, `start.tsx`, `en/start.tsx`, `[.]well-known.apple-app-site-association.ts`, `api/public/app/courses*.ts` (see risk R6).
- Authors/profs: `auteurs.*`, `en/authors.$slug.tsx`, `fr/auteurs.$slug.tsx`, `devenir-professeur.tsx`, `en/become-a-teacher.tsx`, `_authenticated/auteurs/**`, `invite.$token.tsx`.
- UGC: `creators.app.*`, `creators.ugc.*`, `en/creators/ugc.tsx`, `fr/createurs/ugc.tsx`, `en/ugc-application.tsx`, `fr/candidature-ugc.tsx`, `creators.invite.tsx`, `creators.login.tsx` (see risk R4), `creators.index.tsx`, `en/creators/index.tsx`, `fr/createurs/index.tsx` (→ redirect to slideshow), `hub/ugc/**`, `hub/ads`, `affiliates`, `analytics`, `campaigns.*`, `creators.$creatorId`, `discover`, `learn*`, `messages`, `payouts`, `tools.$`.
- Influencers: `creators.influencer.*`, `en/creators/influencer.tsx`, `fr/createurs/influenceur.tsx`, `en/influencer-application.tsx`, `fr/candidature-influenceur.tsx`, `hub/influencers/**`.
- UnSwipe: `creators.unswipe.*`, `en/creators/unswipe/*`, `fr/createurs/unswipe/*`, and the `unswipe` branch in `SlideshowDoc.tsx`.
- Other: `go.$handle.ts`, `api/public/stripe/webhook.ts`, `api/public/tiktok/oauth.ts`.
- Components/libs used only by removed routes (marketing, portal, studio, creators/app, influencer, hub/ugc, ads, sidekick, notion-sync, fast-lane, inspirations, access-code pages) are deleted after an import check; anything a kept file imports stays.

### Schedules
- Keep: `slides-remind`, `slides-os-retry`, `slides-pool-expiry`, `slides-snapshots`, `slides-week`.
- Delete: `ugc-d7` and `ugc-ads-metrics` (active), `ugc-notion-sync` (active, every 10 min), plus the inactive `ugc-*` ones (compliance, monthly, planner-reminder, daily-detect, dormancy, brief-drop, tiers, nurture x2). No email is sent by deleting them.

## 2. Hard-coded `sophia-culture.com`

| Place | Change |
|---|---|
| `src/config/site.ts` `SITE_URL` | `https://vik-studios-creators.com` |
| Fallbacks `process.env.SITE_URL ?? "https://sophia-culture.com"` in `slideshows.server.ts`, `slideshow-accept.server.ts`, `slideshow-reminders.server.ts`, `slideshow-unsubscribe.server.ts`, `os-candidatures.server.ts` | one shared helper reading `SITE_URL` from config |
| `SITE_URL` secret (if set) | update to the new URL (done in Lovable secrets, I check whether it exists) |
| `email-send.server.ts` `SENDER_DOMAIN = notify.sophia-culture.com`, `FROM_DOMAIN`, footer text | new sender domain `notify.vik-studios-creators.com` — must be set up and DNS-verified first (step 2 of the order) |
| `os-email.server.ts` sender `noreply@sophia-culture.com` (Brevo) | `noreply@vik-studios-creators.com` — **you** must add and authenticate this domain in Brevo (SPF/DKIM) |
| `brevo.server.ts` fastlane check | removed with fast lane |
| Tests (`slideshow-emails`, `slideshow-attribution`, `slideshow-apply-attribution`, `os-email`) | updated URLs |
| `slideshow-measurement-brief.md` ad URL | new domain |
| Removed-only files (`ads.server.ts`, `go.$handle`, `hub-automation` UGC buttons, `notion-sync`, `sidekick`, influencer/creator-payout functions, portal/creator dicts) | deleted with their areas |
| `apps.domain` row (migration 0029) and the old test email seed | data, left as is |
| Schedule targets | the 5 kept `slides-*` schedules: I verify their target host and repoint them to the new domain only after publish (step 5) |

**You must change outside Lovable:**
- Brevo: authenticate sender domain `vik-studios-creators.com`; change the transactional webhook URL to `https://vik-studios-creators.com/api/public/os-email-events` (same bearer token).
- Sophia OS team: base URL for `/api/public/os-email` and `/api/public/os-candidatures` → new domain (same `x-hub-secret`); referral email templates/links generated by the OS → new domain.
- Sophia mobile app: creators-screen buttons → `https://vik-studios-creators.com/en/creators/slideshow?...` (old links keep working only via the new owner's redirect).
- Meta: add `vik-studios-creators.com` to the pixel's allowed/verified domains and update ad URLs.
- Slack/Ruul/any doc linking the old domain.
- Domain settings: make `vik-studios-creators.com` Primary (already listed as primary) and **disconnect `sophia-culture.com` + `www`** from this project when the new owner is ready — otherwise both projects fight for it.

**Handled in Lovable:** sign-in redirect URLs follow the primary domain; I check and, if needed, add `https://vik-studios-creators.com` to the allowed redirect list for password reset.

## 3. Old links already sent
If the new owner 301-redirects the **same path and the full query string** to `https://vik-studios-creators.com`, everything keeps working:
- Signing tokens, payout tokens and unsubscribe tokens are stored or signed on the server, not tied to the host, so they stay valid.
- `?ref=` and `utm_*`/`fbclid` are read from the URL on arrival, so they are saved on the new domain. Only a code saved earlier in a visitor's browser on the old domain is lost (it was never sent to us); the link itself works again.
- POST endpoints (OS, Brevo) must **not** depend on a redirect — many clients do not resend a POST after a 301. They must point at the new URL (section 2). If the new owner uses 308, POST would also work as a temporary fallback.

Paths that must be redirected (path + query kept):
```text
/creators/sign/*                 signing links (~95 acceptance + reminder emails)
/payout/*                        poster payout links
/poster-unsubscribe*             unsubscribe links (exact path/query as in emails)
/en/creators/slideshow*          referral + ad + app links, all query params
/fr/createurs/slideshow*
/{lang}/creators/slideshow*      28 other languages (incl. /apply)
/en/slideshow-application*  /fr/candidature-slideshow*
/creators/slideshow*             legacy redirects
/en/creators/{role}  /fr/createurs/{role}   Sophia app buttons (role = slideshow; ugc/influencer → slideshow on our side)
/reset-password*  /auth*         admin/poster password emails
/api/public/os-email, /api/public/os-email-events, /api/public/os-candidatures   (308 only, as fallback)
/api/public/cron/ugc/*           only until schedules are repointed
```
Simplest instruction to the new owner: "redirect the paths above with 301 (308 for /api/public/*), keeping the query string".

## 4. Order of operations (no downtime)
1. Set up the email sender domain `notify.vik-studios-creators.com` and Brevo domain; wait for DNS verification. Nothing changes for users.
2. Code pass: domain constants, branding, removals, `/` redirect, legal page. Tests green. Publish. Both domains still serve this project, so old links keep working directly.
3. Check live on the new domain: poster pages in 3 languages, apply form (no submission), signing page with a test token, unsubscribe page, Hub slideshows.
4. Switch email sender to the new domain once verified (until then emails keep the old verified sender).
5. Repoint the 5 slideshow schedules; delete the UGC schedules.
6. You: Brevo webhook URL, OS base URL, Meta domain, Sophia app links.
7. Watch 48 h: OS calls, Brevo events, emails sent, cron runs.
8. Only then: disconnect `sophia-culture.com` from this project; the new owner connects it and puts the redirects live the same hour.

## 5. Tests after
- Existing vitest suites (slideshow, OS email/events, attribution, reminders, dates, accept) with new-domain URLs.
- Small new test: every absolute link builder (sign, payout, unsubscribe, OS payloads) starts with `https://vik-studios-creators.com`.
- Browser (390 / 1440): `/` redirect, 30 poster pages + apply forms load with `?ref=` and `utm_*` kept into the form; cookie banner; pixel only after consent (simulated); `/start`, `/auteurs`, `/creators/app`, `/hub/ugc` return 404/redirect.
- Hub as hub.test: all Slideshows pages, Parcours Ruul, OS card ping and zones only (no accept, no poster creation, no signing, no Retry).
- HTTP checks: OS endpoints reject without secret, Brevo receiver rejects without bearer, cron route rejects without secret and 404s removed jobs.
- No real application, email, contract or payout during tests.

## Risks
- R1 Email sender: switching before DNS verification stops all poster emails. Mitigation: switch only after verification.
- R2 OS/Brevo POSTs lost if they rely on a 301 from the old domain. Must be repointed before step 8.
- R3 Shared code: some removed areas share modules with slideshows (account-role, documents, email, hub shell, settings). Deleting the wrong file breaks the build or a flow; mitigated by import checks and the restore point.
- R4 Login: admin login and poster OS logins — the poster login lives in Sophia OS, not here; I confirm no poster uses `/creators/login` before removing it (otherwise keep it).
- R5 Existing UGC/influencer/author users (Juliette, authors) lose access to their spaces. Data stays, but they can no longer sign in here. Needs your OK.
- R6 Sophia mobile app may call `/api/public/app/courses*` and `.well-known/apple-app-site-association` on sophia-culture.com. These belong to the new owner; removing them here is safe only once the domain moves. Until step 8 I keep them live.
- R7 `ugc-notion-sync`, `ugc-d7`, `ugc-ads-metrics` stop; any Notion/ads reporting relying on them stops.
- R8 Old-domain localStorage (saved ref codes, cookie consent) does not carry over; visitors see the cookie banner again.
- R9 SEO: old indexed URLs disappear from this project; canonical/hreflang/sitemap now use the new domain.
- R10 If the new owner does not set up redirects, all ~95 signing links and sent referral links break. Optional mitigation: re-send signing reminders with new-domain links (only with your explicit OK).
- R11 Contract text mentions "Sophia" as account owner; legal entity naming must be confirmed by you, not changed by me.
- R12 Meta pixel events from a new domain may be held until the domain is verified in Meta.

## Open questions
1. Approve the `/` redirect (vs a simple landing)?
2. Legal entity name and address for the new legal/privacy page?
3. OK that authors/UGC/influencer users lose access here (R5)?
4. Do you have a Vik Studios logo?
