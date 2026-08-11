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

### F-07 [P3] fixed - Preview scaling relies on calc() length division

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
matrix with no cropping.
