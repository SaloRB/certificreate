# Feature: Template/style system

**From build-plan:** feature 5
**Status:** complete (branch `feature/template-style-system`)

> **Three deviations from the spec, all forced by the build.**
> 1. `TemplateId` lives in `lib/templates/definitions.ts`, not `types/template.ts`.
>    Deriving the union needs `TEMPLATES`, which needs `TemplateDefinition`, so
>    putting both in one file would make `types/` and `lib/` import each other.
> 2. **The award group flows, it is not pinned.** In both new templates the name,
>    rule, lead line, and course title share one anchor and flow. Pinning each
>    block needs a band reserving three lines for a long name, which leaves a
>    130px hole under a short one; the first Modern Slate pass did exactly that
>    and a 60-character name overran the rule and the lead line. Flowing the group
>    keeps it tight either way, and the worst case bottoms out clear of the pinned
>    base row (597 vs 640 on Modern Slate, 620 vs 660 on Classic Ivory).
> 3. **Classic Ivory's mark is a top crest, not under the name.** Under the name
>    the 121px mark pushed the base row off the sheet. Its frame is also a rule
>    plus an inner hairline rather than one rule, which reads as intentional
>    rather than plain.
>
> Modern Slate's first pass also carried an invented headline ("Awarded with
> pride"). Templates must not introduce brand copy that is not in the payload; it
> now uses the same "Certificate / of Completion" wording as Black Border.
>
> `app/globals.css` keeps its `--color-cert-*` tokens. Deleting them would delete
> the `bg-cert-paper` / `text-cert-ink` utilities themselves, not just the values;
> they are now the fallback layer under the registry.
>
> Black Border is byte-identical throughout: PNG sha256 `2fe11364...` before step 2
> and after step 6, same input.

## Goal

Turn the single hardcoded Black Border design into a registry of templates that
share one theme layer, add a picker to the editor, and ship two new designs
through that registry. After this, adding a style is a data entry plus one
component, and the preview, the PNG route, and the PDF route all pick it up with
no further wiring.

The lineup is **3 templates**: `black-border` (existing, must not change),
`modern-slate` (new), and `classic-ivory` (new).

## Design reference

No reference image. Black Border was a replication; these two are original
designs, so the look is settled by review at the preview step, not by matching an
artifact. There are no `prototypes/` mockups in the repo.

The fidelity anchor is the opposite direction: **Black Border must come out of
this feature pixel-identical.** Its exported PNG is the reference image.

Design direction for the two new templates, to be confirmed on screen:

| Template | Direction |
| --- | --- |
| `modern-slate` | Contemporary and editorial. Solid accent band down the left edge, all lettering left-aligned off that band, sans display type (the already-loaded Lato/Inter), no frame, one hairline rule under the name. Reads as clearly *not* the classic certificate. |
| `classic-ivory` | Formal like Black Border but warmer and quieter. Warm ivory paper, single thin rule frame with no concave corners, serif display type, centred, mark under the name rather than between the signatures. |

Both are built from the same `CertificateInput` and the same 1123 x 794 sheet.

## In scope

- A `TemplateDefinition` contract and a registry: id, display name, one-line
  description, and `themeVars`.
- A component map keyed by template id, typed so a missing or extra entry is a
  compile error.
- One `Certificate` entry component that resolves an id to its component and
  applies that template's `themeVars` to the sheet wrapper.
- Rewiring the editor preview, `/preview`, and `/render/certificate` onto that
  entry component, so both export routes inherit template support for free.
- Boundary validation: an unknown `templateId` is rejected by
  `parseCertificateInput`, and `fromRenderParams` falls back to the default id.
- A template picker in the editor, listing every registry entry, updating the
  preview live and driving both downloads.
- The two new template components.

## Out of scope

- **Brand color overrides** - feature 6a. This feature builds the `themeVars`
  hook 6a writes into; it does not add a settings panel, local storage, or any
  user-editable color.
- **Logo upload** - feature 6b. All three templates keep using the built-in
  `CertificateMark`. Do not add a `logoAsset` field to the template shape.
- **History and last-used template** - feature 7. The picked template resets to
  the default on reload.
- **Zod** - feature 8 owns the validator swap. Extend `parseCertificateInput` as
  it is.
- **Long-name auto-fit and the F-03 title/mark overlap** - feature 8. New
  templates must not overlap at realistic lengths, but no shrink-to-fit logic
  ships here.
- **Per-template page sizes, orientations, or export options.** Every template
  lays out at exactly `CERT_WIDTH_PX` x `CERT_HEIGHT_PX`; the export routes are
  not touched.
- **Template thumbnails or a visual gallery.** The picker is a labelled control,
  not a grid of rendered previews.
- **Changing Black Border.** Not its geometry, its type, its colors, or its
  markup, beyond moving where its theme values are declared.
- **Deploying to Render.** The user deploys manually.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - the template contract and registry (data only, nothing renders
  differently)** - `types/template.ts` defines `TemplateDefinition`
  (`id`, `name`, `description`, `themeVars`) and derives
  `type TemplateId` from the registry with `as const satisfies`, so ids are a
  union rather than `string`. `lib/templates/definitions.ts` holds
  `TEMPLATES` with the single `black-border` entry, its `themeVars` carrying the
  cert values currently sitting in `app/globals.css` (`--color-cert-paper`,
  `-ink`, `-ink-soft`, `-rule`, `-frame`, `-border`, `-border-thin`, plus
  `--font-cert-display` and `--font-cert-body`). `lib/templates/resolve.ts`
  exports `DEFAULT_TEMPLATE_ID`, `isTemplateId(value: unknown)`,
  `getTemplate(id: TemplateId)`, and `resolveTemplateId(value: unknown)` which
  returns the default for anything unknown. No JSX in any of these modules.
  *Done when:* `npm test` is green including new tests for `isTemplateId` and
  `resolveTemplateId` (known id, unknown string, empty string, wrong type),
  `npx tsc --noEmit` and `npm run build` are clean, and the running app is
  visually unchanged because nothing imports the registry yet.

- [x] **Step 2 - render through the registry** - add
  `components/certificate/templates/index.ts` exporting
  `TEMPLATE_COMPONENTS: Record<TemplateId, CertificateTemplateComponent>` with
  the one existing entry, and `components/certificate/Certificate.tsx`: it
  resolves `input.templateId`, renders the sheet wrapper (fixed size,
  `data-certificate`, `data-template-id`) with the template's `themeVars` set as
  CSS custom properties, and renders the template's own body inside. Move the
  wrapper out of `BlackBorderCertificate` so each template renders only its
  artwork. Rewire `Editor`, `app/preview/page.tsx`, and
  `app/render/certificate/page.tsx` to `<Certificate input={...} />`. Delete the
  cert `--color-cert-*` values from `@theme static` only if the fallback story
  still holds, otherwise leave them as the defaults the wrapper overrides (say
  which in the diff summary). *Done when:* a PNG exported after this step is
  byte-identical (`shasum`) to one exported before it from the same input, the
  PDF still shows one page with white edges, the editor preview and `/preview`
  look unchanged, `[data-certificate]` is still the screenshot target the PNG
  route finds, and `tsc` / `npm test` / `npm run build` are clean.

- [x] **Step 3 - reject unknown template ids at the boundary** -
  `parseCertificateInput` validates `templateId` against the registry with
  `isTemplateId` and returns `400` with "Template is not recognised." for
  anything else; `fromRenderParams` falls back to `DEFAULT_TEMPLATE_ID` instead
  of the literal `"black-border"`. *Done when:* `npm test` is green including
  cases for a valid id, an unknown id, and the existing empty/missing cases;
  `curl -X POST /api/export/png` with `"templateId": "nope"` returns 400 with
  that message and no PNG; a valid id still exports.

- [x] **Step 4 - template picker in the editor** - a `TemplateField` in
  `components/editor/CertificateForm.tsx` (or a sibling component) built from
  `TEMPLATES`, showing name and description, calling the existing
  `onChange({ templateId })`. The preview caption reads the selected template's
  name from the registry instead of the hardcoded "Black Border" string.
  *Done when:* the picker lists all registry entries, selecting one swaps the
  preview immediately with no reload, the caption follows the selection, both
  Download buttons produce the selected design, the control is keyboard
  reachable and labelled, and the console is error-free.

- [x] **Step 5 - `modern-slate` template** - definition plus component, per the
  Design reference table. Reuse `CertificateRule` and `CertificateMark` where
  they fit; do not fork Black Border's geometry constants. Its `themeVars` set
  its own paper, ink, and accent values, and `--font-cert-display` to the loaded
  sans stack. *Done when:* it appears in the picker without touching the picker
  code, renders inside the sheet with nothing clipped or overlapping at the
  default input and at a 60-character name plus a 90-character course title,
  exported PNG and PDF match the on-screen preview, Black Border is still
  byte-identical, and all checks are clean.

- [x] **Step 6 - `classic-ivory` template** - same shape as step 5, per the
  Design reference table. If it needs a display face the app does not already
  load, add exactly one `next/font` family in `app/layout.tsx` and expose it as a
  CSS variable; do not load fonts over the network. *Done when:* the same
  criteria as step 5 hold for this template, the picker shows all three, and a
  PNG exported from a container-cold server still uses the correct face (fonts
  are self-hosted, not system).

## Files / areas

| Path | Change |
| --- | --- |
| `types/template.ts` | new - `TemplateDefinition`, `TemplateId`, component prop type |
| `lib/templates/definitions.ts` | new - the registry data, one entry per template |
| `lib/templates/resolve.ts` | new - default id, guard, lookup, fallback |
| `lib/templates/resolve.test.ts` | new - unit tests for the guard and fallback |
| `components/certificate/templates/index.ts` | new - id to component map, exhaustively typed |
| `components/certificate/Certificate.tsx` | new - resolves the template, owns the sheet wrapper and theme vars |
| `components/certificate/BlackBorderCertificate.tsx` | wrapper moves out; artwork unchanged |
| `components/certificate/ModernSlateCertificate.tsx` | new (step 5) |
| `components/certificate/ClassicIvoryCertificate.tsx` | new (step 6) |
| `components/editor/CertificateForm.tsx` | template picker field |
| `components/editor/Editor.tsx` | caption reads the registry name |
| `app/preview/page.tsx`, `app/render/certificate/page.tsx` | render `<Certificate>` |
| `lib/certificate/export-request.ts` + test | `templateId` validated against the registry |
| `lib/certificate/render-params.ts` | fallback uses `DEFAULT_TEMPLATE_ID` |
| `app/globals.css` | cert tokens become defaults the wrapper overrides |
| `app/layout.tsx` | only if step 6 needs one new font family |

No changes to `app/api/export/png/route.ts`, `app/api/export/pdf/route.ts`,
`lib/puppeteer/*`, `lib/certificate/export-route.ts`, or `CERT_WIDTH_PX` /
`CERT_HEIGHT_PX`.

## Data / contracts

**`TemplateDefinition` is load-bearing.** Features 6a and 6b key off `id` and
`themeVars`; feature 7 stores `templateId` per history entry.

```ts
interface TemplateDefinition {
  id: string;            // stable slug, e.g. "black-border"
  name: string;          // picker label
  description: string;   // one line under the label in the picker
  themeVars: Record<string, string>;  // CSS custom property name -> value
}
```

- **`themeVars` is the single theme hook.** It is applied as CSS custom
  properties on the sheet wrapper. Feature 6a layers the user's brand colors over
  the same properties on the same element, so nothing inside a template may
  hardcode a color; every color reads `var(--color-cert-*)`.
- **Fonts ride on `themeVars` too**, via `--font-cert-display` and
  `--font-cert-body`. The overview lists a separate `fonts` field; it is
  deliberately not built, because a field listing families that
  `app/layout.tsx` already loads globally would have no consumer. The families
  themselves stay self-hosted through `next/font`, which is what the export
  depends on.
- **`logoAsset` is deliberately not built either.** All templates use
  `CertificateMark`; feature 6b introduces the uploaded logo and owns that field.
  Flag both omissions when 6a/6b are spec'd.
- **`TemplateId` is a union**, derived from `TEMPLATES`. `CertificateInput.templateId`
  stays typed `string` (it crosses the network and local storage, and feature 7
  will rehydrate ids that may no longer exist), so the union is enforced at the
  boundary by `isTemplateId`, not by widening the payload type.
- **`CertificateInput` does not change.** Same five fields, same route params,
  same request bodies. Both export routes keep working with no edit.
- **Unknown ids behave differently by surface, on purpose:** the export routes
  reject them (400, explicit user error), while `fromRenderParams` and the
  preview fall back to the default (a render page must always render something).
- **No storage.** Templates are static code; the selection lives in React state
  until feature 7.

## Testing

The test gate is **on** (`npm test`, Vitest, declared in `AGENTS.md`).

- **Step 1 ships tests** - `isTemplateId` and `resolveTemplateId` are pure
  logic: known id, unknown string, empty string, non-string, and that
  `resolveTemplateId` returns `DEFAULT_TEMPLATE_ID` rather than throwing.
- **Step 3 ships tests** - extend `lib/certificate/export-request.test.ts` with a
  valid id passing and an unknown id returning the template error message,
  alongside the existing required/empty/too-long cases.
- **Steps 2, 4, 5, 6 are exempt** - components and picker UI. They ride on
  screenshots of the preview, exported PNG/PDF opened beside it, and the build.
- **Regression evidence for step 2** is a `shasum` comparison of a Black Border
  PNG before and after the rewire; keep the same hash valid through steps 3-6 and
  re-check it at the end.
- `npx tsc --noEmit`, `npm run build`, and `npm test` must all be clean before any
  step is approved.

Manual path: `npm run dev`, open `/`, switch template, watch the preview swap,
download PNG and PDF for each of the three templates, and compare each file
against its preview.

## Notes for the AI

- **Adding a template must stay a two-file change** (a definition entry and a
  component). If a new template forces an edit to the picker, the entry
  component, or a route, the abstraction is wrong; fix it rather than special-case
  it.
- `TEMPLATE_COMPONENTS` must be typed `Record<TemplateId, ...>` so forgetting a
  component is a compile error, not a runtime blank sheet.
- The `style` attribute on the sheet wrapper is for CSS custom properties only.
  The no-inline-styles rule still holds for visual declarations; the existing
  measured `style={{ top, left, width }}` positioning inside templates is the
  established pattern from feature 1 and stays.
- Keep `data-certificate` on the sheet wrapper. The PNG route screenshots that
  element; losing it breaks the export silently.
- Every template lays out at exactly `CERT_WIDTH_PX` x `CERT_HEIGHT_PX` and never
  relies on the viewport, so preview and export cannot drift.
- Server components by default. Only the editor's client tree (`Editor`,
  `CertificateForm`, `DownloadButtons`) is `'use client'`; template components
  are plain server components and must stay free of hooks and browser APIs.
- Do not fix the open findings (F-01 mark centring, F-02 duplicated canvas
  dimensions, F-03 title/mark overlap) in this feature unless a step's own code
  touches that exact line. New templates must not reproduce them: derive centred
  positions from `CERT_WIDTH_PX`, never hardcode.
- Tailwind v4 tokens only, no hardcoded hex outside a template's `themeVars`.
- No em dashes in code, comments, or commit messages.
