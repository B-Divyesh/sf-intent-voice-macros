# Say the Action — repair handoff

Build date: 2026-08-30

Work order: `intent-voice-macros-repair-2`
Repair commits: `a4f5163caf66b4ebdb70865fa1a48174b299c103`, `5d5aa13`

Artifact: WXT/TypeScript Chrome MV3 extension plus a static Vite product site. The deployment artifact is `dist/site/`; its stable installation target is `dist/site/downloads/say-the-action.zip`.

## Release-blocker repair

The independent report in `.factory/verification.md` was first reproduced against the live product: on 2026-08-30 the advertised ZIP URL returned the landing page as `text/html` (8,543 bytes), rather than a browser-extension archive.

The earlier repair already addressed the verifier's hostname, free-ten-command, clean-type/test, and static-policy findings. This repair found and fixed the remaining artifact-build root cause: `npm run build:site` let Vite empty `dist/site` but did not restore the extension ZIP. That made a site-only preview or deployment capable of serving the SPA fallback at the advertised download URL.

- `build:site` now builds and zips the MV3 extension, builds the site, copies the ZIP to its public stable name, and verifies the completed artifact.
- `build` now cleans and invokes that complete `build:site` artifact build.
- Package verification now requires the stable download to be byte-for-byte identical to the WXT-produced ZIP as well as valid under `unzip -t`.
- Browser regression coverage requests `/downloads/say-the-action.zip` from the built static server and requires a ZIP MIME type and `PK\x03\x04` signature. The exact previous HTML fallback therefore fails `npm test`.

Existing coverage continues to reject port/path/protocol hostnames, assert 10 free commands per site plus paid capacity, load the packaged MV3 settings at 390px, and verify the static routing/policy configuration.

## Verification

Completed on the current worker image:

```sh
npm ci
npm run clean && npm run build:site
npm test
npm run typecheck
npm run test:package
```

- Clean install: passed; production audit reported 0 vulnerabilities.
- Unit tests: 5 passed.
- Browser/Axe suite: 9 passed, 3 intentional project-specific skips. It covers desktop, 390px, keyboard focus, dark/reduced-motion, exact command preview, packaged extension settings, and the ZIP response regression.
- Typecheck: passed after generated WXT types are prepared by the documented command.
- Production package: passed. `dist/site/downloads/say-the-action.zip` is a 259,800-byte valid ZIP and exactly equals `.output/say-the-action-1.0.0-chrome.zip`.
- Artifact budgets: landing JavaScript 4.16 KB and CSS 9.29 KB before gzip; no third-party fonts, scripts, analytics, or trackers were added.

## Deployment and live verification

Committed and pushed `5d5aa13` to `main`, then deployed the verified `dist/site/` artifact to the permitted `sf-intent-voice-macros` static app.

Live URL: <https://intent-voice-macros.sociobot.in>

- `GET /downloads/say-the-action.zip`: `200`, `content-type: application/zip`, `cache-control: public, max-age=31536000, immutable`, 259,800 bytes.
- `unzip -tqq` passed for the downloaded archive. Its SHA-256, the staged download, and WXT ZIP are all `6d0841a15cef814448a7377afe0f1a216e0d2392ad4a019406b7ad876e698e19`.
- Live response policy includes CSP, `Permissions-Policy: microphone=(self)`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and HSTS.
- `/opt/fleet/lib/verify-url.sh` reported title, `lang="en"`, exactly one `h1`, one `main`, no images without alt text, and no page/console errors.
- Live Playwright/Axe desktop check: 0 serious/critical violations, skip link focused by Tab, and no third-party requests during the normal page flow. At 390px, horizontal overflow was 0px.
- After one online reload the live service worker controlled the page; an isolated offline reload succeeded and showed the offline banner.

## Known limits

- Browser/OS speech recognition and local language-pack availability vary. The typed command path remains available.
- User-authored CSS selectors can stop matching after a target site changes; the extension reports the miss and takes no action.
- The currently deployed paid-link constants still use the factory pilot billing endpoint. Switch both constants to the production Sociobot API only after factory product registration is supplied; this does not affect the free useful baseline or local command storage.
