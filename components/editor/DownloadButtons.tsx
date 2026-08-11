"use client";

import { useCertificateDownload } from "@/lib/hooks/use-certificate-download";
import type { CertificateInput } from "@/types/certificate";

interface DownloadButtonsProps {
  input: CertificateInput;
}

export function DownloadButtons({ input }: DownloadButtonsProps) {
  const png = useCertificateDownload("/api/export/png", "certificate.png");

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => png.download(input)}
        disabled={png.isPending}
        className="rounded-field bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink transition-colors hover:bg-accent-hover focus:outline-none focus:ring-[3px] focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {png.isPending ? "Rendering..." : "Download PNG"}
      </button>

      {png.error ? (
        <p role="alert" className="text-[11px] text-muted">
          {png.error}
        </p>
      ) : null}
    </div>
  );
}
