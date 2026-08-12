interface FieldProps {
  id: string;
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}

/** The one text input in the editor sidebar, shared by the certificate form and
 *  the brand settings panel so the two panels cannot drift apart. */
export function Field({ id, label, value, hint, onChange }: FieldProps) {
  return (
    <div className="mb-4 last:mb-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-field border border-field-border bg-field-bg px-[11px] py-[9px] text-sm text-text placeholder:text-field-placeholder focus:border-field-border-focus focus:outline-none focus:ring-[3px] focus:ring-focus-ring"
      />
      {hint ? <p className="mt-[5px] text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}
