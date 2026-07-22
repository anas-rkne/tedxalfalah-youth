import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/FooterWrapper" ;
import CustomCursorWrapper from "@/components/ui/CustomCursorWrapper";
import ReadingProgress from "@/components/ui/ReadingProgress";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import { routing } from "@/i18n/routing";
import PageTransition from "@/components/ui/PageTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi-arabic",
  subsets: ["arabic"],
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoKufiArabic.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body
        className={`min-h-full flex flex-col ${locale === "ar" ? "font-arabic" : ""}`}
      >
        <NextIntlClientProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-red-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
          >
            Skip to content
          </a>
          <ReadingProgress />
          <CustomCursorWrapper />
          <Header />

          <main
            id="main-content"
            className="flex-1 relative"
          >
            <PageTransition>
              {children}
            </PageTransition>
          </main>

          <ScrollIndicator />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}