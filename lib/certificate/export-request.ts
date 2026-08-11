import type { CertificateInput } from "@/types/certificate";

/** Generous cap: long enough for real course titles, short enough that a pasted
 *  document cannot blow up the render. */
const MAX_FIELD_LENGTH = 200;

const REQUIRED_FIELDS = [
  "recipientName",
  "courseTitle",
  "date",
  "instructor",
  "templateId",
] as const;

const FIELD_LABELS: Record<(typeof REQUIRED_FIELDS)[number], string> = {
  recipientName: "Recipient name",
  courseTitle: "Course or achievement",
  date: "Date",
  instructor: "Instructor",
  templateId: "Template",
};

export type ParseResult =
  | { ok: true; input: CertificateInput }
  | { ok: false; error: string };

/** Boundary validation for the export routes. Feature 8 swaps this for Zod. */
export function parseCertificateInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "Expected a certificate object." };
  }

  const record = value as Record<string, unknown>;
  const input = {} as CertificateInput;

  for (const field of REQUIRED_FIELDS) {
    const raw = record[field];
    if (typeof raw !== "string") {
      return { ok: false, error: `${FIELD_LABELS[field]} is required.` };
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return { ok: false, error: `${FIELD_LABELS[field]} cannot be empty.` };
    }
    if (trimmed.length > MAX_FIELD_LENGTH) {
      return {
        ok: false,
        error: `${FIELD_LABELS[field]} must be ${MAX_FIELD_LENGTH} characters or fewer.`,
      };
    }
    input[field] = trimmed;
  }

  return { ok: true, input };
}

/** Slug of the recipient name, falling back when it has no ASCII word characters
 *  (a fully non-latin name would otherwise slug to an empty string). */
export function certificateFileName(
  input: CertificateInput,
  extension: string,
): string {
  const slug = input.recipientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `certificate-${slug || "recipient"}.${extension}`;
}
