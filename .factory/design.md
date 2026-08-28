# Say the Action — visual thesis

## Direction: neo-brutalist control card

This product should feel like a small, inspectable tool clipped beside the browser—not a magical assistant. Its visual language borrows from labelled hardware controls, accessibility switches, and index cards: hard black rules, deliberately offset shadows, square corners, short labels, and obvious state changes. The roughness is disciplined. Every heavy border separates a real control or safety state.

## Palette

Light is the primary treatment; dark is a purpose-built companion selected by the device.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | `#F4F0E6` | `#171713` | page / extension background |
| panel | `#FFFDF7` | `#25251F` | working surfaces |
| ink | `#171713` | `#FFFDF7` | text and rules |
| muted | `#5E5A50` | `#C9C3B4` | secondary copy |
| signal | `#FF5B3D` | `#FF765F` | listening / primary action |
| lemon | `#E8FF58` | `#D9EF4A` | focus and selected state |
| calm | `#087F5B` | `#55D6AA` | success / safe state |
| caution | `#8B4B00` | `#FFC46B` | pending confirmation |
| danger | `#B42318` | `#FF8A80` | errors / destructive intent |

Ink/paper and muted/paper exceed WCAG AA for body copy. Signal is never used as the only carrier of meaning. Focus is a 3px ink outline with a 3px lemon offset.

## Typography

- Display and labels: `Arial Black`, `Arial Narrow Bold`, system sans-serif. The compressed, emphatic voice resembles a physical control label and avoids a font download.
- Body and code: `ui-monospace`, `SFMono-Regular`, `Cascadia Code`, `Liberation Mono`, monospace. Commands should read as literal, inspectable strings.
- Scale: 14 / 16 / 20 / 28 / 44 / 68px. Body never below 16px in task surfaces. Tabular figures for counts and timestamps.
- Reading measure: 62 characters for instructional copy.

## Space, shape, and depth

- Base rhythm: 4px; common gaps 8, 12, 16, 24, 32, 48, 64px.
- Corners remain square. Primary panels use 3px ink rules and a 6px offset ink shadow. Nested controls use 2px rules without shadows.
- Controls are at least 44px high. Layout at 390px becomes one column, drops the decorative side annotation, and keeps the push-to-talk control within the natural document flow rather than fixed over content.

## Interaction grammar

- **Resting:** cream face, black rule, concise verb.
- **Listening:** signal-red face, inset dot, text becomes “Listening—release to stop”.
- **Matched:** lemon highlight connects the heard phrase to the allowed action.
- **Needs confirmation:** amber striped safety slip names the exact action and site; “Run action” and “Cancel” are equally reachable.
- **Completed:** green status line plus a local log entry. Nothing runs invisibly.
- Press-and-hold is the default pointer gesture. Keyboard users focus the control and press Space to start/stop; a click/tap toggle remains available for switch and touch access.

## Motion policy

State changes use 160ms opacity and 2–4px transforms; panels enter from the control that opened them. Listening uses a single restrained 900ms scale pulse on the dot, never a full-screen animation. With `prefers-reduced-motion: reduce`, transforms and pulses are removed and states change instantly. No animation is required to understand status.

## Illustration and assets

Hero asset: an original editorial still life showing a physical red push-to-talk slab sending one lemon-colored, visibly bounded command card toward a small browser window. The bounded rail communicates the promise: speech can only travel to an action the person approved. It is explanatory, not decorative.

Prompt sheet:

> Neo-brutalist editorial still life, straight-on orthographic view of a chunky vermilion push-to-talk switch on a cream workbench, one acid-lemon command card traveling along a short black metal guide rail into a small abstract browser window, tactile paper and painted steel materials, hard three-pixel black outlines, offset block shadows, limited palette warm cream black vermilion acid lemon muted green, crisp noon studio light, slight paper grain, strong negative space, accessible utility-tool mood, no people, no hands, no text, no letters, no numbers, no watermark, no logos, no gradients, no glossy 3D, no existing brand symbols.

Generated with the factory Azure image deployment (`factory-image`) on 2026-08-28. The image is original to this product. Source PNG and prompt sidecar live in `assets/src/`; optimized AVIF (7–13 KB), WebP (10–17 KB), and PNG fallback (194 KB) variants ship in the site. Hand-authored microphone and safety icons are inline SVG and inherit current color.

## Capability honesty

The site shows a bounded command moving into one browser window, never a robot operating an entire computer. Copy consistently says “browser actions” and calls out Web Speech API availability and that this is not a replacement for platform accessibility tools.
