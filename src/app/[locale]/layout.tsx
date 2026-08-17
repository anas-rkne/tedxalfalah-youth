import type { Metadata } from "next";
import localFont from "next/font/local";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import Header from "@/components/layout/Header";
import FooterContent from "@/components/layout/FooterContent";
import CustomCursorWrapper from "@/components/ui/CustomCursorWrapper";
import Analytics from "@/components/Analytics";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SonnerProvider from "@/components/SonnerProvider";
import ReadingProgress from "@/components/ui/ReadingProgress";
import { routing } from "@/i18n/routing";
import enMessages from "../../../messages/en.json";
import arMessages from "../../../messages/ar.json";
import PageTransition from "@/components/ui/PageTransition";
import { NextIntlClientProvider } from "next-intl";
import JsonLd from "@/components/JsonLd";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { organizationSchema } from "@/lib/json-ld";

const baseUrl = process.env.BASE_URL || "https://www.tedxalfalahyouth.com";

const inter = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const notoKufiArabic = localFont({
  src: "./fonts/NotoKufiArabic.woff2",
  variable: "--font-noto-kufi-arabic",
  display: "swap",
  preload: true,
  weight: "400 900",
});

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-poppins-face",
  display: "swap",
  preload: true,
});

const alexandria = localFont({
  src: "./fonts/Alexandria.ttf",
  variable: "--font-alexandria-face",
  display: "swap",
  preload: true,
  weight: "100 900",
});

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale, namespace: "home.meta" });
  const siteTitle = "TEDxAlFalah Youth | Tomorrow, Now.";
  const siteDesc =
    "Young voices. Real ideas. The future starts earlier than we think. An independently organized TEDx event.";
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteTitle,
      template: `%s | TEDxAlFalah Youth`,
    },
    description: siteDesc,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/my-favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/my-favicon/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/my-favicon/favicon.ico",
      apple: [
        { url: "/my-favicon/apple-touch-icon.png", sizes: "180x180" },
      ],
    },
    appleWebApp: {
      title: "TEDxAlFalah Youth",
      statusBarStyle: "black-translucent",
      capable: true,
    },
    manifest: "/my-favicon/site.webmanifest",
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
      },
    },
    openGraph: {
      title: siteTitle,
      description: siteDesc,
      url: baseUrl,
      siteName: "TEDxAlFalah Youth",
      locale: locale === "ar" ? "ar_AE" : "en_US",
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDesc,
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

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
  // تحميل الرسائل مباشرة من locale القادم من params — يضمن أن Provider يحمل
  // رسائل اللغة الصحيحة في كل أوضاع العرض (ديناميكي/ثابت/هيدريشن) ولا يعتمد
  // على requestLocale الذي قد يكون undefined في تمريرات العرض الثابتة.
  const messages = locale === "ar" ? arMessages : enMessages;

  return (
    <html
      data-scroll-behavior="smooth"
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoKufiArabic.variable} ${poppins.variable} ${alexandria.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <JsonLd data={organizationSchema()} />
      </head>
      <body
        className={`min-h-full flex flex-col ${locale === "ar" ? "font-arabic" : ""}`}
      >
        {/* الترجمات تُمرَّر من السيرفر — SSR كامل بدون "Loading..." */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Analytics />
          <ServiceWorkerRegister />
          <BreadcrumbJsonLd />
          <a
            href="#main-content"
            lang={locale}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-red-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
          >
            {locale === "ar" ? "تخطى إلى المحتوى" : "Skip to content"}
          </a>
          <ReadingProgress />
          <CustomCursorWrapper />
          <Header key={locale} />
          <main id="main-content" className="flex-1 relative">
            <PageTransition>{children}</PageTransition>
          </main>
<FooterContent />
          <SonnerProvider />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}