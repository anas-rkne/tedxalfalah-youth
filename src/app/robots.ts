import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // ⚠️ كان الحظر على "/admin" فقط. المسارات الحية مبنية بنمط
      // "/[locale]/…" ⇒ المسار الفعلي "/ar/live" أو "/en/live"، وهو ما لا
      // يطابق "/admin" ولا حتى "/live" — فكانت شاشات الحضور والمتحدث
      // والاستبيان قابلة للزحف والفهرسة.
      disallow: [
        "/admin",
        "/ar/admin",
        "/en/admin",
        "/live",
        "/ar/live",
        "/en/live",
        "/api/",
      ],
    },
    sitemap: `${process.env.BASE_URL || "https://www.tedxalfalahyouth.com"}/sitemap.xml`,
  };
}
