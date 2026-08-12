"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getBrandSettingsServerSnapshot,
  getBrandSettingsSnapshot,
  setBrandSettings,
  subscribeBrandSettings,
} from "@/lib/brand/store";
import type { BrandSettings } from "@/types/brand";

/** Brand settings for the editor. Storage is never read during render: the
 *  server and the hydrating render both see the defaults, and the stored record
 *  arrives on the render after hydration. */
export function useBrandSettings() {
  const settings = useSyncExternalStore(
    subscribeBrandSettings,
    getBrandSettingsSnapshot,
    getBrandSettingsServerSnapshot,
  );

  const update = useCallback(
    (patch: Partial<BrandSettings>) => {
      setBrandSettings({ ...settings, ...patch });
    },
    [settings],
  );

  return { settings, update };
}
