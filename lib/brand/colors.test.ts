import { describe, expect, it } from "vitest";

import {
  BRAND_COLOR_VARS,
  expandHexColor,
  isBrandColorValue,
  parseBrandColors,
  resolveThemeVars,
} from "@/lib/brand/colors";
import { getTemplate } from "@/lib/templates/resolve";

describe("isBrandColorValue", () => {
  it("accepts three and six digit hex", () => {
    expect(isBrandColorValue("#fff")).toBe(true);
    expect(isBrandColorValue("#A1B2C3")).toBe(true);
  });

  it("rejects anything that is not a bare hex colour", () => {
    expect(isBrandColorValue("red")).toBe(false);
    expect(isBrandColorValue("#ffff")).toBe(false);
    expect(isBrandColorValue("#gggggg")).toBe(false);
    expect(isBrandColorValue("rgb(0,0,0)")).toBe(false);
    expect(isBrandColorValue(" #ffffff")).toBe(false);
    expect(isBrandColorValue(123)).toBe(false);
    expect(isBrandColorValue(null)).toBe(false);
  });

  it("rejects a value carrying a second declaration", () => {
    expect(isBrandColorValue("#fff;background:url(x)")).toBe(false);
  });
});

describe("parseBrandColors", () => {
  it("keeps known variables with valid values", () => {
    expect(
      parseBrandColors({ "--color-cert-ink": "#123456" }),
    ).toEqual({ "--color-cert-ink": "#123456" });
  });

  it("drops unknown keys", () => {
    expect(
      parseBrandColors({
        "--color-cert-ink": "#123456",
        "--font-cert-display": "Comic Sans",
        "--color-cert-rule": "#000000",
      }),
    ).toEqual({ "--color-cert-ink": "#123456" });
  });

  it("drops invalid values on known keys", () => {
    expect(
      parseBrandColors({
        "--color-cert-ink": "red;background:url(x)",
        "--color-cert-paper": "#fff",
      }),
    ).toEqual({ "--color-cert-paper": "#fff" });
  });

  it("returns an empty record for non-objects and empties", () => {
    expect(parseBrandColors(undefined)).toEqual({});
    expect(parseBrandColors(null)).toEqual({});
    expect(parseBrandColors("#fff")).toEqual({});
    expect(parseBrandColors(["#fff"])).toEqual({});
    expect(parseBrandColors({})).toEqual({});
  });
});

describe("expandHexColor", () => {
  it("expands three digit hex", () => {
    expect(expandHexColor("#fff")).toBe("#ffffff");
    expect(expandHexColor("#1a2")).toBe("#11aa22");
  });

  it("leaves six digit hex alone", () => {
    expect(expandHexColor("#A1B2C3")).toBe("#A1B2C3");
  });

  it("falls back to black for anything unusable", () => {
    expect(expandHexColor("chartreuse")).toBe("#000000");
    expect(expandHexColor("")).toBe("#000000");
  });
});

describe("resolveThemeVars", () => {
  const template = getTemplate("black-border");

  it("returns the template theme untouched when there are no overrides", () => {
    expect(resolveThemeVars(template)).toEqual(template.themeVars);
    expect(resolveThemeVars(template, {})).toEqual(template.themeVars);
  });

  it("overrides only the variables it is given", () => {
    const vars = resolveThemeVars(template, { "--color-cert-paper": "#000" });

    expect(vars["--color-cert-paper"]).toBe("#000");
    expect(vars["--color-cert-ink"]).toBe(
      template.themeVars["--color-cert-ink"],
    );
    expect(vars["--font-cert-display"]).toBe(
      template.themeVars["--font-cert-display"],
    );
  });

  it("revalidates, so a hostile value never reaches the sheet", () => {
    const vars = resolveThemeVars(template, {
      "--color-cert-ink": "#fff)}html{display:none",
    });

    expect(vars["--color-cert-ink"]).toBe(
      template.themeVars["--color-cert-ink"],
    );
  });

  it("covers every overridable variable with a template value to fall back to", () => {
    for (const variable of BRAND_COLOR_VARS) {
      expect(template.themeVars[variable]).toBeTruthy();
    }
  });
});
