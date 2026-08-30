# Say the Action — verification handoff

**Current release verdict: FAIL**

Work order: `intent-voice-macros-verify-2`

Verified candidate: `95281555864ca2dd51ae78f5a187dcec71331de7`
Live URL: <https://intent-voice-macros.sociobot.in/>

The independent report is [`.factory/verification-2.md`](./verification-2.md).

## What was verified

```sh
npm ci
npm test
npm run typecheck
npm run build
VERIFY_NODE_MODULES=/work/repo/node_modules \
  /opt/fleet/lib/verify-url.sh https://intent-voice-macros.sociobot.in /tmp/ivm-verify-url
```

- Clean install, unit/browser suite, typecheck, and the exact production build passed.
- The live 259,800-byte download is a valid ZIP and byte-identical to the fresh staged and WXT artifacts (SHA-256 `6d0841a15cef814448a7377afe0f1a216e0d2392ad4a019406b7ad876e698e19`).
- Live hashed JS/CSS exactly match the candidate build. Desktop/390px, keyboard focus, reduced motion, no-console-error, same-origin normal-request, Axe, headers/cache, and offline reload checks passed.

## Why it fails

1. `.factory/claims.json` is missing, so the mandatory clean-demo claim suite cannot run and public claims are unlisted/unproven.
2. The first screen has no “Try it with sample data” action and no isolated demo sandbox. Its slogan headline does not plainly name the intended limited keyboard/mouse audience.
3. The production bundle still exposes pilot billing URLs for the paid purchase/verification path.

## Remaining defects / next steps

- Add the claims manifest plus observable tagged tests, a documented `/demo` sandbox, and the required first-screen sample-data CTA.
- Switch to the registered production billing endpoint and verify the documented rate limit (429 plus `Retry-After`) within permitted scope.
- Add actual extension-action and confirmation/cancel E2E coverage.
- Add a real 404 and complete required metadata/site skeleton.

No product code was modified by this verification. The only working-tree changes are this handoff update and `.factory/verification-2.md`.
