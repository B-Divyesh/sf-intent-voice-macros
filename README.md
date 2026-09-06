# Say the Action

Run approved browser actions by voice or typing. Say the Action is a Chrome and Edge extension for people with limited keyboard or mouse access.

A person approves one exact phrase, one hostname, and one browser action. Similar phrases do nothing. Risky actions pause for confirmation.

Live site: <https://intent-voice-macros.sociobot.in/>

Sample demo: <https://intent-voice-macros.sociobot.in/?demo=1#workspace>

## What it does

- Starts listening only after the person presses the talk button.
- Requests local speech processing when the browser supports it.
- Keeps typed input available when speech recognition is unavailable.
- Runs focus, click, page-top, page-bottom, and same-host navigation actions.
- Confirms navigation, links, submit controls, and actions named delete, remove, pay, send, publish, or sign out.
- Keeps commands and the latest 100 results in extension browser storage.
- Stores no audio, analytics, or page content.
- Exports commands and the local activity log as JSON.
- Supports 10 commands per site for free.
- Raises the limit to 25 with a one-time $19 license. There is no subscription.

Say the Action complements platform accessibility tools. It does not replace Voice Access, Voice Control, Talon, Dragon, or similar tools.

Every public claim has an executable test in [`.factory/claims.json`](./.factory/claims.json). The isolated sample workspace is documented in [`.factory/demo.md`](./.factory/demo.md).

## Run and test

Requirements: Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
npm run dev:site
npm test
npm run typecheck
npm run build
```

`npm test` generates WXT types, builds both products, and runs Vitest, desktop Chromium, 390px mobile, Axe, offline, privacy, billing-fixture, and installed-extension action tests.

`npm run build` produces:

- `.output/chrome-mv3/` — unpacked MV3 extension.
- `.output/say-the-action-1.0.1-chrome.zip` — packaged extension.
- `dist/site/` — deployable static site.
- `dist/site/downloads/say-the-action.zip` — stable download URL.

Load `.output/chrome-mv3` from the browser’s extensions page for local testing. Pin the extension or press `Ctrl+Shift+U` to open its command palette.

## Configure a command

1. Enter a hostname such as `example.com`.
2. Enter an exact phrase such as `focus search`.
3. Choose an action.
4. Add a CSS selector for focus or click actions.
5. Keep **Ask before running** selected unless the action is harmless.

Navigation accepts only HTTP or HTTPS URLs on the approved hostname. The extension requests `activeTab`, not access to every website.

## Billing and privacy

Checkout and license verification use only `https://api.sociobot.in/api/v1`. The product never embeds a payment provider.

Returned tokens use site storage key `sb_license:intent-voice-macros`. The URL token is removed immediately. A cached valid result enables paid capacity without delaying the free experience.

License verification runs at most once each day. A `429` response respects `Retry-After` and keeps the saved setup unchanged. Automated tests use deterministic fixtures and never contact shared checkout.

See the live [privacy policy](https://intent-voice-macros.sociobot.in/privacy/) and [terms](https://intent-voice-macros.sociobot.in/terms/).

## Project map

- `entrypoints/` — extension background, popup, and settings.
- `lib/` — command rules, injected page action, billing, and storage.
- `site/` — landing, demo, privacy, terms, and 404 pages.
- `tests/` — unit, browser, claims, accessibility, and installed-extension tests.
- `.factory/design.md` — product-specific visual system and asset provenance.
- `.factory/handoff.md` — release evidence and remaining environment gates.

## Deploy

Run `npm ci && npm run build`. Publish `dist/site/` as the static root for `sf-intent-voice-macros`.

The factory owns DNS, billing registration, and deployment. This repository contains no cloud credentials.

## License

MIT. See [LICENSE](./LICENSE).
