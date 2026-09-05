# Verify approved browser actions by voice — verification 3

**Verdict: FAIL**

Verified on 2026-09-05 at <https://intent-voice-macros.sociobot.in/>.

Implementation candidate reviewed: `629fa5808ba053e51f9d000d043a4b8e5a222265`.
Documentation/deployment-evidence commit: `3f432cc3403a8c363cc31d3e8ed4028e52c18f3a`.
The latter changes only `.factory/handoff.md`; the fresh build and live ZIP are
therefore checks of the implementation candidate.

The product job is to run a small list of approved browser actions by voice or
typing. It is for people with limited keyboard or mouse access who repeat a few
browser actions. Before scrolling, both a fresh desktop and a fresh 390px phone
page said this and offered **Try it with sample data**; the adjacent note said
that it opens three sample commands in a separate workspace.

## Findings

### P1 — the public no-audio-storage privacy claim is unlisted and untested

The live privacy section says: “No audio, analytics, or page content is
stored.” The README also says “Stores no audio or analytics data.” Neither
statement has a matching public claim in `.factory/claims.json` or a tagged
test that proves that no audio or page content is persisted after a recognition
flow.

`no-tracking-audio` is not sufficient proof of that statement: its declared
claim is limited to demo same-origin traffic and no background audio permission;
its test checks request origins, demo localStorage keys, and manifest
permissions. Those are useful checks, but they do not assert the published
storage promise. This is a privacy claim a visitor can rely on, so it must be
declared and tested or removed.

### P2 — the landing footer omits the required factory attribution

The live landing footer contains the product one-line description, Demo,
Privacy, Terms, Source, and version/image provenance. It does not contain
“Built by Param Factory.” `/privacy/`, `/terms/`, and the designed 404 do
contain it. The site-structure contract requires that footer item on every
route, including the landing page.

## Declared claims

All 16 declared commands were run individually after `npm ci`; each passed.
There are no failed declared claims. The P1 finding above means there is still
**one untested public claim**.

| Claim IDs with passing declared command | Evidence |
| --- | --- |
| `packaged-download`, `exact-approved-phrase`, `demo-isolation`, `no-tracking-audio`, `offline-reload`, `one-time-license`, `push-to-talk-speech` | Each `npm run test:claims -- --grep @claim:<id>` command passed. |
| `license-cache`, `command-capacity`, `same-site-navigation`, `supported-actions`, `log-limit` | Each `npm run test:unit -- --testNamePattern @claim:<id>` command passed. |
| `json-export`, `keyboard-access`, `risky-confirmation`, `local-action-data` | Each `npm run test:e2e -- --project=chromium --grep @claim:<id>` command passed. |

The installed-extension tests use a clean Chromium extension profile. They
proved keyboard command creation and JSON export, then opened the actual popup
against an isolated local tab: focus ran, Cancel left risky actions unrun, Run
action removed the sample draft, and commands/results remained in extension
local storage.

## Checks that passed

| Area | Evidence |
| --- | --- |
| Clean setup and quality gates | `npm ci` installed 177 packages with 0 vulnerabilities. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` passed. The suite reported 9 unit tests and 28 Playwright project runs (24 passes, 4 intentional cross-project skips). |
| Fresh desktop and phone first screen | Fresh 1366px and 390px contexts had the correct title, one plain-language H1, named audience, sample CTA, zero initial scroll, zero horizontal overflow, no console/page errors, and no external normal-load requests. |
| Live sample sandbox | The persistent demo label appeared. A near phrase produced “No approved phrase matched. Nothing ran.” The exact phrase focused Ticket search. Delete opened a dialog; Cancel left the draft and then announced cancellation. Reset restored the draft and three commands. Start for real cleared `demo:intent-voice-macros:workspace` while preserving a pre-seeded real license key. |
| Live offline/update promise | In a fresh context the service worker controlled after an online reload. With the context offline, `?demo=1#workspace` reloaded and showed both the demo label and offline notice. |
| Accessibility | `/opt/fleet/lib/verify-url.sh` passed live home: 760 ms load, no console errors, title, `lang=en`, one H1, main landmark, image alt text, and named buttons. Live Playwright Axe checks on home, demo, privacy, terms, and 404 found 0 violations, including 0 serious/critical. The standalone Axe CLI could not find a system Chrome binary in this container; the repository-pinned `@axe-core/playwright` integration was used instead. Home Tab first reached the visible Skip to main content link with a 3px outline. In dark/reduced-motion demo, dialog focus moved to Cancel and the listening-dot animation duration was `0.00001s`. |
| Routes, links, and legal pages | Live `/`, `/?demo=1`, `/privacy/`, `/terms/`, and the deliberate missing route had correct route titles and one H1. The missing route returned HTTP 404 with the designed page. All crawled internal links returned 200. Privacy and terms loaded without console errors. |
| Package, deployment identity, headers | Fresh local download ZIP and live ZIP had the same SHA-256: `eb6f9ca3cce165d7d4a3d6ef2bf3c8f39a643d471c75bc04e80a2bda5c846ec2`; it is 461,335 bytes, `application/zip`, and the local archive passes `unzip -tqq`. Live ZIP and hashed assets are immutable. Live home has HSTS, `nosniff`, strict-origin referrer policy, microphone permissions policy, and CSP with only self plus `https://api.sociobot.in` for connections. |
| Performance budget | Fresh build: home JS 8,040 B raw, home CSS 12,183 B raw, and mobile hero AVIF 6,861 B. All are within the stated budgets. |

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Live download returned HTML, not an extension | Fixed: live ZIP is an MV3 archive with the matching checksum and `application/zip`. |
| Clean tests/types needed generated WXT files | Fixed: `pretest` and `typecheck` generate WXT types; clean `npm test` and `npm run typecheck` passed. |
| Hostname with a port created an unusable command | Fixed: the installed-settings test rejects `example.com:443` with a recovery message. |
| Free limit was five, not ten | Fixed: clean extension profile added ten commands and rejected the eleventh. |
| Live cache/security headers were incomplete | Fixed: live CSP, microphone policy, and immutable download/asset caching were observed. |
| Claims manifest and isolated one-click demo were absent | Fixed: 16 declared tests passed; the live demo has isolated `demo:` storage, label, reset, and start-for-real behavior. |
| Pilot billing endpoint was shipped | Fixed: source and live link use `https://api.sociobot.in/api/v1`; deterministic production-origin 429/`Retry-After` fixtures passed. No shared checkout request was made because it is outside this product's permitted scope. |
| Action execution and confirmation lacked installed-extension evidence | Fixed: the real popup/action harness passed focus, cancel, confirmation, and local-storage checks. |
| Metadata, legal skeleton, and 404 were incomplete | Mostly fixed: live route metadata, legal skeleton, and real 404 pass. The landing footer attribution omission remains as the P2 finding above. |

## Scope note

No request was sent to the shared Sociobot checkout or license service. The
work order restricts this verification to the product scope. The visible
production endpoint, deterministic fixture coverage, and 429/`Retry-After`
handling were checked without probing that shared service.

## Required repair

1. Add a precise claim and observable test for the published no-audio/page-content-storage promise, or remove that promise from the site and README.
2. Add “Built by Param Factory” to the landing footer, then rerun the content, browser, and live checks.

**Final result: FAIL — 2 findings, including 1 untested public claim.**
