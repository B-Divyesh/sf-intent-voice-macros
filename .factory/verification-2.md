# Say the Action — independent verification 2

**Verdict: FAIL**

Verified on 2026-08-30 against candidate commit
`95281555864ca2dd51ae78f5a187dcec71331de7` and the live product at
<https://intent-voice-macros.sociobot.in/>.

This is a fresh verification. The deployment repair is present: the live
extension archive and the two hashed landing assets exactly match a fresh local
production build of this commit. That does not overcome the mandatory demo and
claims release gates below.

## Release blockers

### P0 — no `.factory/claims.json`; the required claim tests cannot run

`.factory/claims.json` is absent in the clean candidate. Therefore there are
no declared claim-test commands to run from the demo entry point, no
`@claim:<id>` tests in the test suite, and no way to verify the numerous
visitor-facing privacy, offline, local-storage, command-limit, confirmation,
or price claims as required. This is explicitly release-blocking under the
claims contract.

Examples of unlisted claims on the landing page include “Commands and logs
stay in browser storage,” “Audio is never saved,” “The free plan includes 10
commands,” and “No subscription and no voice-data account.”

### P0 — the cold landing page has no required sample-data demo

Cold first-read result, before interacting with the page:

> Say the Action is presented as a “small voice-command layer” for repeat
> browser actions. The first choices are “Download extension” and “Try the
> command card.” It does not say that it is for people with limited
> keyboard/mouse access, and it provides no “Try it with sample data” action.

The headline is “Say only the action.” Rather than a plain-language job and
audience statement, it is a slogan. The page has only a landing-page
simulation of the phrase `focus search`; it neither opens the actual extension
in a sandbox nor seeds isolated sample commands. `.factory/demo.md` is also
absent, `/demo` and `?demo=1` do not enter a sandbox, and there is no persistent
“Demo — sample data, nothing is saved” banner, reset, or start-for-real path.

This fails both the first-read acceptance test and the demo-sandbox contract.

### P1 — production product still points paid checkout and verification at the pilot API

The deployed bundle is the candidate bundle and contains
`https://pilot-api.sociobot.in/api/v1` in both `site/main.ts` and
`lib/license.ts`; the visible Buy link also targets that pilot endpoint. The
README and previous handoff explicitly call this a staging configuration to be
changed only after registration. A production product at the live URL must not
offer a pilot billing endpoint as its one-time purchase flow.

No request was sent to that endpoint during this verification, in compliance
with the work-order prohibition on connecting to resources outside the assigned
`sf-intent-voice-macros` scope. The static evidence is sufficient to establish
the wrong production endpoint.

## Other findings

### P2 — actual command execution and destructive confirmation have no end-to-end coverage

The isolated packaged-extension run successfully loaded MV3 settings, added
normal and destructive command cards for a local target, and reported no
console errors. The repository test suite also independently checks invalid
hostnames, ten free commands, 390px layout, and Axe.

However, neither repository Playwright test opens the actual browser-toolbar
popup on an active tab and asserts a configured DOM action runs, nor asserts
that a risky action stays unrun after Cancel and runs only after confirmation.
The transient Chrome toolbar popup was not controllable through the headless
browser harness, so this verifier could not independently complete that last
interaction. Add a reliable extension E2E harness for focus/click plus the
cancel/confirm branches; this is required evidence for the real job-to-be-done.

### P2 — required site routes/metadata are incomplete

There is no designed `404` page. A live request to `/does-not-exist` returns
the landing page with HTTP 200. The site also lacks canonical, Open Graph,
Twitter-card, and Apple-touch metadata required by the site-structure
contract. Privacy and terms pages have semantic main/h1 structure and passed
Axe, but do not carry the required consistent product navigation/footer
skeleton.

### P2 — unlock API rate-limit requirement is not verifiable

The product has license verification/checkout calls but the repository does
not document an allowance or a rate-limit test. Per the scope restriction, the
pilot API was not contacted to drive it past a limit. The required observable
`429` plus `Retry-After` evidence is therefore absent.

## Checks and evidence

| Area | Result |
| --- | --- |
| Candidate identity | `git rev-parse HEAD` = `95281555864ca2dd51ae78f5a187dcec71331de7` |
| Clean install | `npm ci` passed; 0 reported vulnerabilities |
| Required claims gate | **Failed:** `.factory/claims.json` missing; no claim tests exist/run |
| Unit/integration/browser suite | `npm test` passed: 5 Vitest tests; 9 Playwright passes and 3 intentional project skips (`test-results/.last-run.json`: `passed`) |
| Static type check | `npm run typecheck` passed |
| Exact production build | `npm run build` passed; emitted `dist/site/` and a valid MV3 ZIP |
| Package/download | Live `/downloads/say-the-action.zip` is `application/zip`, 259,800 bytes; `unzip -tqq` passed; SHA-256 of live ZIP, local staged ZIP, and WXT ZIP all `6d0841a15cef814448a7377afe0f1a216e0d2392ad4a019406b7ad876e698e19` |
| Live/candidate match | Live `home-D4TVXJB2.js` and `home-DiPJY9da.css` SHA-256 values exactly match local `dist/site/` assets |
| First read/demo | **Failed:** slogan headline, audience not named, no sample-data demo or isolated demo route |
| Normal/invalid preview path | Typed `focus the search` reported “Nothing ran”; exact `focus search` reported the approved focus action |
| Extension settings | Packaged MV3 settings accepted configured cards; repository suite verified invalid hostname recovery, 10-command free boundary, 390px layout, keyboard skip link, and Axe |
| Desktop/mobile/a11y | Live desktop and 390px checks had 0px mobile horizontal overflow, visible skip-link outline `rgb(23,23,19) solid 3px` with 3px offset, no console/page errors, and zero Axe serious/critical findings; dark/reduced-motion also had zero serious/critical and animation was disabled |
| Required URL verifier | `/opt/fleet/lib/verify-url.sh` passed with title, `lang=en`, one h1, main, all img alt attributes, no console/page errors; its report recorded a 756ms load |
| Privacy/outgoing normal flow | Live normal landing flow made only same-origin document, image, JS, and CSS requests; no analytics/tracker or third-party runtime request observed |
| Headers/caching | Live CSP, HSTS, `nosniff`, strict-origin referrer policy, and `Permissions-Policy: microphone=(self)` present. Hashed JS/CSS and ZIP are immutable; HTML/SW use 30-second revalidation |
| Offline/PWA smoke | After an online reload the service worker controlled the page; a fresh isolated offline reload returned 200 and showed the offline banner |
| Bundle budget | Landing JS 4,155 bytes (1,900 gzip), CSS 9,289 bytes (2,790 gzip), and mobile AVIF 6,861 bytes: within stated static budgets |

## Required release actions

1. Add `.factory/claims.json` and one clean-demo observable test for every
   visitor claim; make all listed commands pass from a fresh checkout.
2. Build a real `/demo` or `?demo=1` extension/product sandbox with seeded
   sample commands, isolated storage, reset/start-for-real controls, and a
   visible first-screen “Try it with sample data” action. Rewrite the first
   screen to name the limited keyboard/mouse audience in plain words.
3. Register/use the production Sociobot billing endpoint before offering the
   paid purchase link on the production site, then verify the documented
   rate-limit response within the permitted service scope.
4. Add automated actual-action and confirmation/cancel extension coverage.
5. Supply a real 404 route and complete required metadata/site skeleton.
