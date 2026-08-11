# Build Plan

v1 is a simple, local-only tool: no auth, no database, everything the user keeps lives in browser local storage. Core single-certificate flow first, then styles, local persistence, polish. The export API deploys to Render early (right after the first Puppeteer route works) and auto-deploys from then on — item 9 is production hardening, not first contact.

- [x] 1. **Certificate template** - recreate the "Black Border" design as a self-contained, themeable HTML/CSS component with placeholder data and the logo mark
- [ ] 2. **Form + live preview** - inputs for name, course, date, and instructor (defaulting from brand settings) bound to the template, updating live in the browser
- [ ] 3. **PNG export** - server route renders the template via full Puppeteer (bundled Chromium, one shared browser instance, new page per request) and returns a high-resolution PNG (`deviceScaleFactor: 2–3`). **Deploy to Render as soon as this works locally** — create the web service, verify the PNG renders identically in production, and leave auto-deploy on for everything after. The deployment will be manual so do not add it as a step. Only add the png creation and export
- [ ] 4. **PDF export** - same render pipeline (shared browser instance with PNG export) outputs a print-ready landscape PDF with the correct page size and margins (`page.pdf({ landscape: true, printBackground: true })`)
- [ ] 5. **Template/style system** - a few templates sharing one theme (CSS variables) plus a picker in the UI, structured so new styles drop in cleanly
- [ ] 6. **Brand settings (local)** - logo upload, colors, and instructor name saved in local storage and applied to the chosen template
  - [ ] 6a. **Instructor + colors** - BrandSettings type, a local-storage store, a settings panel, instructor default, and theme-color overrides applied to the preview and the export
  - [ ] 6b. **Logo upload** - upload a logo (data URL) into brand settings, replace the placeholder mark in the templates, and carry it through the export pipeline
- [ ] 7. **Certificate history (local)** - save each generated certificate to local storage with a history list to re-open and re-download, and remember the last form values
- [ ] 8. **Input polish** - date picker and formatting, Zod validation, long-name auto-fit, and empty states
- [ ] 9. **Production hardening on Render** - instance sizing check under real renders, render queue behavior under concurrent requests, env config cleanup, custom domain

## Deployment notes (Render + Puppeteer)

Decisions settled up front so feature 3 and the deploy don't relitigate them:

- **Full `puppeteer`, not `puppeteer-core` + `@sparticuz/chromium`.** Render web services are persistent containers, not serverless — the stripped serverless Chrome build solves a bundle-size constraint we don't have and adds version-matching fragility and font/rendering gaps we can't afford in a design-precise tool
- **Chrome cache path** - `.puppeteerrc.cjs` in the repo root pointing `cacheDirectory` at `join(__dirname, '.cache', 'puppeteer')` so the build-time Chrome download ships with the deploy (fixes "Could not find Chrome"; add `.cache` to `.gitignore`)
- **Launch flags** - `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage` (containers have a tiny `/dev/shm`; without the flag Chrome crashes mid-render with "Target closed")
- **One browser, many pages** - launch Chrome once at server boot, open/close a page per request, never relaunch per request; cap concurrency at 1–2 renders with a small queue
- **`puppeteer` in `dependencies`**, not `devDependencies`, or the production install skips it
- **Fonts served by the app** via `@font-face`, with `document.fonts.ready` awaited before capture — never rely on system fonts in the container
- **Instance** - Starter minimum, Standard (2GB) preferred; no free tier (spin-down + Chrome memory)
- If "Could not find Chrome" ever resurfaces after a Puppeteer version bump: "Clear build cache & deploy"

## Later (not v1)

Only if Certificreate grows into a product for others. Not scheduled; revisit after v1 ships. These are also what justify the server long-term — bulk and verified certificates must render without a user's browser present.

- Accounts (Clerk) and cloud sync of settings and history
- Server-side issued certificates (Postgres + Prisma) with a unique verification slug and public verification page
- Bulk from CSV - upload recipients, generate all, download as a zip
- Billing and plans (Stripe) - free vs paid, watermark on free, feature gating