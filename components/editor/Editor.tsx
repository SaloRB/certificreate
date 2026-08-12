"use client";

import { useState } from "react";

import { Certificate } from "@/components/certificate/Certificate";
import { CertificateFit } from "@/components/certificate/CertificateFit";
import { CertificateForm } from "@/components/editor/CertificateForm";
import { DownloadButtons } from "@/components/editor/DownloadButtons";
import { TemplatePicker } from "@/components/editor/TemplatePicker";
import { DEFAULT_CERTIFICATE_INPUT } from "@/lib/certificate-defaults";
import { getTemplate, resolveTemplateId } from "@/lib/templates/resolve";
import type { CertificateInput } from "@/types/certificate";

export function Editor() {
  const [input, setInput] = useState<CertificateInput>(
    DEFAULT_CERTIFICATE_INPUT,
  );

  const update = (patch: Partial<CertificateInput>) =>
    setInput((current) => ({ ...current, ...patch }));

  const template = getTemplate(resolveTemplateId(input.templateId));

  return (
    <main className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-start gap-6 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-6">
        <CertificateForm value={input} onChange={update} />
        <TemplatePicker
          value={input.templateId}
          onChange={(templateId) => update({ templateId })}
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
          <DownloadButtons input={input} />
        </div>

        <CertificateFit className="mx-auto max-w-[900px]">
          <Certificate input={input} />
        </CertificateFit>
      </div>
    </main>
  );
}
