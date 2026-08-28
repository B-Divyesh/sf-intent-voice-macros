# Say the Action

Say the Action is a small, local-first Chrome/Edge extension for people who need a few repeatable browser actions without depending on a keyboard or mouse. A person approves an exact phrase, one hostname, and one DOM action. The extension does not improvise, execute arbitrary code, or listen in the background.

Live product page: <https://intent-voice-macros.sociobot.in>

## What v1 does

- Push-to-talk speech recognition where the browser exposes the Web Speech API, with local processing requested where supported.
- Typed command fallback for browsers, offline states, and switch/keyboard access.
- Exact phrase matching and explicit per-host action allowlists.
- Focus, click, page-top, page-bottom, and same-host navigation actions.
- Automatic confirmation for navigation, links, submit controls, and actions labelled delete, remove, pay, send, publish, or sign out.
- Local-only command cards and a 100-entry outcome log; no audio storage or analytics.
- Five commands per site for free; a one-time $19 license raises the limit to ten.
- JSON export, clear-log control, responsive options screen, and light/dark/reduced-motion treatments.

This is a complement to—not a replacement for—platform accessibility tools such as Voice Access, Voice Control, Talon, or Dragon.

## Develop

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing site at localhost
npm test             # unit + desktop/mobile Playwright + Axe checks
npm run build        # extension, zip, and deployable site
```

`npm run build` produces:

- `.output/chrome-mv3/` — unpacked MV3 extension
- `.output/say-the-action-1.0.0-chrome.zip` — packaged extension
- `dist/site/index.html` — static deployment root
- `dist/site/downloads/say-the-action.zip` — stable landing-page download target

To load locally, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `.output/chrome-mv3`. Open the extension settings to add a command. Pin the extension or use `Ctrl+Shift+U` (`Command+Shift+U` on macOS) to open its visible command palette.

## Configuring a command

1. Enter a hostname such as `example.com`.
2. Choose an exact phrase such as `focus search`.
3. Choose an action and, for focus/click, a CSS selector such as `#search`.
4. Leave **Ask before running** enabled unless the action is harmless. Safety checks still force confirmation for recognized irreversible controls.
5. Open that website, open the popup, and speak or type the exact phrase.

Same-site navigation accepts only HTTP(S) URLs whose hostname exactly matches the command card. The extension requests `activeTab`, not broad host access, so page access is granted only when the user opens the toolbar popup.

## Billing and privacy

Staging builds use the Sociobot pilot billing API. Production release should switch both billing base constants from `https://pilot-api.sociobot.in/api/v1` to `https://api.sociobot.in/api/v1` after the factory registers the product. No payment provider is embedded.

License tokens are stored in site `localStorage` under `sb_license:intent-voice-macros` and separately in extension local storage when pasted into extension settings. Cached valid licenses unlock optimistically and are rechecked at most daily. See `/privacy/` and `/terms/` on the built site.

## Project map

- `entrypoints/` — WXT background, popup, and options pages
- `lib/` — shared command grammar, storage, license, and types
- `site/` — static landing, privacy, and terms pages
- `public/` — optimized hero variants, icon, service worker, and cache headers
- `tests/` — Vitest grammar tests and Playwright/Axe site tests
- `.factory/design.md` — visual system and generated-asset provenance
- `.factory/handoff.md` — verification record and release notes

## Deploy

Run `npm ci && npm run build`, then publish `dist/site/` as the static root. The factory owns DNS, billing registration, and deployment; this repository does not modify infrastructure.

## License

MIT. See [LICENSE](./LICENSE).
