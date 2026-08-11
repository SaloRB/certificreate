# Project Plan

## 1. Problem - What problem are we solving?

Course-completion certificates are made by hand in Canva today: duplicate the
design, retype the recipient's name, course, and date, then export. It is slow,
easy to get wrong, and impossible to hand off or automate. Certificreate turns three
inputs (name, course, date) into a polished, on-brand certificate and exports a
high-quality PNG plus a print-ready PDF in seconds, with room to add more designs
over time.

## 2. Users - Who is this for?

Primary: Brad and Traversy Media, issuing certificates to students who finish a
course. Secondary (the product direction): other course creators, bootcamps,
workshop hosts, and event organizers who need branded certificates without a
designer or Canva. Later: students self-serving their own certificate after
completing a course.

## 3. Features - What does v1 need?

v1 is a simple, local-only tool. No login, no server-side database; everything a
user keeps lives in their browser.

- Simple form for the recipient details: name, course or achievement title, date, plus an instructor field that defaults from brand settings but is editable per certificate
- Live preview that updates as you type and matches the exported file exactly
- Faithful recreation of the current "Black Border" design: blue double border, corner flourishes, serif headline, centered logo mark
- A few templates to choose from (including Black Border) via a picker, all sharing one theme
- High-resolution PNG export, sharp enough for print and social
- Print-ready PDF export: landscape, correct page size and margins
- Brand settings saved in local storage: logo, instructor/signatory name, colors, applied to the chosen template
- Certificate history in local storage: a list of generated certificates you can re-open and re-download
- Remember the last form values (name/course/date/instructor/template) so the form isn't empty on reload

Later, if it grows into a product for others (not v1, see build-plan.md):
accounts and cloud sync, server-side issued-certificate history with public
verification links, CSV bulk generation, and paid plans.

## 4. Data - What are we storing?

No server-side database in v1. Two kinds of data:

- **In code:** template definitions (id, display name, the HTML/CSS, fonts, theme
  variables, logo asset). Static, shipped with the app.
- **In browser local storage:** brand settings (logo data URL, instructor name,
  colors), a certificate history list (recipient, course, date, template,
  timestamp), and the last-used form values. All per-device, never leaves the
  browser; clearing site data wipes it.

Files (PNG/PDF) are generated on demand and downloaded, not stored.

Product direction (database-backed, only if it becomes a product, not v1): users,
organizations/brand settings, issued certificates with unique verification slugs
and file URLs, CSV batch jobs, and billing/subscription records.

## 5. Tech - What stack are we using?

- Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui, matching blueprint/context/coding-standards.md
- Rendering engine: headless Chrome with Puppeteer, running locally and in the Render web service, renders the same HTML/CSS template to both PNG and PDF so preview and export never drift
- Self-hosted web fonts that match the Canva serif, so the server render matches the browser preview
- Browser local storage for brand settings, certificate history, and last form values (no database in v1)
- Input validation with Zod
- Deploy as a web service on Render
- Later (only if it becomes a product, not v1): Render Postgres + Prisma for data, Clerk for auth, file storage on Cloudflare R2, Stripe for billing, CSV bulk zip via archiver or jszip

## 6. Monetize - How will this make money?

v1 does not. It's a free, local tool for Brad and anyone who lands on it, shipped
to prove the core flow and the rendering pipeline.

If it grows into a product later: freemium SaaS for course creators. A free tier
generates watermarked certificates from built-in templates at limited volume; a
paid Stripe subscription removes the watermark and unlocks custom branding, all
templates, CSV bulk generation, cloud-saved history, and higher volume. None of
that is in v1.

## 7. UI/UX - How should this look and feel?

One focused screen: a form on the left (name, course, date, template picker) and
a live certificate preview on the right with Download PNG and Download PDF
buttons. On mobile the form stacks above the preview. The preview is the real
template scaled down, so what you see is what you get. A brand-settings panel
(logo, instructor name, colors) and a history list of previously generated
certificates live alongside the form, both backed by local storage. The
certificates keep the existing brand: formal and classic, with a serif display
headline, letter-spaced small-cap labels, the blue double-line border with corner
flourishes, and the centered logo mark between the instructor and date lines. The
app chrome around it is clean and modern (dark-mode-first per coding standards);
the certificate artifact stays light and print-friendly. No login anywhere in v1.