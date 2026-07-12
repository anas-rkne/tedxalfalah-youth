import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // يستثني: مسارات API، ملفات Next.js الداخلية، وملفات public الثابتة
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
