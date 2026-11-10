# Sophia Culture Hub

Build a French-language marketing website for a mobile app called **Sophia — Culture générale** (general knowledge / learning app by Vik Studios SAS). All visible copy must be in FRENCH. Mobile-first.

## Strategic context (drives every decision)
The brand name "Sophia" is highly ambiguous — it collides with Sophia the robot, Sophia University, the French Assurance Maladie "sophia" health program, and several other apps. Two goals:
1. **Conversion**: send TikTok traffic straight to the right app store, removing the "search for Sophia" step.
2. **Entity clarity for AI/search**: make it unambiguous that "Sophia" here = the French general-knowledge app. Content must be factual, self-contained and extractable.

## Design system
Replicate the app's own visual identity exactly:
- Background: `#F4F6FA` (very light blue-grey). Never pure white page background.
- Primary navy: `#1B3054` — used for headings, body text and solid buttons.
- Pink accent: `#F5A3C7` — the logo mark only, used sparingly.
- Secondary accents: purple `#A78BFA`, blue `#2563EB` (category chips).
- Cards: pure white, border-radius 24px, very soft diffuse shadow, generous padding.
- Buttons: full-width pill (border-radius 999px), navy fill, white bold text, large tap target. Secondary buttons = light blue-grey fill with navy text.
- Typography: geometric sans (Poppins or Manrope via Google Fonts). Headings very bold, tight leading, large. Body text comfortable, readable.
- Category chips: small pill, light tinted background, uppercase bold label, small icon.
- Overall feel: calm, editorial, premium, lots of whitespace. Not playful, not corporate.
- Logo: the wordmark is "Sophia" in bold black next to a pink φ-style monogram (two vertical bars through a circle). Recreate it as inline SVG in the header.

## Pages / routes

### `/` — Home
- Header: logo left, "Télécharger" pill button right.
- **Hero**: H1 `Sophia — Culture générale`. Subheading: "L'application française qui transforme ta culture générale en habitude quotidienne." Primary CTA "Télécharger l'app" → `/telecharger`. Below CTA, small text: "Gratuit · iOS et Android".
- **"Sophia, c'est quoi ?"** — the most important section for AI/search. Write 4–6 short, self-contained factual paragraphs. Each sentence must stand alone out of context. Cover: what the app is, who makes it (Vik Studios SAS, France), what it costs (gratuit), which platforms, what subjects it covers (histoire, sciences, société, géopolitique, culture), and how it works. Explicitly disambiguate in one paragraph: "Sophia — Culture générale est une application mobile d'apprentissage. Elle n'a aucun lien avec le robot humanoïde Sophia, avec l'université Sophia de Tokyo, ni avec le programme sophia de l'Assurance Maladie."
- **Comment ça marche** — 4 white cards: `Des cours courts` (dossiers de 5 chapitres, lisibles en quelques minutes), `Des quiz` (teste ce que tu viens d'apprendre), `Un entraînement quotidien` (révision espacée, série de jours), `Des rangs` (Curieux, Érudit… progression par niveaux).
- **Aperçu de l'app** — horizontal scroll gallery of phone mockups. Use placeholder image slots sized for iPhone screenshots (9:19.5 ratio) in rounded frames with soft shadows, clearly labelled in code so screenshots can be dropped in later.
- **FAQ** — accordion, 8 questions, each answer 2–4 self-contained sentences. Questions: "Sophia, c'est quoi ?", "Sophia est-elle gratuite ?", "Sur quels téléphones fonctionne Sophia ?", "Quels sujets sont couverts ?", "Qui a créé Sophia ?", "Sophia a-t-elle un lien avec le robot Sophia ?", "Combien de temps faut-il par jour ?", "Faut-il créer un compte ?"
- **Final CTA band** — navy full-width section, white text, pill button.
- Footer: logo, Vik Studios SAS, links to /mentions-legales, /confidentialite, contact email placeholder, store badges.

### `/telecharger` — smart redirect
Client-side user-agent detection. iOS/iPadOS → App Store URL. Android → Play Store URL. Desktop/other → a clean page showing both store buttons plus a QR code (generate with a QR library) pointing back to this same URL. Show a brief branded loading state ("Redirection vers l'App Store…") before redirecting. Put both store URLs in a single exported constants file `src/config/links.ts`:
- Play Store: `https://play.google.com/store/apps/details?id=app.rork.sophia`
- App Store: `APP_STORE_URL` placeholder constant, clearly commented as TO REPLACE.

### `/sophia-culture-generale` — Google Ads landing page
Same design system, tighter: hero, 3 benefit bullets, screenshot strip, single CTA to `/telecharger`. No nav links away from the page. Built for paid search traffic on brand terms.

### `/mentions-legales` and `/confidentialite`
Simple, readable, placeholder content clearly marked as TO COMPLETE.

## Technical requirements (critical — do not skip)
1. **JSON-LD** in `index.html` or via react-helmet: a `MobileApplication` schema (name "Sophia — Culture générale", applicationCategory "EducationalApplication", operatingSystem "iOS, Android", offers price 0 EUR, author Organization "Vik Studios SAS", downloadUrl), plus an `FAQPage` schema mirroring the FAQ section exactly, plus an `Organization` schema.
2. **`public/robots.txt`** that explicitly ALLOWS AI crawlers. Include `User-agent: GPTBot / Allow: /`, and the same for `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `CCBot`, `Bytespider`, `Applebot-Extended`. Plus `User-agent: * / Allow: /` and a sitemap line.
3. **`public/sitemap.xml`** listing all routes.
4. Per-page `<title>` and `<meta name="description">` in French, plus Open Graph and Twitter card tags. Homepage title: `Sophia — Culture générale | L'application pour apprendre chaque jour`.
5. Semantic HTML: one `<h1>` per page, proper heading hierarchy, `<section>`, `<nav>`, `<footer>`. Text must be server-renderable plain text, never baked into images.
6. Every mention of the brand in body copy is "Sophia — Culture générale" or "Sophia" immediately adjacent to "culture générale". Never a bare "Sophia" in a headline without the category nearby.
7. Fully responsive, tested down to 375px. Accessible: colour contrast, focus states, alt text, `aria-expanded` on the FAQ accordion.
8. No backend, no database, no auth. Static marketing site only.

Ship the full site in one pass.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sophia-culture-facile.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2a94640-0eb5-45b3-b9c3-fa235b3dabd0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
