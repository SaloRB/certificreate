import { CertificateBody } from "@/components/certificate/CertificateBody";
import { CertificateFrame } from "@/components/certificate/CertificateFrame";
import type { CertificateInput } from "@/types/certificate";

interface BlackBorderCertificateProps {
  input: CertificateInput;
}

/** Artwork only. The sheet, its size, and its theme vars belong to
 *  `Certificate`, so every template draws into the same canvas. */
export function BlackBorderCertificate({ input }: BlackBorderCertificateProps) {
  return (
    <>
      <CertificateFrame />
      <CertificateBody input={input} />
    </>
  );
}
