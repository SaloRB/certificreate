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

/** Posts a certificate to an export endpoint and saves what comes back. Feature 4
 *  reuses it for PDF by passing a different endpoint. */
export function useCertificateDownload(endpoint: string, fallbackName: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (input: CertificateInput, brand: ExportBrand) => {
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
        return;
      }

      const fileName = fileNameFrom(
        response.headers.get("Content-Disposition"),
        fallbackName,
      );
      saveBlob(await response.blob(), fileName);
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending, error };
}
