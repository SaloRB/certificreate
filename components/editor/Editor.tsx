"use client";

import { Certificate } from "@/components/certificate/Certificate";
import { CertificateFit } from "@/components/certificate/CertificateFit";
import { BrandSettingsPanel } from "@/components/editor/BrandSettingsPanel";
import { CertificateForm } from "@/components/editor/CertificateForm";
import { DownloadButtons } from "@/components/editor/DownloadButtons";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { TemplatePicker } from "@/components/editor/TemplatePicker";
import { resolveInstructor } from "@/lib/brand/storage";
import { useBrandSettings } from "@/lib/hooks/use-brand-settings";
import { useCertificateHistory } from "@/lib/hooks/use-certificate-history";
import { useLastFormValues } from "@/lib/hooks/use-last-form-values";
import { getTemplate, resolveTemplateId } from "@/lib/templates/resolve";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

export function Editor() {
  const { settings, update: updateSettings } = useBrandSettings();
  // Form state lives in local storage rather than component state, so a reload
  // resumes where the user left off. A null instructor override means "follow
  // brand settings"; deriving the instructor rather than storing it flat is what
  // keeps a settings change from clobbering a per-certificate edit, in either
  // direction.
  const { values, update: updateValues } = useLastFormValues();
  const { entries, record, remove, clear } = useCertificateHistory();
  const { draft, instructorOverride } = values;

  const input: CertificateInput = {
    ...draft,
    instructor: instructorOverride ?? resolveInstructor(settings),
  };

  const update = ({ instructor, ...rest }: Partial<CertificateInput>) => {
    updateValues({
      draft: { ...draft, ...rest },
      ...(instructor === undefined ? {} : { instructorOverride: instructor }),
    });
  };

  // Re-opening pins the instructor it was generated with, rather than letting
  // the current brand default rewrite a certificate that already went out.
  const open = ({ instructor, ...rest }: CertificateInput) =>
    updateValues({ draft: rest, instructorOverride: instructor });

  const template = getTemplate(resolveTemplateId(input.templateId));
  const brand: ExportBrand = {
    colors: settings.colors,
    logoDataUrl: settings.logoDataUrl,
  };

  return (
    <main className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-start gap-6 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-6">
        <CertificateForm value={input} onChange={update} />
        <TemplatePicker
          value={input.templateId}
          onChange={(templateId) => update({ templateId })}
        />
        <BrandSettingsPanel
          settings={settings}
          template={template}
          onChange={updateSettings}
        />
        <HistoryPanel
          entries={entries}
          brand={brand}
          onOpen={open}
          onExported={record}
          onRemove={remove}
          onClear={clear}
        />
      </div>

      <div className="rounded-panel border border-border bg-surface p-4 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-label text-muted">
              Preview
            </p>
            <span className="text-[11px] text-faint">
              {template.name} &middot; A4 landscape
            </span>
          </div>
          <DownloadButtons input={input} brand={brand} onExported={record} />
        </div>

        <CertificateFit className="mx-auto max-w-[900px]">
          <Certificate
            input={input}
            colors={settings.colors}
            logoDataUrl={settings.logoDataUrl}
          />
        </CertificateFit>
      </div>
    </main>
  );
}
