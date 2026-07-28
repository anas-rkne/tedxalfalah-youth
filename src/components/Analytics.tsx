"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export default function Analytics() {
  const pathname = usePathname();

  // Google Analytics: تتبع التنقل بين الصفحات (client-side)
  useEffect(() => {
    if (GA_ID && IS_PROD && typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("config", GA_ID, {
        page_path: pathname,
        anonymize_ip: true,
      });
    }
  }, [pathname]);

  return (
    <>
      {PLAUSIBLE_DOMAIN && IS_PROD && (
        <Script
          defer
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      {GA_ID && IS_PROD && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      )}
    </>
  );
}
