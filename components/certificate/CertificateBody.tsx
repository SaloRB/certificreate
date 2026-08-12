import { CertificateMark } from "@/components/certificate/CertificateMark";
import { CertificateRule } from "@/components/certificate/CertificateRule";
import { CERT_WIDTH_PX, type CertificateInput } from "@/types/certificate";

const NAME_RULE_WIDTH = 707;
const SIGNATURE_WIDTH = 216;
/** Widest any body text may run, keeping it clear of the frame. */
const CONTENT_WIDTH = 860;
const SIGNATURE_CENTRES = { instructor: 288.8, date: 833.5 };

/** Each block is positioned absolutely from the sheet's top edge, at coordinates
 *  measured off the reference. Flow layout would compound every spacing error
 *  down the stack; here a block can only be wrong on its own. */
const TOP = {
  title: 116,
  subtitle: 239,
  certify: 335,
  nameBlock: 440,
  lead: 485,
  course: 536,
  signature: 646,
  mark: 593.5,
} as const;

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
        className="uppercase"
        style={{
          fontSize: 16,
          fontWeight: 300,
          lineHeight: 1,
          minHeight: 16,
          letterSpacing: "0.4em",
          textIndent: "0.4em",
          // Tracked caps overflow the rule width before they should wrap; a
          // second line would push the caption off its measured position.
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 6 }}>
        <CertificateRule width={SIGNATURE_WIDTH} />
      </div>
      <div
        className="text-cert-ink-soft"
        style={{ marginTop: 10, fontSize: 21, fontWeight: 300, lineHeight: 1 }}
      >
        {caption}
      </div>
    </div>
  );
}

interface CertificateBodyProps {
  input: CertificateInput;
  logoDataUrl?: string | null;
}

export function CertificateBody({
  input,
  logoDataUrl,
}: CertificateBodyProps) {
  return (
    <div className="absolute inset-0 text-center">
      <h1
        className="absolute inset-x-0 font-cert-display font-normal"
        style={{ top: TOP.title, fontSize: 132, lineHeight: 1 }}
      >
        Certificate
      </h1>

      <p
        className="absolute inset-x-0 font-cert-display"
        style={{ top: TOP.subtitle, fontSize: 60, lineHeight: 1 }}
      >
        of Completion
      </p>

      <p
        className="absolute inset-x-0 uppercase text-cert-ink-soft"
        style={{
          top: TOP.certify,
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: "0.3em",
          textIndent: "0.3em",
        }}
      >
        This is to certify that
      </p>

      <div
        className="absolute"
        style={{
          top: TOP.nameBlock,
          left: (1123 - NAME_RULE_WIDTH) / 2,
          width: NAME_RULE_WIDTH,
        }}
      >
        {/* minHeight holds the rule in place when the name is empty */}
        <div
          className="font-bold uppercase"
          style={{
            fontSize: 16,
            lineHeight: 1,
            minHeight: 16,
            letterSpacing: "0.26em",
            textIndent: "0.26em",
          }}
        >
          {input.recipientName}
        </div>
        <div style={{ marginTop: 8 }}>
          <CertificateRule width={NAME_RULE_WIDTH} lineWidth={2} />
        </div>
      </div>

      <p
        className="absolute inset-x-0 text-cert-ink-soft"
        style={{ top: TOP.lead, fontSize: 27, lineHeight: 1 }}
      >
        Has completed the following Traversy Media course:
      </p>

      {/* Capped so a long title wraps inside the frame instead of running out
          past the border. Shrinking it to fit is feature 8's job. */}
      <p
        className="absolute mx-auto font-bold"
        style={{
          top: TOP.course,
          left: (CERT_WIDTH_PX - CONTENT_WIDTH) / 2,
          width: CONTENT_WIDTH,
          fontSize: 29,
          lineHeight: 1.15,
          minHeight: 33,
        }}
      >
        {input.courseTitle}
      </p>

      <SignatureBlock
        value={input.instructor}
        caption="Instructor"
        centre={SIGNATURE_CENTRES.instructor}
      />

      <div
        className="absolute"
        style={{ top: TOP.mark, left: 500 }}
        data-certificate-mark
      >
        <CertificateMark logoDataUrl={logoDataUrl} />
      </div>

      <SignatureBlock
        value={input.date}
        caption="Date"
        centre={SIGNATURE_CENTRES.date}
      />
    </div>
  );
}
