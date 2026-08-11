import { BlackBorderCertificate } from "@/components/certificate/BlackBorderCertificate";
import { fromRenderParams } from "@/lib/certificate/render-params";

/** The capture target for the export routes: one certificate at natural size at
 *  the document origin, with no app chrome and no preview scaling, so what
 *  Puppeteer photographs is the same component the preview shows. */
export default async function RenderCertificatePage({
  searchParams,
}: PageProps<"/render/certificate">) {
  const input = fromRenderParams(await searchParams);

  return (
    <div className="shrink-0">
      <BlackBorderCertificate input={input} />
    </div>
  );
}
