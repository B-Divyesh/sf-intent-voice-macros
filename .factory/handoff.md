# Say the Action — repair handoff

Build date: 2026-08-28

Work order: `intent-voice-macros-repair-1`  
Repair commit: `a4f5163caf66b4ebdb70865fa1a48174b299c103`

Artifact: WXT/TypeScript Chrome MV3 extension plus static Vite product site. The deployment artifact remains `dist/site/` and its primary extension download remains `dist/site/downloads/say-the-action.zip`.

## Independent-verifier findings repaired

1. **P0 download served homepage HTML:** the root build now copies the WXT ZIP to the advertised path and fails unless it is a non-trivial ZIP with `unzip -t` passing. `public/staticwebapp.config.json` excludes `/downloads/*` from SPA fallback, declares `application/zip`, and sets immutable caching. This prevents a missing ZIP from silently becoming the homepage. `public/_headers` carries the same download policy for hosts that use that convention.
2. **P1 clean `npm test` failure:** `pretest` runs `wxt prepare` before Vitest/Playwright and `typecheck` does the same. A clean checkout no longer relies on an untracked `.wxt/tsconfig.json`.
3. **P2 hostname with port accepted:** settings now canonicalize and accept only a hostname. Ports, protocol prefixes, paths, queries, credentials, and whitespace are rejected before storage, matching popup lookup by `URL.hostname`.
4. **P2 five-command contract deviation:** the brief’s 10 user-approved actions per site are now free. The optional $19 one-time license adds capacity to 25; confirmations, accessibility, export, and privacy behavior remain free.
5. **P3 response policy/cache configuration:** deployable static-host configuration supplies immutable assets/downloads plus `Permissions-Policy`, CSP, referrer, nosniff, and HSTS headers. The package gate asserts the download fallback exclusion, ZIP type route, and required policy headers.

## Exact regression coverage

- Unit coverage rejects `example.com:443`, URL/path/query hostname inputs, and preserves canonical lowercase hostnames.
- Unit coverage asserts the free 10-command baseline and paid additional capacity.
- Loaded-MV3 Playwright coverage runs at 390px, focuses the skip link by keyboard, rejects the unusable port hostname, adds exactly 10 free commands, rejects the eleventh, checks no horizontal overflow, Axe serious/critical findings, and console errors.
- `npm run build` and `npm run test:package` invoke `scripts/verify-package.mjs`, which checks the stable download exists, is a ZIP by signature and `unzip -t`, and has correct static-host routing/header policy.

## Verification run

From a clean dependency install:

```sh
npm ci
npm test
npm run typecheck
npm run test:package
```

Results on repair commit:

- `npm ci`: pass; `npm audit`: 0 vulnerabilities.
- `npm test`: pass — 5 Vitest tests; 7 Playwright checks passed with 3 intentional project-specific skips. Includes desktop Chromium, 390px site and loaded-extension coverage, keyboard smoke test, reduced-motion/dark check, and Axe checks with 0 serious/critical violations.
- `npm run typecheck`: pass.
- `npm run test:package`: pass. Built ZIP is 259,800 bytes at `dist/site/downloads/say-the-action.zip`; `unzip -t` reports no errors; deployment policy verification passes.
- Static budgets remain under limit: home JS 4.16 KB and CSS 9.29 KB; no third-party fonts, scripts, trackers, or analytics are introduced. Browser storage remains local-first; only the existing Sociobot pilot license endpoint is contacted when a person supplies a token.

## Deployment and release check

Publish by pushing this branch and build the static root with `npm ci && npm run build`; publish **the complete `dist/site/` directory**, including `downloads/say-the-action.zip` and `staticwebapp.config.json`. The live validation to perform after the deployment updates is:

```sh
curl -I https://intent-voice-macros.sociobot.in/downloads/say-the-action.zip
curl -fsS https://intent-voice-macros.sociobot.in/downloads/say-the-action.zip -o /tmp/say-the-action.zip
unzip -t /tmp/say-the-action.zip
```

Expected: `content-type: application/zip`, a ZIP response (not homepage HTML), and a successful integrity check. Also check the CSP and `Permissions-Policy` headers, then reload once online and once offline to confirm the versioned service worker has updated its cached shell.

## Known product limits

- Speech recognition availability and local processing are browser/OS dependent; the typed command path remains available.
- User-authored selectors can break after a target site redesign; a failed target is reported and does nothing.
- Staging uses the Sociobot pilot billing API. Factory-owned production registration still needs the billing base constants and buy-link fallback switched to `https://api.sociobot.in/api/v1`.
