"use client";

import { DownloadButtons } from "@/components/editor/DownloadButtons";
import { toCertificateInput } from "@/lib/history/storage";
import { getTemplate, resolveTemplateId } from "@/lib/templates/resolve";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";
import type { HistoryEntry } from "@/types/history";

interface HistoryPanelProps {
  entries: readonly HistoryEntry[];
  /** Colours and logo are taken live, never snapshotted per entry, so a
   *  re-download after a rebrand comes back on the current brand. */
  brand: ExportBrand;
  onOpen: (input: CertificateInput) => void;
  onExported: (input: CertificateInput) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

interface HistoryRowProps extends Omit<HistoryPanelProps, "entries" | "onClear"> {
  entry: HistoryEntry;
}

function timestamp(createdAt: number): string {
  return new Date(createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HistoryRow({
  entry,
  brand,
  onOpen,
  onExported,
  onRemove,
}: HistoryRowProps) {
  // The stored id is whatever was selected at export time, and a template can be
  // removed from the registry between then and now.
  const template = getTemplate(resolveTemplateId(entry.templateId));
  const input = toCertificateInput(entry);

  return (
    <li className="border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-text">
            {entry.recipientName || "Untitled certificate"}
          </p>
          <p className="truncate text-[12px] text-muted">{entry.courseTitle}</p>
          <p className="mt-1 text-[11px] text-faint">
            {template.name} &middot; {timestamp(entry.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove ${entry.recipientName || "certificate"} from history`}
          className="shrink-0 rounded-field px-2 text-[15px] leading-none text-muted hover:text-text focus:outline-none focus:ring-[3px] focus:ring-focus-ring"
        >
          &times;
        </button>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(input)}
          className="rounded-field border border-border-strong px-3 py-[6px] text-[12px] font-semibold text-text hover:bg-surface-2 focus:outline-none focus:ring-[3px] focus:ring-focus-ring"
        >
          Open
        </button>

        {/* The compact labels are just "PDF" and "PNG", so the group names the
            certificate they belong to for screen readers. */}
        <div
          role="group"
          aria-label={`Download ${entry.recipientName || "certificate"}`}
        >
          <DownloadButtons
            input={input}
            brand={brand}
            onExported={onExported}
            compact
          />
        </div>
      </div>
    </li>
  );
}

export function HistoryPanel({
  entries,
  brand,
  onOpen,
  onExported,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-label text-muted">
        History
      </p>

      {entries.length === 0 ? (
        <p className="text-[12px] text-muted">
          Certificates you download are saved here, on this device only.
        </p>
      ) : (
        <>
          <ul>
            {entries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                brand={brand}
                onOpen={onOpen}
                onExported={onExported}
                onRemove={onRemove}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={onClear}
            className="mt-4 text-[11px] text-muted hover:text-text"
          >
            Clear history
          </button>
        </>
      )}
    </section>
  );
}
