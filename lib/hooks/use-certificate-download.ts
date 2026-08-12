"use client";

import { useState } from "react";

import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

const FALLBACK_ERROR = "Could not generate the certificate. Please try again.";

function fileNameFrom(disposition: string | null, fallback: string): string {
  return disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallback;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Posts a `CertificateInput` to an export endpoint and saves the response under
 *  the server-supplied filename; the PNG and PDF buttons differ only by endpoint.
 *  Resolves to whether the file actually reached the user, so a caller can record
 *  history for real exports only. */
export function useCertificateDownload(endpoint: string, fallbackName: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (
    input: CertificateInput,
    brand: ExportBrand,
  ): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, ...brand }),
      });

      if (!response.ok) {
        const message = await response
          .json()
          .then((body) => body?.error)
          .catch(() => null);
        setError(typeof message === "string" ? message : FALLBACK_ERROR);
        return false;
      }

      const fileName = fileNameFrom(
        response.headers.get("Content-Disposition"),
        fallbackName,
      );
      saveBlob(await response.blob(), fileName);
      return true;
    } catch {
      setError(FALLBACK_ERROR);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending, error };
}
