import { describe, expect, it } from "vitest";

import {
  certificateFileName,
  parseCertificateInput,
} from "@/lib/certificate/export-request";
import { TEMPLATES } from "@/lib/templates/definitions";
import type { CertificateInput } from "@/types/certificate";

const VALID: CertificateInput = {
  recipientName: "Ada Lovelace",
  courseTitle: "Analytical Engines 101",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};

describe("parseCertificateInput", () => {
  it("accepts a complete input and trims it", () => {
    const result = parseCertificateInput({ ...VALID, recipientName: "  Ada  " });

    expect(result).toEqual({
      ok: true,
      input: { ...VALID, recipientName: "Ada" },
      brand: { colors: {}, logoDataUrl: null },
    });
  });

  it("keeps valid brand colours from the body", () => {
    const result = parseCertificateInput({
      ...VALID,
      colors: { "--color-cert-paper": "#fdf3d7" },
    });

    expect(result).toEqual({
      ok: true,
      input: VALID,
      brand: {
        colors: { "--color-cert-paper": "#fdf3d7" },
        logoDataUrl: null,
      },
    });
  });

  it("drops unusable colours instead of failing the export", () => {
    for (const colors of [
      { "--color-cert-paper": "rgb(0,0,0)" },
      { "--font-cert-display": "Comic Sans" },
      "not an object",
      undefined,
    ]) {
      expect(parseCertificateInput({ ...VALID, colors })).toEqual({
        ok: true,
        input: VALID,
        brand: { colors: {}, logoDataUrl: null },
      });
    }
  });

  it("keeps a usable brand logo from the body", () => {
    const logoDataUrl = "data:image/png;base64,AAA=";

    expect(parseCertificateInput({ ...VALID, logoDataUrl })).toEqual({
      ok: true,
      input: VALID,
      brand: { colors: {}, logoDataUrl },
    });
  });

  it("drops an unusable logo instead of failing the export", () => {
    for (const logoDataUrl of [
      "https://example.com/logo.png",
      "data:image/gif;base64,AAA=",
      "data:text/html;base64,AAA=",
      42,
      null,
      undefined,
    ]) {
      expect(parseCertificateInput({ ...VALID, logoDataUrl })).toEqual({
        ok: true,
        input: VALID,
        brand: { colors: {}, logoDataUrl: null },
      });
    }
  });

  it("rejects a whitespace-only field", () => {
    const result = parseCertificateInput({ ...VALID, recipientName: "   " });

    expect(result).toEqual({
      ok: false,
      error: "Recipient name cannot be empty.",
    });
  });

  it("rejects a missing field", () => {
    const withoutCourse: Partial<CertificateInput> = { ...VALID };
    delete withoutCourse.courseTitle;

    expect(parseCertificateInput(withoutCourse)).toEqual({
      ok: false,
      error: "Course or achievement is required.",
    });
  });

  it("rejects a non-object body", () => {
    expect(parseCertificateInput(null).ok).toBe(false);
    expect(parseCertificateInput("Ada").ok).toBe(false);
  });

  it("accepts every template in the registry", () => {
    for (const template of TEMPLATES) {
      const result = parseCertificateInput({
        ...VALID,
        templateId: template.id,
      });

      expect(result).toEqual({
        ok: true,
        input: { ...VALID, templateId: template.id },
        brand: { colors: {}, logoDataUrl: null },
      });
    }
  });

  it("rejects an unknown template id", () => {
    const result = parseCertificateInput({ ...VALID, templateId: "nope" });

    expect(result).toEqual({
      ok: false,
      error: "Template is not recognised.",
    });
  });

  it("rejects an over-long field", () => {
    const result = parseCertificateInput({
      ...VALID,
      courseTitle: "x".repeat(201),
    });

    expect(result).toEqual({
      ok: false,
      error: "Course or achievement must be 200 characters or fewer.",
    });
  });
});

describe("certificateFileName", () => {
  it("slugs the recipient name", () => {
    expect(certificateFileName(VALID, "png")).toBe(
      "certificate-ada-lovelace.png",
    );
  });

  it("collapses punctuation without leaving stray hyphens", () => {
    const input = { ...VALID, recipientName: "J. R. R. Tolkien-Smith!" };

    expect(certificateFileName(input, "pdf")).toBe(
      "certificate-j-r-r-tolkien-smith.pdf",
    );
  });

  it("falls back when the name has no latin characters", () => {
    expect(certificateFileName({ ...VALID, recipientName: "杉本" }, "png")).toBe(
      "certificate-recipient.png",
    );
  });
});
