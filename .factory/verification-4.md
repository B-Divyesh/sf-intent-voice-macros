# Run approved browser actions by voice — verification 4

**Verdict: PASS**

Verified on 2026-09-06 against implementation commit `744c2cabe4ae7050d02a50ce06872c679ec23fc7` and <https://intent-voice-macros.sociobot.in/>.

The job is to run a small list of approved browser actions by voice or typing. It is for people with limited keyboard or mouse access who repeat a few browser actions. Before scrolling, fresh desktop and 390px phone contexts showed that job, named that audience, and offered **Try it with sample data**. The adjacent sentence says that it opens three sample commands in a separate workspace.

## Repair results

### P1 — public privacy storage statement

**Fixed.** `.factory/claims.json` now declares `no-audio-page-storage` with the exact visitor statement: “No audio, analytics, or page content is stored.” Its clean command is:

```sh
npm run test:claims -- --grep @claim:no-audio-page-storage
```

The observable test supplies a deterministic recognized phrase, puts a unique private marker into the sample page, performs the speech-driven focus action, and reads persisted demo storage. It proves only the approved command/outcome schema exists, the page marker is absent, and the full demo request flow uses only the product origin. The exact command passed after `npm ci`.

### P2 — factory attribution in landing footer

**Fixed.** The landing footer now says “Built by Param Factory.” The landing browser test checks that visible footer outcome. Live home HTML contains it.

## Clean verification

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 177 packages installed and 0 vulnerabilities reported. |
| Every declared claim command | All 17 commands passed individually. |
| `npm run lint` | Passed: 17 claims and four route structures. |
| `npm run typecheck` | Passed with generated WXT types. |
| `npm test` | Passed: 9 unit tests, 26 Playwright passes, 4 intentional project skips. |
| `npm run build` | Passed; `dist/site/`, MV3 unpacked extension, and ZIP emitted. |
| Package | ZIP is 461,335 bytes, passes `unzip -tqq`, and has SHA-256 `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`. |
| Budget | Home JS 8,040 B raw / 3.21 KB gzip; CSS 12,183 B raw / 3.31 KB gzip; mobile hero AVIF 6,861 B. |

## HTTPS verification

Deployment `30732fad-05eb-4859-8c8c-bb0f784840e3` completed successfully for the product’s durable static app. Live home bytes match the production build; the live ZIP exactly matches the local ZIP checksum above.

| Area | Result |
| --- | --- |
| First read, desktop and phone | Correct title, one plain H1, named audience, sample CTA, initial scroll 0, and 0px horizontal overflow. |
| Demo sandbox | Persistent label; near phrase blocked; exact phrase focused Ticket search; Cancel preserved the draft; Reset restored it; Start for real cleared demo storage. |
| Offline | A fresh controlled service-worker context reloaded `?demo=1` offline with its demo label and offline notice. |
| Accessibility | `verify-url.sh` passed in 727 ms with no console errors. Playwright Axe found 0 serious/critical issues on home, demo, privacy, terms, and the designed 404. Reduced motion uses a `1e-05s` listening-dot duration. |
| Routes | Home, demo, privacy, terms, 404 asset, robots, sitemap, service worker, and ZIP returned 200. A deliberate missing route returned HTTP 404 with the designed page. |
| Requests and headers | Normal/demo flows made only same-origin requests. HSTS, CSP, `nosniff`, strict-origin referrer policy, and microphone policy are present; the ZIP is immutable. |
| Mobile Lighthouse | Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.07 s, CLS 0, TBT 0 ms. |

## Earlier findings and disposition

All findings in `verification.md`, `verification-2.md`, and `verification-3.md` are now resolved. This includes package deployment, clean WXT setup, hostname validation, ten free commands, response headers, the claims and demo contracts, production billing origin and rate-limit fixture, real installed-extension confirmation coverage, metadata/legal/404 structure, and the two repair-4 findings above.

## Scope note

No request was sent to the shared Sociobot checkout or license service. That service is outside the product resource boundary. The public production URL and one-time $19 offer are present; deterministic production-origin fixtures cover license behavior and a `429` with `Retry-After`. This remains an external billing-registration dependency, not a release defect in the product artifact.
