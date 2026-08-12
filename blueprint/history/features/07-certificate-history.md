# Feature: Certificate history (local)

**From build-plan:** feature 7
**Status:** complete

## Goal

Every certificate the user actually exports gets saved to browser local storage
and listed in the editor, so they can re-open it into the form or download it
again without retyping. The form also remembers the last values entered, so a
reload never drops the user back onto the seeded placeholder certificate.

This is the last piece of "local persistence" (brand settings landed in 6a/6b);
after it, feature 8 polishes the inputs themselves.

## Design reference

None. The history panel is app chrome, not certificate artwork, and follows the
existing panel pattern in `components/editor/BrandSettingsPanel.tsx` (rounded
panel, `border-border`, `bg-surface`, uppercase `tracking-label` heading).

## In scope

- `HistoryEntry` and `LastFormValues` types, locked for later features.
- A local-storage history list: append on a successful export, newest first,
  deduplicated, capped.
- A history panel in the editor's left column: list, empty state, re-open into
  the form, re-download PNG/PDF, remove one entry, clear all.
- Last form values persisted and restored on reload, replacing the hardcoded
  seed as the editor's starting state.
- Unit tests for all of the above storage logic.

## Out of scope

- Any server-side storage, sync, or account. v1 stays per-device.
- Storing the rendered PNG/PDF bytes, or a thumbnail, in local storage. Entries
  store the input only and re-render on demand.
- Snapshotting brand colors or the logo per entry (see Data / contracts).
- Date formatting, a date picker, or Zod validation - all feature 8.
- Search, filter, pagination, or export/import of history.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - history types and storage logic** - add `types/history.ts`
  (`HistoryEntry`, `LastFormValues`) and `lib/history/storage.ts` with pure
  functions: `parseHistoryEntry`, `parseHistory`, `deserializeHistory`,
  `serializeHistory`, `addEntry(list, entry)` (newest first, dedupe, cap), and
  `removeEntry(list, id)`. Mirror the defensive parsing in
  `lib/brand/storage.ts`: a malformed record is dropped, not fatal. No React, no
  UI. *Done when:* `npm test` passes with `lib/history/storage.test.ts` covering
  a clean round-trip, a malformed/partial record, a non-array payload, dedupe
  moving an existing entry to the top with a fresh `createdAt`, and the cap
  evicting the oldest entry.

- [x] **Step 2 - history store and hook** - add `lib/history/store.ts` (the
  `useSyncExternalStore` pattern from `lib/brand/store.ts`: cached snapshot,
  `storage` event subscription, empty-array server snapshot) plus
  `readHistory`/`writeHistory` in `lib/history/storage.ts`, and
  `lib/hooks/use-certificate-history.ts` exposing `{ entries, record, remove,
  clear }`. `record` builds the id and `createdAt` here, so `addEntry` stays
  pure. Not wired into any UI yet. *Done when:* `npx tsc --noEmit` and
  `npm run build` pass, and the hook compiles unused with no client/server
  boundary errors.

- [x] **Step 3 - record on successful export** - `useCertificateDownload` returns
  whether the download succeeded; `DownloadButtons` takes an optional
  `onExported(input)` and calls it only on success; `Editor` passes
  `record`. *Done when:* in the browser, clicking Download PNG then Download PDF
  for the same inputs leaves exactly one record under `certificreate.history` in
  local storage (checked in devtools), a failed export adds none, and changing
  the recipient then exporting adds a second.

- [x] **Step 4 - history panel** - add `components/editor/HistoryPanel.tsx` and
  mount it in `Editor` under the brand panel: newest-first rows showing
  recipient, course, template name, and a relative or short absolute timestamp;
  an "Open" action that loads the entry back into the form (including its
  instructor and template); a per-row remove; a "Clear history" action; and an
  empty state before anything is exported. Re-download reuses `DownloadButtons`
  with the row's input and the current brand. *Done when:* exporting twice shows
  two rows newest-first, Open repopulates the form and preview, a row's Download
  PNG returns that certificate, remove deletes one row, clear empties the list
  back to the empty state, and a screenshot shows the populated panel.

- [x] **Step 5 - remember the last form values** - add
  `lib/certificate/last-values.ts` (parse/serialize plus read/write) and a store
  and hook in the same shape as step 2, and switch `Editor` to read its draft and
  instructor override from it. Keep `DEFAULT_CERTIFICATE_DRAFT` as the value used
  on a first visit and as the server/hydration snapshot. *Done when:*
  `npm test` passes with `lib/certificate/last-values.test.ts` covering a clean
  record, a partial record filled from the defaults, a malformed payload, and a
  null instructor override surviving the round-trip; and in the browser, editing
  the form then reloading restores the edited values with no hydration warning in
  the console, while a first visit (cleared storage) still shows the seeded
  certificate.

## Files / areas

**New**

- `types/history.ts` - `HistoryEntry`, `LastFormValues`
- `lib/history/storage.ts` + `lib/history/storage.test.ts`
- `lib/history/store.ts`
- `lib/hooks/use-certificate-history.ts`
- `lib/certificate/last-values.ts` + `lib/certificate/last-values.test.ts`
- `lib/certificate/last-values-store.ts` + `lib/hooks/use-last-form-values.ts`
- `components/editor/HistoryPanel.tsx`

**Changed**

- `components/editor/Editor.tsx` - mounts the panel, records exports, sources its
  draft from stored last values
- `components/editor/DownloadButtons.tsx` - optional `onExported` callback
- `lib/hooks/use-certificate-download.ts` - `download` reports success
- `lib/certificate-defaults.ts` - update the stale "feature 7 replaces this"
  comment; the default stays as the first-visit seed

## Data / contracts

Both shapes are **load-bearing** and locked here.

### `HistoryEntry` (local storage, list under `certificreate.history`)

| Field | Type | Note |
| --- | --- | --- |
| `id` | `string` | generated client-side (`crypto.randomUUID()`) |
| `recipientName` | `string` | |
| `courseTitle` | `string` | |
| `date` | `string` | display string, as `CertificateInput.date` |
| `instructor` | `string` | **added to the overview's field list** |
| `templateId` | `string` | references `Template.id` |
| `createdAt` | `number` | epoch ms |

`instructor` is not in the field list in `project-overview.md`, but that same
section requires an entry to rehydrate a full `CertificateInput`, which is
impossible without it. Storing it is also the only correct behavior: an entry
must re-open with the signatory it was *generated* with, not with whatever the
brand default happens to be later. Fix the overview's list at `/complete` time.

**Behavior rules**

- Newest first. `addEntry` prepends.
- Dedupe on the four content fields plus `templateId` and `instructor`: an
  identical certificate exported again moves its existing entry to the top with a
  new `createdAt` rather than adding a row. Downloading PNG then PDF is one
  entry, which is why step 3's done-when checks exactly that.
- Cap at 50 entries; the oldest is evicted.
- No brand snapshot per entry. Colors and the logo come from current brand
  settings at re-download time, so a re-branded history re-downloads on-brand.
  Stated as a deliberate choice, not an oversight.

### `LastFormValues` (local storage, single record under `certificreate.last-input`)

```ts
interface LastFormValues {
  draft: CertificateDraft;            // recipientName, courseTitle, date, templateId
  instructorOverride: string | null;  // null = follow brand settings
}
```

The overview calls this "the most recent `CertificateInput`". Storing a flat
`CertificateInput` would lose the distinction 6a deliberately built: a `null`
override means the certificate follows the brand default and must keep tracking
it after a reload. Flattening would freeze whatever the default was at save time.
Note the deviation in the overview at `/complete` time.

## Testing

The test gate is on (`npm test`, Vitest).

**Needs tests (pure logic):**

- `lib/history/storage.ts` - parsing, deserialization, `addEntry` dedupe and cap,
  `removeEntry` (step 1)
- `lib/certificate/last-values.ts` - parsing and round-trip, including a `null`
  instructor override and a partial record (step 5)

Keep `addEntry` pure by passing a fully-formed entry (id and `createdAt`
supplied by the caller); the store generates them. That is what makes dedupe and
cap deterministically testable without fake timers.

**No tests (UI / integration):** `HistoryPanel`, the stores and hooks, and the
`Editor`/`DownloadButtons` wiring. These ride on browser evidence plus
`npm run build`, per the Testing section of `coding-standards.md`.

**Manual path:** load `/`, edit the form, Download PNG, confirm a history row
appears; Download PDF for the same input and confirm no second row; change the
recipient and export to get a second row; Open the first row and confirm the form
and preview change; re-download from that row; remove it; reload the page and
confirm the form still holds the last values; clear storage and reload to confirm
the first-visit seed.

## Notes for the AI

- Everything here is **client-only**. No server component, no route handler, no
  server action. The export routes are untouched.
- **Never read local storage during render.** Follow `lib/brand/store.ts` exactly:
  `useSyncExternalStore` with a cached snapshot, a `storage` listener for other
  tabs, and a server snapshot of the defaults (empty list, seeded draft). A
  hydration mismatch here is the most likely way this feature breaks.
- Wrap every `localStorage` call in try/catch like `lib/brand/storage.ts` does.
  History is convenience data; a quota error or a locked-down browser must never
  take the editor down. A failed write is silent.
- Parse defensively at the boundary: an unknown value from storage is `unknown`,
  never cast. Drop a malformed entry and keep the rest of the list.
- No `any`; import through the `@/*` alias; Tailwind tokens from
  `app/globals.css` only, no hardcoded hex.
- Reuse existing pieces rather than forking them: `DownloadButtons` for row
  re-downloads, `Field` for any input, `getTemplate`/`resolveTemplateId` for a
  row's template name (an entry may hold a `templateId` that no longer exists).
- Comment sparingly and only the why, matching the density of the existing
  `lib/brand/` files.
