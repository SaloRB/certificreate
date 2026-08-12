import { parseBrandColors } from "@/lib/brand/colors";
import { isLogoDataUrl } from "@/lib/brand/logo";
import { isTemplateId } from "@/lib/templates/resolve";
import type { ExportBrand } from "@/types/brand";
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
  | { ok: true; input: CertificateInput; brand: ExportBrand }
  | { ok: false; error: string };

/** Boundary validation for the export routes. Feature 8 swaps this for Zod.
 *
 *  Brand values are optional and never fatal: a stale or unusable colour or logo
 *  falls back to the template rather than failing an export the user asked for. */
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

  // Unlike the render page, an export cannot fall back to the default template:
  // the caller asked for a specific design and would get a different one back.
  if (!isTemplateId(input.templateId)) {
    return { ok: false, error: "Template is not recognised." };
  }

  return {
    ok: true,
    input,
    brand: {
      colors: parseBrandColors(record.colors),
      logoDataUrl: isLogoDataUrl(record.logoDataUrl) ? record.logoDataUrl : null,
    },
  };
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
