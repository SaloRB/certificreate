const TICK_HEIGHT = 7;

interface CertificateRuleProps {
  width: number;
  /** The reference draws the name rule heavier than the signature rules. */
  lineWidth?: number;
}

/** Horizontal rule with a short vertical tick at each end, as on the reference.
 *  Drawn as SVG so the 1px strokes stay crisp on the pixel grid. */
export function CertificateRule({ width, lineWidth = 1 }: CertificateRuleProps) {
  const midY = TICK_HEIGHT / 2;

  return (
    <svg
      width={width}
      height={TICK_HEIGHT}
      viewBox={`0 0 ${width} ${TICK_HEIGHT}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={`M 0.5 0 V ${TICK_HEIGHT} M ${width - 0.5} 0 V ${TICK_HEIGHT}`}
        stroke="var(--color-cert-rule)"
        strokeWidth={1}
      />
      <path
        d={`M 0 ${midY} H ${width}`}
        stroke="var(--color-cert-rule)"
        strokeWidth={lineWidth}
      />
    </svg>
  );
}
