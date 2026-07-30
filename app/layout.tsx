import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MobileNotice from "@/components/MobileNotice";
import SiteChrome from "@/components/SiteChrome";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";

/**
 * Positioning note: healthcare remains the credibility spine — it's where the
 * spend, the waste and the founder's expertise are. But the product genuinely
 * covers the full benefit stack (PBM, dental, vision, disability, voluntary,
 * HSA/FSA), and HR leaders and CFOs search "benefits", not "healthcare
 * decision intelligence". Discovery copy is broadened; brand copy is not.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Axionia — Independent analysis of employee benefit programs",
    template: "%s — Axionia",
  },
  description:
    "The company selling a benefits program also supplies the study proving it works. Axionia checks it independently — benchmarking, scenario modeling and vendor claim review for self-funded employers at any scale.",
  keywords: [
    "employee benefits analysis",
    "benefits benchmarking",
    "vendor ROI review",
    "self-funded employer",
    "benefits consulting",
    "healthcare benefits analytics",
    "PBM contract review",
    "benefits due diligence",
  ],
  openGraph: {
    type: "website",
    siteName: "Axionia",
    url: SITE,
    title: "Axionia — Independent analysis of employee benefit programs",
    description:
      "The company selling a benefits program also supplies the study proving it works. We check it — independently, with every assumption on the table.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axionia — Independent analysis of employee benefit programs",
    description:
      "The company selling a benefits program also supplies the study proving it works. We check it — independently.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-base text-navy min-h-screen flex flex-col">
        <SiteChrome nav={<Nav />} footer={<Footer />} notice={<MobileNotice />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
