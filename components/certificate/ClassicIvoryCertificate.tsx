import { AutoFitText } from "@/components/certificate/AutoFitText";
import {
  CertificateMark,
  MARK_SIZE,
} from "@/components/certificate/CertificateMark";
import { CertificateRule } from "@/components/certificate/CertificateRule";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

const FRAME_INSET = 38;
const HAIRLINE_INSET = 47.5;
const CONTENT_WIDTH = 780;
const NAME_RULE_WIDTH = 560;
const SIGNATURE_WIDTH = 216;
/** Symmetric about the sheet centre, unlike Black Border's measured pair. */
const SIGNATURE_OFFSET = 270;

/** Auto-fit bounds: both blocks may run to two lines before they shrink, which
 *  is the room the flowed group has above the pinned base row. */
const NAME = { fontSize: 44, minFontSize: 24, lineHeight: 1.15, maxHeight: 44 * 1.15 * 2 };
const COURSE = { fontSize: 24, minFontSize: 15, lineHeight: 1.25, maxHeight: 24 * 1.25 * 2 };

/** Centred and quiet: the mark reads as a crest at the top, the award group
 *  flows under it so a long name pushes nothing off the sheet, and the base row
 *  is pinned. Worst case (a two-line name and a two-line title) bottoms out
 *  around 620, clear of the signatures at 660. */
const TOP = {
  mark: 74,
  title: 208,
  subtitle: 306,
  certify: 348,
  name: 380,
  signature: 660,
} as const;

function IvoryFrame() {
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
        x={FRAME_INSET}
        y={FRAME_INSET}
        width={CERT_WIDTH_PX - FRAME_INSET * 2}
        height={CERT_HEIGHT_PX - FRAME_INSET * 2}
        stroke="var(--color-cert-frame)"
        strokeWidth={1.5}
      />
      {/* Half-pixel inset keeps the 1px stroke on the pixel grid, as in
          CertificateFrame; on a whole number it renders washed out. */}
      <rect
        x={HAIRLINE_INSET}
        y={HAIRLINE_INSET}
        width={CERT_WIDTH_PX - HAIRLINE_INSET * 2}
        height={CERT_HEIGHT_PX - HAIRLINE_INSET * 2}
        stroke="var(--color-cert-border-thin)"
        strokeWidth={1}
      />
    </svg>
  );
}

interface SignatureBlockProps {
  value: string;
  caption: string;
  centre: number;
}

function SignatureBlock({ value, caption, centre }: SignatureBlockProps) {
  return (
    <div
      className="absolute text-center"
      style={{
        top: TOP.signature,
        left: centre - SIGNATURE_WIDTH / 2,
        width: SIGNATURE_WIDTH,
      }}
    >
      <div
        className="font-cert-display"
        style={{
          fontSize: 22,
          lineHeight: 1,
          minHeight: 22,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 8 }}>
        <CertificateRule width={SIGNATURE_WIDTH} />
      </div>
      <div
        className="uppercase text-cert-ink-soft"
        style={{
          marginTop: 10,
          fontSize: 12,
          lineHeight: 1,
          letterSpacing: "0.24em",
          textIndent: "0.24em",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

interface ClassicIvoryCertificateProps {
  input: CertificateInput;
  logoDataUrl?: string | null;
}

export function ClassicIvoryCertificate({
  input,
  logoDataUrl,
}: ClassicIvoryCertificateProps) {
  return (
    <div className="absolute inset-0 text-center">
      <IvoryFrame />

      <div
        className="absolute"
        style={{ top: TOP.mark, left: (CERT_WIDTH_PX - MARK_SIZE) / 2 }}
      >
        <CertificateMark logoDataUrl={logoDataUrl} />
      </div>

      <h1
        className="absolute inset-x-0 font-cert-display font-normal"
        style={{ top: TOP.title, fontSize: 84, lineHeight: 1 }}
      >
        Certificate
      </h1>

      <p
        className="absolute inset-x-0 uppercase text-cert-ink-soft"
        style={{
          top: TOP.subtitle,
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: "0.28em",
          textIndent: "0.28em",
        }}
      >
        of Completion
      </p>

      <p
        className="absolute inset-x-0 uppercase text-cert-ink-soft"
        style={{
          top: TOP.certify,
          fontSize: 14,
          lineHeight: 1,
          letterSpacing: "0.26em",
          textIndent: "0.26em",
        }}
      >
        This is to certify that
      </p>

      {/* Name, rule, lead, and title flow together, so a long name cannot push
          the pinned base row off the sheet. */}
      <div
        className="absolute"
        style={{
          top: TOP.name,
          left: (CERT_WIDTH_PX - CONTENT_WIDTH) / 2,
          width: CONTENT_WIDTH,
        }}
      >
        <AutoFitText
          text={input.recipientName}
          fontSize={NAME.fontSize}
          minFontSize={NAME.minFontSize}
          maxHeight={NAME.maxHeight}
          className="font-cert-display"
          style={{ lineHeight: NAME.lineHeight, minHeight: NAME.fontSize }}
        />

        <div className="mx-auto" style={{ marginTop: 16, width: NAME_RULE_WIDTH }}>
          <CertificateRule width={NAME_RULE_WIDTH} />
        </div>

        <p
          className="text-cert-ink-soft"
          style={{ marginTop: 24, fontSize: 20, lineHeight: 1 }}
        >
          Has completed the following Traversy Media course:
        </p>

        <AutoFitText
          text={input.courseTitle}
          fontSize={COURSE.fontSize}
          minFontSize={COURSE.minFontSize}
          maxHeight={COURSE.maxHeight}
          className="font-bold"
          style={{
            marginTop: 12,
            lineHeight: COURSE.lineHeight,
            minHeight: 30,
          }}
        />
      </div>

      <SignatureBlock
        value={input.instructor}
        caption="Instructor"
        centre={CERT_WIDTH_PX / 2 - SIGNATURE_OFFSET}
      />
      <SignatureBlock
        value={input.date}
        caption="Date"
        centre={CERT_WIDTH_PX / 2 + SIGNATURE_OFFSET}
      />
    </div>
  );
}
