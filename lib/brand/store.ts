import {
  BRAND_STORAGE_KEY,
  DEFAULT_BRAND_SETTINGS,
  readBrandSettings,
  writeBrandSettings,
} from "@/lib/brand/storage";
import type { BrandSettings } from "@/types/brand";

/** Local storage as an external store, so React reads it through
 *  `useSyncExternalStore` rather than a setState in an effect. The snapshot is
 *  cached because that hook compares it by reference and would loop on a fresh
 *  object every render. */
let snapshot: BrandSettings | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeBrandSettings(listener: () => void): () => void {
  listeners.add(listener);

  // A second tab editing the same settings is the one external writer we know
  // about; without this its changes would sit stale until a reload.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== BRAND_STORAGE_KEY) return;
    snapshot = readBrandSettings();
    emit();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getBrandSettingsSnapshot(): BrandSettings {
  snapshot ??= readBrandSettings();
  return snapshot;
}

/** The server and the hydrating render both see defaults, which is what keeps
 *  the markup identical on both sides. */
export function getBrandSettingsServerSnapshot(): BrandSettings {
  return DEFAULT_BRAND_SETTINGS;
}

export function setBrandSettings(next: BrandSettings): void {
  snapshot = next;
  writeBrandSettings(next);
  emit();
}
