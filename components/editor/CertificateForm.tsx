import type { CertificateInput } from "@/types/certificate";

interface CertificateFormProps {
  value: CertificateInput;
  onChange: (patch: Partial<CertificateInput>) => void;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, value, hint, onChange }: FieldProps) {
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

export function CertificateForm({ value, onChange }: CertificateFormProps) {
  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-label text-muted">
        Recipient
      </p>

      <Field
        id="recipient-name"
        label="Recipient name"
        value={value.recipientName}
        onChange={(recipientName) => onChange({ recipientName })}
      />
      <Field
        id="course-title"
        label="Course or achievement"
        value={value.courseTitle}
        onChange={(courseTitle) => onChange({ courseTitle })}
      />
      <Field
        id="date"
        label="Date"
        value={value.date}
        onChange={(date) => onChange({ date })}
      />
      <Field
        id="instructor"
        label="Instructor"
        value={value.instructor}
        hint="Defaults from brand settings, editable per certificate"
        onChange={(instructor) => onChange({ instructor })}
      />
    </section>
  );
}
