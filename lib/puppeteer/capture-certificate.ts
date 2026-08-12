import type { Page, Viewport } from "puppeteer";

import { AUTOFIT_PENDING_ATTRIBUTE } from "@/lib/certificate/autofit";
import {
  dropRenderLogo,
  putRenderLogo,
} from "@/lib/certificate/render-handoff";
import { toRenderParams } from "@/lib/certificate/render-params";
import { withPage } from "@/lib/puppeteer/browser";
import { renderOrigin } from "@/lib/puppeteer/render-origin";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

/** Only ever reached when hydration never lands, so it can afford to be
 *  generous: the common path resolves in a frame or two. */
const AUTOFIT_TIMEOUT_MS = 10_000;

/** The long-name fit runs on the client, so the capture has to wait for it or it
 *  photographs text at its pre-shrink size. Never fatal: if hydration failed the
 *  page still holds a complete certificate at the designed sizes, which is a far
 *  better outcome than refusing an export the user asked for. */
async function waitForAutoFit(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      (attribute: string) => !document.querySelector(`[${attribute}]`),
      { timeout: AUTOFIT_TIMEOUT_MS },
      AUTOFIT_PENDING_ATTRIBUTE,
    );
  } catch {
    // Timed out. Capture what is on the page.
  }
}

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
      await waitForAutoFit(page);

      return capture(page);
    });
  } finally {
    // A render that never reached the page would otherwise leave the image in
    // memory until its TTL.
    if (logoToken) dropRenderLogo(logoToken);
  }
}
