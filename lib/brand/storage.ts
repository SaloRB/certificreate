import { parseBrandColors } from "@/lib/brand/colors";
import { DEFAULT_INSTRUCTOR } from "@/lib/certificate-defaults";
import type { BrandSettings } from "@/types/brand";

export const BRAND_STORAGE_KEY = "certificreate.brand";

/** The instructor default matches the editor's seed, so a first visit with empty
 *  storage looks exactly as it did before brand settings existed. */
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoDataUrl: null,
  instructor: DEFAULT_INSTRUCTOR,
  colors: {},
};

/** Every field degrades on its own: a record with a usable colour set but a
 *  corrupt instructor keeps the colours. */
export function parseBrandSettings(value: unknown): BrandSettings {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_BRAND_SETTINGS;
  }

  const record = value as Record<string, unknown>;

  return {
    logoDataUrl:
      typeof record.logoDataUrl === "string" ? record.logoDataUrl : null,
    instructor:
      typeof record.instructor === "string"
        ? record.instructor.trim()
        : DEFAULT_BRAND_SETTINGS.instructor,
    colors: parseBrandColors(record.colors),
  };
}

export function deserializeBrandSettings(raw: string | null): BrandSettings {
  if (!raw) return DEFAULT_BRAND_SETTINGS;

  try {
    return parseBrandSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

export function serializeBrandSettings(settings: BrandSettings): string {
  return JSON.stringify(settings);
}

/** The signature line is never blank: an instructor cleared in the panel still
 *  falls back to the default on the certificate. */
export function resolveInstructor(settings: BrandSettings): string {
  return settings.instructor.trim() || DEFAULT_BRAND_SETTINGS.instructor;
}

/** Client-only. Storage can throw outright (Safari private browsing, a disabled
 *  cookie policy, a full quota), and losing brand settings must never take the
 *  editor down with it. */
export function readBrandSettings(): BrandSettings {
  if (typeof window === "undefined") return DEFAULT_BRAND_SETTINGS;

  try {
    return deserializeBrandSettings(
      window.localStorage.getItem(BRAND_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

export function writeBrandSettings(settings: BrandSettings): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      BRAND_STORAGE_KEY,
      serializeBrandSettings(settings),
    );
  } catch {
    // Nothing useful to do, and nothing worth interrupting the user over.
  }
}
