import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer resolves Chrome from disk at runtime; bundling it breaks that path.
  serverExternalPackages: ["puppeteer"],
  // The dev badge overlaps the certificate sheet, so it lands inside locally
  // exported PNGs. Production never renders it; this keeps dev exports honest.
  devIndicators: false,
};

export default nextConfig;
