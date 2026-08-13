# Certificreate

> Turn a name, course, and date into a polished, on-brand certificate and export
> it as a high-resolution PNG and a print-ready PDF, in seconds.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.
Certificates are rendered server-side by headless Chrome (Puppeteer), so the
export is a photograph of the same page the preview shows.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |

## Operations

### Endpoints

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/export/png` | POST | Renders a certificate and returns a PNG |
| `/api/export/pdf` | POST | Renders a certificate and returns a landscape PDF |
| `/api/health` | GET | Liveness and render-pool state |

**Render's health check path is `/api/health`.** It answers 200 whenever the
server is up and never starts Chrome, so polling an idle instance costs nothing.
`browser: "not-started"` is the normal state of an idle service, not a fault.

```json
{ "status": "ok", "uptimeSeconds": 136, "browser": "up",
  "activeRenders": 0, "queuedRenders": 0,
  "maxConcurrentRenders": 2, "maxQueuedRenders": 4 }
```

### Render behavior under load

Chrome launches once per process and is reused; each request gets a fresh page.
Two renders run at once and four more may queue, both set in
[lib/puppeteer/browser.ts](lib/puppeteer/browser.ts).

| Situation | Response |
| --- | --- |
| Normal | 200 with the file |
| Invalid input | 400 with the field message |
| Queue full (more than 6 in flight) | 503 with `Retry-After` |
| Render past its 45s deadline | 504, and the page is closed |
| Chrome crashed | 500, and the next request launches a fresh browser |

Measured locally against `npm run start` (Apple silicon), one PNG plus one PDF
alternating:

| Concurrent requests | Result | p50 | max |
| --- | --- | --- | --- |
| 1 | 1x 200 | 1.1s | 1.1s |
| 4 | 4x 200 | 1.3s | 2.3s |
| 10 | 6x 200, 4x 503 (refused in under 10ms) | 2.2s | 3.4s |

Memory over 22 renders: the Node process held steady around 159MB, and Chrome
settled back to roughly 650MB with its renderer processes reaped within 15
seconds of a burst. Nothing accumulated across repeated runs. Those figures are
summed macOS RSS, which overcounts shared pages, so treat them as an upper bound
and confirm against Render's own metrics.

**Instance sizing: Standard (2GB) preferred, Starter as the floor.** No free
tier: it spins down, and a cold start would pay for a Chrome launch on the first
export.

### Load and smoke checks

```bash
node scripts/load-export.mjs --concurrency 10
node scripts/load-export.mjs --base-url https://<service>.onrender.com --format png
```

It verifies each response's magic bytes, so a truncated or HTML error body
cannot pass as a certificate, and exits non-zero on any status other than 200 or
503. A 503 past the queue cap is expected, not a failure.

### Environment

v1 requires no environment variables. `PORT` is read in exactly one place,
[lib/puppeteer/render-origin.ts](lib/puppeteer/render-origin.ts), so Chrome can
load the render page over loopback. Never derive that origin from the incoming
request: behind Render's TLS-terminating proxy it reports `https` against a plain
HTTP server, and Chrome fails with `ERR_SSL_PROTOCOL_ERROR`.

Puppeteer's Chrome download is pinned to `.cache/puppeteer` inside the repo by
[.puppeteerrc.cjs](.puppeteerrc.cjs) so it survives into the deployed container.
If "Could not find Chrome" appears after a Puppeteer version bump, use Render's
"Clear build cache & deploy".

### Custom domain

Done by hand in the Render dashboard, in this order:

1. Add the domain under **Settings > Custom Domains** and copy the target Render
   gives you.
2. Create the DNS record at your registrar: `CNAME` to that target for a
   subdomain, or Render's `A` record for an apex domain.
3. Wait for Render to verify and issue the TLS certificate, then load the domain
   over `https` and confirm no certificate warning.
4. Re-run the smoke check against the new host and open both files:
   `node scripts/load-export.mjs --base-url https://<domain> --concurrency 4`.

## Working on this project

Agent instructions live in [AGENTS.md](AGENTS.md). The development workflow this
project follows is documented in [blueprint/README.md](blueprint/README.md).
