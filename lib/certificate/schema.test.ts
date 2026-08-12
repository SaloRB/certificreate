import { describe, expect, it } from "vitest";

import {
  certificateInputSchema,
  fieldErrors,
  firstError,
  MAX_FIELD_LENGTH,
  NON_OBJECT_ERROR,
  validateCertificateInput,
} from "@/lib/certificate/schema";
import { TEMPLATES } from "@/lib/templates/definitions";

const VALID = {
  recipientName: "Ada Lovelace",
  courseTitle: "Analytical Engines 101",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};

function errors(value: unknown) {
  const result = validateCertificateInput(value);
  if (result.success) throw new Error("expected the input to be rejected");

  return fieldErrors(result.error);
}

describe("certificateInputSchema", () => {
  it("accepts a complete input and trims every field", () => {
    const result = validateCertificateInput({
      ...VALID,
      recipientName: "  Ada Lovelace  ",
      courseTitle: "\tAnalytical Engines 101\n",
    });

    expect(result).toEqual({ success: true, data: VALID });
  });

  it("strips the brand keys the export body carries alongside the input", () => {
    const result = validateCertificateInput({
      ...VALID,
      colors: { "--color-cert-paper": "#fdf3d7" },
      logoDataUrl: "data:image/png;base64,AAA=",
    });

    expect(result).toEqual({ success: true, data: VALID });
  });

  it("accepts every template in the registry", () => {
    for (const template of TEMPLATES) {
      expect(
        validateCertificateInput({ ...VALID, templateId: template.id }).success,
      ).toBe(true);
    }
  });

  it("rejects an empty or whitespace-only field", () => {
    expect(errors({ ...VALID, recipientName: "" })).toEqual({
      recipientName: "Recipient name cannot be empty.",
    });
    expect(errors({ ...VALID, instructor: "   " })).toEqual({
      instructor: "Instructor cannot be empty.",
    });
  });

  it("rejects a missing or non-string field", () => {
    const withoutCourse: Record<string, unknown> = { ...VALID };
    delete withoutCourse.courseTitle;

    expect(errors(withoutCourse)).toEqual({
      courseTitle: "Course or achievement is required.",
    });
    expect(errors({ ...VALID, date: 20260713 })).toEqual({
      date: "Date is required.",
    });
  });

  it("rejects an over-long field but allows one at the cap", () => {
    expect(
      validateCertificateInput({
        ...VALID,
        courseTitle: "x".repeat(MAX_FIELD_LENGTH),
      }).success,
    ).toBe(true);

    expect(errors({ ...VALID, courseTitle: "x".repeat(201) })).toEqual({
      courseTitle: `Course or achievement must be ${MAX_FIELD_LENGTH} characters or fewer.`,
    });
  });

  it("measures length after trimming", () => {
    expect(
      validateCertificateInput({
        ...VALID,
        courseTitle: `  ${"x".repeat(MAX_FIELD_LENGTH)}  `,
      }).success,
    ).toBe(true);
  });

  it("rejects a date it cannot print", () => {
    for (const date of ["July 13, 2026", "2026-02-30", "sometime"]) {
      expect(errors({ ...VALID, date })).toEqual({
        date: "Date must be a real date, as MM/DD/YYYY.",
      });
    }
  });

  it("rejects an unknown template id", () => {
    expect(errors({ ...VALID, templateId: "nope" })).toEqual({
      templateId: "Template is not recognised.",
    });
  });

  it("reports every bad field at once", () => {
    expect(errors({ ...VALID, recipientName: "", date: "" })).toEqual({
      recipientName: "Recipient name cannot be empty.",
      date: "Date cannot be empty.",
    });
  });

  it("rejects a non-object", () => {
    for (const value of [null, "Ada", 42, undefined]) {
      expect(certificateInputSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("firstError", () => {
  it("picks the message of the topmost failing field", () => {
    const result = validateCertificateInput({
      ...VALID,
      courseTitle: "",
      instructor: "",
    });
    if (result.success) throw new Error("expected the input to be rejected");

    expect(firstError(result.error)).toBe(
      "Course or achievement cannot be empty.",
    );
  });

  it("falls back when nothing maps to a known field", () => {
    const result = certificateInputSchema.safeParse(null);
    if (result.success) throw new Error("expected the input to be rejected");

    expect(firstError(result.error)).toBe(NON_OBJECT_ERROR);
  });
});
