import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MobileNotice from "@/components/MobileNotice";

export const metadata: Metadata = {
  title: "Axionia — Healthcare Decision Intelligence",
  description:
    "Independent, transparent decision intelligence for employer benefit strategy. We tell you what we think — but we expose the entire model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-base text-navy min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNotice />
      </body>
    </html>
  );
}
