export const MARK_SIZE = 121;

const CENTRE = MARK_SIZE / 2;
const DOT_RADIUS = 5.6;
const DOT_GAP_X = 14.7;

/** Dot offsets from the circle centre, measured off the reference: three across
 *  the top, then the stem running down - a T. */
const DOTS = [
  [-DOT_GAP_X, -20.6],
  [0, -20.6],
  [DOT_GAP_X, -20.6],
  [0, -4.9],
  [0, 9.4],
  [0, 24.4],
] as const;

interface CertificateMarkProps {
  /** A brand logo, already validated. Takes the mark's slot when present. */
  logoDataUrl?: string | null;
}

/** The default mark, or the user's logo fitted into the same square so no
 *  template has to lay out two different shapes. */
export function CertificateMark({ logoDataUrl }: CertificateMarkProps) {
  if (logoDataUrl) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: MARK_SIZE, height: MARK_SIZE }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL has nothing for the image optimiser to fetch */}
        <img
          src={logoDataUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <svg
      width={MARK_SIZE}
      height={MARK_SIZE}
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={57.85}
        stroke="var(--color-cert-border)"
        strokeWidth={5.3}
      />
      {DOTS.map(([dx, dy]) => (
        <circle
          key={`${dx},${dy}`}
          cx={CENTRE + dx}
          cy={CENTRE + dy}
          r={DOT_RADIUS}
          fill="var(--color-cert-border)"
        />
      ))}
    </svg>
  );
}
