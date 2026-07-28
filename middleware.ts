// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix, // يأخذ 'always' من ملف التكوين
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};