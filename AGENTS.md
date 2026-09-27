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
