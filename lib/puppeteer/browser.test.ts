import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const launch = vi.hoisted(() => vi.fn());

vi.mock("puppeteer", () => ({ default: { launch } }));

type Disconnect = () => void;

function fakeBrowser() {
  const listeners: Disconnect[] = [];
  const browser = {
    connected: true,
    newPage: vi.fn(async () => ({ close: vi.fn(async () => {}) })),
    once: vi.fn((event: string, listener: Disconnect) => {
      if (event === "disconnected") listeners.push(listener);
      return browser;
    }),
    crash() {
      browser.connected = false;
      for (const listener of listeners) listener();
    },
  };

  return browser;
}

/** The module caches Chrome in module scope, so every test needs a fresh copy.
 *  The error classes come from the same reset registry, or `instanceof` compares
 *  against a different copy of the class than the one the module threw. */
async function loadBrowserModule() {
  vi.resetModules();
  const [browser, errors] = await Promise.all([
    import("./browser"),
    import("./errors"),
  ]);

  return { ...browser, ...errors };
}

describe("withPage", () => {
  beforeEach(() => {
    launch.mockReset();
  });

  it("launches Chrome once and reuses it across renders", async () => {
    const browser = fakeBrowser();
    launch.mockResolvedValue(browser);
    const { withPage } = await loadBrowserModule();

    await withPage(async () => "first");
    await withPage(async () => "second");

    expect(launch).toHaveBeenCalledTimes(1);
    expect(browser.newPage).toHaveBeenCalledTimes(2);
  });

  it("closes the page even when the render throws", async () => {
    const browser = fakeBrowser();
    const page = { close: vi.fn(async () => {}) };
    browser.newPage.mockResolvedValue(page);
    launch.mockResolvedValue(browser);
    const { withPage } = await loadBrowserModule();

    await expect(
      withPage(async () => {
        throw new Error("capture failed");
      }),
    ).rejects.toThrow("capture failed");
    expect(page.close).toHaveBeenCalledTimes(1);
  });

  it("relaunches after Chrome disconnects instead of reusing a dead handle", async () => {
    const crashed = fakeBrowser();
    const replacement = fakeBrowser();
    launch.mockResolvedValueOnce(crashed).mockResolvedValueOnce(replacement);
    const { withPage } = await loadBrowserModule();

    await withPage(async () => "before");
    crashed.crash();
    await withPage(async () => "after");

    expect(launch).toHaveBeenCalledTimes(2);
    expect(replacement.newPage).toHaveBeenCalledTimes(1);
  });

  it("relaunches when the cached browser is gone but the event has not fired", async () => {
    const crashed = fakeBrowser();
    const replacement = fakeBrowser();
    launch.mockResolvedValueOnce(crashed).mockResolvedValueOnce(replacement);
    const { withPage } = await loadBrowserModule();

    await withPage(async () => "before");
    crashed.connected = false;

    await expect(withPage(async () => "during")).rejects.toThrow(
      "Shared Chrome instance is gone",
    );
    await expect(withPage(async () => "after")).resolves.toBe("after");
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed launch", async () => {
    launch
      .mockRejectedValueOnce(new Error("Could not find Chrome"))
      .mockResolvedValueOnce(fakeBrowser());
    const { withPage } = await loadBrowserModule();

    await expect(withPage(async () => "first")).rejects.toThrow(
      "Could not find Chrome",
    );
    await expect(withPage(async () => "second")).resolves.toBe("second");
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it("frees the render slot when opening a page fails", async () => {
    const broken = fakeBrowser();
    broken.newPage.mockRejectedValue(new Error("Target closed"));
    const working = fakeBrowser();
    launch
      .mockResolvedValueOnce(broken)
      .mockResolvedValueOnce(broken)
      .mockResolvedValueOnce(broken)
      .mockResolvedValue(working);
    const { withPage } = await loadBrowserModule();

    // Enough failures to exhaust the render cap if a slot ever leaked.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(withPage(async () => "never")).rejects.toThrow(
        "Target closed",
      );
    }

    await expect(withPage(async () => "recovered")).resolves.toBe("recovered");
  });
});

describe("renderPoolStats", () => {
  beforeEach(() => {
    launch.mockReset();
  });

  it("reports an idle pool without starting Chrome", async () => {
    launch.mockResolvedValue(fakeBrowser());
    const { renderPoolStats } = await loadBrowserModule();

    expect(renderPoolStats()).toEqual({
      browser: "not-started",
      activeRenders: 0,
      queuedRenders: 0,
      maxConcurrentRenders: 2,
      maxQueuedRenders: 4,
    });
    expect(launch).not.toHaveBeenCalled();
  });

  it("reports the browser as up once a render has launched it", async () => {
    launch.mockResolvedValue(fakeBrowser());
    const { withPage, renderPoolStats } = await loadBrowserModule();

    await withPage(async () => "done");

    expect(renderPoolStats().browser).toBe("up");
  });

  it("reports the browser as not-started again after it disconnects", async () => {
    const browser = fakeBrowser();
    launch.mockResolvedValue(browser);
    const { withPage, renderPoolStats } = await loadBrowserModule();

    await withPage(async () => "done");
    browser.crash();

    expect(renderPoolStats().browser).toBe("not-started");
  });

  it("does not report a failed launch as up", async () => {
    launch.mockRejectedValue(new Error("Could not find Chrome"));
    const { withPage, renderPoolStats } = await loadBrowserModule();

    await expect(withPage(async () => "never")).rejects.toThrow();

    expect(renderPoolStats().browser).toBe("not-started");
  });
});

/** Mirrors the module's caps. Kept literal so a change to either constant has to
 *  be a deliberate edit here too. */
const MAX_CONCURRENT_RENDERS = 2;
const MAX_QUEUED_RENDERS = 4;
const RENDER_TIMEOUT_MS = 45_000;

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { promise, release };
}

describe("render queue", () => {
  beforeEach(() => {
    launch.mockReset();
    launch.mockResolvedValue(fakeBrowser());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hands slots to waiting renders in the order they arrived", async () => {
    const { withPage } = await loadBrowserModule();
    const started: string[] = [];
    const running = Array.from({ length: MAX_CONCURRENT_RENDERS }, deferred);

    const holders = running.map((gate) => withPage(async () => gate.promise));
    const queued = ["first", "second"].map((name) =>
      withPage(async () => {
        started.push(name);
      }),
    );

    await Promise.resolve();
    expect(started).toEqual([]);

    running[0].release();
    await holders[0];
    await queued[0];
    expect(started).toEqual(["first"]);

    running[1].release();
    await Promise.all([...holders, ...queued]);
    expect(started).toEqual(["first", "second"]);
  });

  it("rejects a render once the queue is full instead of queueing it", async () => {
    const { withPage, RenderOverloadError } = await loadBrowserModule();
    const running = Array.from({ length: MAX_CONCURRENT_RENDERS }, deferred);

    const holders = running.map((gate) => withPage(async () => gate.promise));
    const queued = Array.from({ length: MAX_QUEUED_RENDERS }, () =>
      withPage(async () => "queued"),
    );

    const rejected = withPage(async () => "over the cap");
    await expect(rejected).rejects.toBeInstanceOf(RenderOverloadError);
    await expect(rejected).rejects.toMatchObject({
      retryAfterSeconds: expect.any(Number),
    });

    for (const gate of running) gate.release();
    await Promise.all([...holders, ...queued]);
  });

  it("accepts renders again once the queue drains", async () => {
    const { withPage, RenderOverloadError } = await loadBrowserModule();
    const running = Array.from({ length: MAX_CONCURRENT_RENDERS }, deferred);
    const holders = running.map((gate) => withPage(async () => gate.promise));
    const queued = Array.from({ length: MAX_QUEUED_RENDERS }, () =>
      withPage(async () => "queued"),
    );

    await expect(withPage(async () => "rejected")).rejects.toBeInstanceOf(
      RenderOverloadError,
    );
    for (const gate of running) gate.release();
    await Promise.all([...holders, ...queued]);

    await expect(withPage(async () => "accepted")).resolves.toBe("accepted");
  });

  it("abandons a render that runs past the deadline and frees its slot", async () => {
    vi.useFakeTimers();
    const browser = fakeBrowser();
    const page = { close: vi.fn(async () => {}) };
    browser.newPage.mockResolvedValue(page);
    launch.mockResolvedValue(browser);
    const { withPage, RenderTimeoutError } = await loadBrowserModule();

    const settled = withPage(() => new Promise<string>(() => {})).catch(
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS);

    expect(await settled).toBeInstanceOf(RenderTimeoutError);
    expect(page.close).toHaveBeenCalledTimes(1);
    await expect(withPage(async () => "next")).resolves.toBe("next");
  });

  it("reports queue depth while renders are waiting", async () => {
    const { withPage, renderPoolStats } = await loadBrowserModule();
    const running = Array.from({ length: MAX_CONCURRENT_RENDERS }, deferred);
    const holders = running.map((gate) => withPage(async () => gate.promise));
    const queued = Array.from({ length: 2 }, () =>
      withPage(async () => "queued"),
    );

    await Promise.resolve();
    expect(renderPoolStats()).toMatchObject({
      activeRenders: MAX_CONCURRENT_RENDERS,
      queuedRenders: 2,
    });

    for (const gate of running) gate.release();
    await Promise.all([...holders, ...queued]);

    expect(renderPoolStats()).toMatchObject({
      activeRenders: 0,
      queuedRenders: 0,
    });
  });

  it("leaves the deadline timer behind on a normal render", async () => {
    vi.useFakeTimers();
    const { withPage } = await loadBrowserModule();

    await expect(withPage(async () => "quick")).resolves.toBe("quick");

    expect(vi.getTimerCount()).toBe(0);
  });
});
