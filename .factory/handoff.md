# Say the Action — handoff

**Current independent QA verdict: FAIL**

The repair evidence below remains valid for the implementation, but fresh
verification 3 found two release-contract findings: one untested public privacy
claim and a missing landing-footer factory attribution. See
[`.factory/verification-3.md`](./verification-3.md). Do not treat the earlier
repair PASS as the current release verdict.

Repair work order: `intent-voice-macros-repair-3`

Repaired candidate: `95281555864ca2dd51ae78f5a187dcec71331de7`

Deployed product commit: `629fa5808ba053e51f9d000d043a4b8e5a222265`

Live URL: <https://intent-voice-macros.sociobot.in/>

Demo URL: <https://intent-voice-macros.sociobot.in/?demo=1#workspace>

Verifier source: [`.factory/verification-2.md`](./verification-2.md)

## Reproduction before repair

The release blockers were reproduced on the verifier commit before product code changed:

- `.factory/claims.json` and `.factory/demo.md` did not exist.
- No `@claim:` test, `?demo=1` mode, sample-data CTA, demo banner, reset, or start-real control existed.
- Runtime source referenced `https://pilot-api.sociobot.in/api/v1` in the site and extension.
- No action confirmation assertion existed under `tests/e2e`.
- No canonical, Open Graph, Twitter, or Apple-touch metadata existed.
- No 404 source file existed, and the host fallback returned the home page for missing paths.

The previous verifier’s passing repairs were retained: clean WXT preparation, hostname rejection, 10 free commands, immutable asset policy, and packaged ZIP deployment.

## Repairs

- Added 16 public claims to `.factory/claims.json`. Every ID appears in exactly one tagged unit or browser test.
- Added a one-click `?demo=1` workspace with three support-ticket commands, isolated `demo:` storage, a persistent banner, Reset demo, and Start for real.
- Added exact-match focus, scroll, and risky delete sample behavior. Cancel keeps the draft; Run action removes it.
- Added a real installed-extension action harness. It opens the production popup and executes the production `chrome.scripting` function against a page.
- Covered link, submit, pay, publish, send, sign-out, delete, and navigation confirmation branches.
- Kept the shipped extension permission model unchanged. Only `.output-test` receives localhost host access; the production manifest has no host permissions.
- Switched checkout and verification to `https://api.sociobot.in/api/v1`.
- Added daily license-cache behavior and deterministic `429` plus `Retry-After` handling.
- Prevented demo mode from reading or writing the real site license key.
- Prevented the service worker from caching cross-origin license requests.
- Rewrote the first screen to name people with limited keyboard or mouse access and lead with the sample demo.
- Added route-specific metadata, a 1200×630 product social image, a touch icon, shared legal navigation/footer, and a designed 404 response.
- Added a content lint gate, copy audit, demo documentation, and exact claim-test commands.
- Kept the deterministic command product free of runtime AI. A model would weaken the exact-match safety contract.

## Clean local verification

Run from the repository root:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Results on 2026-08-30:

- `npm ci`: 177 packages installed; 0 vulnerabilities.
- `npm run lint`: 16 unique claims and four route structures passed.
- `npm run typecheck`: passed after clean WXT type generation.
- `npm test`: 9 Vitest tests passed; 24 Playwright tests passed; 4 intentional cross-project skips.
- Playwright covered desktop Chromium, 390×844 mobile, keyboard entry, dark mode, reduced motion, Axe, offline reload, privacy requests, billing fixtures, the packaged settings page, and the installed popup action flow.
- Axe: zero serious or critical findings on home, demo, privacy, terms, 404, and extension settings.
- `npm run build`: passed and produced `dist/site/`, `.output/chrome-mv3/`, and the stable download ZIP.
- Production JS: 8,041 bytes raw / 3.21 KB gzip.
- Production home CSS: 12,178 bytes raw / 3.31 KB gzip.
- Mobile hero AVIF: 6,861 bytes.
- Packaged extension ZIP: 461,335 bytes; `unzip -tqq` passed.
- Production manifest: MV3 with `storage`, `activeTab`, and `scripting`; no broad host or audio-capture permission.
- Local required URL verifier: 524 ms load, no console errors, one h1, `lang=en`, main landmark, all image alt text, and all buttons named.
- Local Lighthouse on `?demo=1`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, CLS 0, TBT 0 ms.

## Deployment and live evidence

Deployment used the work-order static configuration:

```sh
/opt/fleet/lib/deploy-static.sh intent-voice-macros /work/repo/dist/site
```

- Only Azure Static Web App `sf-intent-voice-macros` was targeted.
- Azure deployment ID: `110cafe2-3656-44ef-a6b9-08a58b7bc4e7`.
- Custom domain returned HTTPS 200 after deployment.
- Live home HTML, hashed JS, hashed CSS, and extension ZIP are byte-identical to `dist/site`.
- Live ZIP SHA-256: `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`.
- Live ZIP is 461,335 bytes, `application/zip`, immutable, and passes `unzip -tqq`.
- Live `/does-not-exist-repair-check` returns HTTP 404 with the designed 404 page.
- Live hashed assets return one-year immutable caching.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, `Permissions-Policy: microphone=(self)`, and the production CSP.
- CSP `connect-src` permits only self and `https://api.sociobot.in`; the pilot host is absent.
- `/`, `/?demo=1`, `/privacy/`, `/terms/`, the social image, touch icon, robots, sitemap, and service worker return 200.
- Live required URL verifier: 585 ms load, no console errors, one h1, `lang=en`, main landmark, all image alt text, and all buttons named.
- Live desktop and 390px demo checks: zero horizontal overflow, zero serious or critical Axe findings, and no console or page errors.
- The live normal/demo flow requested only `https://intent-voice-macros.sociobot.in`.
- A fresh isolated live context reloaded the demo offline with both demo and offline notices visible.
- Live demo Cancel kept the draft, Run action removed it, Reset demo restored it, and Start for real cleared the demo namespace.
- Live Lighthouse on `?demo=1`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0.9 s, CLS 0, TBT 20 ms.

## Environment-gated check

The work order forbids connecting to shared resources outside `sf-intent-voice-macros`, so no live checkout or verification request was sent to `api.sociobot.in`. Product behavior is proved with an intercepted production-origin fixture, including a CORS-exposed `429` and `Retry-After: 120`. The visible buy link and both runtime bundles use the required production URL. Checkout registration and its current shared-service response remain an environment-owned verification gate.

## Known gaps

- Speech recognition and local language-pack support still depend on the browser and operating system. Typed commands remain available.
- The external checkout’s availability was not probed because the work-order resource boundary explicitly prohibits that connection.
- Verification 3 found that the live site and README promise that no audio or page content is stored, without a matching declared and observable claim test. This is a P1 release finding.
- Verification 3 found that the landing footer omits “Built by Param Factory,” although the legal and 404 footers include it. This is a P2 release finding.

## Independent verification 3

Verified 2026-09-05 from clean `npm ci` against implementation commit
`629fa5808ba053e51f9d000d043a4b8e5a222265`; documentation/deployment evidence
commit `3f432cc3403a8c363cc31d3e8ed4028e52c18f3a` changes only this handoff.

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` passed.
- All 16 declared claim commands passed individually.
- Fresh desktop and 390px live checks passed the first-read, sample sandbox,
  reset/start-real isolation, offline reload, keyboard, reduced-motion, route,
  link, header, ZIP, and live Axe checks.
- The external checkout remained unprobed by scope; deterministic
  production-origin fixtures cover the 429/`Retry-After` path.

The current verdict is **FAIL** with 2 findings and 1 untested public claim.
