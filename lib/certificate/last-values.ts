import { DEFAULT_CERTIFICATE_DRAFT } from "@/lib/certificate-defaults";
import type { CertificateDraft } from "@/types/certificate";
import type { LastFormValues } from "@/types/history";

export const LAST_VALUES_STORAGE_KEY = "certificreate.last-input";

/** A first visit still shows the seeded certificate rather than a blank sheet. */
export const DEFAULT_LAST_FORM_VALUES: LastFormValues = {
  draft: DEFAULT_CERTIFICATE_DRAFT,
  instructorOverride: null,
};

function field(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/** Every field degrades on its own, as in `lib/brand/storage.ts`: a record with
 *  a usable course title but a corrupt date keeps the title. */
export function parseLastFormValues(value: unknown): LastFormValues {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_LAST_FORM_VALUES;
  }

  const record = value as Record<string, unknown>;
  const stored = (
    typeof record.draft === "object" && record.draft !== null
      ? record.draft
      : {}
  ) as Record<string, unknown>;

  const draft: CertificateDraft = {
    recipientName: field(
      stored.recipientName,
      DEFAULT_CERTIFICATE_DRAFT.recipientName,
    ),
    courseTitle: field(
      stored.courseTitle,
      DEFAULT_CERTIFICATE_DRAFT.courseTitle,
    ),
    date: field(stored.date, DEFAULT_CERTIFICATE_DRAFT.date),
    templateId: field(stored.templateId, DEFAULT_CERTIFICATE_DRAFT.templateId),
  };

  return {
    draft,
    // Null is meaningful (follow the brand default), so only a string overrides.
    instructorOverride:
      typeof record.instructorOverride === "string"
        ? record.instructorOverride
        : null,
  };
}

export function deserializeLastFormValues(raw: string | null): LastFormValues {
  if (!raw) return DEFAULT_LAST_FORM_VALUES;

  try {
    return parseLastFormValues(JSON.parse(raw));
  } catch {
    return DEFAULT_LAST_FORM_VALUES;
  }
}

export function serializeLastFormValues(values: LastFormValues): string {
  return JSON.stringify(values);
}

/** Client-only, and never allowed to throw: see `readHistory`. */
export function readLastFormValues(): LastFormValues {
  if (typeof window === "undefined") return DEFAULT_LAST_FORM_VALUES;

  try {
    return deserializeLastFormValues(
      window.localStorage.getItem(LAST_VALUES_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_LAST_FORM_VALUES;
  }
}

export function writeLastFormValues(values: LastFormValues): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      LAST_VALUES_STORAGE_KEY,
      serializeLastFormValues(values),
    );
  } catch {
    // Nothing useful to do, and nothing worth interrupting the user over.
  }
}
