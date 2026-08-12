# Feature: Logo upload

**From build-plan:** feature 6b (sub-feature of 6, Brand settings (local))
**Status:** complete (branch `feature/logo-upload`)

> **One deviation from the spec, forced by the build.** Step 4 put the handoff
> store in a module-level `Map`. The first real export still rendered the dot
> mark: Next compiles the export route and the render page into separate module
> instances in the same process, so each side held its own empty store
> (`PUT b7w8np` vs `TAKE kpnixn` in the dev log). Step 5 moved the store onto
> `globalThis` under `Symbol.for("certificreate.render-logos")` and added a
> regression test that re-imports the module after `vi.resetModules()`. Nothing
> short of a live export would have caught this; the unit tests passed throughout.
>
> One tidy beyond scope: `MARK_SIZE` is now exported from `CertificateMark`, and
> the duplicate `const MARK_SIZE = 121` in Classic Ivory and Modern Slate import
> it instead. F-01 (the Black Border mark's hardcoded `left: 500`) is untouched
> and stays open.

## Goal

Let the user upload their own logo, keep it in brand settings (local storage as a
data URL), and use it in place of the built-in dot mark on every template, in the
live preview and in both exports. This closes feature 6: after it, brand settings
carry instructor, colors, and logo.

## Design reference

No new design. The logo occupies the exact box the current `CertificateMark`
occupies in each template (a 121px square, positioned per template), scaled to fit
inside it with its aspect ratio preserved. Existing templates:
[BlackBorderCertificate.tsx](components/certificate/CertificateBody.tsx#L158-L165),
[ClassicIvoryCertificate.tsx](components/certificate/ClassicIvoryCertificate.tsx#L118-L126),
[ModernSlateCertificate.tsx](components/certificate/ModernSlateCertificate.tsx#L86-L92).

## In scope

- Logo rules shared by every boundary: allowed types (PNG, JPEG, WebP, SVG), a
  file-size cap, and a `data:` URL shape check.
- Upload control in the brand settings panel: pick a file, see a thumbnail,
  replace it, remove it, see a readable error for a rejected file.
- Persistence through the existing `BrandSettings` local-storage record
  (`logoDataUrl`), including rejecting a corrupt stored value on read.
- All three templates render the uploaded logo in place of `CertificateMark`,
  falling back to the mark when there is none.
- The logo travels through the export pipeline so PNG and PDF match the preview.
- Boundary validation of `logoDataUrl` on the export routes.

## Out of scope

- Cropping, rotating, or resizing the logo; logo position or size controls.
- A per-certificate logo. The logo is a brand setting, one per browser.
- Adding `logoDataUrl` to `CertificateInput`. That shape is locked, and history
  (feature 7) would otherwise store a copy of the image per entry.
- Server-side image processing, compression, or SVG sanitising beyond rendering
  the file inside an `<img>` (which does not execute script).
- Multiple saved logos, or a logo library.
- Date/validation polish (feature 8) and history (feature 7).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - logo rules + storage hardening** - add `lib/brand/logo.ts`:
  `LOGO_MIME_TYPES`, `MAX_LOGO_BYTES` (512KB), `validateLogoFile({ type, size })`
  returning `{ ok } | { ok: false, error }`, and `isLogoDataUrl(value)` for a
  `data:image/<allowed>;base64,` string within a length cap. Use `isLogoDataUrl`
  in `parseBrandSettings` so a corrupt or oversized stored value degrades to
  `null`. *Done when:* `npm test` passes with new tests for both functions
  (allowed type, rejected type, oversize file, non-data-URL string, wrong image
  subtype, truncated string) and a storage test proving a bad `logoDataUrl`
  parses to `null` while the other fields survive.

- [x] **Step 2 - upload control in the brand settings panel** - a "Logo" block in
  `BrandSettingsPanel`: file input (accept from `LOGO_MIME_TYPES`), thumbnail of
  the current logo on the panel's surface, Remove button, and an inline error for
  a rejected file. Reads the file with `FileReader` to a data URL and calls
  `onChange({ logoDataUrl })`. *Done when:* uploading a PNG shows the thumbnail;
  reloading the page keeps it; Remove clears it back to the empty state; picking
  a `.txt` (or a 5MB image) shows the error and leaves the current logo intact.

- [x] **Step 3 - templates render the logo** - `CertificateMark` takes an optional
  `logoDataUrl` and renders an `<img>` fitted inside the same 121px square
  (`object-contain`, `alt=""`) instead of the SVG when present. Thread
  `logoDataUrl` from `Certificate` through the three template components (a new
  prop on `CertificateTemplateComponent`, not on `CertificateInput`), and pass
  `settings.logoDataUrl` from the editor. *Done when:* with a logo uploaded, all
  three templates show it centred in the mark's slot at the mark's size in the
  live preview, wide and tall logos both stay undistorted, and removing the logo
  brings the dot mark back.

- [x] **Step 4 - export transport + boundary validation** - add
  `lib/certificate/render-handoff.ts`: an in-process store mapping a random token
  to a logo data URL, single-use, with a short TTL (60s) and expiry sweep. A data
  URL cannot ride in the render page's query string (Node rejects request lines
  past its header limit), so the export passes a token instead. Extend
  `parseCertificateInput` to accept an optional `logoDataUrl`, validated with
  `isLogoDataUrl` and dropped (never fatal) when unusable, and return
  `{ colors, logoDataUrl }` as one `ExportBrand` object. *Done when:* `npm test`
  passes with tests for the handoff store (put/take round trip, second take is
  `null`, expired token is `null`) and for the export parser (valid logo passes
  through, junk logo becomes `null` without failing the parse, missing logo stays
  `null`).

- [x] **Step 5 - wire the logo through PNG and PDF** - the download hook and
  `DownloadButtons` send `logoDataUrl` with the POST body; `handleExportRequest`
  hands `ExportBrand` to `render`; both routes forward it to
  `captureCertificate`, which stores the logo, appends `logo=<token>` to the
  render URL, and clears the token afterwards; `/render/certificate` takes the
  token from the store and passes the data URL to `Certificate`, falling back to
  the dot mark when the token is missing or expired. *Done when:* with a logo
  uploaded, a downloaded PNG and a downloaded PDF both show that logo in the same
  slot as the preview, at full resolution; with no logo, both still export the dot
  mark; `npm run build` passes.

## Files / areas

| File | Why |
| --- | --- |
| `lib/brand/logo.ts` (new) + `logo.test.ts` | shared logo rules: types, size cap, data-URL check |
| `lib/brand/storage.ts` (+ test) | reject a corrupt stored `logoDataUrl` |
| `components/editor/BrandSettingsPanel.tsx` | upload, thumbnail, remove, error |
| `components/certificate/CertificateMark.tsx` | `<img>` branch beside the SVG |
| `components/certificate/Certificate.tsx`, `CertificateBody.tsx`, `ClassicIvoryCertificate.tsx`, `ModernSlateCertificate.tsx`, `types/template.ts` | thread `logoDataUrl` to the mark slot |
| `components/editor/Editor.tsx` | pass `settings.logoDataUrl` to preview and downloads |
| `lib/certificate/render-handoff.ts` (new) + test | token transport for the data URL |
| `lib/certificate/export-request.ts` (+ test), `export-route.ts` | parse and carry `ExportBrand` |
| `lib/puppeteer/capture-certificate.ts`, `app/api/export/png/route.ts`, `app/api/export/pdf/route.ts`, `app/render/certificate/page.tsx` | token in, logo out |
| `types/brand.ts` | `ExportBrand` (`{ colors, logoDataUrl }`) |
| `lib/hooks/use-certificate-download.ts`, `components/editor/DownloadButtons.tsx` | send the logo with the export request |

## Data / contracts

- **`BrandSettings.logoDataUrl: string | null`** - already declared in
  `types/brand.ts` and already persisted; this feature is the first writer.
  Load-bearing: feature 7's history rehydration reads the same record.
- **`ExportBrand = { colors: BrandColors; logoDataUrl: string | null }`** - the
  brand half of an export request, separate from `CertificateInput`. Adding a
  future brand field (a signature image, say) then touches one type, not four
  signatures.
- **Export request body** - unchanged shape plus an optional `logoDataUrl`
  string; still `{ ...CertificateInput, colors?, logoDataUrl? }`.
- **Render URL** - `/render/certificate?...&logo=<token>`. The token, not the
  image, and it resolves only in the process that issued it.
- **`CertificateTemplateComponent`** - gains `logoDataUrl?: string | null`
  alongside `input`. `CertificateInput` stays exactly as it is.

## Testing

The test gate is on (`npm test`, Vitest). In-scope logic that must ship a test in
the same step:

| Step | Tested logic |
| --- | --- |
| 1 | `validateLogoFile`, `isLogoDataUrl`, `parseBrandSettings` rejecting a bad logo |
| 4 | `render-handoff` put/take/expiry, `parseCertificateInput` logo handling |

Steps 2, 3, and 5 are UI and integration surfaces (file input, template artwork,
Puppeteer routes): they ride on screenshot plus build evidence, per the Testing
section of `coding-standards.md`.

Manual verification path: upload a logo in the panel, switch across all three
templates, download the PNG and the PDF, then remove the logo and export again to
confirm the dot mark returns. Reload between steps 2 and 3 to prove persistence.

## Notes for the AI

- Client vs server: the panel, the download hook, and the editor are `"use client"`;
  the render page, the handoff store, and the export routes are server-only. The
  handoff store must never be imported into a client component.
- Size discipline: 512KB before base64, so the encoded string stays under ~700KB
  and local storage (roughly 5MB, UTF-16) is not at risk. Reject at the panel with
  a message that names the limit.
- Never let a bad logo fail an export. Like brand colors, an unusable value falls
  back (dot mark), matching the comment in `export-request.ts`.
- The token cleanup must run even when the capture throws, or a failed export
  leaks the image into memory until its TTL.
- Keep the mark's box geometry unchanged; templates position the slot and must not
  learn about logos beyond passing the prop down.
- No hardcoded colors in the templates (`types/template.ts` rule); the `<img>`
  branch has no colors to add.
- No em dashes in any generated content.
