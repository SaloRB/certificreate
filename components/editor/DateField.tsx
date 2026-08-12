"use client";

import {
  FieldShell,
  fieldErrorId,
  fieldInputClass,
} from "@/components/editor/Field";
import { formatCertificateDate, toIsoDate } from "@/lib/certificate/date";

interface DateFieldProps {
  id: string;
  label: string;
  /** The printed value, `MM/DD/YYYY`. */
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

/** The native picker, converting at the boundary so `CertificateInput.date`
 *  stays the display string every stored record already holds. A value the
 *  parser cannot read (typed before this field existed) leaves the picker empty
 *  rather than throwing; validation then names it. */
export function DateField({
  id,
  label,
  value,
  error,
  onChange,
}: DateFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        type="date"
        value={toIsoDate(value) ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? fieldErrorId(id) : undefined}
        onChange={(event) => onChange(formatCertificateDate(event.target.value))}
        // The app is dark-only, and without this Chrome paints the calendar icon
        // and the picker panel in light-scheme colours.
        className={`${fieldInputClass(error)} [color-scheme:dark]`}
      />
    </FieldShell>
  );
}
