import { TEMPLATES, type TemplateId } from "@/lib/templates/definitions";
import type { TemplateDefinition } from "@/types/template";

export const DEFAULT_TEMPLATE_ID: TemplateId = "black-border";

export function isTemplateId(value: unknown): value is TemplateId {
  return (
    typeof value === "string" &&
    TEMPLATES.some((template) => template.id === value)
  );
}

/** Unknown ids fall back rather than throw: a render surface must always render
 *  something. The export routes reject them at the boundary instead. */
export function resolveTemplateId(value: unknown): TemplateId {
  return isTemplateId(value) ? value : DEFAULT_TEMPLATE_ID;
}

export function getTemplate(id: TemplateId): TemplateDefinition {
  const template = TEMPLATES.find((candidate) => candidate.id === id);

  // Unreachable while `id` is a TemplateId; the fallback is here so the return
  // type stays non-optional for every caller.
  return template ?? TEMPLATES[0];
}
