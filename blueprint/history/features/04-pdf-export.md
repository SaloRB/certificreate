# Feature: PDF export

**From build-plan:** feature 4
**Status:** complete (branch `feature/pdf-export`)

> **Built as spec'd, with two things the build forced.**
> 1. The spec's prediction held: `format: "A4", landscape: true` would have spilled
>    onto a blank second page, because A4 landscape is 1122.52 x 793.7px against a
>    1123 x 794 sheet. The PDF is sized from the sheet instead, giving 297.35 x
>    210.19mm, off standard A4 by about a third of a millimetre.
> 2. `app/render/certificate/page.tsx` gained a full-bleed `bg-cert-paper` backdrop
>    (F-08). Chrome rounds the requested paper size *up*, so the app's dark body
>    background printed as a hairline down the right and bottom edges of every PDF.
>    The backdrop is load-bearing; do not remove it.
>
> `emulateMediaType("screen")` is also load-bearing: `page.pdf()` emulates print
> media by default, which repaints the page and would let the export drift from the
> preview.
>
> Step 1 was a pure refactor. The PNG export is byte-identical before and after
> (sha256 a1edafa5...), verified again after the F-08 repair.

## Goal

Add a second output to the pipeline feature 3 built: `POST /api/export/pdf`
renders the same `/render/certificate` page through the same shared browser and
returns a print-ready landscape PDF, one page, exact A4 landscape size, no
margins. A "Download PDF" button sits beside "Download PNG" in the editor.

The value is print fidelity: a PNG is fine on screen, but a certificate that gets
printed or emailed as a document wants a PDF whose page is exactly the artwork,
with selectable text and vector-crisp rules rather than resampled pixels.

Nothing about the certificate template changes. If this feature needs a template
edit, the render route is wrong, not the template.

## In scope

- Extracting the render-and-respond plumbing the PNG route already contains so
  both routes share one navigate/font-wait path and one error contract.
- `POST /api/export/pdf`: same `CertificateInput` body, same validation, same
  browser singleton and concurrency cap, returning `application/pdf`.
- Page geometry: exactly one page, sized from `CERT_WIDTH_PX` /
  `CERT_HEIGHT_PX`, zero margins, backgrounds printed.
- Screen-media capture so the PDF matches the on-screen preview, not Chrome's
  print stylesheet.
- A "Download PDF" button with its own pending and error state.

## Out of scope

- **Template picker / multiple templates** - feature 5. The PDF route accepts
  `templateId` and renders Black Border for any value, same as PNG.
- **Brand colors and logo upload** - feature 6.
- **Saving generated certificates to history** - feature 7. The PDF is streamed
  and never persisted.
- **Zod validation** - feature 8 owns the swap. Keep using
  `parseCertificateInput`.
- **User-selectable page size, margins, or print options** - not in the plan. A4
  landscape is the only output.
- **PDF metadata (title, author), tagging, or PDF/A** - not asked for; do not add.
- **Deploying to Render, `render.yaml`, health checks** - the user deploys
  manually. Do not add deploy steps.
- **Render queue tuning and instance sizing** - feature 9. The existing cap of 2
  concurrent renders is reused as-is, not re-tuned.
- **Changing the PNG output.** Step 1 is a pure refactor; the bytes the PNG route
  returns must not change.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - share the export plumbing (refactor, no behavior change)** - two
  small modules, then rewire the PNG route onto them.
  - `lib/puppeteer/capture-certificate.ts`: `captureCertificate(input, capture)`
    opens a page via `withPage`, navigates to
    `${renderOrigin()}/render/certificate?${toRenderParams(input)}` with
    `waitUntil: "networkidle0"`, awaits `document.fonts.ready` in the page, then
    hands the ready page to the caller's `capture(page)`. Viewport setting stays
    with the PNG caller, since PDF sizing is set on the `page.pdf()` call instead.
  - `lib/certificate/export-route.ts`: `handleExportRequest(request, options)`
    with `options = { contentType, extension, render }`. It parses JSON (400 on
    bad JSON), runs `parseCertificateInput` (400 with the field message), calls
    `render(input)`, and returns the bytes with `Content-Type`,
    `Content-Disposition: attachment; filename=<certificateFileName(input, ext)>`,
    and `Cache-Control: no-store`. A throwing `render` logs server-side and
    returns the existing generic 500 JSON. No raw exception text ever reaches the
    client.
  - `app/api/export/png/route.ts` becomes a thin caller: keep
    `export const runtime = "nodejs"`, keep `DEVICE_SCALE_FACTOR = 2`, keep the
    `[data-certificate]` element screenshot and the `new Uint8Array(...)` copy
    (Puppeteer types the screenshot as possibly `SharedArrayBuffer`-backed, which
    `Response` rejects - do not "simplify" that away).
  *Done when:* `npx tsc --noEmit` and `npm run build` are clean, `npm test` is
  green including new tests for `handleExportRequest`, and a PNG exported after
  the refactor is byte-identical (`shasum`) to one exported before it from the
  same input.

- [x] **Step 2 - `POST /api/export/pdf`** - a route mirroring the PNG one:
  `runtime = "nodejs"`, `handleExportRequest` with `contentType:
  "application/pdf"` and `extension: "pdf"`. Its render function goes through
  `captureCertificate`, calls `page.emulateMediaType("screen")` before capture so
  the PDF matches the preview rather than Chrome's print stylesheet, then
  `page.pdf()` with `width` and `height` set from `CERT_WIDTH_PX` and
  `CERT_HEIGHT_PX` as px strings, plus `printBackground: true`, all four margins
  zero, and `pageRanges: "1"`. See Data / contracts for why explicit dimensions replace
  `format: "A4", landscape: true`. *Done when:* `curl -X POST` with a valid body
  writes a PDF that `mdls` (or `pdfinfo`) reports as **1 page** at roughly
  297 x 210 mm (842 x 595 pt) landscape; the certificate fills the page edge to
  edge with no white gutter and nothing clipped; opening it beside the browser
  preview shows identical fonts, spacing, colors, and border geometry; a body
  missing `recipientName` returns 400 with a JSON message; and a forced render
  failure returns the generic 500 while the real error appears in the server log.

- [x] **Step 3 - Download PDF button** - add a second button to
  `components/editor/DownloadButtons.tsx` using a second
  `useCertificateDownload("/api/export/pdf", "certificate.pdf")` instance. Each
  button shows its own pending label and disabled state, and each error renders
  in its own `role="alert"` line so a PNG failure never appears under the PDF
  button. Style the PDF button as the secondary action so PNG stays the primary.
  *Done when:* clicking Download PDF in the running app saves a PDF of the
  certificate currently shown in the preview, edits made in the form appear in
  the downloaded file, the button is disabled and labelled while rendering,
  triggering a failure shows a friendly inline message under that button only,
  both buttons work independently, and the browser console is error-free.

- [x] **Repair F-08 - PDF pages carry a dark hairline on the right and bottom
  edges** - the render page inherits the app's dark `body` background, and Chrome
  rounds the requested paper size up by 0.84px wide and 0.56px tall, so that strip
  of dark background prints on every PDF. Give `app/render/certificate/page.tsx` a
  full-bleed `bg-cert-paper` wrapper so the paper is white regardless of how the
  size rounds. *Done when:* a freshly exported PDF measures pure white
  (255,255,255) along its right and bottom edges and at the bottom-right corner in
  a native-resolution rasterisation, the PNG export stays byte-identical, and
  `tsc` / `npm test` / `npm run build` are clean.

## Files / areas

| Path | Change |
| --- | --- |
| `lib/puppeteer/capture-certificate.ts` | new - navigate + font-wait, shared by both routes |
| `lib/certificate/export-route.ts` | new - shared parse, headers, and error contract |
| `lib/certificate/export-route.test.ts` | new - unit tests for the handler |
| `app/api/export/png/route.ts` | rewired onto the shared helpers, output unchanged |
| `app/api/export/pdf/route.ts` | new - the PDF endpoint |
| `components/editor/DownloadButtons.tsx` | second button, per-action pending and error state |

No changes to `components/certificate/`, `app/render/certificate/page.tsx`,
`lib/puppeteer/browser.ts`, `lib/certificate/export-request.ts`,
`lib/certificate/render-params.ts`, or `types/certificate.ts`.

## Data / contracts

- **Request body:** the existing `CertificateInput`, unchanged. Both export
  routes take the same payload; there is no PDF-specific request type.
- **Route:** `POST /api/export/pdf`, beside `POST /api/export/png`.
- **Response:** `application/pdf` binary, `Content-Disposition: attachment;
  filename="certificate-<slug>.pdf"`, `Cache-Control: no-store`. Errors stay
  `{ error: string }` JSON with 400 (bad input) or 500 (render failure), matching
  PNG exactly, so `useCertificateDownload` needs no changes.
- **Page geometry:** derived from `CERT_WIDTH_PX` / `CERT_HEIGHT_PX`. Never
  retype 1123/794.
- **Why explicit `width`/`height` instead of `format: "A4", landscape: true`:**
  A4 landscape is 1122.52 x 793.7 CSS px, but the sheet is exactly 1123 x 794, so
  format-based sizing overflows by a fraction of a pixel and Chrome emits a blank
  second page. Passing the sheet's own dimensions gives a page of 297.1 x 210.1
  mm, off standard A4 by a tenth of a millimetre (invisible in print) and
  guaranteed to hold the artwork on one page with no scaling. `landscape` is not
  passed, since it only affects format-based sizing; the page is landscape
  because width exceeds height. `pageRanges: "1"` is a cheap guard so a future
  layout change can never silently ship a two-page certificate.
- **`emulateMediaType("screen")` is load-bearing.** `page.pdf()` emulates print
  media by default, which can change what the browser paints. This project's
  whole premise is that preview and export never diverge, so the PDF is captured
  under screen media.
- No database, no stored files. The PDF is streamed and never persisted.

## Testing

The test gate is **on** (`npm test`, Vitest, declared in `AGENTS.md`).

- **Step 1 ships tests.** `handleExportRequest` is in-scope logic: it branches on
  input and builds headers, and it takes `render` as an injected function, so it
  tests without a browser. Cover: non-JSON body returns 400; a body failing
  `parseCertificateInput` returns 400 with that field message; a successful
  render returns the bytes with the right `Content-Type`, filename (including a
  slugged recipient name), and `Cache-Control`; a throwing `render` returns 500
  with the generic message and never leaks the exception text.
- **Steps 2 and 3 are exempt** - a Puppeteer route and a UI button are
  integration surfaces. They ride on curl output, `pdfinfo`/`mdls` page-count and
  page-size readings, a screenshot compared against the preview, and the build,
  per the Testing section of `coding-standards.md`.
- `npx tsc --noEmit`, `npm run build`, and `npm test` must all be clean before
  any step is approved.

**Parity check is the real acceptance test:** the exported PDF, the exported PNG,
and the on-screen preview must all show the same certificate. Any difference in
font, spacing, or color means the capture diverged and must be fixed, not worked
around.

## Notes for the AI

- **Step 1 must not change PNG output.** Prove it with a `shasum` comparison of a
  before-and-after export from the same input, not by reading the diff.
- Reuse the existing browser singleton and its cap of 2 concurrent renders. Do
  not launch a second browser, add a PDF-specific queue, or touch the launch
  flags.
- `export const runtime = "nodejs"` on the PDF route. Route handlers are Node, not
  Edge.
- Keep building the render URL from `renderOrigin()` (loopback), never from the
  incoming request. The comment in `lib/puppeteer/render-origin.ts` explains why;
  do not undo it.
- `page.pdf()` returns a `Uint8Array`. If TypeScript complains that `Response`
  will not take it, copy it the same way the PNG route does rather than casting.
- Await `document.fonts.ready` before the PDF capture too. A PDF that beats the
  fonts silently falls back to a system serif.
- Never echo raw exception text to the client; log the real error server-side
  (`coding-standards.md`).
- Only `DownloadButtons.tsx` and the download hook are `'use client'`.
- Tailwind v4 tokens only, no hardcoded hex, no inline styles.
- No em dashes in code, comments, or commit messages.

## Findings

Resolved findings from this work item, at their final status.
Unresolved entries stay in `blueprint/context/findings.md`.

### 04/F-07 [P3] closed - Preview scaling relies on calc() length division

**File:** app/globals.css:64
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `scale(min(1, calc(100cqw / 1123px)))` divides a length by a
length, a CSS Values 4 feature. It is verified working in the Chromium used for
this feature's evidence, but was not tested in Safari or Firefox. If a browser
rejects it, the declaration is invalid, the sheet renders unscaled, and
`.cert-fit`'s `overflow: hidden` crops the certificate silently instead of
failing visibly. Unverified because no cross-browser check has been run.
**Suggested fix:** Check Safari and Firefox when feature 2 builds the real
preview. If unsupported, fall back to a JS-set scale variable, or accept the
uncropped overflow by removing `overflow: hidden`.
**Resolution:** Confirmed real in feature 2 step 4. Firefox 1490 dropped the
declaration (`transform: none`), rendering the sheet at 1123x794 inside a 900px
`.cert-fit` and cropping it silently, exactly as predicted; WebKit was fine. The
`tan(atan2())` workaround was tried and broke WebKit instead. Fixed with the
finding's named fallback: `components/certificate/CertificateFit.tsx` measures the
container with a `ResizeObserver` and sets `--cert-scale`, and `.cert-fit` no
longer needs `container-type`. All three engines now compute the same 0.801425
matrix with no cropping. Closed 2026-08-11 by /audit (scope: current): re-read the
repaired code, no `calc()` length division remains in `app/globals.css`, the scale
derives from `CERT_WIDTH_PX` rather than a literal, and the observer disconnects on
unmount. No new defect introduced.

### 04/F-08 [P1] closed - PDF pages carry a dark hairline down the right and bottom edges

**File:** app/api/export/pdf/route.ts:26
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `page.pdf()` captures the whole page, and the app's `body`
paints `--color-bg` (#0b0d10). Chrome rounds the requested paper size up: asking
for 1123 x 794px yields a MediaBox of 842.88 x 595.92pt, which is 1123.84 x
794.56px. The certificate covers 1123 x 794 of that, so a 0.84px strip on the
right and a 0.56px strip on the bottom expose the dark body background, with
`printBackground: true` faithfully painting it. Measured on a native-resolution
rasterisation of a real export: the left edge is pure white (255,255,255) while the
right edge reads (61,62,66) for its full height, the bottom edge (152,153,154) for
its full width, and the bottom-right corner (39,40,44). The two strip widths
predict exactly that ordering, so this is geometry, not a rasteriser artifact. It
ships on every PDF and prints as a dark hairline on two edges. The PNG is unaffected
because it screenshots the element rather than the page.
**Suggested fix:** Paint the render page's own background white instead of relying
on the sheet to cover the paper: give `app/render/certificate/page.tsx` a wrapper
with `bg-cert-paper` (or set it on that route's `body`). That also immunises the
export against any future rounding change. Do not chase the exact paper size.
**Resolution:** Fixed as specified in `app/render/certificate/page.tsx`: the
wrapper is now `min-h-screen w-full shrink-0 bg-cert-paper`, with a comment saying
why it is load-bearing. Proved causally rather than by eye, because the finding's
own rasterised measurement turned out to be unreliable at the page boundary (sips
antialiases the PDF edge, which reads as residual grey whatever the content is).
Instead, full-page screenshots at 3x device scale, taken at the exact paper size
with no PDF rasteriser in the loop: with the repair in place and the page
background forced to #ff0000, every pixel beyond the sheet on the right and bottom
edges is (255,255,255); with the repair stripped back off at runtime and the same
red forced, those pixels are (255,0,0). The backdrop is therefore exactly what
closes the leak. PNG export re-verified byte-identical (sha256 a1edafa5...), and
`tsc`, lint, `npm test` (24), and `npm run build` are clean. Awaiting /audit
re-review. Closed 2026-08-11 by /audit (scope: current): re-read the repaired
route, the original defect is gone by the causal red-background test above, and
the repair introduces no new one. The two ways it could have regressed were both
checked: it does not disturb the PNG (still byte-identical to the pre-feature
baseline a1edafa5..., so no scrollbar or reflow was introduced at the pinned
1123x794 viewport), and `bg-cert-paper` is the same existing token the sheet
itself uses rather than a new hardcoded colour. The backdrop is documented as
load-bearing at the call site.

### 04/F-13 [P1] accepted - A crashed Chrome is never detected, so exports stay broken until restart

**File:** lib/puppeteer/browser.ts:13
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `browserPromise` clears itself when `puppeteer.launch()`
rejects, but nothing detects a browser that dies after the promise has resolved.
`getBrowser()` keeps returning the same settled promise, so every later
`withPage()` call reuses a dead handle. Reproduced live during this feature's work:
after the shared Chrome went away, both `/api/export/png` and `/api/export/pdf`
returned 500 with `ConnectionClosedError: Connection closed` on every subsequent
request, and only restarting the server recovered. In dev this is the hot-reload
annoyance feature 3's spec chose to tolerate. In production it is different: a
single Chrome crash (OOM is realistic on the Starter instance the overview names)
takes down both export routes, which are the product's headline capability, until
someone manually restarts the Render service. Nothing would surface it either, as
the health check path is still an open question in `project-overview.md`, so a
liveness probe would not catch a dead subprocess behind a healthy server.
**Suggested fix:** Treat a disconnected browser as a cache miss rather than adding
a reconnect scheme. In `getBrowser()`, await the cached promise and check
`browser.connected`; if it is false, null `browserPromise` and launch again. A
`browser.once("disconnected", () => { browserPromise = null; })` handler at launch
achieves the same in fewer moving parts. Either is a few lines and needs no change
to `withPage` or the routes.
**Resolution:** Accepted 2026-08-11 on the user's explicit decision: "Let's just
finish this step, we can handle it later." Deferred, not dismissed. The code is
unchanged and the failure mode described above is still live, so a Chrome crash in
production still takes both export routes down until the Render service is
restarted. Feature 9 (production hardening on Render) is the natural home for the
repair; this entry archives with feature 4, so carry it forward there rather than
relying on the ledger to resurface it.

