import type { CSSProperties } from "react";

import { TEMPLATE_COMPONENTS } from "@/components/certificate/templates";
import { getTemplate, resolveTemplateId } from "@/lib/templates/resolve";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

interface CertificateProps {
  input: CertificateInput;
}

/** The one way a certificate is rendered: resolve the template, paint its theme
 *  vars onto the sheet, hand the sheet to the template's artwork. The preview
 *  and both export routes all come through here, so they cannot drift. */
export function Certificate({ input }: CertificateProps) {
  const templateId = resolveTemplateId(input.templateId);
  const template = getTemplate(templateId);
  const Template = TEMPLATE_COMPONENTS[templateId];

  return (
    <div
      data-certificate
      data-template-id={templateId}
      className="relative bg-cert-paper text-cert-ink font-cert-body"
      // Custom properties only. Feature 6a layers the user's brand colours over
      // the same properties on this element, so template values must land here
      // rather than in a stylesheet.
      style={
        {
          width: CERT_WIDTH_PX,
          height: CERT_HEIGHT_PX,
          ...template.themeVars,
        } as CSSProperties
      }
    >
      <Template input={{ ...input, templateId }} />
    </div>
  );
}
