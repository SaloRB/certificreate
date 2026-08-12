import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer resolves Chrome from disk at runtime; bundling it breaks that path.
  serverExternalPackages: ["puppeteer"],
  // The dev badge overlaps the certificate sheet, so it lands inside locally
  // exported PNGs. Production never renders it; this keeps dev exports honest.
  devIndicators: false,
  // Chrome loads the render page over loopback (see `renderOrigin`), which dev
  // treats as a cross-origin request and answers with 403 for /_next assets.
  // Without this the render page never hydrates in dev, so the long-name fit
  // silently does not run and local exports disagree with production.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
