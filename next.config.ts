import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // يسمح فقط بالمصادر الضرورية فعلياً بالمشروع.
    // 🔥 تم إضافة نطاقات Sanity API للسماح بجلب البيانات.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://cdnjs.cloudflare.com https://server.arcgisonline.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com",
      "frame-src https://challenges.cloudflare.com https://www.google.com/maps",
      // 🔥 تم إضافة نطاق Sanity API الخاص بمشروعك لضمان عدم حظر الطلبات
      "connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://www.googletagmanager.com https://*.api.sanity.io https://*.sanity.io",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // مخرجات مستقلة للنشر على Hostinger Node — يُشغَّل بـ node .next/standalone/server.js
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ["image/webp", "image/avif"],
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);