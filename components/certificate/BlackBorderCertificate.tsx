import { CertificateBody } from "@/components/certificate/CertificateBody";
import { CertificateFrame } from "@/components/certificate/CertificateFrame";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

interface BlackBorderCertificateProps {
  input: CertificateInput;
}

export function BlackBorderCertificate({ input }: BlackBorderCertificateProps) {
  return (
    <div
      data-certificate
      data-template-id={input.templateId}
      className="relative bg-cert-paper text-cert-ink font-cert-body"
      style={{ width: CERT_WIDTH_PX, height: CERT_HEIGHT_PX }}
    >
      <CertificateFrame />
      <CertificateBody input={input} />
    </div>
  );
}
