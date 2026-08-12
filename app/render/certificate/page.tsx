import { Certificate } from "@/components/certificate/Certificate";
import { fromRenderParams } from "@/lib/certificate/render-params";

/** The capture target for the export routes: one certificate at natural size at
 *  the document origin, with no app chrome and no preview scaling, so what
 *  Puppeteer photographs is the same component the preview shows. */
export default async function RenderCertificatePage({
  searchParams,
}: PageProps<"/render/certificate">) {
  const input = fromRenderParams(await searchParams);

  // The white backdrop is load-bearing for the PDF, which photographs the whole
  // page rather than the sheet: Chrome rounds the requested paper size up by a
  // fraction of a pixel, and without this the app's dark body background prints
  // as a hairline down the right and bottom edges.
  return (
    <div className="min-h-screen w-full shrink-0 bg-cert-paper">
      <Certificate input={input} />
    </div>
  );
}
