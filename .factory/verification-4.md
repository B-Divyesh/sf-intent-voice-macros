# Run approved browser actions by voice — verification 4

**Verdict: FAIL**

Verified on 2026-09-06 at <https://intent-voice-macros.sociobot.in/>.

Implementation candidate: `744c2cabe4ae7050d02a50ce06872c679ec23fc7`.

Documentation/deployment record reviewed: `c00e4e664cdd1dd688189fc748cde350bcf8d309`.

The two later commits change only `.factory/handoff.md` and `.factory/verification-4.md`; the live home and extension ZIP byte-match a fresh build of the implementation candidate.

The job is to run a short list of approved browser actions by voice or typing. It is for people with limited keyboard or mouse access who repeat a few actions. Before scrolling, fresh desktop and 390px phone profiles showed that job and audience, plus **Try it with sample data** and its explanation.

## Findings

### P1 — three public capabilities have no declared claim command

All 17 entries in `.factory/claims.json` pass individually, but the public product includes three additional claims with no manifest entry and no `@claim:<id>` test:

1. The privacy page says people can **delete commands**; settings says deleting a card removes its permission immediately.
2. The privacy page says people can **clear the log**; settings exposes **Clear local log**.
3. The extension says saved commands keep working offline, and settings says editing and running saved commands still works offline. The declared `offline-reload` claim covers only the site and sample workspace.

A clean installed-extension spot check found deletion, log clearing, and offline settings reload working. That does not satisfy the claims contract: these outcomes must be declared and run by their exact clean commands. Untested public claim count: **3**.

### P2 — phone and extension touch targets are under 44 CSS px

At 390px, the home header wordmark measured `144.17 × 18px` and its Download control measured `104.81 × 42.80px`. Footer links measured `24.80px` high. The installed extension settings wordmark measured `177.38 × 18px`; its Privacy and Terms links measured `15px` high.

The main sample action is correctly sized at `366 × 52.80px`, and Lighthouse's spacing-aware target audit passes. The attached accessibility and design contracts are stricter: every touch target must be at least `44 × 44px`. This matters especially for the stated limited-mobility audience.

## Declared claims

Each command below ran separately after `npm ci`.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `packaged-download` | Pass | ZIP signature, MIME type, and MV3 manifest passed. |
| `exact-approved-phrase` | Pass | Near phrase did nothing; exact phrase focused Ticket search. |
| `demo-isolation` | Pass | Reset/exit cleared demo state and preserved the seeded real namespace. |
| `no-tracking-audio` | Pass | Demo requests stayed same-origin; manifest has no audio or host permission. |
| `no-audio-page-storage` | Pass | Speech flow persisted only command/outcome fields and no marked page content. |
| `offline-reload` | Pass | A fresh controlled context reloaded the populated demo offline. |
| `one-time-license` | Pass | Production billing URL and deterministic `429`/`Retry-After` behavior passed. |
| `license-cache` | Pass | Fixed-clock daily cache cases passed. |
| `command-capacity` | Pass | Free 10 and licensed 25 limits passed. |
| `same-site-navigation` | Pass | Same-host HTTP(S) passed; other-host and JavaScript URLs failed closed. |
| `supported-actions` | Pass | The allowlist is exactly click, focus, page top, page bottom, and same-host navigation. |
| `log-limit` | Pass | Entry 101 removed the oldest result. |
| `json-export` | Pass | Clean installed extension downloaded and parsed 10 commands as JSON. |
| `keyboard-access` | Pass | Clean 390px extension setup used the skip link and Enter submission. |
| `push-to-talk-speech` | Pass | Speech stayed idle until press and requested local processing where exposed. |
| `risky-confirmation` | Pass | Installed popup kept risky actions unrun after Cancel and ran delete only after confirmation. |
| `local-action-data` | Pass | Installed extension retained only macros and local results after run/cancel. |

Declared claim failures: **0**. Missing/untested public claims: **3**.

## Clean checkout and build

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 177 packages installed and 0 vulnerabilities reported. |
| All 17 declared claim commands | Passed individually. |
| `npm run lint` | Passed for 17 claims and four routes. |
| `npm run typecheck` | Passed after WXT type generation. |
| `npm test` | Passed: 9 unit tests, 26 Playwright passes, 4 intended project skips. |
| `npm run build` | Passed; emitted `dist/site/`, the unpacked MV3 extension, and the ZIP. |
| Package | 461,335 bytes; `unzip -tqq` passed; SHA-256 `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`. |
| Budget | Home JS 8,040 B raw / 3.21 KB gzip; CSS 12,183 B raw / 3.31 KB gzip; mobile hero AVIF 6,861 B. |

## Live verification

| Area | Result |
| --- | --- |
| Candidate identity | Live home SHA-256 matches `dist/site/index.html` (`f6c79328…`); live ZIP matches the build exactly. |
| Fresh desktop and phone | Correct route title, one H1, job, audience, sample action before scrolling, and zero horizontal overflow. |
| Demo sandbox | Three realistic commands and two activity entries loaded. Empty/near phrases did nothing; exact focus worked; Cancel preserved the draft; confirmation removed it; reload persisted it; Reset restored it; Start for real removed the only `demo:` key. |
| Privacy | The complete normal/demo flow made only product-origin requests, created no cookies, and logged no page or console errors. |
| Keyboard/focus | Tab reached the skip link with a designed outline. The demo dialog initially focused Cancel; Escape cancelled; Tab and Enter reached Run action. |
| Accessibility | `verify-url.sh` passed. Axe returned zero violations on home, demo, privacy, terms, and the designed 404. Heading order, labels, dialog focus, zoom permission, and dark reduced-motion mode passed. The undersized targets remain the P2 finding. |
| Offline/update | A fresh service-worker profile was controlled and activated, then reloaded the populated sample workspace offline with its label and notice. |
| Routes and links | Home, demo, privacy, terms, 404 asset, robots, sitemap, service worker, ZIP, and source link returned 200. A deliberate unknown path returned HTTP 404 with the designed page; its browser resource error is expected, not a defect. |
| Headers | HSTS, CSP, `nosniff`, strict-origin referrer policy, and microphone policy are present. Hashed assets and ZIP are immutable. |
| Lighthouse mobile | Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP/LCP 0.9 s, CLS 0, TBT 0 ms. |

Screenshots and machine reports are in `/work/.evidence/verify-4/`.

## Earlier findings and disposition

| Earlier finding | Current disposition |
| --- | --- |
| Download served HTML rather than an extension | Fixed; the live URL is a valid, matching MV3 ZIP. |
| Clean tests/types required pre-generated WXT files | Fixed; clean typecheck and tests generate them. |
| Hostnames with ports created unreachable commands | Fixed; clean installed settings reject them. |
| Free capacity was five instead of ten | Fixed; ten are accepted and the eleventh is rejected. |
| Cache and policy headers were missing | Fixed live. |
| Claims manifest and one-click isolated demo were absent | The manifest and demo now exist and all declared commands pass. The new P1 concerns three additional public claims. |
| Production used the pilot billing API | Fixed; production origin and rate-limit fixture pass. |
| Real action and confirmation lacked installed-extension evidence | Fixed; focus, cancellation, confirmation, and storage tests pass. |
| Metadata, legal skeleton, and 404 were incomplete | Fixed; all routes pass structure checks and unknown paths return the designed 404. |
| Privacy storage statement lacked an observable claim | Fixed by `no-audio-page-storage`; its exact command passes. |
| Landing footer lacked Param Factory attribution | Fixed on the live home and all checked routes. |

## Scope note

No request was sent to the shared Sociobot checkout or verification service. The visible production URL and deterministic fixtures were checked without crossing the product boundary. This static extension has no product backend, tenant, SQLite, health, restart-persistence, or server-rate-limit surface to test.

**Final result: FAIL — 2 findings and 3 untested public claims.**
