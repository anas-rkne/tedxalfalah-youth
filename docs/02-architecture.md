# 02 — البنية المعمارية للمشروع (Architecture)

**الملف**: `docs/02-architecture.md`
**الجمهور المستهدف**: مطورون ومهندسون — وثيقة "كيف يعمل النظام ولماذا بُني هكذا".
**المصدر**: الكود الفعلي في جذر المشروع (قراءة موثّقة بالمسارات)، أغسطس 2026.

---

## 1. مخطط التقنيات (Tech Stack)

### 1.1 التفاصيل (dependencies)

| الحزمة | الإصدار المطلوب | دورها في المشروع (من الاستخدام الفعلي) |
|---|---|---|
| `next` | ^16.2.10 | إطار العمل — App Router + مسارات `src/app/[locale]/` و`src/app/api/` + بناء Turbopack |
| `react` / `react-dom` | ^19.2.4 | مكتبة الواجهات — مكوّنات `src/components/` ونظام الجلسات |
| `typescript` | ^5 | فحص صارم — `npx tsc --noEmit` نظيف، الأنواع في `src/lib/types.ts` |
| `next-intl` | ^4.13.2 | الترجمات EN/AR — `middleware.ts` + `src/i18n/` + `messages/*.json` |
| `@sanity/client` | ^7.23.0 | عميل قراءة Sanity — `src/lib/sanity.ts` (CDN، بلا توكن) |
| `@sanity/image-url` | ^2.1.1 | توليد روابط الصور المقطوعة — `urlFor()` في `src/lib/sanity.ts` |
| `nodemailer` | ^9 (مثبّت حديثًا) | إرسال البريد عبر SMTP Hostinger — `src/lib/mailer.ts` |
| `@upstash/ratelimit` + `@upstash/redis` | ^2.0.8 + ^1.38.0 | Rate Limiting — `src/lib/rate-limit.ts` (نافذة منزلقة 5/10د) |
| `google-spreadsheet` + `google-auth-library` | ^5.3.0 + ^10.9.0 | حفظ طلبات Apply في Google Sheet — `saveToGoogleSheet` في `src/app/api/apply/route.ts` |
| `react-hook-form` + `@hookform/resolvers` | ^7.81.0 + ^3.9.0 | الفورمات — `src/components/apply/ApplicationForm.tsx` مع zod resolver |
| `zod` | ^3.23.8 | التحقق الموحّد — نفس المخططات في الفورمات والـ API routes |
| `framer-motion` | ^12.42.2 | الأنيميشن: Hero، Flip Clock، ScrollReveal، PageTransition... |
| `three` + `@react-three/fiber` + `@react-three/drei` + `three-globe` | ^0.174 / ^9.6 / ^10.7 / ^2.45 | الكوكب التفاعلي — `src/components/ui/globe.tsx` و`tedx-globe.tsx` |
| `leaflet` + `react-leaflet` | ^1.9.4 + ^5.0.0 | خريطة الهوم — `src/components/ui/LeafletMap.tsx` (بلاطات Carto) |
| `lucide-react` | ^1.25.0 | أيقونات — مستخدمة بكثافة (Header، Tickets، FAQ...) |
| `sonner` | ^2.0.7 | إشعارات Toast — `SonnerProvider.tsx` |
| `clsx` + `tailwind-merge` + `class-variance-authority` | ^3.6^2.1 + ^0.7 | بناء الفئات — `cn()` في `src/lib/utils.ts` |
| `tailwindcss` | ^4 | التنسيق — عبر `@tailwindcss/postcss` و`tw-animate-css` |
| `resend` | ^6.17.1 | **مثبّت وغير مستخدم** — أُبقيَ من المرحلة السابقة (انظر القرار المعماري 1) |

### 1.2 التفاصيل (devDependencies)

| الحزمة | الإصدار | الدور |
|---|---|---|
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/leaflet` | ^20 / ^19 / ^19 / ^1.9 | أنواع TypeScript |
| `eslint` + `eslint-config-next` | ^9 + 16.2.10 | الفحص — `npm run lint` |
| `@tailwindcss/postcss` | ^4 | معالج CSS |
| `shadcn` | ^4.13.0 | أدوات تطويرية (المكوّنات مدمجة فعلًا في `src/components/ui/`) |

> **ملاحظة:** كل الترجمات في `messages/en.json` + `messages/ar.json` (8 مجموعات)، و`studio/` له `package.json` مستقل بحزم Sanity Studio الخاصة به — لا يُثبَّت مع حزم الموقع الرئيسي.

---

## 2. خريطة المجلدات الكاملة (Directory Tree)

```
tedxalfalahyouth-website/
│
├── .env.local                  ← المتغيرات الحقيقية (محمي من Git عبر `.gitignore`)
├── .env.local.example          ← قالب المتغيرات الموثّق (مرفوع مع الكود الآن)
├── .gitignore                  ← يحمي `.env*` و`node_modules` و`.next`... + استثناء `.env.local.example`
├── package.json                ← الحزم والـ scripts (build/start/dev/lint)
├── next.config.ts              ← CSP وأمان + إعدادات الصور (Sanity CDN) + next-intl plugin
├── middleware.ts               ← توجيه اللغة (next-intl) — يعرضه Next 16 كـ "Proxy (Middleware)"
├── README.md                   ← دليل التشغيل السريع
├── DOCUMENTATION.md            ← التوثيق القديم (يُستبدل تدريجيًا ببنية docs/)
├── docs/                       ← التوثيق الجديد (هذه السلسلة)
├── messages/
│   ├── en.json                 ← كل النصوص بالإنجليزية (8 مجموعات)
│   └── ar.json                 ← كل النصوص بالعربية (نفس البنية تمامًا)
│
├── public/                     ← أصول ثابتة تُخدم من الجذر مباشرة
│   ├── sw.js                   ← Service Worker v2 (تفريغ الكاش + تجاوز الطلبات غير الأصلية)
│   ├── offline.html            ← صفحة "لا يوجد اتصال"
│   ├── og-image.jpg            ← صورة المشاركة الاجتماعية (1200×630)
│   ├── favicon.ico
│   ├── my-favicon/             ← أيقونات PWA كاملة + site.webmanifest
│   └── images/                 ← logo-black.png، صور SVG (شخصيات/خريطة الإمارات)، صور venue
│
├── src/
│   ├── app/
│   │   ├── [locale]/           ← كل الصفحات تحت معامل اللغة (en/ar)
│   │   │   ├── layout.tsx      ← الترويسة/التذييل/الخطوط المحلية/dir rtl/SEP الجذر
│   │   │   ├── page.tsx        ← الرئيسية (أقسام مجمّعة بـ ShowToggle)
│   │   │   ├── speakers/       ← قائمة المتحدثين (404 إن كان showSpeakers=false)
│   │   │   ├── team/           ← أعضاء الفريق
│   │   │   ├── activations/    ← الأنشطة في المكان
│   │   │   ├── schedule/       ← جدول اليوم + فلاتر + SchedulePageClient
│   │   │   ├── apply/          ← فورم المسارين + Timeline 11 مرحلة + FAQ
│   │   │   ├── tickets/        ← التذاكر + subroutes success/ + cancel/
│   │   │   ├── venue/          ← الخريطة + معرض المكان
│   │   │   ├── faq/            ← الأسئلة الشائعة
│   │   │   └── thank-you/      ← شكر بعد الفورمات
│   │   ├── api/                ← مسارات الخادم (4)
│   │   │   ├── apply/route.ts          ← POST طلبات التقديم (Sheet + إيميلان)
│   │   │   ├── contact/route.ts        ← POST فورم التواصل (توجيه حسب الموضوع)
│   │   │   ├── partner-inquiry/route.ts← POST استفسارات الشراكات (بلا واجهة حاليًا)
│   │   │   └── revalidate/route.ts     ← POST Webhook Sanity (revalidatePath)
│   │   ├── robots.ts           ← robots.txt تلقائي من BASE_URL
│   │   ├── sitemap.ts          ← sitemap.xml تلقائي
│   │   ├── globals.css         ← Tailwind + متغيرات التصميم
│   │   ├── not-found.tsx + error.tsx  ← صفحات الحالة العامة
│   │   └── (بجانب) [locale]/{loading,error,not-found}.tsx لكل صفحة
│   │
│   ├── components/             ← المكوّنات (Server بحكم موقعها، ومعها Client صريحة)
│   │   ├── layout/             ← Header + FooterContent
│   │   ├── header/             ← Logo + NavLink + MobileMenu + MoreDropdown
│   │   ├── home/               ← Hero + About + Theme + Highlights + SpeakersPreview + ScheduleBanner + ApplyBanner + SponsorsStrip
│   │   ├── apply/              ← ApplyHero + ApplyTimeline + ApplyFAQ + ApplicationForm
│   │   ├── contact/            ← ContactBox + ContactBoxWrapper
│   │   ├── schedule/           ← ScheduleTimeline + ScheduleItem + FilterBar + ScheduleHeroSection
│   │   ├── speakers/           ← SpeakersGrid + SpeakerCard + SpeakerModal
│   │   ├── team/ activations/ venue/ thankyou/  ← بطاقات الصفحات
│   │   └── ui/                 ← مكوّنات عامة: Button, Input, Modal, LeafletMap, flip-clock,
│   │                            globe, tedx-globe, TurnstileWidget, SafeImage, ScrollSection,
│   │                            ScrollReveal, PageTransition, LanguageSwitcher, CustomCursor, ...
│   │
│   ├── lib/                    ← منطق الخادم والمشارك
│   │   ├── sanity.ts           ← العميل + urlFor + isSanityConfigured
│   │   ├── data.ts             ← استعلامات GROQ لكل المحتوى
│   │   ├── mailer.ts           ← SMTP Hostinger (nodemailer) — القلب الجديد للبريد
│   │   ├── turnstile.ts        ← تحقق Cloudflare Turnstile server-side
│   │   ├── rate-limit.ts       ← Upstash (نافذة منزلقة لكل فورم/IP)
│   │   ├── cors.ts             ← validateOrigin من ALLOWED_API_ORIGINS
│   │   ├── sanitize.ts         ← escapeHtml + sanitizePrivateKey
│   │   ├── json-ld.ts          ← Organization/Event/WebSite/Breadcrumb/Person schemas
│   │   ├── types.ts            ← كل الأنواع المطابقة لوثائق Sanity
│   │   ├── constants.ts        ← APPLICATION_DEADLINE
│   │   ├── utils.ts            ← cn()
│   │   └── tickets.ts          ← (لا يوجد — الصفحة تقرأ الترجمات مباشرة، وزر Platinumlist خارجي)
│   │
│   ├── i18n/
│   │   ├── routing.ts          ← locales: ["en","ar"], defaultLocale, localePrefix
│   │   ├── request.ts          ← تحميل messages/{locale}.json ديناميكيًا
│   │   └── navigation.ts       ← Link/useRouter/usePathname/redirect مترجمة
│   │
│   └── hooks/                  ← useRTL (اتجاه النص للمكوّنات)
│
└── studio/                     ← Sanity Studio مستقل تمامًا
    ├── sanity.config.ts        ← المشروع hisn3dku + dataset production + schemaTypes
    ├── sanity.cli.ts           ← إعدادات الـ CLI (deploy/init)
    ├── package.json            ← حزم الستوديو الخاصة
    ├── schemaTypes/            ← speaker, session, activation, sponsor, teamMember,
    │                            eventInfo, galleryImage, index
    ├── .sanity/runtime/        ← ملفات تشغيل محلية
    └── dist/                   ← بناء سابق للستوديو (من npx sanity deploy)
```

> **ملاحظة:** `src/lib/tickets.ts` — **لم يتم العثور عليه**؛ التذاكر تُدار من الترجمات + الرابط الخارجي. و`src/lib/mock-data.ts` غير موجود أيضًا (انظر القسم 3.2).

---

## 3. مخططات تدفق البيانات (ASCII)

### 3.1 دورة طلب HTTP الكاملة — مثال `/api/apply` (من `src/app/api/apply/route.ts`)

```
المتصفح (ApplicationForm.tsx)
   │  POST /api/apply  (JSON: 18+ حقلاً + turnstileToken)
   ▼
┌───────────────────────────────────────────────┐
│ middleware.ts — غير معني (المطابق يستثني /api)│
└───────────────────────────────────────────────┘
   ▼ Next.js ينفذ POST() في route.ts
┌───────────────────────────────────────────────┐
│ 1. validateOrigin(request)        [cors.ts]   │ ← origin غير مسموح → 403
│ 2. checkRateLimit(request,"apply")[rate-limit]│ ← تجاوز → 429 (5/10د/IP)
│ 3. applicationSchema.safeParse    [zod]       │ ← بيانات غير صحيحة → 400
│ 4. verifyTurnstile(token)         [turnstile] │ ← بوت → 403
│ 5. saveToGoogleSheet(data)   (إن وُجِدت إعدادات)│ ← فشل = تحذير فقط (غير قاتل)
│ 6. sendMail → تأكيد المتقدم (النص الحرفي)      │
│ 7. sendMail → إشعار إداري لـ apply@            │ ← فشل = تحذير فقط
└───────────────────────────────────────────────┘
   ▼
JSON { "success": true } → الفورم يعرض النجاح ويحوّل /thank-you
```

الأمر نفسه تقريبًا لـ `/api/contact` (مخطط أصغر + توجيه الصندوق حسب `subject`) و`/api/partner-inquiry`. كل طبقة (1–7) موجودة كدالة حقيقية في `src/lib/` — بدون أي "منطق وهمي".

### 3.2 تدفق بيانات Sanity → الصفحات

```
┌─────────────────┐      ┌──────────────────────────┐
│ Sanity Studio   │      │ CDN API (قراءة عامة)      │
│ (studio/)       │──►──│ https://hisn3dku.api...   │
└─────────────────┘      └──────────────────────────┘
                                   │
                                   ▼
               src/lib/sanity.ts — createClient({ projectId, dataset, useCdn:true })
                                   │
         هل isSanityConfigured (NEXT_PUBLIC_SANITY_PROJECT_ID)؟
                 │                         │
                 │ نعم                       │ لا
                 ▼                          ▼
      src/lib/data.ts (GROQ)      ترجع الدوال [] مباشرة
      speaker/team/activation/    (لا يوجد mock-data.ts —
      sponsor/session/eventInfo   المكوّنات تتعامل مع الفراغ
      + urlFor() لقص الصور        بأمان: مخفي/حالة فارغة)
                 │
                 ▼
  صفحات [locale] (speakers/team/schedule/page.tsx...)
                 │
                 ▼
  next/image (remotePatterns: cdn.sanity.io) — لا يُسمح بأي CDN آخر
```

**تحويل الصور**: `urlFor(s.photo)?.width(400).quality(80).url()` في `data.ts` لكل نوع — روابط CDN مع معاملات تحجيم/جودة، ثم تُمرَّر عبر `next/image` الذي يسمح فقط بـ `cdn.sanity.io` (`next.config.ts` → `images.remotePatterns`).

### 3.3 تدفق البريد الإلكتروني

```
API route (apply/contact/partner-inquiry)
   │  تُبنى رسالة HTML (كل مجال مُدخَل يمر عبر escapeHtml من sanitize.ts)
   ▼
sendMail({ to, replyTo?, subject, html })      [src/lib/mailer.ts]
   │
   │  isMailerConfigured()؟  (SMTP_HOST+USER+PASS)
   │   └ لا → تحذير "[MAILER] SMTP not configured" — الطلب يكمل
   ▼
nodemailer.createTransport({ host: smtp.hostinger.com, port: 465, secure: true, auth })
   ▼
SMTP Hostinger (SSL 465 — اختبرناه: SMTP-VERIFY-OK)
   ▼
┌──────────────────────────────────────────────────────────────┐
│ التوجيه حسب الصندوق:                                         │
│  apply/route.ts        → to = data.email (تأكيد)             │
│                        → to = ADMIN_APPLICATIONS_EMAIL        │
│  contact/route.ts      → Sponsorship→PARTNER_EMAIL           │
│                          Media→MEDIA_EMAIL ← الباقي→CONTACT_EMAIL │
│  partner-inquiry/route→ to = PARTNER_EMAIL                   │
│  كلها: from = EMAIL_FROM (marhaba@... اسم حقيقي)               │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. نموذج اللغة (Internationalization)

### 4.1 المسار الكامل للطلب

1. **`middleware.ts`** (جذر المشروع):
   ```ts
   import createMiddleware from 'next-intl/middleware';
   export default createMiddleware({ locales: routing.locales, defaultLocale, localePrefix });
   export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
   ```
   - يعترض كل طلب **عدا** `/api` و`/_next` والملفات ذات النقطة (`.png`...).
   - مع `localePrefix: "always"` (`src/i18n/routing.ts`) يعيد التوجيه: الجذر → `/en`، و`/ar/whatever` يُقبل بلا تغيير، و`/en/whatever` كذلك، وأي مسار بلا لغة صالحة يُوجه للافتراضية.
2. **`src/i18n/routing.ts`**: `locales: ["en","ar"]`، `defaultLocale: "en"`، `localePrefix: "always"`.
3. **`src/i18n/request.ts`**: يقرأ `requestLocale` (من الـ middleware)، يتحقق بـ `hasLocale`، ثم:
   ```ts
   messages: (await import(`../../messages/${locale}.json`)).default
   ```
   — تحميل ديناميكي لملف الترجمة المناسب.
4. **`src/i18n/navigation.ts`**: يصدّر `Link / useRouter / usePathname / redirect / getPathname` المترجمة — **هذه هي الـ API الوحيدة المسموحة في المكوّنات** (أي استخدام لـ `next/link` أو `next/navigation` الخام يخرق النمط).

### 4.2 التبديل بين اللغات

`src/components/ui/LanguageSwitcher.tsx` يستخدم `usePathname` و`useRouter` من `@/i18n/navigation` لتبديل اللغة **مع الحفاظ على المسار الحالي** (اختيار "العربية" من `/en/apply` → `/ar/apply`).

### 4.3 RTL تلقائي

في `src/app/[locale]/layout.tsx`:
```tsx
const dir = locale === "ar" ? "rtl" : "ltr";
<html lang={locale} dir={dir} className={...}>
<body className={locale === "ar" ? "font-arabic" : ""}>
```
- `dir=rtl` يقلب تخطيط الصفوف تلقائيًا (flex/grid)، و`{"font-arabic"}` يفعّل خط **Noto Kufi Arabic** المحلي، وفي `src/hooks/useRTL.ts` يوجد محوّل اتجاه للمكوّنات الخاصة.

### 4.4 إضافة لغة ثالثة (مثال: الفرنسية) — دليل عملي

1. **`src/i18n/routing.ts`**: `locales: ["en", "ar", "fr"]`.
2. **أنشئ `messages/fr.json`**: انسخ `en.json` وترجم كل القيم (البنية يجب تطابق النطاقات الثمانية: `common/footer/home/notFound/errorPage/countdown/thankYou/page`).
3. **`request.ts`**: لا يتطلب تعديلًا — التحميل ديناميكي `messages/${locale}.json` سيصله تلقائيًا. (كود صريح: السطر 13).
4. **RTL**: الفرنسية LTR — لا تعديل. **لو كانت اللغة مثل العربية:** عدّل الشرط في `layout.tsx` إلى `locale === "ar" || locale === "fa"` للسطرين (`dir` و`font-arabic`) وأضف خط الفرع المحلي بـ `localFont` (انظر كيفية إضافة الخطوط المحلية في القرار المعماري 2).
5. أعد البناء وتأكد من `generateStaticParams` في `layout.tsx` (يبني مسارات اللغة الجديدة تلقائيًا لأنه يقرأ `routing.locales`).

---

## 5. خصوصيات Next.js 16 في هذا المشروع

### 5.1 Turbopack افتراضي
المشروع يعمل على **Next.js 16.2.10** الذي يستخدم **Turbopack** كافتراضي للبناء والتطوير — واضح في مخرجات `next build` (سطر "Turbopack" + فحص TypeScript داخلي). لا حاجة لأي إعداد إضافي.

### 5.2 `params` كـ `Promise` (متطلب إلزامي)
كل صفحة في `[locale]` تُعرّف الممتلكات هكذا:
```tsx
type Props = { params: Promise<{ locale: string }> };
export default async function Home({ params }: Props) { const { locale } = await params; ... }
```
- في Next 15+ أصبحت `params` **وعدًا** — قراءتها بدون `await` تسبب خطأ تشغيل. هذه قاعدة يجب الحفاظ عليها في أي صفحة/أول خطأ شائع لدى المطورين الجدد.
- ملاحظة مرتبطة: `generateMetadata` في كل صفحة تنتظر `params` كذلك.

### 5.3 ملف proxy.ts — نتيجة الفحص
- **لم يتم العثور على ملف `proxy.ts` صريحًا في المشروع.**
- التوجيه اللغوي يتم عبر `middleware.ts` في الجذر (وهو الذي يعرضه Next 16 في جدول البناء تحت اسم **"Proxy (Middleware)"**) — فالاسم تغيّر في الواجهة لكن الملف هو `middleware.ts`.
- إعدادات الأمان (CSP) وإعادة التوجيه تتم عبر `next.config.ts` (`async headers`) وليس عبر proxy.

---

## 6. سجل القرارات المعمارية (ADR)

### 6.1 لماذا SMTP Hostinger بدل Resend؟

**الدليل من الكود**: `src/lib/mailer.ts` يبني الناقل عبر:
```ts
nodemailer.createTransport({ host: "smtp.hostinger.com", port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } });
```
بينما `resend` ما زال في `package.json` لكن **صفر استخدامات** في `src/` (تحققت: لا `import "resend"` في أي ملف بعد التعديل).

**المنطق** (من التحليل والتوثيق السابق): إرسال Resend يتطلب حسابًا خارجيًا + تحقق DNS من ملكية الدومين + `RESEND_API_KEY`. هذا حاجز إضافي قبل "الإطلاق" ويزيد نقاط الفشل. الصناديق التي يملكها العميل على Hostinger (على نفس الدومين) جاهزة **اليوم** وبيانات SMTP معروفة؛ فالتحويل يمنح:
- تحكمًا كاملًا بالمرسل (`from`) على دومين مملوك.
- توصيلًا فوريًا للصناديق المختصة (apply@/partners@/media@/marhaba@) بدون وسيط.
- عمل Fail-Open سلس في التطوير (تحذير بدل فشل).
- النتيجة: البريد **مفعّل ومختبر فعليًا** (5 إرسالات ناجحة) بينما لو بقي Resend لكان الموقع بلا قدرة إرسال حتى يوفّر العميل مفتاح الدومين.

### 6.2 لماذا الخطوط محلية بدل Google Fonts؟

**الدليل**: `src/app/[locale]/layout.tsx:24` — `localFont({ src: "./fonts/Inter.woff2" })` و`localFont({ src: "./fonts/NotoKufiArabic.woff2", weight: "400 900" })`، والملفات في `src/app/[locale]/fonts/`.

**الخلفية الفعلية**: كان البناء يفشل عند محاولة `next/font/google` جلب الخطوط من `fonts.gstatic.com` (بيئة العميل/البناء تحجب الطلب). القرار:
- **الموثوقية**: صفر طلبات خارجية أثناء البناء — بناء يعمل حتى بلا إنترنت.
- **السرعة**: تحميل محلي من نفس النطاق (بدون DNS خارجي أو TLS ثالث).
- **الخصوصية**: لا يرسل الزائر أي طلب لمزود الخطوط (Google).
- **الالتزام بالهوية**: خطان بنفس الأسماء القديمة (`--font-inter`, `--font-noto-kufi-arabic`) حتى لا تتغير المتغيرات في CSS.
- (بقايا قديمة): `next.config.ts` ما زال يسمح بـ `fonts.gstatic.com` و`fonts.googleapis.com` في CSP `font-src/style-src` — أسطر بلا مستخدم فعلي الآن، ويُفضّل إزالتها في مراجعة أمنية لاحقة.

### 6.3 لماذا سياسة Fail-Open في كل الخدمات؟

**الدليل — أربعة مواضع صريحة**:
- `src/lib/turnstile.ts:11` — غياب المفتاح → تحذير → `return true`.
- `src/lib/rate-limit.ts:36` — غياب Upstash → تحذير → `{ allowed: true }`.
- `src/lib/mailer.ts` — غياب SMTP → تحذير → الإيميل يُتخطى والطلب يكمل.
- `src/lib/data.ts:4` — غياب Sanity → `null` → قوائم فارغة.
- (وأيضًا بعد التعديل) فشل `saveToGoogleSheet` = تحذير فقط في `apply/route.ts`.

**المنطق**: التطوير المحلي يجب ألا يتطلب إنشاء حسابات في 4 خدمات سحابية قبل كتابة سطر واحد من الكود؛ والموقع يجب أن **يعمل دائمًا** (بصريًا ووظيفيًا) أثناء مراحل العرض على العميل. الثمن معروف ومقبول مؤقتًا: حماية أضعف قبل الإطلاق.

> **تحذير هام (من تعليقات الكود نفسها):** وضع Fail-Open **ليس وضعًا للإنتاج**. قبل الإطلاق العام يجب تفعيل Turnstile وUpstash على الأقل (فورم Apply يجمع بيانات قُصَّر وأولياء أمور). توجد تحذيرات `console.warn` صريحة في كل ملف تبدو في سجل الخادم — يجب ألا يبقى أي منها يوم النشر.

### 6.4 لماذا `sw.js` يتجاوز الطلبات غير الأصلية ويخطي مرحلة الانتظار؟

**الدليل**: `public/sw.js` (الإصدار `tedx-v2`):
```js
if (url.origin !== self.location.origin) return;   // تجاوز كامل للطلبات غير الأصلية
self.skipWaiting();                                // تفعيل النسخة الجديدة فورًا
caches.keys().filter(key => key !== CACHE_NAME).map(key => caches.delete(key)) // تنظيف tedx-v1
```

**سببان مستقلان**:
1. **تجاوز الطلبات غير الأصلية (Cross-origin bypass)** — القرار الأهم: كان الـ SW القديم يعترض **كل** طلب `.png` (منها بلاطات خريطة Carto) وعند أي فشل كان **يفبرك استجابة 408** `new Response("", { status: 408 })` فتُقتل الخريطة. الحل المعماري: الموارد الخارجية (البلاطات/CDN/واجهات خارجية) لا تمَر أبدًا عبر الـ SW — تذهب للشبكة مباشرة. الـ SW يبقى مسؤولًا فقط عن أصوله الأصلية + التنقل + صفحة الـ Offline.
2. **`skipWaiting()` + تنظيف الكاش** — يضمن أن نسخة الـ SW الجديدة (بعد كل نشر) تسيطر فورًا بدل انتظار إغلاق التبويبات، ويحذف كاش `tedx-v1` القديم ليمنع تقديم أصول بالية.

### 6.5 لماذا حقول `showSpeakers` و`showSponsors` في `eventInfo`؟

**الدليل**: `studio/schemaTypes/eventInfo.ts` — حقلان بوليانيان `initialValue: false` مع وصف "Turn ON to make the Speakers section and page visible once the lineup is ready". الاستهلاك في `src/app/[locale]/page.tsx:50,72` (`eventInfo?.showSponsors && <SponsorsStrip/>` و`eventInfo?.showSpeakers && <SpeakersPreview/>`)، وفي `speakers/page.tsx:16` دخول الصفحة مرهون به (`!eventInfo?.showSpeakers → notFound()`).

**المنطق العملي**: قبل الإعلان الرسمي عن المتحدثين (وعدم وجود رعاة مؤكدين بعد) يجب أن يكون الموقع "نظيفًا" — من دون **حذف** أي بيانات. المفتاحان يفصلان **وجود المحتوى** (في Sanity دائمًا) عن **ظهوره** (مقفل بالإعلان). والجانب الجميل: غياب مستند `eventInfo` كليًا = `undefined` = نفس نتيجة `false` — فالوضع الافتراضي آمن (مخفي) تلقائيًا دون أي إعداد.

### 6.6 لماذا المواعيد والعمر كما هي؟

**الدليل — قيم حرفية في الكود والترجمات**:
- `src/lib/constants.ts:1`: `APPLICATION_DEADLINE = "2026-09-30T23:59:59+04:00"` — **UTC+4 (توقيت الإمارات) صريحًا**، تُستخدم في `src/app/[locale]/apply/page.tsx:28` و`src/components/home/ApplyBanner.tsx:9` لإغلاق الفورم كليًا بعد الموعد.
- التاريخ النهائي للحدث: `2026-12-19` (احتياط JSON-LD في `json-ld.ts:28` + مستند `eventInfo` عند توافره).
- الساعات: `messages/en.json:698` → `"timeValue": "9:00 AM – 5:00 PM"` (معلومات التذاكر).
- العمر: `messages/en.json:703` → `"ageValue": "Open to all ages; recommended for 13+"` (وFAQ السطر 764: يُنصح بـ 10+، ومسار المتحدث الشاب 10–18، وتحقق الفورم `ageRange 10–99`).

**التحليل المعماري** (بناءً على الكود): هذا حدث **شبابي نهار كامل** في أبوظبي — وقت إغلاق التقديم **سبتمبر 2026** بعيد عن ديسمبر ليتسع لمسار التحكيم الـ 11 مرحلة (من Timeline في `src/components/apply/ApplyTimeline.tsx`: تقديم → مراجعة → مقابلات → تدريب 6–8 أسابيع → بروفات)؛ وساعات 9:00–17:00 مدينة نهارًا ملائم لعائلات فئة 13+؛ والتوقيت `+04:00` حرفيًا هو توقيت أبوظبي (توقيت محلي موحّد). القرارات صُممت كـ**ثوابت/ترجمات قابلة للتغيير** وليست مشفرة في المنطق — تغييرها خطوة إعداد وليس تعديل كود.

---

## 7. تلخيص معمارية بفقرة واحدة

نظام **خوادم Next.js مع واجهات Sanity-read**، تُوعَّر من خلال `middleware` (استثناء `/api` الصناعي)، النصوص كلها من `messages/*.json`، والمنطق الحساس كله خلف **أربع طبقات أمنية** (CORS → Rate-Limit → zod → Turnstile) تعمل بـ Fail-Open للتطوير، والتأثيرات الخارجية أربعة فقط (Sanity CDN للقراءة، SMTP Hostinger للبريد، Google Sheets للحفظ، Upstash للحدود) — وكلها قابلة للتفعيل متدرجًا بمتغيرات بيئة، مع قدرة تشغيل كاملة للموقع بمجرد `npm run dev` حتى في غياب كل مفاتيح الإنتاج.

> **مهم:** هذا هو المرجع المعماري — للتفاصيل التشغيلية راجع `docs/03-setup-and-env.md` و`docs/05-forms-email-system.md`، وللقرارات المستقبلية (فيديو، مدفوعات) راجع نهاية `docs/01-overview.md`.