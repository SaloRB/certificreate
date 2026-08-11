# Feature: PNG export

**From build-plan:** feature 3
**Status:** complete (branch `feature/png-export`)

> **Built as spec'd, with three additions the build forced.**
> 1. `next.config.ts` sets `devIndicators: false`: the dev badge overlaps the
>    sheet's bottom-left corner, so an element-clipped screenshot baked it into
>    locally exported PNGs. Production never renders it.
> 2. `lib/certificate/render-params.ts` holds both directions of the render query
>    string, so the export route and the render page cannot drift on a param name.
>    Feature 4 imports `toRenderParams` unchanged.
> 3. `eslint.config.mjs` ignores `.puppeteerrc.cjs`, which Puppeteer loads through
>    `require()` and so cannot be ESM.
>
> The screenshot is copied into a fresh `Uint8Array` before it becomes a
> `Response` body: Puppeteer types it as possibly `SharedArrayBuffer`-backed,
> which `Response` rejects. Do not "simplify" that away.
>
> Carried forward from feature 2: the stage hint still reads "A4 landscape" rather
> than the real export dimensions (2246 x 1588). Not in this spec's scope.

## Goal

Turn the live preview into a downloadable file: a server route renders the exact
same certificate template through headless Chrome and returns a high-resolution
PNG, sharp enough for print and social.

This is the headline feature. The render pipeline built here (browser singleton,
render route, request contract) is what feature 4 (PDF) reuses unchanged, and what
features 5, 6, and 7 feed into. Preview and export must never drift, so the export
renders the same React component at the same fixed size, not a second copy of the
design.

## In scope

- `puppeteer` (full package, bundled Chromium) as a runtime dependency, with the
  Chrome cache config the deployment notes settle on.
- A shared browser singleton: Chrome launched once per server process, one page
  per request, with a small concurrency limiter.
- A chrome-free render route that draws one certificate at exactly
  `CERT_WIDTH_PX` x `CERT_HEIGHT_PX`, unscaled, for Puppeteer to navigate to.
- Boundary validation of the incoming `CertificateInput`.
- `POST /api/export/png` returning a PNG at `deviceScaleFactor: 2`.
- A "Download PNG" button in the editor with pending and error states.

## Out of scope

- **PDF export** - feature 4, same pipeline.
- **Deploying to Render** - done manually by the user once this works locally.
  Do not add deploy steps, `render.yaml`, or a health check route here.
- **Zod** - feature 8 owns validation polish. Use a small hand-rolled guard now
  and leave the swap point obvious.
- **Template picker / multiple templates** - feature 5. The render route accepts
  `templateId` and renders Black Border for any value, so the contract is already
  the right shape.
- **Brand colors, logo upload** - feature 6.
- **Saving the generated certificate to history** - feature 7.
- **Render queue tuning, instance sizing, concurrency load testing** - feature 9.
  A hard cap is set here; measuring it is not.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Puppeteer dependency and browser singleton** - add `puppeteer` to
  `dependencies`, add `.puppeteerrc.cjs` pointing `cacheDirectory` at
  `join(__dirname, '.cache', 'puppeteer')`, add `.cache` to `.gitignore`, add
  `serverExternalPackages: ["puppeteer"]` to `next.config.ts`, and write
  `lib/puppeteer/browser.ts`: a lazily launched, module-scoped browser promise
  with the settled launch flags, a `withPage(fn)` helper that opens and always
  closes one page, and an in-process limiter capping concurrent renders at 2 with
  the rest queued. *Done when:* `npm run build` passes, `npx tsc --noEmit` is
  clean, and a throwaway script in the scratchpad calls `withPage` to screenshot
  `example.com` successfully (script is not committed).

- [x] **Step 2 - `/render/certificate` route** - a server-rendered page that reads
  a `CertificateInput` from search params and renders `BlackBorderCertificate`
  raw: no header, no `CertificateFit` scaling, no page padding, body background
  transparent-or-white, sheet at natural size at the document origin. *Done when:*
  visiting `http://localhost:3000/render/certificate?recipientName=Sarah%20Whitfield&courseTitle=Test&date=07/13/2026&instructor=Brad%20Traversy&templateId=black-border`
  shows the certificate flush to the top-left corner with no app chrome, and its
  bounding box measures exactly 1123 x 794 CSS px.

- [x] **Step 3 - PNG export route** - `lib/certificate/export-request.ts` with
  `parseCertificateInput(value: unknown)` (returns the trimmed input or a field
  error, enforcing required non-empty strings and a max length) and
  `certificateFileName(input, ext)` (slugified recipient name, safe fallback for
  empty/non-latin). Then `app/api/export/png/route.ts`: POST, validate, build the
  render URL from the request origin, `setViewport({ width: 1123, height: 794,
  deviceScaleFactor: 2 })`, `goto(..., { waitUntil: "networkidle0" })`, await
  `document.fonts.ready` in the page, screenshot the `[data-certificate]` element,
  return `image/png` with a `Content-Disposition` attachment filename. Invalid
  body returns 400 with a JSON message; a render failure returns 500 with a
  generic message and logs the real error server-side. *Done when:* a `curl -X
  POST` with a valid body writes a PNG that `sips -g pixelWidth -g pixelHeight`
  reports as 2246 x 1588, a body missing `recipientName` returns 400, and the
  saved PNG visually matches the browser preview.

- [x] **Step 4 - Download PNG button** - a button in the editor panel that POSTs
  the current `CertificateInput`, downloads the returned blob under the
  server-supplied filename, and shows a disabled/pending state while rendering
  plus an inline error message on failure (never raw exception text). Keep the
  fetch-and-download logic in a small `useCertificateDownload` hook so feature 4
  can add PDF by passing a different endpoint. *Done when:* clicking Download PNG
  in the running app saves a PNG of the certificate currently shown in the
  preview, the button is disabled and labelled as working during the render, the
  console is error-free, and killing the route (or sending a bad payload) shows a
  friendly inline error instead of a crash.

## Files / areas

| Path | Change |
| --- | --- |
| `package.json` | `puppeteer` in `dependencies` |
| `.puppeteerrc.cjs` | new - Chrome cache directory inside the repo |
| `.gitignore` | add `.cache` |
| `next.config.ts` | `serverExternalPackages: ["puppeteer"]` |
| `lib/puppeteer/browser.ts` | new - browser singleton, `withPage`, concurrency limiter |
| `app/render/certificate/page.tsx` | new - chrome-free render target |
| `lib/certificate/export-request.ts` | new - input validation + filename builder |
| `app/api/export/png/route.ts` | new - the PNG endpoint |
| `components/editor/DownloadButtons.tsx` | new - download UI |
| `lib/hooks/use-certificate-download.ts` | new - fetch, blob, filename, pending/error state |
| `components/editor/Editor.tsx` | mount the download UI |

Nothing in `components/certificate/` changes. If the export needs a template
edit, that is a signal the render route is wrong, not the template.

## Data / contracts

**Load-bearing - feature 4 reuses all of this unchanged.**

- **Request body:** the existing `CertificateInput` from `types/certificate.ts`,
  posted as JSON. No new payload type.
- **Route:** `POST /api/export/png`. Feature 4 adds `POST /api/export/pdf` beside
  it, same body, same validation, same browser.
- **Render target:** `/render/certificate`, driven by search params named exactly
  after the `CertificateInput` fields. Both export routes navigate here.
- **Response:** `image/png` binary, `Content-Disposition: attachment;
  filename="certificate-<slug>.png"`. Error responses are
  `{ error: string }` JSON with 400 (bad input) or 500 (render failure).
- **Sizing:** `CERT_WIDTH_PX` / `CERT_HEIGHT_PX` stay the single source of the
  viewport size. Never retype 1123/794 in the route.
- No database, no stored files. The PNG is streamed and never persisted.

## Testing

No test runner is configured (`AGENTS.md` declares no `test` command), so the
gate is off and steps ride on screenshot, curl output, and build evidence. Two
pieces of pure logic land here that would be first in line if `/tests` runs
later: `parseCertificateInput` (empty, missing, wrong-type, over-length fields)
and `certificateFileName` (spaces, punctuation, non-latin, empty name).

Per step:

1. `npm run build` and `npx tsc --noEmit` clean; scratch script screenshots a
   page through `withPage`.
2. Load the render URL in a browser, screenshot it, and measure the sheet element
   at 1123 x 794.
3. `curl` the route to a file; check pixel dimensions are 2246 x 1588; open it and
   compare against a screenshot of the preview for identical fonts, spacing, and
   border; confirm 400 on a malformed body.
4. Click through in the running app: download succeeds, filename is right, edited
   form values appear in the downloaded file, pending state shows, forced failure
   shows a friendly message, no console errors.

**Parity check is the real acceptance test:** the exported PNG and the on-screen
preview must show the same certificate. Any difference in font, spacing, or color
means the render route diverged and must be fixed, not worked around.

## Notes for the AI

- **Do not deploy, create `render.yaml`, push, or touch Render.** The user handles
  the deploy manually after this works locally.
- Launch flags are settled: `--no-sandbox`, `--disable-setuid-sandbox`,
  `--disable-dev-shm-usage`. Do not add or remove flags without asking.
- One browser per process, launched lazily on first use and reused. Never launch
  per request. Do not add a shutdown hook that races Next's dev-server hot reload;
  if a stale-browser problem appears in dev, mention it rather than inventing a
  reconnect scheme.
- Route handlers are Node runtime, not Edge. Set `export const runtime = "nodejs"`
  explicitly on the export route.
- Build the render URL from the incoming request's origin so it works in dev and
  in the Render container without an env var. If the origin ever needs an
  override, flag it rather than silently adding config.
- Await `document.fonts.ready` before capture. `next/font` self-hosts the fonts,
  so they load from the app itself, but the screenshot can still beat them.
- Screenshot the `[data-certificate]` element, not the full page, so stray body
  margin cannot leak into the output.
- Validate the request body at the boundary and never echo raw exception text to
  the client (`coding-standards.md`). Hand-rolled guard now; feature 8 swaps in
  Zod.
- The render page is a server component. Only the download button and its hook
  are `'use client'`.
- Tailwind v4 tokens only, no hardcoded hex, no inline styles other than the
  existing fixed-size sheet dimensions.
- No em dashes in code, comments, or commit messages.
