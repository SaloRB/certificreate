# Certificreate - Project Overview

> Turn a name, course, and date into a polished, on-brand certificate and export it as a high-resolution PNG and a print-ready PDF, in seconds.

Generated from [../project-plan.md](../project-plan.md) and
[../build-plan.md](../build-plan.md). Do not hand-edit; change the plans and
re-run `/overview`.

## Problem

Course-completion certificates are made by hand in Canva today: duplicate the
design, retype the recipient's name, course, and date, then export. It is slow,
error-prone, and impossible to hand off or automate. Certificreate takes the three
inputs and produces the finished files directly, with room to add more designs
over time.

## Users

- **Brad / Traversy Media (primary)** - issues certificates to students finishing a course. Needs speed and exact brand fidelity to the existing design.
- **Other course creators, bootcamps, workshop hosts, event organizers (product direction)** - need branded certificates without a designer or Canva.
- **Students (later)** - self-serve their own certificate after completing a course.

No accounts or access tiers in v1. Everything is anonymous and local to the
browser; there is no login anywhere.

## Features

In build-plan order. The headline feature is **3 - PNG export**: the server-side
render pipeline is what makes the output print-quality and what the rest of the
product is built on.

1. **Certificate template** - the "Black Border" design recreated as a self-contained, themeable HTML/CSS component with placeholder data and the logo mark.
2. **Form + live preview** - name, course, date, and instructor inputs bound to the template, updating live in the browser.
3. **PNG export** (headline) - a server route renders the template through Puppeteer and returns a high-resolution PNG sharp enough for print and social.
4. **PDF export** - the same pipeline outputs a print-ready landscape PDF with correct page size and margins.
5. **Template/style system** - several templates sharing one CSS-variable theme, plus a picker, structured so new styles drop in cleanly.
6. **Brand settings (local)** - logo, colors, and instructor name in local storage, applied to the chosen template.
   - 6a. **Instructor + colors** - `BrandSettings` type, local-storage store, settings panel, instructor default, theme-color overrides applied to preview and export.
   - 6b. **Logo upload** - upload a logo as a data URL, replace the placeholder mark, carry it through the export pipeline.
7. **Certificate history (local)** - every generated certificate saved locally, listed for re-open and re-download; last form values remembered.
8. **Input polish** - date picker and formatting, Zod validation, long-name auto-fit, empty states.
9. **Production hardening on Render** - instance sizing under real renders, render queue behavior under concurrency, env config cleanup, custom domain.

Deployment to Render happens manually as soon as feature 3 works locally, and
auto-deploys from then on. It is not a build-plan step and must not be added to
any feature spec.

## Data model

No server-side database in v1. Data lives in two places: template definitions in
code, and user data in browser local storage. Generated PNG/PDF files are streamed
to the user and never stored.

### Template (in code, static)

Shipped with the app, not user-editable.

- `id` (string) - stable slug, e.g. `black-border`
- `name` (string) - display name in the picker
- `component` - the HTML/CSS that renders the certificate
- `themeVars` (record of CSS custom properties) - the theme hook brand colors override
- `fonts` (list) - self-hosted `@font-face` families the template needs
- `logoAsset` (string) - default logo mark, replaced when brand settings carry an uploaded logo

> Locked shape. Features 5, 6a, and 6b all key off `id` and `themeVars`.

### CertificateInput (transient, drives preview and export)

The one payload the preview and both export routes consume. Preview and export
must never diverge from this shape.

- `recipientName` (string)
- `courseTitle` (string)
- `date` (string, formatted for display; formatting settled in feature 8)
- `instructor` (string) - defaults from `BrandSettings.instructor`, editable per certificate
- `templateId` (string) - references `Template.id`

> Locked shape. Features 2, 3, 4, 7, and 8 all pass this object.

### BrandSettings (local storage, single record)

- `logoDataUrl` (string | null) - uploaded logo as a data URL (6b)
- `instructor` (string) - default signatory name
- `colors` (record of theme-variable overrides) - applied over `Template.themeVars`

### HistoryEntry (local storage, list)

- `id` (string) - generated locally
- `recipientName` (string)
- `courseTitle` (string)
- `date` (string)
- `templateId` (string) - references `Template.id`
- `createdAt` (timestamp)

Re-opening an entry rehydrates a `CertificateInput`, so history entries carry
every field that payload needs.

### LastFormValues (local storage, single record)

The most recent `CertificateInput`, restored on reload so the form is never empty.

All local-storage data is per-device and never leaves the browser; clearing site
data wipes it.

## Tech stack

- **Next.js (App Router) + TypeScript** - app framework and type safety
- **Tailwind CSS v4** - styling, CSS-first theme config
- **shadcn/ui** - UI components for the app chrome (> TODO: not installed yet)
- **Puppeteer (full package, bundled Chromium)** - headless Chrome renders the same HTML/CSS template to both PNG and PDF, so preview and export never drift
- **Self-hosted web fonts** - match the Canva serif so the server render matches the browser preview
- **Browser local storage** - brand settings, certificate history, last form values; no database in v1
- **Zod** - input validation
- **Render** - hosting, as a persistent web service

Not in v1, only if this becomes a product: Render Postgres + Prisma, Clerk auth,
Cloudflare R2 file storage, Stripe billing, CSV bulk zip via archiver or jszip.

## Monetization

Not in v1. Certificreate ships free and local, to prove the core flow and the
rendering pipeline.

If it grows into a product: freemium SaaS. The free tier generates watermarked
certificates from built-in templates at limited volume; a paid Stripe subscription
removes the watermark and unlocks custom branding, all templates, CSV bulk
generation, cloud-saved history, and higher volume.

## UI/UX

One focused screen. Form on the left (name, course, date, template picker), live
certificate preview on the right with Download PNG and Download PDF buttons. On
mobile the form stacks above the preview. The preview is the real template scaled
down, so what you see is what you get. A brand-settings panel and a history list
live alongside the form, both backed by local storage.

The certificate artifact keeps the existing brand: formal and classic, serif
display headline, letter-spaced small-cap labels, blue double-line border with
corner flourishes, centered logo mark between the instructor and date lines. It
stays light and print-friendly. The app chrome around it is clean, modern, and
dark-mode-first per the coding standards.

- `/` - the whole app: form, template picker, live preview, download buttons, brand settings, history
- `/api/...` (route names > TODO, settled in features 3 and 4) - server render endpoints returning PNG and PDF

## Deployment

Render web service, deployed manually once feature 3 renders a PNG locally, then
auto-deploying on push. These decisions are settled and should not be relitigated
during feature 3.

| Item | Decision |
| --- | --- |
| Host | Render, persistent web service (not serverless) |
| Puppeteer | Full `puppeteer` in `dependencies`, not `puppeteer-core` + `@sparticuz/chromium` |
| Chrome cache | `.puppeteerrc.cjs` at repo root pointing `cacheDirectory` at `join(__dirname, '.cache', 'puppeteer')`; add `.cache` to `.gitignore` |
| Launch flags | `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage` |
| Browser lifecycle | Launch Chrome once at server boot, one page per request, never relaunch per request; cap concurrency at 1-2 renders with a small queue |
| Fonts | Served by the app via `@font-face`, with `document.fonts.ready` awaited before capture; never rely on container system fonts |
| Instance | Starter minimum, Standard (2GB) preferred; no free tier (spin-down plus Chrome memory) |
| Build / start | `npm run build` / `npm run start` |
| Env vars | None required in v1 |
| Database / storage | None |
| Health check path | > TODO |
| Custom domain | Feature 9 |

If "Could not find Chrome" resurfaces after a Puppeteer version bump, use Render's
"Clear build cache & deploy".

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **shadcn/ui is named in the plan but not installed.** `blueprint/context/coding-standards.md` still marks the component library as a TODO. Install it, or drop it from the plan, before feature 2 builds real UI.
- **`project-plan.md` has no section 8 (Deployment).** The Deployment section above was synthesized from section 5 and the build plan's deployment notes. Adding section 8 to the project plan would make the source explicit.
- **Health check path is undecided.** Render wants one; settle it by feature 9 at the latest.
- **Export route names are unnamed.** Feature 3 fixes the PNG route and feature 4 the PDF route; they share one browser instance.
- **"A few templates" is unquantified.** Feature 5 needs a concrete count and the list of designs beyond Black Border.
- **Watermarking** appears only in the monetization direction, never as a v1 feature. Correct for v1, but worth confirming no template ships watermark markup.
