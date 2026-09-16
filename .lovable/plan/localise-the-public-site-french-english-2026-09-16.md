# Localise the public site (French / English)

Public marketing pages, FAQ, published courses and author pages get two clean language versions under `/fr/...` and `/en/...`. The author portal, admin, contract, writing guide and examples page are untouched and stay English.

## Assumptions

- Paths keep their localised wording inside the prefix: `/fr/cours`, `/fr/telecharger`, `/fr/devenir-professeur`, `/en/lessons`, `/en/download`, `/en/become-a-teacher`. (The brief mentions both `/courses` and `/en/lessons`; keeping the existing English wording avoids a second round of redirects on URLs already published.)
- Current French URLs (`/`, `/cours`, `/cours/slug`, `/telecharger`, `/mentions-legales`, `/confidentialite`, `/devenir-professeur`, `/sophia-culture-generale`, `/auteurs/slug`) redirect 301 to their `/fr/...` equivalent. Existing `/en/...` URLs stay exactly where they are.
- `/auth`, `/auteurs/invite`, `/reset-password` and everything under the portal keep their current URLs, no prefix.
- Published courses are currently all French. A new language field is added, defaulting to French, so English courses can be published later without another migration.

## What the visitor gets

- First visit to `/` sends them (302, not cached) to `/fr` or `/en` based on: their saved choice, then their browser languages, then their country, then English.
- A small language link in the header and in the footer showing the other language; clicking it saves the choice and lands on the same page in that language — a course page goes to its counterpart when one exists, otherwise to the course index of that language.
- Each page declares the correct `lang`, a canonical for its own language, and `fr` / `en` / `x-default` alternates.

## Technical plan

### 1. Language detection (server side)

New `src/lib/locale.server.ts` + `src/lib/locale.functions.ts`:

- `detectLang(headers)`: cookie `sophia_lang` (`fr`|`en`) → `Accept-Language` (any tag starting with `fr`) → `cf-ipcountry` / `x-vercel-ip-country` against a francophone country list (FR, BE, CH, LU, MC, CA, SN, CI, CM, MA, TN, DZ, ML, BF, NE, GN, BJ, TG, MG, CD, CG, GA, TD, RW, BI, HT) → `en`.
- `setLangCookie(lang)` server fn: 1-year cookie, `SameSite=Lax`, path `/`, not http-only (the switcher writes it client side too).
- `src/routes/index.tsx` becomes a redirect-only route: `beforeLoad` calls the detection server fn and throws `redirect({ to: '/fr' | '/en', statusCode: 302 })`.

### 2. Route restructure

- Move every French public route file under `src/routes/fr/`: `index.tsx`, `cours/index.tsx`, `cours/$slug.tsx`, `telecharger.tsx`, `mentions-legales.tsx`, `confidentialite.tsx`, `devenir-professeur.tsx`, `sophia-culture-generale.tsx`, `auteurs/$slug.tsx`.
- Add the missing English counterparts that only exist in French today: `/en/lessons/$slug` gains the published-course branch, and `/en/authors/$slug` is added for author pages.
- Old paths become thin redirect routes: `beforeLoad` throws `redirect({ to: <fr path>, statusCode: 301 })`, params preserved for `$slug`.
- `src/i18n/routes.ts`: `ROUTES` rewritten with the prefixed paths, plus `authors` and a `switchPath(pathname, lang)` helper used by the switcher.

### 3. Content and metadata

- Fill every gap in `src/i18n/en.ts` so the English dictionary covers the same keys as `src/i18n/fr.ts`, written as English copy rather than a literal translation — including the disambiguation paragraph naming the Sophia robot, Sophia University in Tokyo and the Assurance Maladie programme, phrased for an English reader.
- Each route's `head()` gets its own English/French title, description and Open Graph text; `langLinks()` in `src/lib/seo.ts` already emits canonical + hreflang and follows the new paths automatically.
- `x-default` points at the English version (the wider audience) while `/fr` and `/en` each self-canonicalise.

### 4. Published courses

- Migration: `alter table public.courses add column language text not null default 'fr' check (language in ('fr','en'))`, plus an optional `alternate_slug` to pair a course with its counterpart.
- `public-content.functions.ts`: `listPublishedCourses` takes a language filter; course lookup returns the language so the page can set `lang` and hreflang (self-only when there is no counterpart).
- Course index: courses in the visitor's language first, with a visible toggle ("Also show English lessons" / "Voir aussi les cours en français") rather than hiding the others. No machine translation anywhere.
- Author pages list that author's courses with a language marker.

### 5. Switcher, sitemap, robots

- `LanguageToggle` extended: writes the cookie, then navigates to the same page in the other language (course-aware via `alternate_slug`).
- `sitemap.xml`: static pages emitted under both prefixes with alternates; published courses emitted at their own language URL, with alternates only when a counterpart exists.
- `__root.tsx` `html lang` derives from the new `/fr` | `/en` prefix.

### 6. Verification

Run the browser against `/` with a French `Accept-Language`, then an English one; check the 302 target, the cookie behaviour on the second visit, a 301 from `/cours/<slug>` to `/fr/cours/<slug>`, and the canonical/hreflang tags on one page of each language.
