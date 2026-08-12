import type { CertificateDraft, CertificateInput } from "@/types/certificate";

/** Seeds the editor so a first visit shows a complete certificate rather than a
 *  blank sheet. Feature 7 replaces this with the last used values. */
export const DEFAULT_CERTIFICATE_DRAFT: CertificateDraft = {
  recipientName: "Sarah Whitfield",
  courseTitle: "Coding With AI: Planning To Production",
  date: "07/13/2026",
  templateId: "black-border",
};

/** Also the brand-settings default, so a first visit with empty storage looks
 *  exactly as it did before brand settings existed. */
export const DEFAULT_INSTRUCTOR = "Brad Traversy";

export const DEFAULT_CERTIFICATE_INPUT: CertificateInput = {
  ...DEFAULT_CERTIFICATE_DRAFT,
  instructor: DEFAULT_INSTRUCTOR,
};
