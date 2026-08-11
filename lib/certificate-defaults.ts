import type { CertificateInput } from "@/types/certificate";

/** Seeds the editor so a first visit shows a complete certificate rather than a
 *  blank sheet. Feature 7 replaces this with the last used values, and feature 6a
 *  takes the instructor from brand settings; both change it here. */
export const DEFAULT_CERTIFICATE_INPUT: CertificateInput = {
  recipientName: "Sarah Whitfield",
  courseTitle: "Coding With AI: Planning To Production",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};
