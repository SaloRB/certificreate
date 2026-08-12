import { describe, expect, it } from "vitest";

import {
  DEFAULT_BRAND_SETTINGS,
  deserializeBrandSettings,
  parseBrandSettings,
  resolveInstructor,
  serializeBrandSettings,
} from "@/lib/brand/storage";

describe("parseBrandSettings", () => {
  it("keeps a complete record", () => {
    expect(
      parseBrandSettings({
        logoDataUrl: "data:image/png;base64,AAA",
        instructor: "Ada Lovelace",
        colors: { "--color-cert-ink": "#101010" },
      }),
    ).toEqual({
      logoDataUrl: "data:image/png;base64,AAA",
      instructor: "Ada Lovelace",
      colors: { "--color-cert-ink": "#101010" },
    });
  });

  it("fills in the fields a partial record is missing", () => {
    expect(parseBrandSettings({ instructor: "Ada Lovelace" })).toEqual({
      logoDataUrl: null,
      instructor: "Ada Lovelace",
      colors: {},
    });
  });

  it("falls back for a wrong-typed instructor but keeps valid colours", () => {
    expect(
      parseBrandSettings({
        instructor: 42,
        colors: { "--color-cert-paper": "#fff" },
      }),
    ).toEqual({
      logoDataUrl: null,
      instructor: DEFAULT_BRAND_SETTINGS.instructor,
      colors: { "--color-cert-paper": "#fff" },
    });
  });

  it("drops unusable colours without dropping the record", () => {
    expect(
      parseBrandSettings({
        instructor: "Ada Lovelace",
        colors: { "--color-cert-ink": "chartreuse" },
      }).colors,
    ).toEqual({});
  });

  it("trims a stored instructor", () => {
    expect(parseBrandSettings({ instructor: "  Ada  " }).instructor).toBe("Ada");
  });

  it("returns defaults for a non-object", () => {
    expect(parseBrandSettings(null)).toEqual(DEFAULT_BRAND_SETTINGS);
    expect(parseBrandSettings("Ada")).toEqual(DEFAULT_BRAND_SETTINGS);
    expect(parseBrandSettings(undefined)).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("ignores a logo that is not a string, ahead of 6b", () => {
    expect(parseBrandSettings({ logoDataUrl: 7 }).logoDataUrl).toBeNull();
  });
});

describe("deserializeBrandSettings", () => {
  it("returns defaults when nothing is stored", () => {
    expect(deserializeBrandSettings(null)).toEqual(DEFAULT_BRAND_SETTINGS);
    expect(deserializeBrandSettings("")).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("returns defaults for malformed JSON", () => {
    expect(deserializeBrandSettings("not json")).toEqual(
      DEFAULT_BRAND_SETTINGS,
    );
  });

  it("round-trips a written record", () => {
    const settings = {
      logoDataUrl: null,
      instructor: "Ada Lovelace",
      colors: { "--color-cert-border": "#0af" },
    };

    expect(deserializeBrandSettings(serializeBrandSettings(settings))).toEqual(
      settings,
    );
  });
});

describe("resolveInstructor", () => {
  it("uses the stored instructor", () => {
    expect(
      resolveInstructor({ ...DEFAULT_BRAND_SETTINGS, instructor: "Ada" }),
    ).toBe("Ada");
  });

  it("falls back when the instructor was cleared", () => {
    expect(
      resolveInstructor({ ...DEFAULT_BRAND_SETTINGS, instructor: "   " }),
    ).toBe(DEFAULT_BRAND_SETTINGS.instructor);
  });
});
