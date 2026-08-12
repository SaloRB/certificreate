import type { CertificateInput } from "@/types/certificate";
import type { HistoryEntry } from "@/types/history";

export const HISTORY_STORAGE_KEY = "certificreate.history";

/** Local storage is a few megabytes shared with the brand logo, so the list is
 *  capped rather than grown forever. */
export const HISTORY_LIMIT = 50;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** A single bad entry is dropped rather than failing the whole list, so one
 *  corrupt record cannot cost the user their history. */
export function parseHistoryEntry(value: unknown): HistoryEntry | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const recipientName = asString(record.recipientName);
  const courseTitle = asString(record.courseTitle);
  const date = asString(record.date);
  const instructor = asString(record.instructor);
  const templateId = asString(record.templateId);

  if (
    !id ||
    recipientName === null ||
    courseTitle === null ||
    date === null ||
    instructor === null ||
    !templateId ||
    typeof record.createdAt !== "number" ||
    !Number.isFinite(record.createdAt)
  ) {
    return null;
  }

  return {
    id,
    recipientName,
    courseTitle,
    date,
    instructor,
    templateId,
    createdAt: record.createdAt,
  };
}

export function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parseHistoryEntry)
    .filter((entry): entry is HistoryEntry => entry !== null)
    .slice(0, HISTORY_LIMIT);
}

export function deserializeHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];

  try {
    return parseHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function serializeHistory(entries: HistoryEntry[]): string {
  return JSON.stringify(entries);
}

/** An entry back to the payload the preview and both export routes consume. */
export function toCertificateInput(entry: HistoryEntry): CertificateInput {
  return {
    recipientName: entry.recipientName,
    courseTitle: entry.courseTitle,
    date: entry.date,
    instructor: entry.instructor,
    templateId: entry.templateId,
  };
}

/** Client-only. Storage can throw outright (Safari private browsing, a disabled
 *  cookie policy, a full quota), and history is convenience data: losing it must
 *  never take the editor down. */
export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    return deserializeHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(entries));
  } catch {
    // Nothing useful to do, and nothing worth interrupting the user over.
  }
}

function contentKey(entry: HistoryEntry): string {
  return JSON.stringify([
    entry.recipientName,
    entry.courseTitle,
    entry.date,
    entry.instructor,
    entry.templateId,
  ]);
}

/** Pure: the caller supplies `id` and `createdAt`. Downloading the same
 *  certificate as PNG and then PDF is one export to the user, so an identical
 *  entry moves back to the top instead of adding a row. The original id is kept
 *  so a re-export does not remount the row the user is looking at. */
export function addEntry(
  entries: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  const key = contentKey(entry);
  const existing = entries.find((current) => contentKey(current) === key);
  const next = existing ? { ...entry, id: existing.id } : entry;

  return [next, ...entries.filter((current) => current.id !== next.id)].slice(
    0,
    HISTORY_LIMIT,
  );
}

export function removeEntry(
  entries: HistoryEntry[],
  id: string,
): HistoryEntry[] {
  return entries.filter((entry) => entry.id !== id);
}
