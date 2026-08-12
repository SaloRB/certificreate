import {
  CertificateMark,
  MARK_SIZE,
} from "@/components/certificate/CertificateMark";
import { CertificateRule } from "@/components/certificate/CertificateRule";
import { CERT_WIDTH_PX, type CertificateInput } from "@/types/certificate";

const BAND_WIDTH = 96;
const CONTENT_LEFT = 168;
const MARGIN_RIGHT = 96;
/** Text stops short of the mark's column, so no value can ever run into it. */
const TEXT_WIDTH = 700;
const ACCENT_RULE = { width: 120, height: 3 };
const SIGNATURE_WIDTH = 260;
const SIGNATURE_GAP = 380;

/** Absolute from the sheet's top edge, like Black Border, so a block can only be
 *  wrong on its own. The exception is the award group (name, rule, lead, course):
 *  those four flow together from `TOP.name`, because pinning each one would need
 *  a band reserving three lines for a long name, which leaves a hole under a
 *  short one. Flowing them keeps the group tight either way, and its worst case
 *  (a name over three lines plus a two-line title) still bottoms out at 597,
 *  clear of the fixed base row at 640. The mark sits low on the right, giving the
 *  sheet a diagonal: display type top left, mark bottom right, signatures along
 *  the base. */
const TOP = {
  title: 108,
  subtitle: 194,
  certify: 252,
  name: 288,
  signature: 640,
  mark: 566,
} as const;

interface SignatureBlockProps {
  value: string;
  caption: string;
  left: number;
}

function SignatureBlock({ value, caption, left }: SignatureBlockProps) {
  return (
    <div className="absolute" style={{ top: TOP.signature, left }}>
      <div
        className="uppercase"
        style={{
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1,
          minHeight: 15,
          letterSpacing: "0.22em",
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
          marginTop: 9,
          fontSize: 13,
          lineHeight: 1,
          letterSpacing: "0.18em",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

interface ModernSlateCertificateProps {
  input: CertificateInput;
  logoDataUrl?: string | null;
}

export function ModernSlateCertificate({
  input,
  logoDataUrl,
}: ModernSlateCertificateProps) {
  return (
    <div className="absolute inset-0 text-left">
      <div
        className="absolute inset-y-0 left-0 bg-cert-border"
        style={{ width: BAND_WIDTH }}
        aria-hidden="true"
      />

      <div
        className="absolute"
        style={{ top: TOP.mark, left: CERT_WIDTH_PX - MARGIN_RIGHT - MARK_SIZE }}
      >
        <CertificateMark logoDataUrl={logoDataUrl} />
      </div>

      <h1
        className="absolute font-cert-display"
        style={{
          top: TOP.title,
          left: CONTENT_LEFT,
          width: TEXT_WIDTH,
          fontSize: 72,
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        Certificate
      </h1>

      <p
        className="absolute uppercase text-cert-ink-soft"
        style={{
          top: TOP.subtitle,
          left: CONTENT_LEFT,
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: "0.3em",
        }}
      >
        of Completion
      </p>

      <p
        className="absolute uppercase text-cert-ink-soft"
        style={{
          top: TOP.certify,
          left: CONTENT_LEFT,
          fontSize: 15,
          lineHeight: 1,
          letterSpacing: "0.2em",
        }}
      >
        This is to certify that
      </p>

      <div
        className="absolute"
        style={{ top: TOP.name, left: CONTENT_LEFT, width: TEXT_WIDTH }}
      >
        <p
          className="font-cert-display font-bold"
          style={{ fontSize: 44, lineHeight: 1.15, minHeight: 44 }}
        >
          {input.recipientName}
        </p>
        <div
          className="bg-cert-border"
          style={{ marginTop: 26, ...ACCENT_RULE }}
          aria-hidden="true"
        />

        <p
          className="text-cert-ink-soft"
          style={{ marginTop: 30, fontSize: 19, lineHeight: 1 }}
        >
          Has completed the following Traversy Media course:
        </p>

        <p
          className="font-bold"
          style={{
            marginTop: 14,
            fontSize: 26,
            lineHeight: 1.25,
            minHeight: 33,
          }}
        >
          {input.courseTitle}
        </p>
      </div>

      <SignatureBlock
        value={input.instructor}
        caption="Instructor"
        left={CONTENT_LEFT}
      />
      <SignatureBlock
        value={input.date}
        caption="Date"
        left={CONTENT_LEFT + SIGNATURE_GAP}
      />
    </div>
  );
}
