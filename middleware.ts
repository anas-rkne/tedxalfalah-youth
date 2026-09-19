// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix, // يأخذ 'always' من ملف التكوين
});

export default function middleware(request: import('next/server').NextRequest) {
  const pathname = request.nextUrl.pathname;

  // شاشات العرض (screen/speaker) تُعطى علامة تُخفي بها الـ layout
  // الـ header/footer وعناصر الموقع — لعرض ملء الشاشة.
  const isStage =
    pathname.includes('/live/screen') || pathname.includes('/live/speaker');

  const response = intlMiddleware(request);

  if (isStage) {
    response.headers.set('x-stage-mode', '1');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};