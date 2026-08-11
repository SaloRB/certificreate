import { BlackBorderCertificate } from "@/components/certificate/BlackBorderCertificate";
import { CertificateFit } from "@/components/certificate/CertificateFit";
import type { CertificateInput } from "@/types/certificate";

const PLACEHOLDER: CertificateInput = {
  recipientName: "Sarah Whitfield",
  courseTitle: "Coding With AI: Planning To Production",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};

export default function PreviewPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] p-8">
      <h1 className="mb-6 text-xs font-semibold uppercase tracking-label text-muted">
        Certificate preview
      </h1>
      <CertificateFit>
        <BlackBorderCertificate input={PLACEHOLDER} />
      </CertificateFit>
    </main>
  );
}
