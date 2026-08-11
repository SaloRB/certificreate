# Feature: Form + live preview

**From build-plan:** feature 2
**Status:** complete (branch `feature/form-live-preview`)

> **Built differently than spec'd, deliberately.** Step 4 confirmed finding F-07:
> Firefox drops `calc(100cqw / 1123px)` and silently crops the preview. The
> `tan(atan2())` workaround broke WebKit, so the scale moved to JS in the new
> `components/certificate/CertificateFit.tsx`, which `/preview` now uses too. The
> stage hint reads "A4 landscape" rather than the mockup's pixel figure; feature 3
> should replace it with the real export dimensions.

## Goal

Turn `/` from the Next.js boilerplate into the real editor: a topbar, a form panel
with recipient name, course, date, and instructor, and a stage on the right showing
the Black Border certificate updating live as you type. This is the first feature a
user actually touches, and it establishes the app chrome (layout, panels, fields,
tokens) that features 3 through 8 all bolt onto.

## Design reference

- [blueprint/references/editor-mockup.html](../references/editor-mockup.html) - the approved editor mockup, restored from the discarded `prototypes/` output. Open it in a browser; it is the layout, spacing, and field-styling target for the app chrome.
- [blueprint/references/theme.css](../references/theme.css) - the mockup's tokens. The shipped `@theme` block in `app/globals.css` is the source of truth; this file shows the chrome tokens that were never ported (focus ring, placeholder, `--radius-sm`, `--space`).
- [blueprint/references/cert-example.png](../references/cert-example.png) - the certificate artifact itself, already built in feature 1. Nothing in this feature should change how it renders.

Where the mockup and the shipped app disagree on the **certificate**, the shipped
component wins - feature 1 measured it against the reference image and the mockup's
inline `.certificate` block is a stale draft. The mockup is authoritative only for
the **app chrome** around it.

The mockup also shows panels this feature does not build (template picker, brand
settings, history) and buttons it does not build (Download PNG/PDF). Build the
layout so they drop in later; do not render placeholder versions of them.

## In scope

- The missing app-chrome theme tokens from the mockup ported into `@theme`
- The editor layout at `/`: topbar with wordmark and tagline, a two-column grid (controls left, stage right), panel and field styling matching the mockup
- A client-side editor holding one `CertificateInput` in state
- Four controlled text inputs (recipient name, course, date, instructor) with the mockup's labels and the instructor hint
- Live binding: every keystroke re-renders `BlackBorderCertificate` in the stage
- The stage header ("Preview" label plus the template name and export size hint)
- Responsive behavior: form stacks above the preview on narrow screens
- Deleting the create-next-app boilerplate from `/` and its unused `public/*.svg` assets

## Out of scope

- Template picker or a second template (feature 5) - `templateId` stays fixed at `black-border`
- Brand settings panel, logo upload, color overrides (feature 6)
- History panel and remembering the last form values (feature 7) - state is in-memory only and resets on reload
- Download PNG / PDF buttons and any server route (features 3 and 4) - the stage has no action row yet
- Date picker, date formatting, Zod validation, long-name auto-fit, empty-state polish (feature 8) - `date` is a plain text input and goes to the template as typed
- Any change to `components/certificate/*` internals or `types/certificate.ts`
- `/preview` - it stays as-is; features 3 and 4 decide what the export pipeline renders against
- The open findings in `blueprint/context/findings.md`, except F-07 (see step 3)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Chrome tokens** - add the app-chrome tokens the mockup uses that feature 1 never ported into `app/globals.css`'s `@theme static` block: `--color-accent-faint`, `--color-focus-ring`, `--color-field-border-focus`, `--color-field-placeholder`, `--radius-sm`, and the `--space` step if the layout needs it. Delete the dead `--radius-DEFAULT` (finding F-04) while in the file. *Done when:* `npm run build` passes and a scratch element using `--color-focus-ring` and `--radius-sm` resolves to real values in devtools (not empty strings).

- [x] **Step 2 - Editor layout shell** - replace `app/page.tsx` with the editor chrome: topbar (wordmark "Certifi<span>create</span>" with the accent second half, tagline), a `360px minmax(0,1fr)` grid, one controls panel, and the stage panel with its header and the certificate inside a `.cert-fit` wrapper, fed by a module-level default `CertificateInput`. Still a server component, no form controls yet. Delete the boilerplate and the unused `public/*.svg` files. *Done when:* a screenshot of `/` at 1440px wide sits beside `editor-mockup.html` and matches on column widths, panel background/border/radius, padding rhythm, and topbar; the certificate renders identically to `/preview`; console is clean; `npm run build` passes.

- [x] **Step 3 - Form state and live binding** - add `components/editor/CertificateForm.tsx` and a `'use client'` `components/editor/Editor.tsx` that owns one `CertificateInput` in `useState`, renders the four labelled inputs (with the instructor hint from the mockup), and passes the state straight into `BlackBorderCertificate`. Wire it into `app/page.tsx`. *Done when:* typing in each of the four fields updates the matching line of the certificate as you type, with no submit and no reload; clearing every field leaves the certificate laid out with empty values and no thrown error; inputs show the mockup's focus ring; console is clean; `npm run build` passes.

- [x] **Step 4 - Responsive and robustness pass** - make the grid collapse to a single column with the form above the preview below the mockup's breakpoint, and check the preview scaling holds up. *Done when:* at 390px wide the form stacks above the stage, nothing overflows horizontally, and the certificate is still fully visible and uncropped; the scaled preview renders uncropped in Chrome, Safari, and Firefox (this closes finding F-07, which asked feature 2 to verify the `calc()` length division; if a browser rejects it, fall back to a JS-set scale variable and record that in the finding); a 60-character name and a 90-character course title stay inside the frame (the known vertical overlap from F-03 is feature 8's, not a failure here); `npm run build` passes.

## Files / areas

| Path | Change |
| --- | --- |
| `app/globals.css` | Add missing chrome tokens; drop `--radius-DEFAULT` |
| `app/page.tsx` | Replaced - the editor page (server component, renders `<Editor />`) |
| `components/editor/Editor.tsx` | New - `'use client'`, owns `CertificateInput` state |
| `components/editor/CertificateForm.tsx` | New - the four labelled fields, controlled |
| `public/*.svg` | Delete the unused create-next-app assets |
| `blueprint/context/findings.md` | F-07 resolved in step 4; F-04's `--radius-DEFAULT` half resolved in step 1 |

## Data / contracts

**No new types.** This feature consumes the load-bearing `CertificateInput` from
`types/certificate.ts` exactly as feature 1 locked it. Do not add, rename, or widen
a field - features 3, 4, 7, and 8 all pass the same object.

```ts
interface CertificateInput {
  recipientName: string;
  courseTitle: string;
  date: string;        // plain typed string in this feature
  instructor: string;
  templateId: string;  // fixed "black-border" until feature 5
}
```

**Initial state (decision, easy to overturn).** The form starts prefilled with the
same placeholder values `/preview` uses, so first load shows a complete certificate
rather than an empty sheet. Feature 7 replaces this default with the last-used
values; feature 6a replaces the hardcoded instructor with the brand-settings
default. Keep the defaults in one exported constant so both later features have a
single place to change.

No persistence, no API, no server state in this feature.

## Testing

No `test` command is declared in `AGENTS.md`, so the **test gate is off**, and this
feature adds no in-scope logic anyway (no parser, formatter, or validator - date
formatting is feature 8). Verify with browser evidence and the build:

- Screenshot `/` beside `editor-mockup.html` at step 2 and again at step 4
- Type into each of the four fields and confirm the matching certificate line changes (step 3)
- Render with all four fields empty (step 3) and with a 60-char name / 90-char course title (step 4)
- Check Chrome, Safari, and Firefox for the preview scale (step 4, finding F-07)
- Browser console clean and `npm run build` passing at every step

## Notes for the AI

- **Client boundary is one component.** `app/page.tsx` stays a server component and renders `<Editor />`. Only `Editor.tsx` carries `'use client'`; `CertificateForm` is a plain child of it. `BlackBorderCertificate` has no server-only dependency, so rendering it inside the client tree is fine - do not add `'use client'` to anything under `components/certificate/`.
- **No form submission.** State updates on change; there is no `<form>` action, no Server Action, and no submit handler. Uncontrolled inputs are not an option - the preview reads the same state.
- **Tokens only.** Every color and radius comes from a `@theme` token. No hex values in components, no inline styles (the fixed-canvas `style` inside `BlackBorderCertificate` is feature 1's and stays).
- **No component library.** shadcn/ui is named in the plan but not installed; hand-roll the inputs with Tailwind classes rather than installing it mid-feature. If we want shadcn, that is its own decision before feature 5.
- **Do not touch the certificate.** If the template looks wrong in the editor, the fix is in the layout or the scale wrapper, not in `components/certificate/`.
- **Labels are real labels.** Each input gets a `<label htmlFor>`; this is the first keyboard-and-screen-reader surface in the app.
- **No em dashes** in any generated text, per the coding standards.
