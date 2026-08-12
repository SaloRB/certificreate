import {
  HISTORY_STORAGE_KEY,
  readHistory,
  writeHistory,
} from "@/lib/history/storage";
import type { HistoryEntry } from "@/types/history";

/** Local storage as an external store, in the same shape as
 *  `lib/brand/store.ts`. The snapshot is cached because `useSyncExternalStore`
 *  compares it by reference and would loop on a fresh array every render. */
let snapshot: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

/** One frozen instance, so the server snapshot is reference-stable too. */
const EMPTY: readonly HistoryEntry[] = Object.freeze([]);

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);

  // A second tab exporting a certificate is the one external writer we know
  // about; without this its entries would sit stale until a reload.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== HISTORY_STORAGE_KEY) return;
    snapshot = readHistory();
    emit();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getHistorySnapshot(): readonly HistoryEntry[] {
  snapshot ??= readHistory();
  return snapshot;
}

/** The server and the hydrating render both see an empty list, which is what
 *  keeps the markup identical on both sides. */
export function getHistoryServerSnapshot(): readonly HistoryEntry[] {
  return EMPTY;
}

export function setHistory(next: HistoryEntry[]): void {
  snapshot = next;
  writeHistory(next);
  emit();
}
