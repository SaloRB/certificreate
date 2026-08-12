# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] open - Logo mark is 1px off-centre from a hardcoded left offset

**File:** components/certificate/CertificateBody.tsx:161
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** The mark is placed with `left: 500` while it is 121px wide on
an 1123px canvas, so centred would be 501. The rendered mark spans x500-620
(centre 560.5) against a sheet centre of 561.5. Every other centred block in the
file derives its position; this one is a magic number, so it drifts silently if
the mark size or canvas changes. At the 3x export scale the offset is 3px.
**Suggested fix:** Export the mark's size from `CertificateMark.tsx` and compute
`left: (CERT_WIDTH_PX - MARK_SIZE) / 2`, matching the course and name blocks.
**Resolution:**

### F-02 [P2] open - Canvas dimensions duplicated instead of using the exported constants

**File:** app/globals.css:58
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `CERT_WIDTH_PX`/`CERT_HEIGHT_PX` in `types/certificate.ts`
are the declared source of truth for the fixed canvas, but 1123/794 are also
hardcoded in `.cert-fit`'s `aspect-ratio` (globals.css:58) and its scale
divisor (globals.css:64), and again in `CertificateBody.tsx:108` - which imports
`CERT_WIDTH_PX` and uses it correctly 35 lines later. Changing the canvas would
leave the CSS disagreeing with the component, and because `.cert-fit` sets
`overflow: hidden`, the mismatch would silently crop the certificate rather than
fail loudly. Features 3 and 4 depend on this contract.
**Suggested fix:** Use `CERT_WIDTH_PX` at CertificateBody.tsx:108. For the CSS,
either set the two values as custom properties from the component or add a
comment at both sites pointing at `types/certificate.ts` as the source.
**Resolution:**

### F-03 [P2] open - Long course title overlaps the logo mark

**File:** components/certificate/CertificateBody.tsx:139
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** A 91-character title wraps to a second line that descends to
y=601 while the mark starts at y=594 - 152 ink pixels overlap. Course titles that
long are realistic. Horizontal containment was fixed in step 6 (`CONTENT_WIDTH`),
so nothing escapes the frame; this is the remaining vertical collision. Recorded
here so it survives a context clear.
**Suggested fix:** Feature 8 owns long-name auto-fit and should shrink the title
to fit its band. Deliberately not fixed in feature 1 to avoid scope creep; the
active spec's status block records the same deferral.
**Resolution:**

### F-04 [P3] open - Dead attribute, no-op class, and unused theme token

**File:** components/certificate/CertificateBody.tsx:162
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** Three small pieces of dead code: `data-certificate-mark`
(CertificateBody.tsx:162) is referenced nowhere; `mx-auto` (CertificateBody.tsx:140)
is a no-op alongside an explicit `left` and `width`; `--radius-DEFAULT`
(globals.css:43) is a Tailwind v3 idiom that v4 does not read and nothing uses.
Each invites a future reader to assume a meaning that is not there.
**Suggested fix:** Delete all three. Keep `data-certificate` on the sheet - that
one is the export selector features 3 and 4 will use.
**Resolution:** Partly repaired in feature 2 step 1: `--radius-DEFAULT` removed and
replaced with the used `--radius-panel` / `--radius-field`. The two
`CertificateBody.tsx` items remain open; that file is out of scope for feature 2.

### F-05 [P3] open - Signature columns are not symmetric about the sheet centre

**File:** components/certificate/CertificateBody.tsx:9
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `SIGNATURE_CENTRES` is `{ instructor: 288.8, date: 833.5 }`,
which sits 272.7 left and 272.0 right of the 561.5 centre. The 0.7px asymmetry is
transcription noise from measuring the reference, not a design intent, and it will
be inherited by every future template that copies this layout.
**Suggested fix:** Derive both from a single offset, e.g. `centre ± 272.5`.
**Resolution:**

### F-06 [P3] open - prototypes/theme.css no longer matches the shipped tokens

**File:** prototypes/theme.css:33
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** Four certificate colours were corrected against the reference
image during step 3 (`--cert-border` `#567f9f`->`#4a6178`, `--cert-border-thin`
`#7c9db8`->`#8e949c`, `--cert-frame`, `--cert-rule`). The prototype still carries
the old values, so anyone treating it as the token source - as the workflow says
to - gets stale colours.
**Suggested fix:** `/complete` discards `prototypes/` for this feature, which
resolves it. If the mockups are kept for feature 2, sync the four values first.
**Resolution:** `prototypes/` was discarded at feature 1's completion. Feature 2
restored the editor mockup from git as `blueprint/references/editor-mockup.html`
plus `theme.css` (it is the app-chrome design reference) and synced the four
certificate colours to the shipped tokens before using it.

### F-14 [P3] open - Only the PNG path pins the viewport, so the two exports load the page differently

**File:** app/api/export/pdf/route.ts:14
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `captureCertificate`'s viewport is optional, and only the PNG
route passes one. The PDF route therefore loads `/render/certificate` at
Puppeteer's default 800x600 and awaits `document.fonts.ready` at that width, then
Chrome re-lays-out at the 1123.84px paper when `page.pdf()` runs. The PNG loads and
captures at one pinned 1123x794 size throughout. Harmless today because the render
page has no media queries, container queries, or JS measurement, but this project's
stated premise is that preview and export never diverge, and `CertificateFit`
already shows the codebase reaching for JS-measured layout. The first responsive or
measured element on that route would silently make the two formats disagree.
**Suggested fix:** Pass the same viewport from the PDF route, or make the sheet
size the default inside `captureCertificate` so both formats load identically and a
caller has to opt out deliberately.
**Resolution:**

### F-15 [P3] open - Unreferenced /preview route duplicates the default certificate input

**File:** app/preview/page.tsx:5
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** Nothing links to or imports `/preview`; it is a feature 1
scaffold superseded by the real editor at `/`, but it still builds and deploys as a
public route. Its `PLACEHOLDER` constant also repeats all five fields of
`DEFAULT_CERTIFICATE_INPUT` (`lib/certificate-defaults.ts:6`) verbatim, so the two
drift apart the moment either is edited, and features 6a and 7 are both scheduled
to change that default. Not introduced by this feature, but it sits in the export
path's neighbourhood and is a second, stale rendering of the same component.
**Suggested fix:** Delete `app/preview/page.tsx`. If it is still wanted as a
harness, import `DEFAULT_CERTIFICATE_INPUT` instead of restating it.
**Resolution:**

### F-09 [P3] open - pageRanges "1" hides overflow instead of failing on it

**File:** app/api/export/pdf/route.ts:30
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `pageRanges: "1"` was added as a guard against a blank second
page, but it does not distinguish a blank overflow page from a real one. If a
future template or a long field pushes content past the first page, that content is
silently dropped and the export still looks successful. This project has twice been
bitten by exactly this failure mode (F-02's silent crop, F-07's silent crop), so
silent truncation is a known-costly pattern here.
**Suggested fix:** Keep `pageRanges` for the output, but assert the expectation:
after `page.pdf()`, or via a cheap layout check before it, confirm the document is
one page and throw if not, so `handleExportRequest` turns it into a logged 500
rather than a quietly wrong file.
**Resolution:**

### F-10 [P3] open - Load-bearing Uint8Array copy in the PDF route has no comment

**File:** app/api/export/pdf/route.ts:32
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `new Uint8Array(pdf)` is required, not cosmetic: `page.pdf()`
is typed `Promise<Uint8Array>` (so `Uint8Array<ArrayBufferLike>`) while
`ExportOptions.render` requires `Uint8Array<ArrayBuffer>`. The identical copy in
`app/api/export/png/route.ts:27` carries a comment explaining why and warning
against removing it; this one does not, so the two copies of the same trick now
disagree on whether it needs explaining. A reader tidying "redundant" allocations
would break the PDF route's build.
**Suggested fix:** Mirror the PNG route's comment, or move the copy into
`handleExportRequest` by widening `ExportOptions.render` to return
`Uint8Array<ArrayBufferLike>` so neither route repeats it.
**Resolution:**

### F-11 [P2] unverified - Download anchor is never attached to the document

**File:** lib/hooks/use-certificate-download.ts:13
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** `saveBlob` creates a detached `<a>`, clicks it, and revokes the
object URL on the very next statement. Both parts are patterns that historically
fail outside Chromium: some engines ignore a programmatic click on an anchor that
is not in the document, and revoking synchronously can race a download that has not
yet started. Verified working in Chromium for both formats (31KB PDF, 122KB PNG);
not tested in Firefox or Safari. This is pre-existing feature 3 code, but feature 4
doubles the number of buttons that depend on it, and F-07 already proved this
project's Firefox exposure is real rather than theoretical.
**Suggested fix:** Confirm in Firefox and Safari first, since the finding is
unverified. If it fails, append the anchor to `document.body` before `click()`,
remove it after, and revoke the URL in a `setTimeout` or on the next task.
**Resolution:**

### F-12 [P3] fixed - Comment in the download hook describes feature 4 as future work

**File:** lib/hooks/use-certificate-download.ts:22
**Found:** 2026-08-11 by /audit (scope: current)
**Why it matters:** The doc comment reads "Feature 4 reuses it for PDF by passing a
different endpoint." Feature 4 has now done exactly that, so the comment points a
reader at planned work that already shipped. Small, but it is the kind of stale
forward reference that accumulates into comments no one trusts.
**Suggested fix:** Restate it in the present tense, describing what the hook is
rather than who will use it next: it posts a `CertificateInput` to an export
endpoint and saves the response under the server-supplied filename.
**Resolution:** 2026-08-12, feature 7. Rewritten in the present tense while the
hook was being changed to report success. Awaiting re-review by `/audit`.
