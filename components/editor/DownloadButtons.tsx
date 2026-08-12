"use client";

import { useCertificateDownload } from "@/lib/hooks/use-certificate-download";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

interface DownloadButtonsProps {
  input: CertificateInput;
  brand: ExportBrand;
  /** Called only when a file actually reached the user, so a failed render never
   *  lands in history. */
  onExported?: (input: CertificateInput) => void;
  /** History rows sit in a 360px column, where the full-size pair wraps and
   *  outweighs the entry it belongs to. */
  compact?: boolean;
}

interface DownloadButtonProps {
  label: string;
  isPending: boolean;
  variant: "primary" | "secondary";
  compact: boolean;
  onClick: () => void;
}

const BUTTON_BASE =
  "whitespace-nowrap rounded-field font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

const SIZES = {
  full: "px-4 py-2 text-[13px]",
  compact: "px-3 py-[6px] text-[12px]",
} as const;

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-border-strong bg-surface-2 text-text hover:bg-border-strong",
} as const;

function DownloadButton({
  label,
  isPending,
  variant,
  compact,
  onClick,
}: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`${BUTTON_BASE} ${SIZES[compact ? "compact" : "full"]} ${VARIANTS[variant]}`}
    >
      {isPending ? "Rendering..." : label}
    </button>
  );
}

export function DownloadButtons({
  input,
  brand,
  onExported,
  compact = false,
}: DownloadButtonsProps) {
  const png = useCertificateDownload("/api/export/png", "certificate.png");
  const pdf = useCertificateDownload("/api/export/pdf", "certificate.pdf");

  const run = async (download: typeof png.download) => {
    if (await download(input, brand)) onExported?.(input);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <DownloadButton
          label={compact ? "PDF" : "Download PDF"}
          isPending={pdf.isPending}
          variant="secondary"
          compact={compact}
          onClick={() => run(pdf.download)}
        />
        <DownloadButton
          label={compact ? "PNG" : "Download PNG"}
          isPending={png.isPending}
          variant="primary"
          compact={compact}
          onClick={() => run(png.download)}
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
