import { describe, expect, it } from "vitest";

import {
  isLogoDataUrl,
  MAX_LOGO_BYTES,
  validateLogoFile,
} from "@/lib/brand/logo";

describe("validateLogoFile", () => {
  it("accepts each allowed type within the size cap", () => {
    for (const type of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ]) {
      expect(validateLogoFile({ type, size: 1024 })).toEqual({ ok: true });
    }
  });

  it("rejects a type that is not an allowed image", () => {
    const result = validateLogoFile({ type: "text/plain", size: 10 });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/PNG/);
  });

  it("rejects a file over the size cap", () => {
    const result = validateLogoFile({
      type: "image/png",
      size: MAX_LOGO_BYTES + 1,
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/512KB/);
  });

  it("accepts a file exactly at the cap", () => {
    expect(
      validateLogoFile({ type: "image/png", size: MAX_LOGO_BYTES }),
    ).toEqual({ ok: true });
  });
});

describe("isLogoDataUrl", () => {
  it("accepts a base64 data URL of an allowed type", () => {
    expect(isLogoDataUrl("data:image/png;base64,AAA=")).toBe(true);
    expect(isLogoDataUrl("data:image/svg+xml;base64,PHN2Zy8+")).toBe(true);
  });

  it("rejects an image type that is not allowed", () => {
    expect(isLogoDataUrl("data:image/gif;base64,AAA=")).toBe(false);
  });

  it("rejects a non-base64 data URL", () => {
    expect(isLogoDataUrl("data:image/svg+xml,%3Csvg%2F%3E")).toBe(false);
  });

  it("rejects a remote or script URL", () => {
    expect(isLogoDataUrl("https://example.com/logo.png")).toBe(false);
    expect(isLogoDataUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects a truncated or empty payload", () => {
    expect(isLogoDataUrl("data:image/png;base64,")).toBe(false);
    expect(isLogoDataUrl("data:image/png")).toBe(false);
    expect(isLogoDataUrl("")).toBe(false);
  });

  it("rejects characters outside the base64 alphabet", () => {
    expect(isLogoDataUrl('data:image/png;base64,AA"><script>')).toBe(false);
  });

  it("rejects a payload past the length cap", () => {
    const oversize = `data:image/png;base64,${"A".repeat(MAX_LOGO_BYTES * 2)}`;

    expect(isLogoDataUrl(oversize)).toBe(false);
  });

  it("rejects values that are not strings", () => {
    expect(isLogoDataUrl(null)).toBe(false);
    expect(isLogoDataUrl(7)).toBe(false);
  });
});
