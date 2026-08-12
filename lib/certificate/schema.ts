import { z } from "zod";

import { isCertificateDate } from "@/lib/certificate/date";
import { isTemplateId } from "@/lib/templates/resolve";
import type { CertificateInput } from "@/types/certificate";

/** Generous cap: long enough for real course titles, short enough that a pasted
 *  document cannot blow up the render. */
export const MAX_FIELD_LENGTH = 200;

/** Also the order errors are reported in, so a form with several empty fields
 *  always names the topmost one first. */
export const CERTIFICATE_FIELDS = [
  "recipientName",
  "courseTitle",
  "date",
  "instructor",
  "templateId",
] as const;

export type CertificateField = (typeof CERTIFICATE_FIELDS)[number];

export const FIELD_LABELS: Record<CertificateField, string> = {
  recipientName: "Recipient name",
  courseTitle: "Course or achievement",
  date: "Date",
  instructor: "Instructor",
  templateId: "Template",
};

export const NON_OBJECT_ERROR = "Expected a certificate object.";

function textField(field: CertificateField) {
  const label = FIELD_LABELS[field];

  return z
    .string({ error: `${label} is required.` })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, `${label} cannot be empty.`)
    .refine(
      (value) => value.length <= MAX_FIELD_LENGTH,
      `${label} must be ${MAX_FIELD_LENGTH} characters or fewer.`,
    );
}

/** The single definition of a valid certificate, shared by the editor and the
 *  export routes so the form can never allow what the boundary rejects.
 *
 *  Unknown keys are stripped rather than rejected: the export body carries brand
 *  colours and a logo alongside the input, and those are parsed separately by the
 *  deliberately tolerant parsers in `lib/brand/`. */
export const certificateInputSchema = z.object({
  recipientName: textField("recipientName"),
  courseTitle: textField("courseTitle"),
  // The picker only ever emits this format; free text typed before feature 8, or
  // pasted in by hand, is rejected here rather than printed onto a certificate.
  date: textField("date").refine(
    isCertificateDate,
    "Date must be a real date, as MM/DD/YYYY.",
  ),
  instructor: textField("instructor"),
  // Unlike the render page, nothing here can fall back to the default template:
  // the caller asked for a specific design and would get a different one back.
  templateId: textField("templateId").refine(
    isTemplateId,
    "Template is not recognised.",
  ),
});

export type ValidCertificateInput = z.output<typeof certificateInputSchema>;

/** One message per field, first issue wins, for inline display in the form. */
export function fieldErrors(
  error: z.ZodError,
): Partial<Record<CertificateField, string>> {
  const errors: Partial<Record<CertificateField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0] as CertificateField | undefined;
    if (field && field in FIELD_LABELS && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

/** The single message to show when only one fits (an export rejection, or the
 *  reason the download buttons are disabled), in field order. */
export function firstError(error: z.ZodError): string {
  const errors = fieldErrors(error);
  const field = CERTIFICATE_FIELDS.find((name) => errors[name]);

  return field ? errors[field]! : NON_OBJECT_ERROR;
}

export function validateCertificateInput(value: unknown) {
  return certificateInputSchema.safeParse(value) as
    | { success: true; data: CertificateInput }
    | { success: false; error: z.ZodError };
}
