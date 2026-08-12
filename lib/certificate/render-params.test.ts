import { describe, expect, it } from "vitest";

import {
  fromRenderParams,
  toRenderParams,
} from "@/lib/certificate/render-params";
import type { CertificateInput } from "@/types/certificate";

const INPUT: CertificateInput = {
  recipientName: "Ada Lovelace",
  courseTitle: "Analytical Engines 101",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};

function roundTrip(input: CertificateInput, colors?: Record<string, string>) {
  const params = toRenderParams(input, colors);
  return fromRenderParams(Object.fromEntries(params));
}

describe("render params round trip", () => {
  it("carries the certificate fields", () => {
    expect(roundTrip(INPUT).input).toEqual(INPUT);
  });

  it("carries valid brand colours", () => {
    const colors = {
      "--color-cert-paper": "#fdf3d7",
      "--color-cert-ink": "#123",
    };

    expect(roundTrip(INPUT, colors).colors).toEqual(colors);
  });

  it("omits the param entirely when there are no overrides", () => {
    expect(toRenderParams(INPUT).has("colors")).toBe(false);
    expect(toRenderParams(INPUT, {}).has("colors")).toBe(false);
    expect(roundTrip(INPUT).colors).toEqual({});
  });
});

describe("fromRenderParams", () => {
  const base = {
    recipientName: "Ada Lovelace",
    courseTitle: "Analytical Engines 101",
    date: "07/13/2026",
    instructor: "Brad Traversy",
    templateId: "black-border",
  };

  it("drops a hostile colour value rather than painting it", () => {
    const colors = JSON.stringify({
      "--color-cert-ink": "red;background:url(x)",
      "--color-cert-paper": "#ffffff",
    });

    expect(fromRenderParams({ ...base, colors }).colors).toEqual({
      "--color-cert-paper": "#ffffff",
    });
  });

  it("ignores a colour variable that is not overridable", () => {
    const colors = JSON.stringify({ "--font-cert-display": "Comic Sans" });

    expect(fromRenderParams({ ...base, colors }).colors).toEqual({});
  });

  it("survives a colours param that is not JSON", () => {
    expect(fromRenderParams({ ...base, colors: "notjson" }).colors).toEqual({});
    expect(fromRenderParams({ ...base, colors: "[]" }).colors).toEqual({});
  });

  it("falls back to the default template for an unknown id", () => {
    expect(fromRenderParams({ ...base, templateId: "nope" }).input.templateId).toBe(
      "black-border",
    );
  });

  it("treats missing fields as empty strings", () => {
    expect(fromRenderParams({}).input).toEqual({
      recipientName: "",
      courseTitle: "",
      date: "",
      instructor: "",
      templateId: "black-border",
    });
  });
});
