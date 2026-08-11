const SIZE = 121;
const CENTRE = SIZE / 2;
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

export function CertificateMark() {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
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
