import type { NextRequest } from "next/server";

import { handleExportRequest } from "@/lib/certificate/export-route";
import { captureCertificate } from "@/lib/puppeteer/capture-certificate";
import type { BrandColors } from "@/types/brand";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

export const runtime = "nodejs";

function renderPdf(input: CertificateInput, colors: BrandColors) {
  return captureCertificate(input, {
    colors,
    capture: async (page) => {
      // page.pdf() switches to print media, which repaints the page. The whole
      // premise here is that preview and export never diverge, so stay on screen.
      await page.emulateMediaType("screen");

      // Sized from the sheet rather than format A4: A4 landscape is 1122.52 x
      // 793.7px, half a pixel narrower than the sheet, so format sizing spills
      // onto a blank second page. pageRanges is the belt to that braces.
      const pdf = await page.pdf({
        width: `${CERT_WIDTH_PX}px`,
        height: `${CERT_HEIGHT_PX}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        pageRanges: "1",
      });

      return new Uint8Array(pdf);
    },
  });
}

export async function POST(request: NextRequest) {
  return handleExportRequest(request, {
    contentType: "application/pdf",
    extension: "pdf",
    render: renderPdf,
  });
}
