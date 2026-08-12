import { describe, expect, it } from "vitest";

import { TEMPLATES } from "@/lib/templates/definitions";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  isTemplateId,
  resolveTemplateId,
} from "@/lib/templates/resolve";

describe("isTemplateId", () => {
  it("accepts every id in the registry", () => {
    for (const template of TEMPLATES) {
      expect(isTemplateId(template.id)).toBe(true);
    }
  });

  it("rejects an unknown id", () => {
    expect(isTemplateId("nope")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isTemplateId("")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isTemplateId(undefined)).toBe(false);
    expect(isTemplateId(null)).toBe(false);
    expect(isTemplateId(1)).toBe(false);
    expect(isTemplateId({ id: "black-border" })).toBe(false);
  });
});

describe("resolveTemplateId", () => {
  it("keeps a known id", () => {
    expect(resolveTemplateId("black-border")).toBe("black-border");
  });

  it("falls back to the default for anything unknown", () => {
    expect(resolveTemplateId("nope")).toBe(DEFAULT_TEMPLATE_ID);
    expect(resolveTemplateId("")).toBe(DEFAULT_TEMPLATE_ID);
    expect(resolveTemplateId(undefined)).toBe(DEFAULT_TEMPLATE_ID);
  });
});

describe("getTemplate", () => {
  it("returns the definition for an id", () => {
    expect(getTemplate("black-border")).toMatchObject({
      id: "black-border",
      name: "Black Border",
    });
  });

  it("gives every template a theme with paper, ink, and both fonts", () => {
    for (const template of TEMPLATES) {
      const vars = getTemplate(template.id).themeVars;

      expect(vars["--color-cert-paper"]).toBeTruthy();
      expect(vars["--color-cert-ink"]).toBeTruthy();
      expect(vars["--font-cert-display"]).toBeTruthy();
      expect(vars["--font-cert-body"]).toBeTruthy();
    }
  });

  it("has a registry entry for the default id", () => {
    expect(isTemplateId(DEFAULT_TEMPLATE_ID)).toBe(true);
  });
});
