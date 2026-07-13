import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CustomCursorWrapper from "@/components/ui/CustomCursorWrapper";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// خط عربي مخصص — Geist لا يدعم الحروف العربية، لذلك نحمّل خطاً منفصلاً
// يُستخدم فقط عند locale=ar عبر متغير CSS مشروط بالـ <html lang>.
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
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

  // يُخبر next-intl أن هذه الصفحة تُصيَّر بلغة ثابتة، مما يسمح بالتوليد
  // الثابت (Static Rendering) لكل الصفحات بدل جعلها كلها ديناميكية.
  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col ${locale === "ar" ? "font-arabic" : ""}`}
      >
        <NextIntlClientProvider>
          <CustomCursorWrapper />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
