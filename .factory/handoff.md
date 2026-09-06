# Say the Action — handoff

**Current QA verdict: FAIL**

Work order: `intent-voice-macros-verify-4`

Implementation candidate: `744c2cabe4ae7050d02a50ce06872c679ec23fc7`

Documentation/deployment record reviewed: `c00e4e664cdd1dd688189fc748cde350bcf8d309`

Live URL: <https://intent-voice-macros.sociobot.in/>

Demo URL: <https://intent-voice-macros.sociobot.in/?demo=1#workspace>

Verification report: [`.factory/verification-4.md`](./verification-4.md)

## Result

The implementation works end to end and all 17 declared claim commands pass. Independent QA still found two release issues:

1. Three public capabilities have no declared `@claim` command: delete commands, clear the local log, and keep extension commands working offline.
2. Several phone and installed-extension navigation targets are below the required `44 × 44px` minimum.

No product code was changed in this verification work order.

## Product and first action

Say the Action is a Chrome and Edge extension for people with limited keyboard or mouse access who repeat a small set of browser actions. A person approves an exact phrase, hostname, and bounded action. Risky actions ask first. The first action is **Try it with sample data**, which opens three isolated sample commands.

## How to verify

From a clean checkout with Node 20 or newer:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Run every exact command in [`.factory/claims.json`](./claims.json) separately. All 17 passed during this review.

Results on 2026-09-06:

- `npm ci`: 177 packages; 0 reported vulnerabilities.
- `npm run lint`: passed for 17 claims and four routes.
- `npm run typecheck`: passed.
- `npm test`: 9 unit tests and 26 Playwright tests passed; 4 project skips are intended.
- `npm run build`: emitted the static site, unpacked MV3 extension, and a valid 461,335-byte ZIP.
- Live and local ZIP SHA-256: `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0.9 s, CLS 0, TBT 0 ms.

## Live checks

- Fresh desktop and 390px phone contexts showed the job, audience, sample action, and explanation before scrolling.
- The demo loaded three commands and two activity entries. Near phrases were blocked; the exact phrase focused the field; risky cancellation and confirmation worked; reload, Reset, and Start for real behaved correctly.
- Demo traffic stayed same-origin, created no cookies, and did not touch real storage.
- Home, demo, privacy, terms, service worker, package, metadata, source link, and deliberate 404 behavior passed.
- The controlled sample workspace reloaded offline.
- Axe found zero violations across home, demo, legal pages, and 404. Reduced motion and keyboard dialog focus passed.
- Response headers and immutable caching passed.

Evidence is in `/work/.evidence/verify-4/`. The repository report is [`.factory/verification-4.md`](./verification-4.md).

## Earlier findings

All findings from verification rounds 1–3 and repair round 4 remain fixed: package serving, clean WXT setup, hostname validation, ten free commands, headers, one-click demo, production billing origin, installed action/confirmation coverage, metadata/legal/404 structure, privacy storage coverage, and footer attribution.

## Remaining work

- Add claim entries and outcome tests for command deletion, log clearing, and extension offline operation. Run each exact command from a clean checkout.
- Make every phone and extension touch target at least `44 × 44 CSS px`, including wordmarks and footer/legal links. Recheck at 390px.
- Rerun all declared commands, full tests, build, fresh phone/desktop QA, Axe, offline reload, and Lighthouse before declaring PASS.

## External dependency

The shared Sociobot checkout/verification service was not probed because it is outside this product's permitted scope. Production URLs and deterministic `429`/`Retry-After` fixtures pass. This is not one of the two product findings above.
