import type { NextRequest } from "next/server";

import { handleExportRequest } from "@/lib/certificate/export-route";
import { captureCertificate } from "@/lib/puppeteer/capture-certificate";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

export const runtime = "nodejs";

/** Print-sharp without the render cost of 3x. */
const DEVICE_SCALE_FACTOR = 2;

function renderPng(input: CertificateInput) {
  return captureCertificate(input, {
    viewport: {
      width: CERT_WIDTH_PX,
      height: CERT_HEIGHT_PX,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    },
    capture: async (page) => {
      const sheet = await page.$("[data-certificate]");
      if (!sheet) throw new Error("Render page produced no certificate element");

      // Copied into a plain ArrayBuffer view: Puppeteer types the screenshot as
      // possibly SharedArrayBuffer-backed, which Response rejects as a body.
      return new Uint8Array(await sheet.screenshot({ type: "png" }));
    },
  });
}

export async function POST(request: NextRequest) {
  return handleExportRequest(request, {
    contentType: "image/png",
    extension: "png",
    render: renderPng,
  });
}
