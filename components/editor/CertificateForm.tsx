import { DateField } from "@/components/editor/DateField";
import { Field } from "@/components/editor/Field";
import type { CertificateField } from "@/lib/certificate/schema";
import type { CertificateInput } from "@/types/certificate";

interface CertificateFormProps {
  value: CertificateInput;
  errors: Partial<Record<CertificateField, string>>;
  onChange: (patch: Partial<CertificateInput>) => void;
}

export function CertificateForm({
  value,
  errors,
  onChange,
}: CertificateFormProps) {
  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-label text-muted">
        Recipient
      </p>

      <Field
        id="recipient-name"
        label="Recipient name"
        value={value.recipientName}
        error={errors.recipientName}
        onChange={(recipientName) => onChange({ recipientName })}
      />
      <Field
        id="course-title"
        label="Course or achievement"
        value={value.courseTitle}
        error={errors.courseTitle}
        onChange={(courseTitle) => onChange({ courseTitle })}
      />
      <DateField
        id="date"
        label="Date"
        value={value.date}
        error={errors.date}
        onChange={(date) => onChange({ date })}
      />
      <Field
        id="instructor"
        label="Instructor"
        value={value.instructor}
        hint="Defaults from brand settings, editable per certificate"
        error={errors.instructor}
        onChange={(instructor) => onChange({ instructor })}
      />
    </section>
  );
}
