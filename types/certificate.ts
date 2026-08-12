/** A4 landscape at 96dpi. The template always lays out at exactly this size and
 *  is scaled with a transform for display, so the Puppeteer export (same viewport,
 *  higher deviceScaleFactor) cannot drift from the preview. */
export const CERT_WIDTH_PX = 1123;
export const CERT_HEIGHT_PX = 794;

/** The one payload the preview and both export routes consume. */
export interface CertificateInput {
  recipientName: string;
  courseTitle: string;
  /** Display-ready string; formatting is feature 8's job. */
  date: string;
  instructor: string;
  templateId: string;
}

/** A certificate before its signatory is known. The editor keeps the instructor
 *  out of its draft state so "the brand default" and "edited for this one
 *  certificate" stay distinct without mirroring settings into form state. */
export type CertificateDraft = Omit<CertificateInput, "instructor">;
