import type { CertificateDraft, CertificateInput } from "@/types/certificate";

/** One exported certificate, kept in local storage so it can be re-opened or
 *  downloaded again. Load-bearing: `instructor` is stored per entry because an
 *  entry must re-open with the signatory it was generated with, not with whatever
 *  the brand default happens to be later. */
export interface HistoryEntry extends CertificateInput {
  id: string;
  /** Epoch ms. */
  createdAt: number;
}

/** The most recent form state, restored on reload. The instructor is kept
 *  separate from the draft, and nullable, so "follow the brand default" survives
 *  a reload instead of freezing whatever the default was at save time. */
export interface LastFormValues {
  draft: CertificateDraft;
  instructorOverride: string | null;
}
