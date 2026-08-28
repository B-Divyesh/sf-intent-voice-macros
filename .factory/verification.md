# Say the Action — independent verification

**Verdict: FAIL**

Verified 2026-08-28 against candidate commit `845f26b54bd138d5434d199decb542720d0dc72e` and live URL `https://intent-voice-macros.sociobot.in/`.

The static homepage deployed at that URL is byte-identical to this candidate's local `dist/site/index.html` (SHA-256 `2ce5759b08cab0d63d84bf17ae9e40215351422fa6e22910ee0498094ef97dc7`). It is not, however, a releasable browser-extension product: its primary Download extension link returns the homepage HTML, not the extension ZIP.

## Blocking defects

### P0 — live installation link serves HTML instead of the extension

- The primary CTA and navigation link both target `/downloads/say-the-action.zip`.
- `curl -I https://intent-voice-macros.sociobot.in/downloads/say-the-action.zip` returned `HTTP/2 200`, `content-type: text/html`, and `content-length: 8543`, the same ETag and size as `/`.
- A final local `npm run build` created a valid `dist/site/downloads/say-the-action.zip` (258,901 bytes; `unzip -t` passed; SHA-256 identical to `.output/say-the-action-1.0.0-chrome.zip`). The deployed file is therefore absent/replaced in deployment.
- Impact: a person cannot obtain or install the browser extension from the deployed product's advertised path.

### P1 — documented fresh test command does not work from a clean checkout

- From a clean candidate checkout after `npm ci`, `npx tsc --noEmit` exited 1 with `TS5083: Cannot read file '/work/repo/.wxt/tsconfig.json'`.
- In the same fresh state, `npm test` exited 1 before running any test: Vitest/Vite failed to resolve `extends: "./.wxt/tsconfig.json"`.
- `npm run build` generates `.wxt/tsconfig.json`; only after that did `npx tsc --noEmit` and `npm test` pass. This does not satisfy the README's `npm test` clean-checkout quality gate.

### P2 — invalid hostname input is accepted and creates an unusable command

- In packaged extension settings, entering hostname `example.com:443` was accepted with `Added “port command” for example.com:443.`
- The popup derives the active site via `new URL(tab.url).hostname`, which is `example.com` (no port), then performs an exact string match. The saved `example.com:443` command can never be shown or run on that site.
- Hostname validation should reject ports/paths/query strings or normalize to `URL.hostname` before persistence.

### P2 — product contract exposes only five free per-site actions

The researched smallest useful product calls for **10 user-approved DOM actions per site**. A fresh extension profile accepted five actions for `example.com`; the sixth displayed `This website already has 5 commands. Delete one or unlock more room.` The tenth action requires a paid license. This is a contract deviation unless the brief is explicitly amended to allow a five-action free product.

### P3 — deployment headers do not match the supplied cache/policy configuration

`public/_headers` requests immutable caching for hashed JS/CSS and `Permissions-Policy: microphone=(self)`. Live JS/CSS instead return `cache-control: public, must-revalidate, max-age=30`; no `Permissions-Policy` or CSP was present. HSTS, `Referrer-Policy`, and `X-Content-Type-Options` are present. This is not the cause of the install failure, but should be corrected in deployment configuration.

## Checks and evidence

| Area | Result |
| --- | --- |
| Clean install | `npm ci` passed; production audit: 0 vulnerabilities |
| Fresh type/test gate | Failed as described above |
| After build generation | `npx tsc --noEmit` passed; `npm test` passed: 3 Vitest tests and 6 Playwright tests, 2 intentional project skips |
| Exact production build | Passed. Extension ZIP valid and copied into local `dist/site/downloads/` |
| Packaged extension settings | Loaded in Chromium MV3. Invalid hostname and selector recovery messages worked; five-command boundary worked; delete cancel retained five and confirmed delete left four |
| Extension responsive/a11y | 390px settings page: 0px horizontal overflow, visible solid focus outline with 3px offset, 0 Axe serious/critical, no console/page errors |
| Landing desktop + 390px | 0px horizontal overflow; keyboard Tab landed on the skip link with visible focus; typed non-match said nothing ran; exact `focus search` matched; 0 Axe serious/critical; no console/page errors |
| Reduced motion/dark | Repository Playwright check passed after build generation |
| PWA | Live service worker controlled after one online reload; a subsequent offline reload succeeded and displayed the offline banner |
| Outbound/privacy | Live page made requests only to `https://intent-voice-macros.sociobot.in`; source scan found no analytics/CDNs. Commands/logs use extension local storage. License verification/checkout only target Sociobot's pilot billing API when used. |
| Performance/budgets | Built home JS 4,155 B and CSS 9,289 B (well below 200 KB/50 KB budgets); hero AVIF 6,861 B mobile. |

## Scope note

The real action execution popup requires a browser toolbar activation to grant MV3 `activeTab`; the headless/virtual-display test harness could independently load and exercise the packaged settings, popup empty/error state, manifest, and the user-facing site, but could not synthesize a trusted toolbar activation. This limitation does not affect the deployment or fresh-test failures above. The repository's own tests do not cover the installed extension action execution or confirmation path.

## Required release actions

1. Publish `dist/site/downloads/say-the-action.zip` at the advertised live path and recheck content type, ZIP integrity, and download/install.
2. Make clean `npm test` and the typecheck independent of generated untracked `.wxt` state (or generate it in a documented pretest/typecheck step), then rerun from a clean checkout.
3. Validate/canonicalize hostnames before saving commands.
4. Reconcile the five-free/tenth-paid limit with the researched acceptance contract.
5. Configure the live host to honor immutable asset caching and the intended response policy headers.
