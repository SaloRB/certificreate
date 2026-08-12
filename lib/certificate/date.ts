/** The one place the printed date format is defined. `CertificateInput.date`
 *  stays a display string (`MM/DD/YYYY`) so stored history and the render query
 *  string keep working; ISO exists only between the picker and this module. */

const DISPLAY_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Guards against the roll-over a Date constructor performs silently: 02/30
 *  would otherwise become March 2 rather than being rejected. */
function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Display string (or an ISO one already) to `YYYY-MM-DD` for the date input,
 *  or null when the value is not a date this app can round-trip. Legacy and
 *  hand-typed values reach here, so anything unparseable is a null, never a
 *  throw. */
export function toIsoDate(value: string): string | null {
  const trimmed = value.trim();

  const display = DISPLAY_PATTERN.exec(trimmed);
  if (display) {
    const [, month, day, year] = display;
    return isRealDate(Number(year), Number(month), Number(day))
      ? `${year}-${month}-${day}`
      : null;
  }

  const iso = ISO_PATTERN.exec(trimmed);
  if (iso) {
    const [, year, month, day] = iso;
    return isRealDate(Number(year), Number(month), Number(day))
      ? trimmed
      : null;
  }

  return null;
}

/** `YYYY-MM-DD` to the printed `MM/DD/YYYY`, or an empty string when the picker
 *  is cleared. */
export function formatCertificateDate(iso: string): string {
  const match = ISO_PATTERN.exec(iso.trim());
  if (!match) return "";

  const [, year, month, day] = match;
  if (!isRealDate(Number(year), Number(month), Number(day))) return "";

  return `${pad(Number(month))}/${pad(Number(day))}/${year}`;
}

export function isCertificateDate(value: string): boolean {
  return toIsoDate(value) !== null;
}
