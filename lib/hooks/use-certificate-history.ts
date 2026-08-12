"use client";

import { useCallback, useSyncExternalStore } from "react";

import { addEntry, removeEntry } from "@/lib/history/storage";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  setHistory,
  subscribeHistory,
} from "@/lib/history/store";
import type { CertificateInput } from "@/types/certificate";

/** `crypto.randomUUID` is unavailable over plain http on a LAN address, which is
 *  exactly how the dev server gets opened on a phone. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Exported certificates for the editor. Storage is never read during render:
 *  the server and the hydrating render both see an empty list, and the stored
 *  entries arrive on the render after hydration. */
export function useCertificateHistory() {
  const entries = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );

  const record = useCallback(
    (input: CertificateInput) => {
      setHistory(
        addEntry([...entries], { ...input, id: newId(), createdAt: Date.now() }),
      );
    },
    [entries],
  );

  const remove = useCallback(
    (id: string) => {
      setHistory(removeEntry([...entries], id));
    },
    [entries],
  );

  const clear = useCallback(() => setHistory([]), []);

  return { entries, record, remove, clear };
}
