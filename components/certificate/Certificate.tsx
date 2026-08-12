import type { CSSProperties } from "react";

import { TEMPLATE_COMPONENTS } from "@/components/certificate/templates";
import { resolveThemeVars } from "@/lib/brand/colors";
import { isLogoDataUrl } from "@/lib/brand/logo";
import { getTemplate, resolveTemplateId } from "@/lib/templates/resolve";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

interface CertificateProps {
  input: CertificateInput;
  /** Brand overrides. `unknown` because this is the last stop before the values
   *  are painted, and `resolveThemeVars` revalidates whatever arrives. */
  colors?: unknown;
  /** Same contract as `colors`: revalidated here, whatever the caller believes. */
  logoDataUrl?: unknown;
}

/** The one way a certificate is rendered: resolve the template, paint its theme
 *  vars onto the sheet, hand the sheet to the template's artwork. The preview
 *  and both export routes all come through here, so they cannot drift. */
export function Certificate({
  input,
  colors,
  logoDataUrl,
}: CertificateProps) {
  const templateId = resolveTemplateId(input.templateId);
  const template = getTemplate(templateId);
  const Template = TEMPLATE_COMPONENTS[templateId];

  return (
    <div
      data-certificate
      data-template-id={templateId}
      className="relative bg-cert-paper text-cert-ink font-cert-body"
      // Custom properties only: the template theme with the user's brand colours
      // layered over it, on this one element. Template values must land here
      // rather than in a stylesheet, or the overrides would have nothing to
      // cascade over.
      style={
        {
          width: CERT_WIDTH_PX,
          height: CERT_HEIGHT_PX,
          ...resolveThemeVars(template, colors),
        } as CSSProperties
      }
    >
      <Template
        input={{ ...input, templateId }}
        logoDataUrl={isLogoDataUrl(logoDataUrl) ? logoDataUrl : null}
      />
    </div>
  );
}
