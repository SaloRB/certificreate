import { BlackBorderCertificate } from "@/components/certificate/BlackBorderCertificate";
import { ClassicIvoryCertificate } from "@/components/certificate/ClassicIvoryCertificate";
import { ModernSlateCertificate } from "@/components/certificate/ModernSlateCertificate";
import type { TemplateId } from "@/lib/templates/definitions";
import type { CertificateTemplateComponent } from "@/types/template";

/** Keyed by `TemplateId`, so a registry entry with no component is a compile
 *  error rather than a blank sheet at runtime. */
export const TEMPLATE_COMPONENTS: Record<
  TemplateId,
  CertificateTemplateComponent
> = {
  "black-border": BlackBorderCertificate,
  "modern-slate": ModernSlateCertificate,
  "classic-ivory": ClassicIvoryCertificate,
};
