import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tedxalfalahyouth.com"),
  title: {
    default: "TEDxAlFalah Youth | Tomorrow, Now.",
    template: "%s | TEDxAlFalah Youth",
  },
  description:
    "Young voices. Real ideas. The future starts earlier than we think. An independently organized TEDx event.",
  openGraph: {
    title: "TEDxAlFalah Youth | Tomorrow, Now.",
    description:
      "Young voices. Real ideas. The future starts earlier than we think.",
    url: "https://www.tedxalfalahyouth.com",
    siteName: "TEDxAlFalah Youth",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
