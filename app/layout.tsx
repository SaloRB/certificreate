import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Lato } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Self-hosted at build time. The Puppeteer container has no system fonts to fall
// back to, so preview and export would drift if these loaded over the network.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400"],
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certificreate",
  description: "Turn a name, course, and date into a polished certificate",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
