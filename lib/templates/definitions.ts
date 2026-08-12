import type { TemplateDefinition } from "@/types/template";

/** The registry. Adding a style is an entry here plus a component in
 *  `components/certificate/templates`; the picker, the preview, and both export
 *  routes read this list rather than naming templates individually. */
export const TEMPLATES = [
  {
    id: "black-border",
    name: "Black Border",
    description: "Formal double border with concave corners and serif display type.",
    themeVars: {
      "--color-cert-paper": "#ffffff",
      "--color-cert-ink": "#14181c",
      "--color-cert-ink-soft": "#3d444c",
      "--color-cert-rule": "#272727",
      "--color-cert-frame": "#232323",
      "--color-cert-border": "#4a6178",
      "--color-cert-border-thin": "#8e949c",
      "--font-cert-display":
        'var(--font-cormorant), "EB Garamond", Georgia, serif',
      "--font-cert-body": "var(--font-lato), ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    id: "modern-slate",
    name: "Modern Slate",
    description: "Left accent band, sans display type, everything left aligned.",
    themeVars: {
      "--color-cert-paper": "#f7f8fa",
      "--color-cert-ink": "#10151b",
      "--color-cert-ink-soft": "#525c68",
      "--color-cert-rule": "#c3ccd6",
      "--color-cert-frame": "#1e3a5f",
      "--color-cert-border": "#1e3a5f",
      "--color-cert-border-thin": "#dbe2ea",
      "--font-cert-display": "var(--font-inter), ui-sans-serif, sans-serif",
      "--font-cert-body": "var(--font-lato), ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    id: "classic-ivory",
    name: "Classic Ivory",
    description: "Warm ivory paper, thin rule frame, centred serif lettering.",
    themeVars: {
      "--color-cert-paper": "#fbf7ef",
      "--color-cert-ink": "#2a2118",
      "--color-cert-ink-soft": "#6b5c48",
      "--color-cert-rule": "#b09a76",
      "--color-cert-frame": "#8a6f3f",
      "--color-cert-border": "#8a6f3f",
      "--color-cert-border-thin": "#d3c1a0",
      "--font-cert-display":
        'var(--font-cormorant), "EB Garamond", Georgia, serif',
      "--font-cert-body": "var(--font-lato), ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const satisfies readonly TemplateDefinition[];

export type TemplateId = (typeof TEMPLATES)[number]["id"];
