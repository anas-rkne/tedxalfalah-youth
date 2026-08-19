# 03 — إعداد البيئة والمتغيرات (Setup & Environment)

**الملف**: `docs/03-setup-and-env.md`
**الجمهور المستهدف**: مطورون جدد + فريق العمليات — "دليل النجاة": شغّل المشروع في 10 دقائق.
**المصدر**: الكود الفعلي + `.env.local.example` — كل سطر في الجدول تحققت منه شخصيًا (مسار:سطر دقيق).

---

## 1. متطلبات النظام الأساسية (Prerequisites)

| المتطلب | الإصدار | ملاحظات |
|---|---|---|
| **Node.js** | **20.9 أو أحدث** | متطلب Next.js 16 نفسه (لا يوجد حقل `engines` في `package.json` — اعتمد على متطلب الإطار) |
| **npm** | 10 أو أحدث | يأتي مع Node LTS الحالي — لا نسخة خاصة مطلوبة |
| **Git** | أي إصدار حديث | لاستنساخ المستودع وإدارة النسخ |
| **حساب Hostinger** | — | **مهم جدًا** — إدارة الدومين + SMTP (يعمل حاليًا) + **استضافة Node.js النهائية** للمشروع (قرار النشر: Hostinger، وليس Vercel) |
| **حساب Sanity.io** | مجاني | لنشر Sanity Studio وإدارة المحتوى (`studio/`) |
| **حساب Google Cloud** | مجاني | لإنشاء Service Account المخصص لحفظ طلبات Apply في Sheet |
| **حساب Cloudflare** | مجاني | مفتاحا Turnstile (حماية الفورمات من البوتات) |
| **حساب Upstash** | مجاني | Rate Limiting (حد الطلبات) |
| **حساب Google Analytics** | مجاني | `NEXT_PUBLIC_GA_ID` (مفعّل حاليًا بمفتاح موجود) |

---

## 2. التشغيل المحلي خطوة بخطوة (Local Setup)

```bash
# 1) تثبيت الحزم (من جذر المشروع الرئيسي)
npm install

# 2) تشغيل وضع التطوير (Turbopack — افتراضي في Next 16)
npm run dev          # → http://localhost:3000

# 3) التحقق من صلاحية البناء الإنتاجي
npm run build

# 4) تشغيل البناء الناتج
npm run start        # → http://localhost:3000 (مبني سلفًا)
```

**أوامر إضافية موثقة في `package.json:5-10`:** `npm run lint` (فحص ESLint).

> **استكشاف سريع — ماذا سترى في أول تشغيل؟**
> بدون أي مفاتيح (استنساخ نظيف): الموقع يعمل كاملًا بلا تعطل — لا توجد بيانات Mock داخل الكود (تحققت: لا يوجد `mock-data.ts`)؛ القراءة من Sanity (المشروع `hisn3dku` على حساب العميل — **جديد وفارغ حاليًا**) تنهار بأمان إلى فراغ أنيق. الفورمات الثلاثة تعمل لكنها **تسجّل بالـ Terminal** بدل الإرسال (رسائل `[DEV] ...` أو تحذيرات `not configured` — انظر مصفوفة Fail-Open في `docs/05`). أما بـ `.env.local` الحالي (SMTP مفعّل) فالرسائل تُرسل فعلًا.

> ⚠️ **ملاحظة دقة وثائقية**: فقرات "بيانات تجريبية (mock)" في `README.md` قديمة جزئيًا بعد تبديل البريد لـ SMTP — **سلسلة `docs/` هي المرجع الحالي**.

---

## 3. مرجع المتغيرات البيئية (الجدول النهائي — مصدر الحقيقة الوحيد)

### 3.0 قواعد ذهبية قبل الجدول

- **`NEXT_PUBLIC_` = متغير عمومي** يُحقن في حزمة المتصفح — يظهر لأي زائر يفتح أدوات المطور، **يُمنع منعًا باتًا وضع أي سر فيه**. كل المتغيرات الباقية تُقرأ **على الخادم فقط**.
- **كل ما يلي في ملف واحد**: `.env.local` بجذر المشروع الرئيسي (أو إعدادات "Environment Variables" في لوحة الاستضافة عند النشر).
- القيم المكتوبة "**مفعّل حاليًا**" موجودة في `.env.local` المحلي اليوم؛ والقيم "(فارغ)" تنتظر مفاتيح العميل (انظر `docs/01` — جلسة الحسابات المعلقة).

### 3.1 جدول المتغيرات الكامل

| # | اسم المتغير | الغرض | أين يُقرأ (مسار:سطر) | القيمة الحالية/الافتراضية | المصدر |
|---|---|---|---|---|---|
| 1 | `BASE_URL` | الرابط الأساسي — يُستخدم في JSON-LD (Schema.org) وOG tags وsitemap وrobots | `src/lib/json-ld.ts:1`، `src/app/sitemap.ts:4`، `src/app/robots.ts:9`، `src/app/[locale]/layout.tsx:22` | `https://www.tedxalfalahyouth.com` (الافتراضي = النطاق الحقيقي) | دومين العميل النهائي |
| 2 | `NEXT_PUBLIC_BASE_URL` | رابط أساسي إضافي لـ Breadcrumb JSON-LD | `src/components/BreadcrumbJsonLd.tsx:25` | (افتراضي في الكود = `BASE_URL` أو النطاق) — **غير موجود في `.env.local.example`** | اختياري — نفس الدومين |
| 3 | `NEXT_PUBLIC_PLATINUMLIST_URL` | رابط منصة شراء التذاكر (زر خارجي) | `src/app/[locale]/tickets/page.tsx:211` | `https://platinumlist.net/event/tedx-youth-alfalah` (افتراضي أيضًا في الكود) | حساب Platinumlist للعميل |
| 4 | `NEXT_PUBLIC_VENUE_MAP_URL` | خريطة Google المضمّنة بصفحة المكان (frame) | `src/app/[locale]/venue/page.tsx:61` | `https://www.google.com/maps/place/%D9%86%D8%A8%D8%B6+%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%AD%E2%80%AD/@24.4356691,54.7326539,773m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3e5e4b005bfd8213:0x43caa1f7ace7f2eb!8m2!3d24.4356691!4d54.7326539!16s%2Fg%2F11x199qnyl!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D` — **مفعّل حاليًا** | رابط مشاركة Google Maps (يُسمح له في CSP: `frame-src ...google.com/maps` — `next.config.ts:30`) |
| 5 | `ALLOWED_API_ORIGINS` | النطاقات المسموح لها باستدعاء الـ API (مفصولة بفاصلة) — تتجاوز القائمة الثابتة | `src/lib/cors.ts:9-11` (يُقسم بـ `split(",")`؛ القائمة الأصلية أسطر 3–8) | `https://www.tedxalfalahyouth.com,https://tedxalfalahyouth.com,http://localhost:3000` | دومين الإنتاج + أي نطاق إضافي. **القائمة الثابتة تشمل أيضًا `http://localhost:3001`** (منفذ خادم الاختبار e2e — `playwright.config.ts`) |
| 6 | `SMTP_HOST` | خادم البريد الصادر (Hostinger) | `src/lib/mailer.ts:18` (افتراضي `smtp.hostinger.com` داخل الكود) | `smtp.hostinger.com` — **مفعّل حاليًا** | Hostinger (العميل) |
| 7 | `SMTP_PORT` | منفذ الاتصال — `465` = SSL مباشر | `src/lib/mailer.ts:19` (يحدد `secure:` في السطر 37: `SMTP_PORT === 465`) | `465` — **مفعّل حاليًا** | Hostinger |
| 8 | `SMTP_USER` | اسم مستخدم صندوق الإرسال | `src/lib/mailer.ts:26` (شرط `isMailerConfigured`) و`:39` (auth) | `marhaba@tedxalfalahyouth.com` — **مفعّل حاليًا** | Hostinger (الصندوق موجود فعليًا — تحقق WebMail ناجح) |
| 9 | `SMTP_PASS` | كلمة مرور صندوق الإرسال | `src/lib/mailer.ts:26` و`:40` | **مفعّل في `.env.local`** (لا تُذكر قيمته في الوثائق المرفوعة — سر حقيقي — ثبّت الإرسال: SMTP-VERIFY-OK) | Hostinger — عادة إضافية/تغيير من العميل لاحقًا |
| 10 | `EMAIL_FROM` | هوية المُرسِل الظاهرة لكل الرسائل | `src/lib/mailer.ts:21-22` (افتراضي: `TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>`)، يُستخدم في `:61` | نفس الافتراضي — **مفعّل حاليًا** | Hostinger |
| 11 | `ADMIN_APPLICATIONS_EMAIL` | صندوق استلام إشعار كل طلب Apply (بكامل البيانات) — يُرسل الإشعار إليه ونسخة موازية إلى `CONTACT_EMAIL` | `src/app/api/apply/route.ts` — دالة `sendAdminNotification` (افتراضي `apply@tedxalfalahyouth.com` في الكود) | `apply@tedxalfalahyouth.com` — **مفعّل حاليًا** (اختبار إرسال ناجح) | Hostinger |
| 12 | `CONTACT_EMAIL` | **الوجهة الوحيدة لرسائل فورم Contact** (كل المواضيع — قيمة `subject` تُدرَج في جسم الإيميل فقط) + نسخة موازية من إشعارات Apply | `src/app/api/contact/route.ts` (المتلقي عند الإرسال) | `marhaba@tedxalfalahyouth.com` — **مفعّل حاليًا** | Hostinger |
| 13 | `PARTNER_EMAIL` | صندوق الرعايات — وجهة استفسارات الشراكة (كل ما يمر بمسار الشراكة؛ فورم Contact لا يوجّه إليه بعد) | `src/app/api/partner-inquiry/route.ts` | `partners@tedxalfalahyouth.com` — **مفعّل حاليًا** (تحقق من الاسم النهائي للصندوق في hPanel) | Hostinger |
| 14 | `MEDIA_EMAIL` | صندوق استفسارات الإعلام (Media) — **لا يستهلكه أي route حاليًا** بعد إلغاء التوجيه حسب الموضوع في فورم Contact | — | `media@tedxalfalahyouth.com` — **مفعّل حاليًا** | Hostinger |
| 15 | `GOOGLE_SHEET_ID` | معرّف Google Sheet لحفظ طلبات Apply | `src/app/api/apply/route.ts:83` (الحارس `hasGoogleSheetConfig` أسطر 200–203) | `12XE2tICKyHWhJ718ZAy1FGfe7dbCCyXyurGcqvluZDc` — **مفعّل حاليًا** (أُختبَر: كل طلب يُضاف سطرًا بالـ 20 عمودًا) | Google Sheets (العميل) |
| 16 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | بريد Service Account المصرح له بالكتابة في الـ Sheet | `src/app/api/apply/route.ts:77` | `tedx-website-bot@tedxalfalah.iam.gserviceaccount.com` — **مفعّل حاليًا** | Google Cloud (خدمة المسؤول) |
| 17 | `GOOGLE_PRIVATE_KEY` | مفتاح Service Account الخاص — يُعقَّم عبر `sanitizePrivateKey` | `src/app/api/apply/route.ts:78` + المعالج في `src/lib/sanitize.ts:26-32` | **مفعّل في `.env.local`** (لا تُذكر قيمته — سر حقيقي) | Google Cloud — انظر تحذير الأمان (5.4) |
| 18 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | مفتاح الموقع العام (يظهر للمتصفح — آمن للكشف) | `src/components/ui/TurnstileWidget.tsx:25` (بدونه لا يُعرض الودجت أصلًا، سطر 35/62) | `0x4AAAAAAEN7aAaUnDE9QCNJ` — **مفعّل حاليًا** | Cloudflare → Turnstile |
| 19 | `TURNSTILE_SECRET_KEY` | المفتاح السري للتحقق من جانب الخادم (سري تمامًا) | `src/lib/turnstile.ts:1` (الحارس)، و`:29` (الطلب لـ siteverify) | **مفعّل في `.env.local`** (سر — لا تُذكر قيمته) | Cloudflare |
| 20 | `UPSTASH_REDIS_REST_URL` | رابط REST لـ Upstash Redis | `src/lib/rate-limit.ts:5` (الحارس) و`:12` (العميل) | `https://inspired-terrier-172137.upstash.io` — **مفعّل حاليًا** | Upstash (console.upstash.com) |
| 21 | `UPSTASH_REDIS_REST_TOKEN` | رمز REST لـ Upstash Redis | `src/lib/rate-limit.ts:5` و`:13` | **مفعّل في `.env.local`** (سر — لا تُذكر قيمته) | Upstash |
| 22 | `NEXT_PUBLIC_SANITY_PROJECT_ID` | معرّف مشروع Sanity — علة وجوده: إنشاء عميل القراءة (`sanityClient`) | `src/lib/sanity.ts:5` (الحارس `isSanityConfigured`) و`:10` | `hisn3dku` — **مفعّل حاليًا** (جديد على حساب العميل — فارغ حتى النشر) | Sanity.io |
| 23 | `NEXT_PUBLIC_SANITY_DATASET` | اسم مجموعة البيانات | `src/lib/sanity.ts:11` (افتراضي `"production"` داخل الكود) | `production` — **مفعّل حاليًا** | Sanity.io |
| 24 | `SANITY_STUDIO_PROJECT_ID` | معرّف مشروع Sanity Studio (بيئة الستوديو المنفصل) | `studio/sanity.config.ts:19` و`studio/sanity.cli.ts:5` (افتراضي `hisn3dku` في كليهما) | `hisn3dku` — **مفعّل حاليًا** (في `studio/.env`) | Sanity.io |
| 25 | `SANITY_STUDIO_DATASET` | مجموعة بيانات الستوديو | `studio/sanity.config.ts:20` و`studio/sanity.cli.ts:6` (افتراضي `"production"`) | `production` — **مفعّل حاليًا** (في `studio/.env`) | Sanity.io |
| 26 | `SANITY_WEBHOOK_SECRET` | مفتاح Webhook للتحديث الفوري عند تعديل المحتوى (revalidate) | `src/app/api/revalidate/route.ts:6` (التحقق أسطر 16–29: إن غير موجود → يُقبل أي Webhook؛ إن موجود → يلزم تطابقه) | **مفعّل في `.env.local`** (سر — لا تُذكر قيمته) — يبقى إعداد الـ Webhook في Sanity لتفعيل التحديث الفوري | أي قيمة عشوائية قوية + نفس القيمة في Sanity webhook |
| 27 | `NEXT_PUBLIC_GA_ID` | معرّف Google Analytics 4 (تحميل gtag عند وجوده) | `src/components/Analytics.tsx:14` | `G-N3JFXW8D7J` — **مفعّل حاليًا** (موجود في example) | Google Analytics |
| 28 | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | (اختياري) بديل الخصوصية لـ Plausible — يُفضل تعطيل GA4 إن استُخدم | `src/components/Analytics.tsx:15` | (فارغ/معلّق في example) | حساب Plausible |
| 29 | `NEXT_PUBLIC_APPLICATION_DEADLINE` | **نص العرض فقط** ("September 14, 2026") — **لا يتحكم بالإغلاق!** | `src/components/home/ApplyBanner.tsx:5` | `September 14, 2026` — **مفعّل حاليًا** | اختياري |
| — | `APPLICATION_DEADLINE` | **الموعد الفعلي للإغلاق** — قراءة من البيئة أولًا، وسقوط على الثابت | `src/lib/constants.ts:1-2` (`"2026-09-14T23:59:59+04:00"`) يُستخدم في `apply/route.ts` (حارس 403) و`apply/page.tsx:28` و`ApplyBanner.tsx:9` | `2026-09-14T23:59:59+04:00` (UTC+4) — **مفعّل حاليًا** (عبر الثابت في الكود) | تغييره من البيئة فقط (أو تحديث الثابت) |

---

## 4. إدارة الملفات البيئية (ملفان فقط)

| الملف | الوظيفة | هل يُرفع إلى Git؟ |
|---|---|---|
| **`.env.local`** | الأسرار الحقيقية — يُنشأ محليًا من المثال، ويُملأ بالمفاتيح الفعلية | **أبدًا** — يستبعده `.gitignore` (سطر `.env*`) |
| **`.env.local.example`** | قالب موثّق بكل اسم متغير + قيمة توضيحية + إرشادات المصدر — نسخة "دليل التعبئة" | **نعم** — أُضيف استثناء صريح في `.gitignore` لرفعه |

**كيف يعمل Next.js معهما:**
- **التشغيل** (`npm run dev` / `npm run start`): يقرأ `.env.local` تلقائيًا.
- **البناء** (`next build`): المتغيرات **تُقرأ في وقت البناء** — أي `NEXT_PUBLIC_*` تُدمج في حزمة المتصفح من قيم `.env.local` الحالية؛ وإن غيرت مفتاحًا عامًا بعد بناء يجب **إعادة البناء**. في الاستضافة، تُضبط القيم في "Environment Variables" بلوحة Hostinger بدل الملف المحلي (ونفس القاعدة: تغيير `NEXT_PUBLIC_*` = إعادة نشر).
- **الستوديو**: لـ Sanity Studio إعداداته الخاصة (سطر 24/25 بالجدول) — تُوضع في `studio/.env` عند الحاجة.

---

> **تحذير أمني هام:**

## 5. ما لا يجب فعله أبدًا (Do's and Don'ts)

1. **لا ترفع `.env.local` إلى GitHub أبدًا** — 🔴 نقطة حمراء. مضمون حاليًا عبر `.gitignore`، لكن تأكد قبل أي `git add .` بسطر: `.env.local` لا يظهر في `git status` (تحقق: `git status --porcelain` وتأكد من غياب اسمه).
2. **لا تضع المفاتيح داخل الكود** — لا تكتب `process.env.X` كقيمة حرفية في أي ملف، ولا تضع مفتاحًا سريًا في مكوّن Client (أي ملف فيه `"use client"`) — كل متغير عام هو الآن علني لكل زائر.
3. **لا تشارك مفاتيح الإنتاج مع أي مطور خارجي** دون إذن كتابي من العميل — خصوصًا `SMTP_PASS` و`GOOGLE_PRIVATE_KEY` و`TURNSTILE_SECRET_KEY` و`UPSTASH_REDIS_REST_TOKEN`.
4. **`GOOGLE_PRIVATE_KEY` يحتوي `\n` الحرفية** داخل علامات الاقتباس — **لا تعِد تنسيقه يدويًا إطلاقًا** (لا أسطر فعلية، لا إزالة فواصل الأسطر): الصقه كما هو بين علامتي اقتباس في `.env.local`، و`src/lib/sanitize.ts` يحوّله لأسطر حقيقية ويطهره من أي حروف غير ASCII (لمنع خطأ ByteString).
5. **لا تسجّل بيانات الفورمات في السجلات** — الكود مصمم أصلًا ألا يطبع بيانات شخصية (لا أسماء/أرقام أطفال في Terminal حتى في التطوير) — حافظ على ذلك ولا "تحسّن" التسجيل بمحاولة طباعة جسم الطلب.
6. **لا تتجاوز رموز الحالة** — `403` للأصل غير المسموح، `429` للحد، `400` للبيانات، `401` لـ Webhook بدون سر، `500` لفشل إرسال Contact/Partner — هذا العقد موثّق في `docs/05` ويستخدمه العميل للاختبار.
7. **لا تعتمد على Fail-Open في الإنتاج** — الـ 4 تحذيرات "not configured" يجب أن تختفي من سجل الخادم قبل الإطلاق العام (انظر مصفوفة Fail-Open في `docs/05` قسم 7).

---

## 6. خلاصة "من صفر إلى تشغيل" (قائمة سريعة)

1. `git clone` ثم `npm install`.
2. `cp .env.local.example .env.local` ثم املأ ما يخصك (أو احصل على نسخة الفريق — الأنسب: استنساخ بيئة عمل الفريق).
3. `npm run dev` — الموقع يعمل فورًا، والفورمات تسجّل في Terminal (حتى بلا مفاتيح).
4. أصبحت مفعّلة في `.env.local`: **Turnstile** (حماية الفورمات)، **Upstash** (حد الطلبات)، **Google Sheets** (حفظ طلبات Apply — مُختبَر فعليًا). المتبقي قبل الإطلاق العام: إعداد **Sanity Webhook** (تحديث فوري) والتأكد من اختفاء تحذيرات "not configured" من سجل الإنتاج.
5. `npm run build` ثم النشر على **استضافة Hostinger Node.js** (لا تغيير في DNS — A ريكورد باقٍ).