/** The theme variables the user is allowed to override. A curated subset of the
 *  template theme: the rest (soft ink, rules, hairlines) stay template-owned so a
 *  partial override still looks deliberate. */
export type BrandColorVar =
  | "--color-cert-border"
  | "--color-cert-frame"
  | "--color-cert-ink"
  | "--color-cert-paper";

/** A missing key means "use the selected template's value", which is why a reset
 *  deletes the key rather than writing the template's hex. */
export type BrandColors = Partial<Record<BrandColorVar, string>>;

/** The single local-storage record. Load-bearing: 6b writes `logoDataUrl` and
 *  feature 7 reads the same record, so 6a persists every field it does not use. */
export interface BrandSettings {
  logoDataUrl: string | null;
  instructor: string;
  colors: BrandColors;
}

/** The brand half of an export request: everything the render needs that is not
 *  part of `CertificateInput`. One object rather than loose arguments, so a
 *  future brand field does not change four signatures. */
export interface ExportBrand {
  colors: BrandColors;
  logoDataUrl: string | null;
}
