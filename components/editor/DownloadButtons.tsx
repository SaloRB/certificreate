"use client";

import { useCertificateDownload } from "@/lib/hooks/use-certificate-download";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

interface DownloadButtonsProps {
  input: CertificateInput;
  brand: ExportBrand;
}

interface DownloadButtonProps {
  label: string;
  isPending: boolean;
  variant: "primary" | "secondary";
  onClick: () => void;
}

const BUTTON_BASE =
  "rounded-field px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-border-strong bg-surface-2 text-text hover:bg-border-strong",
} as const;

function DownloadButton({
  label,
  isPending,
  variant,
  onClick,
}: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`${BUTTON_BASE} ${VARIANTS[variant]}`}
    >
      {isPending ? "Rendering..." : label}
    </button>
  );
}

export function DownloadButtons({ input, brand }: DownloadButtonsProps) {
  const png = useCertificateDownload("/api/export/png", "certificate.png");
  const pdf = useCertificateDownload("/api/export/pdf", "certificate.pdf");

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <DownloadButton
          label="Download PDF"
          isPending={pdf.isPending}
          variant="secondary"
          onClick={() => pdf.download(input, brand)}
        />
        <DownloadButton
          label="Download PNG"
          isPending={png.isPending}
          variant="primary"
          onClick={() => png.download(input, brand)}
        />
      </div>

      {/* Named per format: the two messages stack, so an unlabelled one would
          read as belonging to whichever button sits above it. */}
      {pdf.error ? (
        <p role="alert" className="text-[11px] text-muted">
          PDF: {pdf.error}
        </p>
      ) : null}
      {png.error ? (
        <p role="alert" className="text-[11px] text-muted">
          PNG: {png.error}
        </p>
      ) : null}
    </div>
  );
}
