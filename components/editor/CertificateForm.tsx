import { Field } from "@/components/editor/Field";
import type { CertificateInput } from "@/types/certificate";

interface CertificateFormProps {
  value: CertificateInput;
  onChange: (patch: Partial<CertificateInput>) => void;
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
