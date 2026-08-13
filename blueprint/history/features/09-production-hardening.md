# Feature: Production hardening on Render

**From build-plan:** feature 9
**Status:** complete

## Goal

Make the export pipeline survive real production conditions on Render: a Chrome
crash must not wedge the process, a burst of concurrent exports must queue
predictably instead of piling up unbounded, a hung render must free its slot, and
the service must expose a health check path Render can poll. Then measure a real
render under concurrency so the instance size is a decision backed by numbers,
and record the remaining manual Render steps (instance plan, health check path,
custom domain) so they are done once and not rediscovered.

Today the pipeline works but has three production-only failure modes that never
show up locally: `browserPromise` caches a resolved `Browser` forever, so if
Chrome dies every later export fails until the service is restarted; the render
queue in `lib/puppeteer/browser.ts` is unbounded, so a burst parks requests in
memory until the client or the proxy times out; and no render has a deadline, so
one hung page holds a slot for the life of the process.

## In scope

- Browser lifecycle recovery: relaunch Chrome after a disconnect or crash.
- Bounded render queue with a wait cap, surfaced as a real HTTP status.
- Per-render timeout so a hung capture releases its slot.
- `GET /api/health` health check endpoint for Render, cheap and Chrome-free.
- A repeatable load script to measure concurrent PNG/PDF exports (latency,
  failures, memory), run locally and, by the user, against the deployed service.
- Env config review: document the real env surface (`PORT` only), keep
  `renderOrigin` the single reader of it, note that v1 requires no env vars.
- Ops documentation: instance plan recommendation from the measured numbers,
  health check path, and the manual custom-domain checklist.

## Out of scope

- Creating or changing anything on Render itself: instance plan, health check
  setting, env vars, custom domain and its DNS records. The build plan keeps
  deployment manual. This feature produces the numbers and the checklist; the
  user performs the remote steps.
- `render.yaml` or any provider config file. That belongs to `/release`, which is
  a separate explicit skill.
- Caching, CDN, rate limiting, auth, or abuse protection. There is no account
  system in v1, and none of these are in the build plan.
- Open findings F-01, F-02, F-04, F-05, F-09, F-10, F-11, F-14, F-15. They are
  logged in `findings.md` and are not this feature's scope; `/audit` and `/fix`
  own them.
- Any change to the certificate templates, the editor UI, or local storage.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Recover from a dead browser** - in `lib/puppeteer/browser.ts`,
  clear the cached `browserPromise` when the browser disconnects (Puppeteer's
  `disconnected` event) and when a launch or `newPage` call fails against a dead
  instance, so the next request launches a fresh Chrome instead of reusing a
  corpse. *Done when:* a unit test with a mocked `puppeteer` module proves that
  after a disconnect the next `withPage` call triggers a new `launch`, and that a
  failed launch is not cached; `npm test` and `npm run build` pass.

- [x] **Step 2 - Bound the queue and time-box a render** - cap how many requests
  may wait for a slot and how long a single render may hold one. Over the wait cap
  the acquire rejects with a distinguishable overload error; past the render
  deadline the page is closed and the slot released. Both caps are module
  constants with a comment on the chosen number. *Done when:* unit tests cover
  slot handoff in FIFO order, rejection past the wait cap, and slot release after
  a timeout; a leaked slot is impossible because release happens in `finally`.

- [x] **Step 3 - Map overload and timeout to honest responses** (the download
  hook already surfaces any server-supplied `error` message, so it needed no
  change) - in
  `lib/certificate/export-route.ts`, turn the overload error into `503` with a
  `Retry-After` header and the timeout into `504`, each with a user-facing message
  distinct from the generic 500, and surface that message in the download hook's
  error state rather than the generic copy. *Done when:* unit tests assert the
  status, header, and body for both cases and that an unknown error still returns
  500 with no exception text; the editor shows the busy message when a 503 comes
  back.

- [x] **Step 4 - Health check endpoint** - add `app/api/health/route.ts`
  returning `200` with the render pool's state (whether Chrome is up, active
  renders, queued renders, uptime) from a small `renderPoolStats()` exported by
  `browser.ts`. It must never launch Chrome, so Render's poll cannot cost a
  browser start. *Done when:* `curl localhost:3000/api/health` on a cold process
  returns `200` JSON reporting the browser as not started and no Chrome process
  exists; after one export it reports the browser up; a unit test covers
  `renderPoolStats()`; the path is recorded in the docs in step 6.

- [x] **Step 5 - Load-check script and measurement** - add
  `scripts/load-export.mjs` (plain Node, no new dependency) that fires N
  concurrent PNG and PDF exports at a base URL and reports per-request status,
  p50/p95/max latency, failure counts, and the server's health snapshot before
  and after. Run it locally at concurrency 1, 4, and 10 against
  `npm run start`, watching process RSS. *Done when:* the run at concurrency 10
  returns a valid file for every request or a clean 503 for the ones past the wait
  cap, never a hang, a crash, or a corrupt file; the observed latency and peak RSS
  are written into the results table in step 6.

- [x] **Step 6 - Ops documentation and env review** - record in `README.md` (and
  reflect the settled values in the plans so `/overview` can pick them up): the
  measured concurrency numbers and the instance plan they justify, the health
  check path, the fact that v1 needs no env vars and that `PORT` is read only by
  `renderOrigin`, and a manual checklist for the custom domain (add domain in
  Render, DNS record, verify TLS, re-check exports on the new host). *Done when:*
  a reader can size the instance, set the health check path, and add the domain
  without asking a question this feature already answered; `npx tsc --noEmit`,
  `npm test`, and `npm run build` all pass.

## Files / areas

- `lib/puppeteer/browser.ts` - disconnect recovery, bounded queue, render
  deadline, `renderPoolStats()`.
- `lib/puppeteer/browser.test.ts` - new, with `vi.mock("puppeteer")` and fake
  timers.
- `lib/certificate/export-route.ts` and `lib/certificate/export-route.test.ts` -
  overload and timeout status mapping.
- `lib/hooks/use-certificate-download.ts` - show the server's message for 503/504.
- `app/api/health/route.ts` - new.
- `scripts/load-export.mjs` - new, developer tool, not shipped code paths.
- `README.md` and `blueprint/project-plan.md` / `blueprint/build-plan.md` for the
  settled deployment values.

## Data / contracts

- **Render pool stats** (new, read by `/api/health`):
  `{ status: "ok", browser: "up" | "not-started", activeRenders: number,
  queuedRenders: number, uptimeSeconds: number }`. Load-bearing only for the
  health endpoint and the load script; keep it additive.
- **Export error responses** stay `{ error: string }`, matching the existing
  shape the download hook already parses. Only the status codes are new: `503`
  (busy, with `Retry-After`) and `504` (render timed out) alongside the current
  `400` and `500`.
- `CertificateInput`, `ExportBrand`, and both export request bodies are
  unchanged. This feature must not alter the export contract.

## Testing

The test gate is on (`npm test`, Vitest). Steps 1 to 4 are logic-bearing and each
ships tests in the same diff:

| Step | Test coverage |
| --- | --- |
| 1 | Disconnect clears the cached browser and the next call relaunches; a failed launch is not cached |
| 2 | FIFO slot handoff, rejection past the wait cap, slot released after a render timeout |
| 3 | 503 with `Retry-After` for overload, 504 for timeout, 500 with no exception text otherwise |
| 4 | `renderPoolStats()` shape and counts, including the cold "not-started" case |

Not unit tested, per the Testing section of `coding-standards.md`: the export
routes themselves, the health route handler, the render page, and the download
button. Those ride on the step 5 load run, a manual export in the browser, and
`npm run build`.

Manual verification for step 5: `npm run build && npm run start`, then
`node scripts/load-export.mjs --concurrency 10`, watching RSS with
`ps -o rss= -p <pid>`. Open a PNG and a PDF from the run and confirm they are
correct certificates, not truncated files.

## Notes for the AI

- Server-only work. `browser.ts`, the health route, and the export routes are
  Node runtime; the only client change is the error message in the download hook.
- Do not touch anything on Render. No deploy, no dashboard change, no DNS. The
  user performs every remote step; this feature only produces numbers and a
  checklist.
- Keep the queue simple: an array of waiters and a counter, as it is now. No
  queue library, no worker pool, no new dependency.
- Never let an error path skip `releaseSlot()`. The `finally` in `withPage` is
  load-bearing; a leaked slot silently halves throughput and eventually deadlocks.
- Never leak exception text to the client. `handleExportRequest` already enforces
  that, so add the new statuses inside it rather than in the route files.
- The health endpoint must not start Chrome. Report state, do not create it.
- `renderOrigin` stays the only reader of `process.env`. Do not add a config
  layer for a single variable.
- Follow the comment rules in `coding-standards.md`: explain why a cap or a
  timeout value was chosen, not what the line does. No em dashes anywhere.

## Outcome

### Measured

Local production build (`npm run start`, Apple silicon), alternating PNG and PDF:

| Concurrent | Result | p50 | max |
| --- | --- | --- | --- |
| 1 | 1x 200 | 1.1s | 1.1s |
| 4 | 4x 200 | 1.3s | 2.3s |
| 10 | 6x 200, 4x 503 refused in under 10ms | 2.2s | 3.4s |

22 renders, zero corrupt files. Node process steady at ~159MB; Chrome settled
back to ~647MB with renderer processes reaped within 15s of a burst, flat across
three repeat rounds. Those are summed macOS RSS figures, which overcount shared
pages, so the README records them as an upper bound to be confirmed against
Render's own metrics.

### Settled values

| Item | Value |
| --- | --- |
| Health check path | `/api/health` |
| Instance | Standard (2GB) preferred, Starter floor, no free tier |
| Concurrency | 2 rendering, 4 queued, then 503 with `Retry-After` |
| Render deadline | 45s, then 504 and the page is closed |
| Env vars | none; `PORT` read only by `renderOrigin` |

### Notes

- **The queue cache bug was the real find.** The spec's Goal named it, but the
  build-plan line ("render queue behavior under concurrency") did not: a resolved
  `browserPromise` was cached forever, so one Chrome crash in the container would
  have wedged every later export until a manual restart. First step, first test.
- **`renderPoolStats()` never calls `getBrowser()`.** A health poll that started
  Chrome would keep ~650MB alive on an idle instance, which is the opposite of
  what the check is for. The cold-state test asserts `launch` was never called.
- **A `"starting"` browser state was added** beyond the spec's two-value contract.
  Reporting a mid-launch browser as `not-started` would be wrong for the second or
  two a poll might land in. `maxConcurrentRenders` / `maxQueuedRenders` were added
  for the same honesty reason: queue depth means nothing without its cap.
- **`use-certificate-download.ts` needed no change.** The spec predicted one, but
  the hook already reads `body.error` for any non-ok response, so the new 503/504
  messages surface in the existing error state.
- **The load script validates magic bytes**, so a truncated body or an HTML error
  page cannot pass as a certificate, and it exits non-zero on any status other
  than 200 or 503. That makes it a deploy smoke test, not just a benchmark.
- **`project-plan.md` gained section 8 (Deployment)**, which the overview had
  flagged as missing. The deployment facts had been synthesized from section 5 and
  the build plan; now they have a source.
- **The 504 path is proven by unit test only.** No local render takes 45s, so the
  timeout was verified with fake timers rather than against a real hung page.
