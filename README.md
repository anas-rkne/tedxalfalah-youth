# TEDxAlFalah Youth Website

**"Tomorrow, Now."** — الموقع الرسمي لحدث TEDxAlFalah Youth: صفحات المتحدثين والفريق والجدول والمكان، نظام تقديم المتحدثين، الفورمات، والتكاملات الكاملة (Sanity، بريد SMTP حقيقي، حماية بوتات، تسجيل في Google Sheets).

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%E2%9C%93-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb)](https://react.dev)
[![Build Status](https://img.shields.io/badge/Build-Passing-success)]()
[![SMTP](https://img.shields.io/badge/SMTP-Hostinger-orange)](https://www.hostinger.com)
[![Deploy](https://img.shields.io/badge/Deploy-Hostinger%20Node-blueviolet)](https://www.hostinger.com)
[![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20AR-green)]()

---

## روابط سريعة

| | | | |
| :--- | :--- | :--- | :--- |
| 📄 [نظرة عامة](docs/01-overview.md) | 🏗️ [البنية المعمارية](docs/02-architecture.md) | 🛠️ [التثبيت والمتغيرات](docs/03-setup-and-env.md) | 🎨 [إدارة المحتوى](docs/04-content-management.md) |
| ✉️ [الفورمات والبريد](docs/05-forms-email-system.md) | 🔒 [الأمان والخصوصية](docs/06-security.md) | 📈 [SEO والتحليلات](docs/07-seo-and-analytics.md) | 🚀 [النشر والاستضافة](docs/08-deployment-hosting.md) |
| 📋 [دليل التشغيل اليومي](docs/09-operations-runbook.md) | 🆘 [استكشاف الأخطاء](docs/10-troubleshooting.md) | ✅ [الاختبارات](docs/11-testing-uat.md) | 🤝 [التسليم](docs/12-handover.md) |

ملاحظات التحديث: [CHANGELOG.md](CHANGELOG.md) · قالب البيئة: [`.env.local.example`](.env.local.example) · دليل الإعداد الكامل: `docs/03-setup-and-env.md`

---

## جدول حالة الخدمات

| الخدمة | الحالة | المفتاح المطلوب | أين يُقرأ في الكود |
| :--- | :--- | :--- | :--- |
| **Sanity CMS** | `⏳` (مشروع العميل الجديد `hisn3dku` جاهز وفارغ — نشر الـ Studio ينتظر دخول حساب العميل) | `NEXT_PUBLIC_SANITY_PROJECT_ID` · `SANITY_WEBHOOK_SECRET` | `src/lib/sanity.ts` · `src/app/api/revalidate/route.ts` |
| **SMTP (Email)** | `✅` **مفعّل ومُختبَر فعليًا** (تحقق SMTP + 5 رسائل حقيقية) | `SMTP_USER` · `SMTP_PASS` | `src/lib/mailer.ts` |
| **Google Sheets** | `⏳` (في انتظار الـ Service Account والـ private key) | `GOOGLE_PRIVATE_KEY` · `GOOGLE_SERVICE_ACCOUNT_EMAIL` · `GOOGLE_SHEET_ID` | `src/app/api/apply/route.ts` |
| **Turnstile (Cloudflare)** | `⏳` (في انتظار مفتاحي الموقع والسر — يعمل Fail-Open حاليًا) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` · `TURNSTILE_SECRET_KEY` | `src/lib/turnstile.ts` |
| **Upstash Redis** | `⏳` (في انتظار الـ URL/Token — Rate Limiting صامت بدونها) | `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` | `src/lib/rate-limit.ts` |
| **Webhook إبطال الكاش** | `⏳` (يعمل الرمز — يحتاج نشر الـ Studio وتفعيل السر) | `SANITY_WEBHOOK_SECRET` | `src/app/api/revalidate/route.ts` |
| **Platinumlist** | `✅` (الرابط مضبوط) | `NEXT_PUBLIC_PLATINUMLIST_URL` | `src/app/[locale]/tickets/page.tsx` |
| **Google Analytics 4** | `✅` (مفعّل — يُحمَّل في الإنتاج فقط) | `NEXT_PUBLIC_GA_ID` | `src/components/Analytics.tsx` |
| **Security Headers + CSP** | `✅` (مفعّلة في `next.config.ts`) | — | `next.config.ts` |

> **فلسفة Fail-Open**: الموقع يعمل بالكامل بلا أي مفتاح (بيانات تجريبية + تسجيل بالـ terminal) — كل `⏳` أعلاه تتحول تلقائيًا إلى تشغيل كامل بمجرد إضافة القيمة إلى `.env.local`. أدق مرجع لكل متغير: `docs/03-setup-and-env.md`.

---

## بدء التشغيل السريع (Quick Start)

```bash
npm install
npm run dev
```

افتح `http://localhost:3000` — الموقع كاملًا (EN/AR، 12 صفحة، كل الفورمات وAPIs) يعمل فورًا بلا إعداد.

للربط بالخدمات الحقيقية، انسخ القالب واملأ قيمك:

```bash
cp .env.local.example .env.local
```

أوامر التحقق قبل أي نشر (من `docs/11-testing-uat.md`):

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## الاعتمادات (Acknowledgments)

تم بناء هذا المشروع بجهود فريق TEDxAlFalah Youth، باستخدام التقنيات الحديثة لضمان تجربة تفاعلية وآمنة — Next.js 16، React 19، TypeScript، Tailwind v4، Sanity CMS، next-intl (EN/AR)، Nodemailer عبر SMTP Hostinger، Cloudflare Turnstile، Upstash Redis، وGoogle Sheets.