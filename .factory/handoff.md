# Say the Action — build handoff

Build date: 2026-08-28

Work order: `intent-voice-macros-build-1`

Artifact: WXT/TypeScript Chrome MV3 extension plus static Vite product site

## What shipped

- A real MV3 extension with a 390px command palette and responsive settings workbench.
- Push-to-talk Web Speech recognition with `processLocally` requested when supported, a typed-command fallback, visible listening state, and no background microphone.
- Exact-match command grammar scoped to the current hostname. Supported actions are focus, click, scroll top/bottom, and same-host navigation. No arbitrary script action exists.
- Five command cards per site in the useful free tier and ten after the one-time $19 license unlock.
- Risk inspection before every run. Navigation, links, submit controls, explicitly confirmed macros, and controls labelled with destructive/irreversible verbs always open a specific confirmation dialog.
- Local extension storage for commands, up to 100 recent results, and cached license state. Users can export setup/logs and clear logs. Audio is never stored.
- `activeTab` + `scripting` permissions only; no broad host permission and no persistent content script.
- Sociobot pilot checkout, return-token capture on the site, restore-by-paste in the site and extension, cached optimistic unlock, and at-most-daily background re-verification.
- Original neo-brutalist visual system, light/dark themes, reduced-motion treatment, generated hero with full provenance, and hand-authored extension icon.
- Static landing page, interactive exact-match preview, offline banner/service worker, `/privacy/`, `/terms/`, cache headers, `robots.txt`, and sitemap.
- Packaged extension copied to `dist/site/downloads/say-the-action.zip` by the reproducible root build.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run build
```

Results from this build:

- `npx tsc --noEmit`: pass.
- `npm test`: pass — 3 Vitest unit tests and 6 Playwright checks across desktop/mobile Chromium; expected project-specific skips keep the overflow check mobile-only and the dark/reduced-motion check desktop-only.
- Playwright Axe on landing, privacy, and terms: 0 serious/critical violations.
- Unpacked MV3 smoke test in headed Chromium: options and popup load with one `h1`, one `main`, 0 console errors, and 0 serious/critical Axe violations; adding `focus search` for `example.com` persisted and rendered one command card.
- `npm run build`: pass. `dist/site/index.html` exists and the stable download zip is 259 KB.
- `npm audit`: 0 vulnerabilities after updating WXT/Vite/Vitest; production audit also reports 0.

Mobile Lighthouse 12.8.2 against the final local Vite preview:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 1.1 s |
| CLS | 0 |
| Total blocking time | 0 ms |

INP is not produced by the single-navigation Lighthouse lab run; the interactive Playwright flow responds without an animation or network dependency. Static budgets are well below limits: initial site JS 4.16 KB, home CSS 9.30 KB, mobile AVIF 6.86 KB / WebP 9.34 KB, no font files or runtime CDN requests. The extension's largest page script is 5.9 KB.

## Known gaps and release steps

- Browser/OS speech support varies. Some browsers do not expose Web Speech in extension pages or do not have an offline language pack; the typed path remains fully functional and the UI says so. `processLocally` is a request, not a guarantee that the browser vendor will avoid its speech service.
- User-authored CSS selectors can break when a website redesigns. A failed target is surfaced as a local error and nothing runs; v1 does not include a visual selector picker.
- Checkout and verification intentionally use `https://pilot-api.sociobot.in/api/v1` for staging. After factory product registration, switch `BILLING_BASE` in `lib/license.ts` and `site/main.ts` plus the static buy-link fallback in `site/index.html` to the production API.
- Web pages and extensions have separate storage origins. A returned checkout token is saved on the product site and the user is told to paste it once into extension settings; a browser store/native-messaging bridge is intentionally out of scope.
- Lighthouse was measured on the built local preview, not the deployed CDN. The `_headers` file supplies immutable asset caching and baseline security headers where the static host supports that convention.
- Chrome Web Store submission, signing, billing product registration, DNS, and deployment remain factory-owned release work.
