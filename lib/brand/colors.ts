import type { TemplateDefinition } from "@/types/template";
import type { BrandColors, BrandColorVar } from "@/types/brand";

/** Exhaustive by construction: a new `BrandColorVar` fails to typecheck until it
 *  has a label here, so the settings panel can never miss a field. */
export const BRAND_COLOR_LABELS: Record<BrandColorVar, string> = {
  "--color-cert-border": "Border",
  "--color-cert-frame": "Frame",
  "--color-cert-ink": "Text",
  "--color-cert-paper": "Paper",
};

export const BRAND_COLOR_VARS = Object.keys(
  BRAND_COLOR_LABELS,
) as BrandColorVar[];

/** `#rgb` or `#rrggbb`, nothing else. These strings end up in a `style`
 *  attribute and arrive from local storage and from a query string, so the
 *  narrow grammar is the security boundary, not a formatting preference. */
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isBrandColorVar(value: string): value is BrandColorVar {
  return Object.hasOwn(BRAND_COLOR_LABELS, value);
}

export function isBrandColorValue(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** Untrusted object in, safe overrides out. Unknown keys and anything that is
 *  not a hex colour are dropped rather than coerced. */
export function parseBrandColors(value: unknown): BrandColors {
  if (typeof value !== "object" || value === null) return {};

  const record = value as Record<string, unknown>;
  const colors: BrandColors = {};

  for (const key of Object.keys(record)) {
    const candidate = record[key];
    if (isBrandColorVar(key) && isBrandColorValue(candidate)) {
      colors[key] = candidate;
    }
  }

  return colors;
}

/** `<input type="color">` only accepts six digits, so a hand-typed `#fff` has to
 *  be expanded before it can be shown in one. Anything invalid falls back to
 *  black rather than leaving the control in an undefined state. */
export function expandHexColor(value: string): string {
  if (!isBrandColorValue(value)) return "#000000";
  if (value.length === 7) return value;

  const [, r, g, b] = value;
  return `#${r}${r}${g}${g}${b}${b}`;
}

/** The only way brand colours reach a sheet. It takes `unknown` on purpose: this
 *  is the last gate before the custom properties are painted, so both the
 *  local-storage path and the query-string path revalidate here. */
export function resolveThemeVars(
  template: TemplateDefinition,
  colors?: unknown,
): Record<string, string> {
  return { ...template.themeVars, ...parseBrandColors(colors) };
}
