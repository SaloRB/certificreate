import puppeteer, { type Browser, type Page } from "puppeteer";

// Containers ship a tiny /dev/shm; without the last flag Chrome dies mid-render
// with "Target closed". Settled in the build plan's deployment notes.
const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

const MAX_CONCURRENT_RENDERS = 2;

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ args: LAUNCH_ARGS }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}

let activeRenders = 0;
const waiting: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders += 1;
    return Promise.resolve();
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

/** Runs `fn` on a fresh page of the shared browser, queued behind the render cap.
 *  Chrome launches once per process and is never relaunched per request. */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  await acquireSlot();
  let page: Page | null = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    return await fn(page);
  } finally {
    await page?.close().catch(() => {});
    releaseSlot();
  }
}
