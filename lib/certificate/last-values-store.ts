import {
  DEFAULT_LAST_FORM_VALUES,
  LAST_VALUES_STORAGE_KEY,
  readLastFormValues,
  writeLastFormValues,
} from "@/lib/certificate/last-values";
import type { LastFormValues } from "@/types/history";

/** Local storage as an external store, in the same shape as
 *  `lib/brand/store.ts`. */
let snapshot: LastFormValues | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeLastFormValues(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== LAST_VALUES_STORAGE_KEY) return;
    snapshot = readLastFormValues();
    emit();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getLastFormValuesSnapshot(): LastFormValues {
  snapshot ??= readLastFormValues();
  return snapshot;
}

/** The server and the hydrating render both see the seeded defaults, which is
 *  what keeps the markup identical on both sides. */
export function getLastFormValuesServerSnapshot(): LastFormValues {
  return DEFAULT_LAST_FORM_VALUES;
}

export function setLastFormValues(next: LastFormValues): void {
  snapshot = next;
  writeLastFormValues(next);
  emit();
}
