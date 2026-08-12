# Feature: Input polish

**From build-plan:** feature 8
**Status:** complete

## Goal

Make the editor's inputs trustworthy: a real date picker with one consistent
printed format, Zod validation shared by the form and the export boundary,
long names and course titles that shrink to fit instead of overflowing, and
clear empty states so an incomplete certificate can never be exported.

This is the last feature before production hardening, so it is also where the
hand-rolled boundary parser (`lib/certificate/export-request.ts`, which its own
comment marks as "feature 8 swaps this for Zod") gets replaced by one schema both
sides share.

## Design reference

No new visual target. The certificate artwork stays exactly as built in features
1 and 5; auto-fit only reduces type size when a value would otherwise overflow.
Reference sheet for the Black Border design: `blueprint/reference/` (unchanged).

## Decisions settled up front

| Question | Decision |
| --- | --- |
| Printed date format | Numeric `MM/DD/YYYY`, unchanged from today. The picker guarantees the value is a real date; it does not restyle the artifact. |
| Stored date shape | `CertificateInput.date` stays the display string. The locked contract, history entries, and the render query string are untouched. The picker converts to and from ISO at the field only. |
| Empty-field preview | The sheet leaves the line blank (the rules already hold position via `minHeight`). No ghost text, so the preview never shows anything the export would not contain. Errors and the reason downloads are disabled live in the form. |
| Auto-fit mechanism | Measured in JS (no CSS equivalent), with the export capture waiting for the fit to settle before photographing. |

## In scope

- Zod as a dependency; one shared schema module for `CertificateInput`.
- Export routes validate through that schema, keeping the current `ParseResult`
  shape and the tolerant brand handling (a bad colour or logo still falls back
  rather than failing the export).
- A native date picker for the Date field, with ISO to `MM/DD/YYYY` conversion
  in both directions, tolerant of the legacy strings already in local storage.
- Field-level validation messages in the certificate form.
- Downloads disabled, with a stated reason, while the input is invalid.
- Auto-fit for recipient name and course title across all three templates, with
  the Puppeteer capture waiting for the fit before shooting.
- Empty states: invalid-input notice near the preview's download buttons.

## Out of scope

- Changing `CertificateInput`, `HistoryEntry`, `BrandSettings`, or the render
  query-string contract. Every stored record stays readable.
- Restyling the certificate, adding template designs, or changing the printed
  date format.
- Validating brand settings (colour/logo) with Zod. Those keep their tested
  tolerant parsers in `lib/brand/`, which are deliberately non-fatal.
- A custom calendar UI. The native `<input type="date">` is the picker.
- Instructor/date auto-fit inside signature blocks (they are `nowrap` by
  design). Only the name and course title auto-fit.
- Render queue, concurrency, and instance sizing. That is feature 9.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Zod schema behind the export boundary** - add `zod` to
  dependencies; create `lib/certificate/schema.ts` exporting a
  `certificateInputSchema` (each of the five fields: string, trimmed, non-empty,
  max 200; `templateId` refined against `isTemplateId`) plus a `fieldErrors`
  helper that maps a failed parse to `Partial<Record<keyof CertificateInput,
  string>>` using the existing field labels. Rewire `parseCertificateInput` to
  use it, keeping its exported `ParseResult` shape, its current error strings,
  and the tolerant brand parsing. *Done when:* `npm test` passes with
  `export-request.test.ts` unchanged and green, a new `schema.test.ts` covers
  empty, whitespace-only, over-length, non-string, and unknown-template cases,
  and both export routes still return a file for a valid POST.

- [x] **Step 2 - Date picker and formatting** - create `lib/certificate/date.ts`
  with `toIsoDate(display: string): string | null` (accepts `MM/DD/YYYY`, ISO
  `YYYY-MM-DD`, and returns null for anything else, rejecting impossible dates
  like `02/30/2026`) and `formatCertificateDate(iso: string): string` returning
  `MM/DD/YYYY`. Add a `DateField` (native `<input type="date">`) to
  `CertificateForm` that reads the stored display string through `toIsoDate` and
  writes back through `formatCertificateDate`. Extend the Step 1 schema so
  `date` must satisfy `toIsoDate`. *Done when:* `date.test.ts` covers both
  directions plus invalid and legacy inputs; picking a date in the browser
  updates the preview in `MM/DD/YYYY`; a reload restores the picked date into
  the picker; a stored value the parser cannot read leaves the picker empty
  without crashing.

- [x] **Step 3 - Inline validation and empty states** - surface the schema in the
  editor: `Field` gains an optional `error` prop (message under the input,
  `aria-invalid`, `aria-describedby`, danger token); `Editor` parses `input`
  through `certificateInputSchema` and passes per-field errors down;
  `DownloadButtons` gains a `disabledReason` prop that disables both buttons and
  renders the reason. *Done when:* clearing the recipient name shows "Recipient
  name is required" under the field, both download buttons go disabled with a
  visible reason, no request is sent, and refilling the field re-enables them.

- [x] **Step 4 - Auto-fit for long names and titles** - add
  `components/certificate/AutoFitText.tsx` (client): renders children at a given
  font size, then after `document.fonts.ready` shrinks the size in steps until
  the content fits its box (max width and max height/line count), down to a floor,
  and only then clears a `data-autofit-pending` attribute. Wire it into the
  recipient name and course title in `CertificateBody`, `ClassicIvoryCertificate`,
  and `ModernSlateCertificate`. In `captureCertificate`, after
  `document.fonts.ready`, wait for no `[data-autofit-pending]` to remain, with a
  short bounded timeout that proceeds rather than failing the export. *Done when:*
  a 60-character name and a 120-character course title stay inside the frame on
  all three templates in the preview, the exported PNG and PDF match the preview
  for those values, normal-length values render at exactly the current sizes
  (no visual change), and a screenshot of each case is captured.

## Files / areas

| File | Why |
| --- | --- |
| `package.json` | add `zod` to dependencies |
| `lib/certificate/schema.ts` + `.test.ts` | new shared Zod schema and field-error mapping |
| `lib/certificate/export-request.ts` + `.test.ts` | boundary parse now runs on the schema |
| `lib/certificate/date.ts` + `.test.ts` | display/ISO conversion and validation |
| `components/editor/Field.tsx` | optional error message and a11y wiring |
| `components/editor/CertificateForm.tsx` | date picker, per-field errors |
| `components/editor/Editor.tsx` | validate once, pass errors and the disabled reason down |
| `components/editor/DownloadButtons.tsx` | `disabledReason` |
| `components/certificate/AutoFitText.tsx` | new shared fit component |
| `components/certificate/CertificateBody.tsx`, `ClassicIvoryCertificate.tsx`, `ModernSlateCertificate.tsx` | wrap name and course title |
| `lib/puppeteer/capture-certificate.ts` | wait for the fit to settle before capture |
| `lib/certificate-defaults.ts` | only if the seeded date needs normalising |

## Data / contracts

- **Unchanged and load-bearing:** `CertificateInput` (all five fields, `date`
  still a display string), `HistoryEntry`, `LastFormValues`, the
  `/render/certificate` query params, and the export routes' request body.
  Nothing in local storage is migrated or invalidated.
- **New:** `certificateInputSchema` (Zod) as the single definition of "valid
  input", consumed by both the client form and the export routes.
- **New:** `toIsoDate` / `formatCertificateDate` as the only place the printed
  date format is defined.
- **New:** the `data-autofit-pending` attribute is a contract between
  `AutoFitText` and `captureCertificate`; renaming it breaks export fidelity
  silently.

## Testing

The test gate is on (`npm test`, Vitest). Logic-bearing steps ship tests in the
same diff:

- Step 1: `lib/certificate/schema.test.ts` (validator), plus the existing
  `export-request.test.ts` staying green as the regression proof.
- Step 2: `lib/certificate/date.test.ts` (parser and formatter, both directions,
  invalid and legacy inputs, impossible dates).
- Steps 3 and 4 are UI and integration: verified with browser screenshots and
  the build, per the Testing scope rule. No unit tests for `AutoFitText` or the
  capture wait.

Manual pass at the end: type a long name and title on each template, download
PNG and PDF, confirm the file matches the preview; clear a field and confirm the
buttons disable; reload and confirm the date and values come back.

## Notes for the AI

- Read `node_modules/next/dist/docs/` before touching App Router code; this Next
  version differs from training data.
- `AutoFitText` is the only new `"use client"` component. The template files stay
  server components; the render page must keep working with JS-driven fit, which
  is exactly why Step 4 owns the capture wait.
- Measure after `document.fonts.ready`, never before: the serif metrics differ
  enough that a pre-font measurement picks the wrong size.
- The capture wait must never fail an export. Bounded wait, then proceed.
- Keep the brand parsers (`lib/brand/colors.ts`, `logo.ts`) tolerant and
  Zod-free; their non-fatal behaviour is deliberate and tested.
- Error strings shown by `DownloadButtons` come back from the server today; keep
  the client-side messages worded the same way so the two paths read alike.
- No em dashes in code, comments, or commit messages.

## What the build changed against the spec

- **`DownloadButtons` validates its own `input`** instead of taking a
  `disabledReason` prop. One rule then covers the preview buttons and every
  history row, including rows built from records stored before this feature.
- **`Field` was split into `FieldShell` + `Field`**, so the text input and the
  new `DateField` share one label/error/hint block rather than duplicating it.
- **`AUTOFIT_PENDING_ATTRIBUTE` lives in `lib/certificate/autofit.ts`**, not next
  to the component: the capture code is server-only and importing a value out of
  a `"use client"` module pulls a client reference into the server bundle.
- **Black Border's title ceiling is `TOP.mark - TOP.course`**, not two lines. Two
  lines at the designed 29px overrun the logo mark by 7px, which the browser
  check caught.
- **Clipping applies only once a size is chosen.** Clipping while pending would
  cut text mid-line on any render where the fit never runs.
- **`next.config.ts` gained `allowedDevOrigins: ["127.0.0.1"]`.** Chrome loads
  the render page over loopback, which Next dev answers with 403 for `/_next`
  assets, so the render page never hydrated and dev exports silently skipped the
  fit while the preview showed it. Production was never affected, but the local
  preview/export parity this feature claims was false without it.
