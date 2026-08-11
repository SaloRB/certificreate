import { CERT_HEIGHT_PX, CERT_WIDTH_PX } from "@/types/certificate";

const OUTER_RULE_INSET = 16;
const BORDER_INSET = 30;
/** Half-pixel offset lands the 1px stroke on the pixel grid; on a whole number it
 *  antialiases across two pixels and renders visibly washed out. */
const HAIRLINE_INSET = 44.5;
const BORDER_RADIUS = 35.5;
/** The hairline's corner is elliptical on the reference, not circular: it leaves
 *  the horizontal line further out than it meets the vertical one. */
const HAIRLINE_RADIUS = { rx: 35.5, ry: 22 };

/** Rectangle whose corners are cut by a quarter-arc centred on the corner point,
 *  so each arc bulges inward. Measured off the reference: the corners are
 *  concave, which is why this is an SVG path and not a border-radius. */
function concaveRectPath(inset: number, rx: number, ry: number) {
  const left = inset;
  const top = inset;
  const right = CERT_WIDTH_PX - inset;
  const bottom = CERT_HEIGHT_PX - inset;
  const arc = `a ${rx} ${ry} 0 0 0`;

  return [
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `${arc} ${rx} ${ry}`,
    `V ${bottom - ry}`,
    `${arc} ${-rx} ${ry}`,
    `H ${left + rx}`,
    `${arc} ${-rx} ${-ry}`,
    `V ${top + ry}`,
    `${arc} ${rx} ${-ry}`,
    "Z",
  ].join(" ");
}

export function CertificateFrame() {
  return (
    <svg
      className="absolute inset-0"
      width={CERT_WIDTH_PX}
      height={CERT_HEIGHT_PX}
      viewBox={`0 0 ${CERT_WIDTH_PX} ${CERT_HEIGHT_PX}`}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x={OUTER_RULE_INSET}
        y={OUTER_RULE_INSET}
        width={CERT_WIDTH_PX - OUTER_RULE_INSET * 2}
        height={CERT_HEIGHT_PX - OUTER_RULE_INSET * 2}
        stroke="var(--color-cert-frame)"
        strokeWidth={2}
      />
      <path
        d={concaveRectPath(BORDER_INSET, BORDER_RADIUS, BORDER_RADIUS)}
        stroke="var(--color-cert-border)"
        strokeWidth={4.5}
      />
      <path
        d={concaveRectPath(
          HAIRLINE_INSET,
          HAIRLINE_RADIUS.rx,
          HAIRLINE_RADIUS.ry,
        )}
        stroke="var(--color-cert-border-thin)"
        strokeWidth={1}
      />
    </svg>
  );
}
