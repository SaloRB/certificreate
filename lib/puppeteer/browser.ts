import puppeteer, { type Browser, type Page } from "puppeteer";

import {
  RenderOverloadError,
  RenderTimeoutError,
} from "@/lib/puppeteer/errors";

// Containers ship a tiny /dev/shm; without the last flag Chrome dies mid-render
// with "Target closed". Settled in the build plan's deployment notes.
const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

const MAX_CONCURRENT_RENDERS = 2;

/** Requests allowed to wait for a slot. A healthy render is a couple of seconds,
 *  so four deep is a few seconds of queueing on a good day, and at worst two
 *  deadlines back to back. Deeper than this and the client has given up before
 *  its turn arrives, so a fast 503 beats a connection held open. */
const MAX_QUEUED_RENDERS = 4;

/** Backstop for a page that never finishes, not a competitor with the inner
 *  waits: `goto` allows 30s and the auto-fit wait another 10s, so a legitimately
 *  slow render must still land inside this. */
const RENDER_TIMEOUT_MS = 45_000;

/** Two slots draining at the deadline is the worst case a queued caller faces. */
const RETRY_AFTER_SECONDS = Math.ceil(
  (RENDER_TIMEOUT_MS / 1000) * (MAX_QUEUED_RENDERS / MAX_CONCURRENT_RENDERS),
);

let browserPromise: Promise<Browser> | null = null;
let browserState: RenderPoolStats["browser"] = "not-started";

/** Drops the cache only if it still holds this attempt, so a launch that started
 *  after the failure is not thrown away with it. */
function invalidate(attempt: Promise<Browser>) {
  if (browserPromise === attempt) {
    browserPromise = null;
    browserState = "not-started";
  }
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const attempt: Promise<Browser> = puppeteer
      .launch({ args: LAUNCH_ARGS })
      .then((browser) => {
        if (browserPromise === attempt) browserState = "up";
        // Chrome dying in the container would otherwise stay cached as a
        // resolved promise, and every later export would fail on the dead handle
        // until someone restarted the service.
        browser.once("disconnected", () => invalidate(attempt));
        return browser;
      })
      .catch((error) => {
        invalidate(attempt);
        throw error;
      });
    browserPromise = attempt;
    browserState = "starting";
  }
  return browserPromise;
}

export interface RenderPoolStats {
  browser: "not-started" | "starting" | "up";
  activeRenders: number;
  queuedRenders: number;
  maxConcurrentRenders: number;
  maxQueuedRenders: number;
}

/** A snapshot for the health endpoint. Deliberately never touches `getBrowser`:
 *  a health poll must report the pool, not create it, or Render's check would
 *  keep a Chrome instance alive on an otherwise idle service. */
export function renderPoolStats(): RenderPoolStats {
  return {
    browser: browserState,
    activeRenders,
    queuedRenders: waiting.length,
    maxConcurrentRenders: MAX_CONCURRENT_RENDERS,
    maxQueuedRenders: MAX_QUEUED_RENDERS,
  };
}

/** Opens a page, treating any failure as evidence that the shared browser is
 *  gone: the cache is dropped so the next request launches a fresh Chrome rather
 *  than queueing behind a corpse. `disconnected` normally gets there first, but
 *  it is an event, so it cannot be relied on to have fired yet. */
async function openPage(): Promise<Page> {
  const attempt = getBrowser();
  try {
    const browser = await attempt;
    if (!browser.connected) throw new Error("Shared Chrome instance is gone");

    return await browser.newPage();
  } catch (error) {
    invalidate(attempt);
    throw error;
  }
}

let activeRenders = 0;
const waiting: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders += 1;
    return Promise.resolve();
  }
  if (waiting.length >= MAX_QUEUED_RENDERS) {
    return Promise.reject(new RenderOverloadError(RETRY_AFTER_SECONDS));
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      activeRenders += 1;
      resolve();
    });
  });
}

function releaseSlot() {
  activeRenders -= 1;
  waiting.shift()?.();
}

/** Abandons the render at the deadline. The losing side of the race stays
 *  attached, so its later rejection is still handled and never surfaces as an
 *  unhandled rejection that would take the server down. */
function withDeadline<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RenderTimeoutError()), RENDER_TIMEOUT_MS);
  });

  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

/** Runs `fn` on a fresh page of the shared browser, queued behind the render cap
 *  and abandoned at the deadline. Chrome launches once per process and is never
 *  relaunched per request. */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  await acquireSlot();
  let page: Page | null = null;
  try {
    page = await openPage();
    return await withDeadline(fn(page));
  } finally {
    // Closing the page is what actually stops a timed-out render: the work it is
    // blocked on rejects once its page is gone.
    await page?.close().catch(() => {});
    releaseSlot();
  }
}
