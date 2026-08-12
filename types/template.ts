import type { ComponentType } from "react";

import type { CertificateInput } from "@/types/certificate";

/** A shipped certificate style. Static, not user-editable.
 *
 *  `themeVars` is the single theme hook: it is applied as CSS custom properties
 *  on the sheet wrapper, and feature 6a layers the user's brand colours over the
 *  same properties on the same element. Nothing inside a template may hardcode a
 *  colour or a font stack. */
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  themeVars: Record<string, string>;
}

/** Every template renders the same payload into the same fixed-size sheet; the
 *  wrapper, the theme vars, and the sizing belong to the entry component. */
export type CertificateTemplateComponent = ComponentType<{
  input: CertificateInput;
}>;
