"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getLastFormValuesServerSnapshot,
  getLastFormValuesSnapshot,
  setLastFormValues,
  subscribeLastFormValues,
} from "@/lib/certificate/last-values-store";
import type { LastFormValues } from "@/types/history";

/** The editor's form state, persisted as it is edited. Storage is never read
 *  during render: the server and the hydrating render both see the seeded
 *  defaults, and the stored values arrive on the render after hydration. */
export function useLastFormValues() {
  const values = useSyncExternalStore(
    subscribeLastFormValues,
    getLastFormValuesSnapshot,
    getLastFormValuesServerSnapshot,
  );

  const update = useCallback(
    (patch: Partial<LastFormValues>) => {
      setLastFormValues({ ...values, ...patch });
    },
    [values],
  );

  return { values, update };
}
