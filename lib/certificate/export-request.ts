import { parseBrandColors } from "@/lib/brand/colors";
import { isLogoDataUrl } from "@/lib/brand/logo";
import {
  firstError,
  NON_OBJECT_ERROR,
  validateCertificateInput,
} from "@/lib/certificate/schema";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

export type ParseResult =
  | { ok: true; input: CertificateInput; brand: ExportBrand }
  | { ok: false; error: string };

/** Boundary validation for the export routes, on the same schema the editor
 *  validates with, so the form can never allow what this rejects.
 *
 *  Brand values are optional and never fatal: a stale or unusable colour or logo
 *  falls back to the template rather than failing an export the user asked for. */
export function parseCertificateInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: NON_OBJECT_ERROR };
  }

  const result = validateCertificateInput(value);
  if (!result.success) {
    return { ok: false, error: firstError(result.error) };
  }

  const record = value as Record<string, unknown>;

  return {
    ok: true,
    input: result.data,
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
