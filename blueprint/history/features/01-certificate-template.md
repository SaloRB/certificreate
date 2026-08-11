# Feature: Certificate template (Black Border)

**From build-plan:** feature 1
**Status:** built, awaiting review (branch `feature/certificate-template`)

> **Open item for feature 8.** A ~90-character course title wraps to a second
> line that overlaps the logo mark by 7px. Horizontal containment was fixed here
> (`CONTENT_WIDTH`); shrink-to-fit is feature 8's scope and was deliberately not
> written. A 60-character name also wraps, leaving only 3px between its rule and
> the lead line.

## Goal

Recreate the existing "Black Border" certificate as a self-contained, themeable
HTML/CSS React component that renders from a single typed input object and shows
placeholder data. This is the artifact the whole product produces: feature 2 binds
live form values to it, and features 3 and 4 render this exact markup through
Puppeteer to PNG and PDF. Everything downstream inherits the fidelity and the
contracts settled here.

## Design reference

- [blueprint/references/cert-example.png](../references/cert-example.png) - the real certificate. This is the fidelity target; build against it, not the description.
- [prototypes/theme.css](../../prototypes/theme.css) - locked design tokens, the source of truth for color and type.
- [prototypes/editor.html](../../prototypes/editor.html) - approved mockup. Its `.certificate` block is a close-but-not-exact draft: **the corner flourishes are plain rounded corners and the reference's notched corners are not reproduced.** Fix that here against the image.

Where the mockup and the reference image disagree, the image wins.

## In scope

- Theme tokens ported from `prototypes/theme.css` into the app's Tailwind v4 `@theme`
- Self-hosted display serif and body sans via `next/font` (build-time self-hosting; the Puppeteer container must never fall back to system fonts)
- `CertificateInput` type and the fixed-size canvas constants
- One `BlackBorderCertificate` component: frame, corner flourishes, headline block, name rule, course line, instructor/date footer, dotted-T logo mark
- A `/preview` dev route rendering the component with placeholder data, scaled to fit

## Out of scope

- Form inputs, live binding, state (feature 2)
- Any server render, export route, or Puppeteer work (features 3, 4)
- A template registry, second template, or picker (feature 5) - this feature ships one component, though `templateId` exists in the type from the start
- Brand settings, logo upload, color overrides (feature 6) - the logo is the built-in mark and colors come from the theme tokens
- Long-name auto-fit, date formatting, Zod validation (feature 8) - the template must not visibly break on long input, but no fitting logic is written here
- Removing `prototypes/` (happens at this feature's `/complete`)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Port the theme** - move the `prototypes/theme.css` variables into `app/globals.css` as Tailwind v4 `@theme` tokens (chrome palette and the `--cert-*` artifact palette), and wire the display serif (Cormorant Garamond) plus body sans (Lato) through `next/font/google` in `app/layout.tsx`, replacing the Geist defaults. *Done when:* `npm run build` passes, and a page using a `--cert-*` token and both font variables renders with the correct families (no system-font fallback in devtools).

- [x] **Step 2 - Type, canvas constants, and empty shell** - add `types/certificate.ts` with the load-bearing `CertificateInput` type and `CERT_WIDTH_PX` / `CERT_HEIGHT_PX`, then `components/certificate/BlackBorderCertificate.tsx` as a server component rendering a blank white sheet at exactly that fixed size, plus `app/preview/page.tsx` rendering it inside a fit-to-width scaling wrapper with placeholder data. *Done when:* `/preview` shows a white landscape sheet at the correct 1123:794 ratio, and reading `document.querySelector('[data-certificate]').getBoundingClientRect()` before scaling reports 1123 x 794.

- [x] **Step 3 - Frame and corner flourishes** - the thin dark outer rule inset on the paper, the steel-blue double border inside it, and the notched corner treatment from the reference image. *Done when:* a screenshot of `/preview` placed beside `cert-example.png` matches on frame inset, line weights, the gap between the double lines, and the corner shape - specifically the corners are the reference's notched form, not plain rounded corners.

- [x] **Step 4 - Headline and body block** - "Certificate" / "of Completion" serif headline, the letter-spaced "THIS IS TO CERTIFY THAT" line, the recipient name over its rule, the "Has completed the following Traversy Media course:" lead, and the bold course title, all fed from `CertificateInput`. *Done when:* `/preview` matches the reference's type hierarchy, letter-spacing, and vertical rhythm; and rendering with `recipientName: ""` and `courseTitle: ""` leaves the layout intact - rules and spacing hold, nothing collapses or throws.

- [x] **Step 5 - Footer and logo mark** - instructor value over its rule with the "Instructor" caption, date value over its rule with the "Date" caption, and the dotted-T circle mark centered between them as inline SVG using the theme's border color. *Done when:* `/preview` matches the reference footer: three-column alignment, rule widths, caption font, and a logo mark whose circle weight and five-dot arrangement match the image.

- [x] **Step 6 - Fidelity and robustness pass** - compare `/preview` against the reference at full size, correct the remaining drift, and check the sheet at export scale. *Done when:* the certificate renders correctly at 1x and at 3x (via browser zoom or a `deviceScaleFactor: 3` screenshot) with no blurred or reflowed text; a 60-character name and a 90-character course title still stay inside the frame without overlapping the rules; and `npm run build` passes with no console errors on `/preview`.

## Files / areas

| Path | Change |
| --- | --- |
| `app/globals.css` | Theme tokens ported into `@theme` |
| `app/layout.tsx` | `next/font` serif + sans, replacing Geist |
| `types/certificate.ts` | New - `CertificateInput`, canvas constants |
| `components/certificate/BlackBorderCertificate.tsx` | New - the template |
| `app/preview/page.tsx` | New - dev preview route |

## Data / contracts

**`CertificateInput` - load-bearing.** Features 2, 3, 4, 7, and 8 all pass this
object; features 3 and 4 send it across the wire to the render route. Lock it now.

```ts
export interface CertificateInput {
  recipientName: string;
  courseTitle: string;
  date: string;        // display-ready string; formatting is feature 8's job
  instructor: string;
  templateId: string;  // "black-border" for now; feature 5 adds the registry
}
```

**Fixed canvas - load-bearing.** The template renders at exactly
`CERT_WIDTH_PX = 1123` x `CERT_HEIGHT_PX = 794` (A4 landscape at 96dpi) with
internal sizing in px. Preview scales the whole sheet with a CSS `transform:
scale()` wrapper; it never re-lays-out at a different size. Features 3 and 4 set
the Puppeteer viewport to exactly these numbers and vary only
`deviceScaleFactor`, which is what guarantees preview and export can't drift.

**Theme tokens.** `--cert-paper`, `--cert-ink`, `--cert-ink-soft`, `--cert-rule`,
`--cert-frame`, `--cert-border`, `--cert-border-thin`. Feature 6a writes to these
to apply brand colors, so the component must read them as CSS variables and never
hardcode a color.

No database, no persistence, no API in this feature.

## Testing

No `test` command is declared in `AGENTS.md`, so the test gate is **off**. This is
a pure UI/visual feature and would be badly served by unit tests anyway. Verify
with browser evidence and the build:

- Screenshot `/preview` and compare against [cert-example.png](../references/cert-example.png) side by side at each of steps 3, 4, 5, and 6
- Check the browser console on `/preview` is clean
- `npm run build` passes at every step
- Edge cases to render explicitly, per the done-whens: empty name and course (step 4), a 60-char name and 90-char course title (step 6)

If `/tests` is run later, the only in-scope logic here would be date/text
formatting helpers, and none are written in this feature.

## Notes for the AI

- **Server component.** No `'use client'` anywhere in this feature; nothing here is interactive.
- **No `src/`.** Files go at `components/`, `types/`, `app/` per the tuned coding standards. Import via the `@/*` alias.
- **Colors come from tokens only.** Every color resolves through a `--cert-*` variable, or feature 6a's brand overrides will not work.
- **Fonts must be self-hosted.** Use `next/font`, which self-hosts at build time. A Google Fonts `<link>` would work locally and then fail or silently fall back inside the Render container, which is exactly the drift feature 3 must not inherit.
- **The mockup is a draft, the image is the target.** Port tokens from `theme.css`, but check every measurement against `cert-example.png`. The prototype's corner flourishes are known to be wrong.
- **The prototype uses container-query units; this component uses fixed px.** Deliberate: a fixed canvas plus an outer scale transform is the more predictable contract for the Puppeteer export.
- Do not add the second and third templates seen in the mockup's picker; those are feature 5.
