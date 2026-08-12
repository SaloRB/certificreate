import type { ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Label, hint, and error message around one control. The text input and the
 *  date picker share it so a validation message can never look different in one
 *  panel than the other. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="mb-4 last:mb-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={fieldErrorId(id)} className="mt-[5px] text-[11px] text-danger">
          {error}
        </p>
      ) : null}
      {hint ? <p className="mt-[5px] text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function fieldErrorId(id: string): string {
  return `${id}-error`;
}

export function fieldInputClass(error?: string): string {
  const border = error
    ? "border-danger focus:border-danger"
    : "border-field-border focus:border-field-border-focus";

  return `w-full rounded-field border bg-field-bg px-[11px] py-[9px] text-sm text-text placeholder:text-field-placeholder focus:outline-none focus:ring-[3px] focus:ring-focus-ring ${border}`;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}

/** The one text input in the editor sidebar, shared by the certificate form and
 *  the brand settings panel so the two panels cannot drift apart. */
export function Field({
  id,
  label,
  value,
  hint,
  error,
  onChange,
}: FieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? fieldErrorId(id) : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={fieldInputClass(error)}
      />
    </FieldShell>
  );
}
