/** The rules an uploaded logo has to satisfy, shared by the upload control, the
 *  stored brand record, and the export boundary, so a value that passes one
 *  cannot fail another. */

export const LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

/** Local storage holds roughly 5MB of UTF-16, and the encoded logo shares it with
 *  the history feature, so the file cap is set well under the quota. */
export const MAX_LOGO_BYTES = 512 * 1024;
export const MAX_LOGO_SIZE_LABEL = "512KB";

/** Base64 costs a third on top, plus the `data:` prefix and padding. */
const MAX_LOGO_DATA_URL_LENGTH = Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 64;

const LOGO_DATA_URL =
  /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export type LogoFileCheck = { ok: true } | { ok: false; error: string };

export function validateLogoFile({
  type,
  size,
}: {
  type: string;
  size: number;
}): LogoFileCheck {
  if (!LOGO_MIME_TYPES.includes(type as (typeof LOGO_MIME_TYPES)[number])) {
    return { ok: false, error: "Choose a PNG, JPEG, WebP, or SVG file." };
  }

  if (size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      error: `That file is too large. Logos must be ${MAX_LOGO_SIZE_LABEL} or smaller.`,
    };
  }

  return { ok: true };
}

/** The gate for a logo arriving from local storage or an export request. The
 *  narrow grammar is the security boundary: this string becomes an `<img src>`,
 *  so only base64 payloads of the allowed image types get through. */
export function isLogoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_LOGO_DATA_URL_LENGTH &&
    LOGO_DATA_URL.test(value)
  );
}
