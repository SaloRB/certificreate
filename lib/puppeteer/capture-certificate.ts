import type { Page, Viewport } from "puppeteer";

import {
  dropRenderLogo,
  putRenderLogo,
} from "@/lib/certificate/render-handoff";
import { toRenderParams } from "@/lib/certificate/render-params";
import { withPage } from "@/lib/puppeteer/browser";
import { renderOrigin } from "@/lib/puppeteer/render-origin";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

interface CaptureOptions<T> {
  /** Applied before navigation, so the page lays out at the capture size once. */
  viewport?: Viewport;
  brand?: ExportBrand;
  capture: (page: Page) => Promise<T>;
}

/** Loads the chrome-free render target on a fresh page and hands it to `capture`
 *  once the fonts have applied. Both export routes go through here so a PNG and a
 *  PDF of the same input can never be photographs of different pages. */
export async function captureCertificate<T>(
  input: CertificateInput,
  { viewport, brand, capture }: CaptureOptions<T>,
): Promise<T> {
  // The logo is handed over in-process and referenced by token: a data URL would
  // blow past the request-line limit on the way to the render page.
  const logoToken = brand?.logoDataUrl
    ? putRenderLogo(brand.logoDataUrl)
    : undefined;
  const url = `${renderOrigin()}/render/certificate?${toRenderParams(input, brand?.colors, logoToken)}`;

  try {
    return await withPage(async (page) => {
      if (viewport) await page.setViewport(viewport);
      await page.goto(url, { waitUntil: "networkidle0" });
      // networkidle0 covers the font requests, not the layout that applies them.
      await page.evaluate(() => document.fonts.ready);

      return capture(page);
    });
  } finally {
    // A render that never reached the page would otherwise leave the image in
    // memory until its TTL.
    if (logoToken) dropRenderLogo(logoToken);
  }
}
