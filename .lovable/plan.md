# Sophia marketing redesign + /start onboarding funnel

## 1. How the project is organised today

**Public marketing pages (Sophia app)**
- Home: `/` (FR) and `/en`, built from the home page component.
- App and info pages: `/sophia-culture-generale` and `/en/sophia-general-knowledge`, `/telecharger` and `/en/download`, careers, become-a-teacher, legal and privacy pages.
- Course hub and course pages: `/fr/cours/*` and `/en/lessons/*`, plus public author pages.
- Shared site pieces: header, footer, hero, phone mockup, phone gallery, store buttons/badges, sticky mobile download bar, scroll-reveal, FAQ, logo.

**Creator, author and admin areas (must not change)**
- Creator recruiting pages and application forms: `/creators/*`, `/fr/createurs`, `/en/creators`, the localized application forms, the 30-language slideshow pages, and `/creators/sign/$token`.
- Creator space `/creators/app/*`, influencer space, the Hub, the author portal `/auteurs/*`, invitation, payout and reset pages, and every `/api/public/*` endpoint (OS bridge, cron, email).
- These pages have their own components, their own translation files and their own "document" style (Inter). None of them use the marketing header or footer.

**Design tokens**: `src/styles.css`. The marketing site uses Poppins and a navy primary colour. The slideshow pages use their own Inter document tokens, scoped to their own class.

**Translations**: the marketing site uses `src/i18n/fr.ts` + `en.ts` (one dictionary per language) and a route map for FR/EN URL pairs. Creator areas use separate dictionaries.

**Store links**: one config file. Google Play is real. **The App Store link is still a placeholder**, so iOS currently goes through the taap.it smart link.

**Analytics**: no analytics tool is connected. Creator events are only pushed to a dataLayer.

## 2. Marketing redesign and how it stays separate

- New marketing look under one scoped wrapper class (for example `.mk`) with its own tokens: display font, colours, spacing scale, radii, shadows and motion. Global tokens used by creator and admin pages stay as they are.
- Rebuild only the marketing pieces: header (light, sticky, blurred on scroll, mobile menu), footer, home sections (big hero with a phone mockup, how it works, feature blocks with screenshots, social proof and ratings, subjects, FAQ, final CTA), and the app page.
- Smooth motion: scroll reveals and parallax screenshots done with CSS and a small IntersectionObserver helper. Reduced-motion settings are respected and no heavy library is added. Images are lazy-loaded and responsive (AVIF/WebP).
- All marketing copy goes into one new file per language (`src/i18n/marketing/fr.ts` + `en.ts`) with typed keys, so taglines can be swapped one by one later. The current text is moved over unchanged as the starting point.
- URLs, page titles and descriptions, canonical/hreflang tags, structured data, sitemap and course pages keep working. Course pages only get the new header and footer.
- Safety: no changes to creator, author, Hub or API files. Before and after the change, run a check that loads every creator, slideshow (sample of languages), sign and login page and compares them, and run the existing tests.

## 3. The /start funnel

- New pages: `/start` (French by default; language also taken from the browser or `?lang=`) and `/en/start`, as one self-contained app-like screen flow. It does not use the site header or footer, so it feels like the mobile app.
- Steps: welcome, interests, level, goal, daily time, 3 quiz questions with fun facts, reminder time, "building your plan" loader, result with a 30-day plan, paywall placeholder, then success with store buttons.
- One config file holds the steps, options, quiz questions, fun facts, plan rules, prices/plans (placeholder, no payment) and all FR/EN copy.
- Answers are kept in the URL step and session storage, so going back or refreshing does not lose progress. Back button and swipe-safe navigation are included.
- `?src=` (and the usual utm parameters) is read once, stored for the session, and attached to every event (`start_view`, `step_view`, `step_answer`, `quiz_answer`, `plan_shown`, `paywall_view`, `plan_selected`, `store_click`). Events go to the existing dataLayer helper (a separate funnel type) until you choose an analytics tool.
- Store buttons reuse the existing link config, pick the right store for iPhone or Android, and carry `src` where the store link supports it.
- TikTok in-app browser: `100dvh` with safe-area padding, no hover-only effects, no popups or new tabs, `location.href` for store links, an "open in browser" hint as a fallback, light pages (no blocking fonts or images), and no reliance on third-party cookies or localStorage alone. Tested at 390px with a TikTok user-agent in Playwright.
- The page will not be indexed by search engines and will not be in the sitemap.
- Reused pieces: logo, phone mockup and store buttons (restyled per scope), store link config and dataLayer helper. The app-look visuals (buttons, progress bar, option cards) are new components that match your screenshots.

## 4. What we need from you

1. Screenshots of every onboarding screen in the app, in light and dark mode if both exist, ideally a screen recording to match the animations.
2. The app's exact colours (hex), font names and font files or licences, button radius and shadows, and the illustration and mascot files (SVG/PNG/Lottie).
3. A logo in SVG (colour and white versions) and the app icon.
4. **The real App Store URL** (currently a placeholder), and whether the funnel should send people to the stores directly or through taap.it.
5. 4–6 polished app screenshots for the phone mockups, in FR and EN.
6. Social proof you can stand behind: store rating, number of reviews and downloads, and real reviews you allow us to quote. Nothing will be invented.
7. Prices and plans for the paywall (monthly, yearly, trial) and the currency.
8. Which analytics tool you want (TikTok Pixel, GA4, PostHog...) and its IDs, or keep dataLayer only for now.
9. Whether /start should be FR+EN only or more languages, and the default language.

## Technical details

- New files: `src/components/marketing/*`, `src/i18n/marketing/{fr,en}.ts`, `src/config/onboarding.ts`, `src/components/onboarding/*`, `src/routes/start.tsx`, `src/routes/en/start.tsx`, `src/lib/onboarding-events.ts`.
- Files to edit: the marketing page components (`HomePage`, `LandingPage`, `DownloadPage`), `components/site/*` (header, footer, hero, phone mockup, store buttons), and a scoped block in `styles.css`. Fonts are added with a `<link>` in the head of `__root`.
- Files not touched: `components/creators|hub|portal|influencers`, `CreatorsPages`, `ApplyPage`, `UgcEarnPage`, the slideshow components and dictionary, all `src/lib/*.server.ts` and `*.functions.ts` files, and `routes/api/*`.
- Delivery happens in two separate passes (redesign first, then /start). Each pass is checked with screenshots and nothing is published until you approve it.
