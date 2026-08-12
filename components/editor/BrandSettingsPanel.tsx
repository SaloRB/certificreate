"use client";

import { useState } from "react";

import { Field } from "@/components/editor/Field";
import { LogoField } from "@/components/editor/LogoField";
import {
  BRAND_COLOR_LABELS,
  BRAND_COLOR_VARS,
  expandHexColor,
  isBrandColorValue,
} from "@/lib/brand/colors";
import type { BrandColors, BrandColorVar, BrandSettings } from "@/types/brand";
import type { TemplateDefinition } from "@/types/template";

interface BrandSettingsPanelProps {
  settings: BrandSettings;
  /** The selected template supplies the value each unset control shows, so the
   *  panel always reflects the certificate on screen. */
  template: TemplateDefinition;
  onChange: (patch: Partial<BrandSettings>) => void;
}

interface ColorFieldProps {
  variable: BrandColorVar;
  value: string;
  isOverridden: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

function ColorField({
  variable,
  value,
  isOverridden,
  onChange,
  onReset,
}: ColorFieldProps) {
  // The text box holds partial input ("#12") that must not be committed, so it
  // keeps its own draft and re-syncs when the value changes from elsewhere (the
  // swatch, a reset, a template switch). Adjusting state during render is the
  // supported way to do that; an effect would land a render late.
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  const commit = (next: string) => {
    setText(next);
    if (isBrandColorValue(next)) onChange(next);
  };

  return (
    <div className="mb-3 last:mb-0 flex items-center gap-3">
      <label htmlFor={variable} className="flex-1 text-[11px] text-muted">
        {BRAND_COLOR_LABELS[variable]}
      </label>

      <input
        type="color"
        aria-label={`${BRAND_COLOR_LABELS[variable]} swatch`}
        value={expandHexColor(value)}
        onChange={(event) => commit(event.target.value)}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-field border border-field-border bg-field-bg"
      />

      <input
        id={variable}
        value={text}
        spellCheck={false}
        onChange={(event) => commit(event.target.value)}
        className={`w-[92px] rounded-field border bg-field-bg px-2 py-[6px] font-mono text-[12px] text-text focus:outline-none focus:ring-[3px] focus:ring-focus-ring ${
          isBrandColorValue(text)
            ? "border-field-border focus:border-field-border-focus"
            : "border-danger"
        }`}
      />

      <button
        type="button"
        onClick={onReset}
        disabled={!isOverridden}
        title="Reset to the template colour"
        className="w-12 shrink-0 text-[11px] text-muted hover:text-text disabled:invisible"
      >
        Reset
      </button>
    </div>
  );
}

export function BrandSettingsPanel({
  settings,
  template,
  onChange,
}: BrandSettingsPanelProps) {
  const setColor = (variable: BrandColorVar, value: string) =>
    onChange({ colors: { ...settings.colors, [variable]: value } });

  // Deleting the key rather than writing the template's hex is what keeps an
  // unset control tracking whichever template is selected.
  const clearColor = (variable: BrandColorVar) => {
    const colors: BrandColors = { ...settings.colors };
    delete colors[variable];
    onChange({ colors });
  };

  const hasOverrides = Object.keys(settings.colors).length > 0;

  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-label text-muted">
        Brand settings
      </p>

      <Field
        id="brand-instructor"
        label="Default instructor"
        value={settings.instructor}
        hint="Saved in this browser and used for new certificates."
        onChange={(instructor) => onChange({ instructor })}
      />

      <div className="mt-5">
        <LogoField
          value={settings.logoDataUrl}
          onChange={(logoDataUrl) => onChange({ logoDataUrl })}
        />
      </div>

      <p className="mb-3 mt-5 text-[11px] uppercase tracking-[0.06em] text-muted">
        Colors
      </p>

      {BRAND_COLOR_VARS.map((variable) => (
        <ColorField
          key={variable}
          variable={variable}
          value={settings.colors[variable] ?? template.themeVars[variable]}
          isOverridden={variable in settings.colors}
          onChange={(value) => setColor(variable, value)}
          onReset={() => clearColor(variable)}
        />
      ))}

      <button
        type="button"
        onClick={() => onChange({ colors: {} })}
        disabled={!hasOverrides}
        className="mt-4 text-[11px] text-muted hover:text-text disabled:opacity-40 disabled:hover:text-muted"
      >
        Reset all colors to the template
      </button>
    </section>
  );
}
