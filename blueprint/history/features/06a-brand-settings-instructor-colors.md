# Feature: Brand settings - instructor + colors

**From build-plan:** feature 6a (under 6, Brand settings (local))
**Status:** complete (branch `feature/brand-settings-instructor-colors`)

> **Two deviations from the spec, both forced by the build.**
> 1. **Local storage is an external store, not a hydrate-in-an-effect hook.** The
>    planned "defaults on first render, then hydrate in an effect" is a `setState`
>    inside `useEffect`, which React 19's `react-hooks/set-state-in-effect` rule
>    fails outright. `lib/brand/store.ts` models storage as an external store read
>    through `useSyncExternalStore`: same contract (defaults on the server and the
>    hydrating render, stored values after), no lint suppression. Its `subscribe`
>    listens for `storage` events, so a second tab now stays in sync.
> 2. **The instructor is derived, not seeded with a touched flag.** The spec
>    proposed tracking whether the field had been edited. `Editor` instead keeps
>    `CertificateDraft` (a new `Omit<CertificateInput, "instructor">`) plus an
>    `instructorOverride` that is `null` until the user types, and composes the
>    payload at render. There is no mirroring, no effect, and no flag to get wrong.
>
> `expandHexColor` was added mid-step-4: `<input type="color">` only accepts six
> digits, so a hand-typed `#fff` cannot reach the swatch unexpanded. `--color-danger`
> was added to `globals.css` for the invalid-hex outline.
>
> **The unbranded export is unchanged.** A PNG of the default input hashes to
> `2fe1136417e2741b863f7d4bae40b15c18c88ccffce31b5fe2482eec08521872`, byte-identical
> to the baseline recorded in feature 5's archive.
>
> `--color-cert-rule`, `--color-cert-ink-soft`, and `--color-cert-border-thin` stay
> template-owned, as specced. Under a heavy recolour those greys visibly stay put;
> adding any of them is one member of the `BrandColorVar` union plus a label.

## Goal

Give the user a persistent brand identity: a default instructor name and a set of
certificate colour overrides, saved in browser local storage and layered over the
selected template's `themeVars`. The preview and both export routes must paint the
same overridden colours, so a downloaded PNG or PDF matches what is on screen.

This is the first feature that stores anything. It also settles the storage shape
that 6b (logo upload) and 7 (history, last form values) build on, so the
`BrandSettings` type is written whole here even though `logoDataUrl` stays unused
until 6b.

## Design reference

No reference image, and no `prototypes/` in the repo. This feature adds app chrome
(a settings panel), not certificate artwork: it follows the existing editor
panels (`CertificateForm`, `TemplatePicker`) - same `rounded-panel border
border-border bg-surface p-5` shell, same label typography, same field styles.

The certificate itself gets no new markup. Its only change is which values land in
the CSS custom properties already set by `Certificate.tsx`.

## In scope

- `BrandSettings` type (`instructor`, `colors`, `logoDataUrl`), written whole and
  flagged load-bearing.
- A curated set of overridable theme variables with display labels, so the panel
  is four meaningful controls rather than seven raw CSS variable names.
- Local-storage read/write with defensive parsing (missing key, malformed JSON,
  wrong types, unknown colour keys, invalid colour values all degrade to defaults).
- A brand settings panel in the editor: instructor default, one colour control per
  overridable variable, per-colour reset, and reset all.
- The stored instructor seeding a new certificate's `instructor` field, still
  editable per certificate.
- Colour overrides applied to the live preview.
- Colour overrides carried through the PNG and PDF export pipeline and validated
  server-side before they touch a `style` attribute.

## Out of scope

- **Logo upload** (`logoDataUrl`) - the field exists in the type and is persisted
  untouched, but nothing reads or writes it. That is 6b.
- **Certificate history and last form values** - feature 7. Brand settings get
  their own storage key; do not build a general "app state" store here.
- **Per-template colour overrides.** One colour set applies to whichever template
  is selected.
- **Font overrides.** `--font-cert-*` stays template-owned.
- **Zod.** Validation stays hand-rolled to match `export-request.ts`; feature 8
  swaps both at once.
- **Server-side persistence.** Nothing leaves the browser.
- Changing any template's own `themeVars`, or any certificate component's markup.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - the brand contract and its validator.** Add `types/brand.ts`
  (`BrandSettings`, `BrandColors`) and `lib/brand/colors.ts`: the
  `BRAND_COLOR_FIELDS` list (variable, label, which templates' value it defaults
  from), `isBrandColorValue` (strict `#rgb` / `#rrggbb` only), `parseBrandColors`
  (unknown object -> `BrandColors`, dropping unknown keys and invalid values), and
  `resolveThemeVars(template, colors)` returning the merged custom properties.
  Pure functions, no React, no storage. *Done when:* `npm test` passes with new
  tests covering an unknown key, a non-hex value, a non-object input, an empty
  record, and a merge that overrides some template vars but not others.

- [x] **Step 2 - the local-storage store.** Add `lib/brand/storage.ts`
  (`readBrandSettings`, `writeBrandSettings`, `DEFAULT_BRAND_SETTINGS`, key
  `certificreate.brand`) built on `parseBrandColors`, plus
  `lib/hooks/use-brand-settings.ts` - a client hook that returns defaults on first
  render and hydrates from storage in an effect. Not wired into any UI yet.
  *Done when:* `npm test` passes with tests for the parse half (absent value,
  malformed JSON, wrong-typed `instructor`, partial record, round-trip through
  `writeBrandSettings`), and `npx tsc --noEmit` is clean.

- [x] **Step 3 - the settings panel and the instructor default.** Add
  `components/editor/BrandSettingsPanel.tsx` (instructor field only for now) and
  wire the hook into `Editor`: settings changes persist, and the stored instructor
  seeds the certificate's `instructor` field. *Done when:* typing a new instructor
  in settings, reloading the page, and seeing both the settings field and the
  certificate's instructor line show it; editing the certificate's own instructor
  field afterwards changes only that certificate, and does not write back to
  settings; no hydration warning in the console.

- [x] **Step 4 - colour overrides in the preview.** Add the colour controls to the
  panel (native `<input type="color">` plus a hex text input per field, a reset per
  field, and a reset all) and merge the overrides in `Certificate.tsx` via
  `resolveThemeVars`. *Done when:* changing a colour repaints the preview live,
  the change survives a reload, switching templates keeps the overrides applied
  over the new template's remaining vars, resetting a field returns it to that
  template's value, and a screenshot shows an off-brand-coloured certificate.

- [x] **Step 5 - colours through the export pipeline.** Carry `colors` from the
  download buttons through the export request body, `handleExportRequest`,
  `captureCertificate`, `toRenderParams`/`fromRenderParams`, and into the render
  page's `Certificate`. Server-side, re-run `parseBrandColors` on the query string
  so nothing unvalidated can reach a `style` attribute. *Done when:* `npm test`
  passes with tests for the round trip through the render params (including a
  hostile value such as `red;background:url(x)` being dropped) and for the export
  body parse; and a PNG and a PDF downloaded with a custom colour set open with
  those colours, matching the preview.

## Files / areas

**New**

- `types/brand.ts` - `BrandSettings`, `BrandColors`.
- `lib/brand/colors.ts` + `lib/brand/colors.test.ts` - overridable field list,
  validation, merge.
- `lib/brand/storage.ts` + `lib/brand/storage.test.ts` - local-storage read/write.
- `lib/brand/store.ts` - **deviation from the spec.** The planned "defaults, then
  hydrate in an effect" hook is a `setState` inside `useEffect`, which React 19's
  `react-hooks/set-state-in-effect` rule rejects outright (lint error, not a
  warning). Local storage is modelled as an external store instead and read with
  `useSyncExternalStore`, which is the sanctioned hydration-safe path: same
  contract (defaults on the server and the hydrating render, stored values after),
  no lint suppression, and a `storage` listener keeps a second tab in sync for
  free.
- `lib/hooks/use-brand-settings.ts` - client hook over that store.
- `components/editor/BrandSettingsPanel.tsx` - the panel.

**Changed**

- `components/certificate/Certificate.tsx` - optional `colors` prop, merged over
  `template.themeVars` (the file already reserves this seam).
- `components/editor/Editor.tsx` - owns brand settings, seeds instructor, passes
  `colors` to preview and downloads.
- `components/editor/DownloadButtons.tsx`, `lib/hooks/use-certificate-download.ts` -
  send `colors` with the request.
- `lib/certificate/render-params.ts` (+ test) - encode/decode `colors`.
- `lib/certificate/export-request.ts` (+ test) - parse optional `colors` from the body.
- `lib/certificate/export-route.ts` (+ test), `app/api/export/png/route.ts`,
  `app/api/export/pdf/route.ts`, `lib/puppeteer/capture-certificate.ts` - thread
  `colors` to the render URL.
- `app/render/certificate/page.tsx` - pass decoded colours to `Certificate`.
- `lib/certificate-defaults.ts` - drop the stale 6a comment once the instructor
  default lands.

## Data / contracts

**`BrandSettings` (local storage, single record, key `certificreate.brand`)** -
load-bearing; 6b and 7 read the same record.

```ts
interface BrandSettings {
  logoDataUrl: string | null; // written by 6b only; 6a persists it untouched
  instructor: string;
  colors: BrandColors;
}

type BrandColors = Partial<Record<BrandColorVar, string>>;
```

**Overridable variables** (`BrandColorVar`) - a curated subset of the template
theme vars. The rest stay template-owned so a partial override still looks
deliberate:

| Variable | Label |
| --- | --- |
| `--color-cert-border` | Border |
| `--color-cert-frame` | Frame |
| `--color-cert-ink` | Text |
| `--color-cert-paper` | Paper |

**Defaults and first run.** `DEFAULT_BRAND_SETTINGS.instructor` is the value
already in `DEFAULT_CERTIFICATE_INPUT` (`"Brad Traversy"`), so a first visit with
empty storage looks exactly as it does today. An empty or whitespace-only stored
instructor falls back to that default rather than seeding a blank signature line.
`colors` defaults to `{}`, meaning "template value", so an unset control still
shows the selected template's colour and reset means "delete the key", not "write
the template's hex".

**Colour values** - `#rgb` or `#rrggbb` only, matched by a strict regex. This is
the security boundary: these strings are written into a `style` attribute, and
they arrive from both local storage and a query string, so anything else is
dropped rather than coerced.

**Export request body** - stays flat, gains one optional field:

```ts
{ ...CertificateInput, colors?: BrandColors }
```

Absent or invalid `colors` renders the plain template, never a 400: an export must
not fail because a stored colour is stale.

**Render params** - `colors` is one extra query param carrying the encoded record,
omitted entirely when empty, decoded and re-validated on the render page.

> `CertificateInput` does not change. Brand settings are a separate record by
> design, per the overview's data model.

## Testing

The test gate is on (`npm test`, Vitest). In-scope logic that must ship a test in
its own step:

| Step | Tested logic |
| --- | --- |
| 1 | `parseBrandColors`, `isBrandColorValue`, `resolveThemeVars` |
| 2 | the storage parse/serialize round trip |
| 5 | `toRenderParams` / `fromRenderParams` with colours, `parseCertificateInput` (or its new sibling) with an optional `colors` field |

Steps 3 and 4 are UI and ride on screenshot plus build evidence, per the Testing
section of `coding-standards.md`.

Manual verification path:

1. `npm run dev`, open `/`.
2. Set an instructor in brand settings, reload, confirm it seeds the certificate.
3. Change Border and Paper to obviously non-default colours; the preview repaints
   live and survives a reload.
4. Switch templates; the overrides persist over the new template.
5. Download the PNG and the PDF; both carry the custom colours.
6. In devtools, corrupt `localStorage["certificreate.brand"]` to `not json` and
   reload; the app renders defaults with no crash.
7. Hand-edit the `colors` query param on `/render/certificate` to an injected CSS
   value; the render page ignores it.

Final gate: `npm test` and `npm run build`. No `Verify` command is configured.

## Notes for the AI

- **Do not touch `CertificateInput`.** It is locked by the overview and consumed
  by features 7 and 8.
- `Certificate.tsx` and `globals.css` already carry comments reserving this seam.
  Update those comments to describe what shipped rather than leaving them pointing
  at "feature 6a".
- **Hydration.** Local storage must never be read during render. The hook returns
  `DEFAULT_BRAND_SETTINGS` on the server and on the first client render, then
  hydrates in an effect. The editor is already `"use client"`; the render page and
  the export routes are server-side and must get colours from their params, never
  from storage.
- **The instructor seed is a default, not a binding.** Once the user edits the
  certificate's instructor field, later settings changes must not overwrite it.
  Track whether the field has been touched rather than mirroring state both ways.
- **Validate at both boundaries.** Storage and query string are equally untrusted.
  Reuse the same `parseBrandColors` on both, and never interpolate a raw value
  into a style attribute or a CSS string.
- Keep the panel's controls accessible: a real `<label>` per control, and the hex
  text input as the keyboard path, since `<input type="color">` alone is not.
- Step 5 touches the most files, but each edit is the same one parameter threaded
  one layer further. If the diff still reads as too much, split it at the network
  boundary: request body and render params first, then the two routes and the
  render page. Do not stop between them, as the pipeline is half-wired in the middle.
- Native `<input type="color">` is the deliberate choice; no colour-picker
  dependency, and no component library is installed.
- Per `coding-standards.md`: no `any`, `@/*` imports, Tailwind only (no inline
  styles except the certificate's custom-property object, which already exists),
  comment the why and not the what, no em dashes.
