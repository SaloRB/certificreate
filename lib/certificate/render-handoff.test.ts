import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dropRenderLogo,
  putRenderLogo,
  takeRenderLogo,
} from "@/lib/certificate/render-handoff";

const LOGO = "data:image/png;base64,AAA=";

afterEach(() => {
  vi.useRealTimers();
});

describe("render handoff", () => {
  it("round-trips a logo through its token", () => {
    const token = putRenderLogo(LOGO);

    expect(takeRenderLogo(token)).toBe(LOGO);
  });

  it("gives each logo its own token", () => {
    expect(putRenderLogo(LOGO)).not.toBe(putRenderLogo(LOGO));
  });

  it("hands a logo out once", () => {
    const token = putRenderLogo(LOGO);
    takeRenderLogo(token);

    expect(takeRenderLogo(token)).toBeNull();
  });

  it("returns null for a token it never issued", () => {
    expect(takeRenderLogo("not-a-token")).toBeNull();
  });

  it("refuses an expired token", () => {
    vi.useFakeTimers();
    const token = putRenderLogo(LOGO);

    vi.advanceTimersByTime(60_001);

    expect(takeRenderLogo(token)).toBeNull();
  });

  it("keeps a token that is still inside its window", () => {
    vi.useFakeTimers();
    const token = putRenderLogo(LOGO);

    vi.advanceTimersByTime(59_000);

    expect(takeRenderLogo(token)).toBe(LOGO);
  });

  it("drops a logo whose capture never read it", () => {
    const token = putRenderLogo(LOGO);
    dropRenderLogo(token);

    expect(takeRenderLogo(token)).toBeNull();
  });

  /** Next compiles the export route and the render page separately, so each holds
   *  its own instance of this module. A store that lives in a module-level
   *  binding silently loses every logo across that boundary. */
  it("shares one store across separate instances of the module", async () => {
    const token = putRenderLogo(LOGO);

    vi.resetModules();
    const reimported = await import("@/lib/certificate/render-handoff");

    expect(reimported.takeRenderLogo(token)).toBe(LOGO);
  });

  it("sweeps expired entries when a new logo is stored", () => {
    vi.useFakeTimers();
    const stale = putRenderLogo(LOGO);

    vi.advanceTimersByTime(60_001);
    putRenderLogo(LOGO);
    // Back inside the stale token's window: only the sweep can have removed it.
    vi.setSystemTime(Date.now() - 30_000);

    expect(takeRenderLogo(stale)).toBeNull();
  });
});
