# Say the Action — handoff

**Current QA verdict: PASS**

Work order: `intent-voice-macros-repair-4`

Implementation commit deployed: `744c2cabe4ae7050d02a50ce06872c679ec23fc7`

Live URL: <https://intent-voice-macros.sociobot.in/>

Demo URL: <https://intent-voice-macros.sociobot.in/?demo=1#workspace>

Verification report: [`.factory/verification-4.md`](./verification-4.md)

## What the product does

Say the Action is a Chrome and Edge extension for people with limited keyboard or mouse access who repeat a small set of browser actions. A person approves an exact phrase, hostname, and bounded DOM action. Risky actions ask before they run. The first action is **Try it with sample data**, which opens three isolated sample commands.

## Repairs in this work order

- Added **Built by Param Factory** to the landing footer and a browser regression check that requires it there.
- Declared the existing public privacy statement as the `no-audio-page-storage` claim.
- Added an outcome-based browser check: a deterministic spoken command runs in the demo, a marked sample-page string is never persisted, persisted data has only the approved command/outcome schema, and all demo requests remain same-origin.
- Updated the README privacy statement, landing-copy audit, and catalog description. The catalog description starts with a verb, is 47 characters, and is copied to `/work/.evidence/catalog-description.txt`.

## Run and verify

From a clean checkout with Node 20 or newer:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

All 17 exact commands in [`.factory/claims.json`](./claims.json) were also run individually after `npm ci`; each passed. The new privacy claim command is:

```sh
npm run test:claims -- --grep @claim:no-audio-page-storage
```

Results on 2026-09-06:

- `npm ci`: 177 packages installed; 0 reported vulnerabilities.
- `npm run lint`: 17 claims and all four route structures passed.
- `npm run typecheck`: passed after clean WXT type generation.
- `npm test`: 9 unit tests and 26 Playwright tests passed; 4 cross-project skips are intentional.
- `npm run build`: produced `dist/site/`, `.output/chrome-mv3/`, and a valid 461,335-byte MV3 ZIP. `unzip -tqq` passed.
- The landing bundle is 8,040 B raw JS / 3.21 KB gzip, 12,183 B raw CSS / 3.31 KB gzip, and the mobile hero AVIF is 6,861 B.

## Deployment and live verification

The static deployment used the durable product configuration:

```sh
/opt/fleet/lib/deploy-static.sh intent-voice-macros /work/repo/dist/site
```

Deployment ID: `30732fad-05eb-4859-8c8c-bb0f784840e3`.

- HTTPS home, demo, privacy, terms, 404 asset, robots, sitemap, service worker, and ZIP all returned their expected status. The deliberate missing route returned HTTP 404 with the designed page.
- The live home byte-matches `dist/site/index.html`. The live download byte-matches the built ZIP: SHA-256 `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`.
- A fresh desktop and fresh 390px phone context saw the job, audience, and **Try it with sample data** before scrolling. Both had zero horizontal overflow.
- The live demo showed its persistent sample label. A near phrase did nothing; the exact phrase focused Ticket search; Cancel retained the draft; Reset restored it; Start for real cleared only demo storage.
- A fresh isolated context reloaded the demo offline after service-worker control. The demo label and offline notice stayed visible.
- `/opt/fleet/lib/verify-url.sh` passed live home: 727 ms load, no console errors, title, `lang=en`, one H1, main landmark, image alt text, and named buttons.
- Playwright Axe found zero serious or critical findings on home, demo, privacy, terms, and the designed 404. In dark reduced-motion mode the listening-dot duration was `1e-05s`.
- Lighthouse mobile recorded Performance 100, Accessibility 100, Best Practices 100, and SEO 100; LCP 1.07 s, CLS 0, and TBT 0 ms.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, microphone policy, and a CSP limited to self plus the production billing API connection origin. The ZIP is immutable.

## Earlier verification findings

| Earlier finding | Current disposition |
| --- | --- |
| Download served HTML rather than an extension | Fixed; the live URL is a valid MV3 ZIP and byte-matches the build. |
| Clean checks needed generated WXT files | Fixed; clean `npm test` and typecheck generate WXT types. |
| Hostnames with ports made unreachable commands | Fixed and covered by the installed-extension settings test. |
| Free capacity was five instead of ten | Fixed; the extension admits ten and rejects the eleventh. |
| Cache and policy headers were missing | Fixed; live CSP, microphone policy, HSTS, and immutable assets are present. |
| Claims manifest and one-click isolated demo were missing | Fixed; 17 declared claims and the persistent isolated demo pass. |
| The production site used the pilot billing API | Fixed; production URLs plus deterministic 429/Retry-After coverage pass. |
| Real action and confirmation lacked installed-extension coverage | Fixed; installed-popup focus, cancellation, confirmation, and local storage pass. |
| Metadata, legal skeleton, and 404 were incomplete | Fixed; all live routes have metadata and the missing route returns a designed 404. |
| Privacy claim had no matching observable test | Fixed in this work order by `@claim:no-audio-page-storage`. |
| Landing footer lacked factory attribution | Fixed in this work order and covered by the landing browser check. |

## Known dependencies and gaps

- Speech recognition and local language-pack support depend on the browser and operating system. Typed phrases remain available. If a browser cannot process speech locally, its speech-service privacy policy applies; Say the Action does not store the audio.
- The product has a live one-time $19 offer and a public billing metadata file at `/work/.evidence/billing-offer.json`. The shared checkout/verification service was not probed because it is outside this product’s permitted scope. Deterministic production-origin fixtures cover the license and 429/`Retry-After` behavior. Billing registration remains the factory operator’s external dependency.
