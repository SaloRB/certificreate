import type { NextRequest } from "next/server";

import {
  certificateFileName,
  parseCertificateInput,
} from "@/lib/certificate/export-request";
import { toRenderParams } from "@/lib/certificate/render-params";
import { withPage } from "@/lib/puppeteer/browser";
import {
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  type CertificateInput,
} from "@/types/certificate";

export const runtime = "nodejs";

/** Print-sharp without the render cost of 3x. */
const DEVICE_SCALE_FACTOR = 2;

async function renderPng(
  input: CertificateInput,
  origin: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const url = `${origin}/render/certificate?${toRenderParams(input)}`;

  return withPage(async (page) => {
    await page.setViewport({
      width: CERT_WIDTH_PX,
      height: CERT_HEIGHT_PX,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });
    await page.goto(url, { waitUntil: "networkidle0" });
    // networkidle0 covers the font requests, not the layout that applies them.
    await page.evaluate(() => document.fonts.ready);

    const sheet = await page.$("[data-certificate]");
    if (!sheet) throw new Error("Render page produced no certificate element");

    // Copied into a plain ArrayBuffer view: Puppeteer types the screenshot as
    // possibly SharedArrayBuffer-backed, which Response rejects as a body.
    return new Uint8Array(await sheet.screenshot({ type: "png" }));
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = parseCertificateInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const png = await renderPng(parsed.input, new URL(request.url).origin);
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${certificateFileName(parsed.input, "png")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PNG export failed", error);
    return Response.json(
      { error: "Could not generate the certificate. Please try again." },
      { status: 500 },
    );
  }
}
