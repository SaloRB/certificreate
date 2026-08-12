import { TEMPLATES } from "@/lib/templates/definitions";

interface TemplatePickerProps {
  value: string;
  onChange: (templateId: string) => void;
}

/** Built from the registry, so a new template appears here without an edit. */
export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <fieldset className="rounded-panel border border-border bg-surface p-5">
      <legend className="mb-4 text-[10px] font-semibold uppercase tracking-label text-muted">
        Template
      </legend>

      <div className="flex flex-col gap-2">
        {TEMPLATES.map((template) => {
          const selected = template.id === value;

          return (
            <label
              key={template.id}
              className={`flex cursor-pointer gap-3 rounded-field border p-3 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-focus-ring ${
                selected
                  ? "border-accent bg-accent-faint"
                  : "border-field-border bg-field-bg hover:border-border-strong"
              }`}
            >
              <input
                type="radio"
                name="templateId"
                value={template.id}
                checked={selected}
                onChange={() => onChange(template.id)}
                className="mt-[3px] self-start accent-accent"
              />
              <span>
                <span className="block text-sm text-text">{template.name}</span>
                <span className="mt-[3px] block text-[11px] text-faint">
                  {template.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
