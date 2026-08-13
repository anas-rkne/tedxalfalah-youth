# 01 — نظرة عامة على المشروع (Project Overview)

**الملف**: `docs/01-overview.md`
**المرجع البرمجي**: جذر المشروع `tedxalfalahyouth-website/` — كل معلومة في هذه الوثيقة مستخرجة من الكود الفعلي، مع ذكر المسار لتمكين التحقق.
**تاريخ التوثيق**: أغسطس 2026

---

## 1. نظرة عامة استراتيجية

### 1.1 الحدث

الموقع رسمي لحدث **"TEDxAlFalah Youth"** — اسم يظهر حرفيًا في:

- وسم الصفحة الرئيسية في `src/app/[locale]/layout.tsx` (السطر 45): `"TEDxAlFalah Youth | Tomorrow, Now."`
- مخطط JSON-LD لمنظمة الحدث في `src/lib/json-ld.ts`
- رسائل التأكيد الإدارية في `src/app/api/apply/route.ts`
- النص العالمي (Meta) في `messages/{en,ar}.json` → `home.meta`

TEDx هو برنامج أحداث محلية مستقل **مرخّص من TED** (شرح المصطلح في القسم 6). الحدث من تنظيم فريق شبابي، ويظهر ذلك في بنية الفورمات (مسار "متحدث شاب" بسن 10–14، ومسار "خبير") — انظر `applicationSchema` في `src/app/api/apply/route.ts` (السطر 12) وشروطه الخاصة بكل مسار.

### 1.2 الثيم والشعار

الثيم الرسمي **"THE SPARK"** — ثابت بالحروف اللاتينية الكبيرة في ملفات الترجمات:

```json
// messages/en.json (السطر 475)
"title": "THE SPARK",
```

ومعناه موثّق في جملة داخل فورم التقديم (`messages/en.json` السطر 657):

> "THE SPARK: Where every idea begins. Share the moment that inspired your idea."

أي: **"الشرارة: حيث تبدأ كل فكرة — شارك اللحظة التي ألهمتك."** وبهذا يكون الهدف من التقديم هو أن يروي كل متقدم "لحظة الشرارة" التي بدأت فكرته.

الشعار الفرعي **"Tomorrow, Now."** موجود بمواضع متعددة:

- وسم الموقع (`src/app/[locale]/layout.tsx:45`)
- تذييل رسالة تأكيد التقديم (`src/app/api/apply/route.ts` — "Tomorrow, Now.<br />Tomorrow is shaped by what we do today.")
- `messages/en.json` السطر 65: `"tagline": "Tomorrow is shaped by what we do today."`
- `messages/en.json` السطر 319: `"taglineMain": "Tomorrow is shaped by"` (جزء من Hero الكتابة المتدرجة في `src/components/home/Hero.tsx`)

### 1.3 الشعار (Logo)

شعار الحدث ملف صورة PNG يُعرض في الترويسة عبر `src/components/header/Logo.tsx`:

```tsx
<SafeImage src="/images/logo-black.png" alt="TEDxAlFalah Youth" ... />
```

- **المواقع الفعلية للملف**: `public/images/logo-black.png` (المستخدم في الـ Header، وبشكل مكافئ عند الحاجة لنسخة أخرى بنفس المجلد).
- **التخزين في الواجهات الترويسة/التذييل**: يعرض Header اللوجو عبر `Logo.tsx`، ويستخدم `SafeImage` (مكوّن في `src/components/ui/SafeImage.tsx` يفشل بأمان عند غياب الصورة).
- أيقونات وإفادات PWA موجودة في `public/my-favicon/` (favicon بأنواع 96/180/192/512 + SVG + ICO + `site.webmanifest`)، مرجعية في `layout.tsx` (أسطر 55–70).

---

## 2. الأهداف والجمهور المستهدف

### 2.1 الأهداف الاستراتيجية (مستخرجة من بنية الموقع)

| # | الهدف | الدليل في الكود |
|---|---|---|
| 1 | استقبال طلبات المتحدثين بمسارين | صفحة `/apply` + `src/app/api/apply/route.ts` (مسارا `young-speaker` و`expert` بخانات وآلية مراجعة) |
| 2 | تسويق الحدث وبناء الحضور | Hero مع عدّاد تنازلي، أقسام About/Theme/Highlights في `src/app/[locale]/page.tsx` |
| 3 | بيع/تسجيل التذاكر عبر منصة خارجية | صفحة `/tickets` + زر يشير إلى `NEXT_PUBLIC_PLATINUMLIST_URL` (`src/app/[locale]/tickets/page.tsx` السطر 211) |
| 4 | جذب الرعاة والشراكات | API خلفي `src/app/api/partner-inquiry/route.ts` + استفسارات Sponsorship في فورم التواصل `src/app/api/contact/route.ts` |
| 5 | التواصل مع الجمهور واستفسارات الإعلام | فورم Contact في `src/components/contact/ContactBox.tsx` مع توجيه الصناديق حسب الموضوع (قسم 5.3 في `docs/05-forms-email-system.md`) |
| 6 | بناء مصداقية البحث (SEO للمنظمين) | JSON-LD الثلاثي + sitemap/robots (انظر `docs/07-seo-and-analytics.md`) |

### 2.2 الجمهور المستهدف (3 فئات)

**الفئة 1 — الشباب المتقدمون (10–14 سنة وأكثر):**
- فورم `/apply` يقبل مسار "Young Speaker" — ويتطلب بيانات ولي الأمر والموافقة الأبوية (تحقق شرطي في `applicationSchema.superRefine`، أسطر 33–46 في `route.ts`).
- الإشعار الإداري بكل البيانات يصل إلى `apply@tedxalfalahyouth.com`، وتُحفظ البيانات في Google Sheets بمجرد التفعيل.
- قيود النصوص: ملخص الفكرة ≤ 300 كلمة، "لماذا تهمك الفكرة" ≤ 150 كلمة.

**الفئة 2 — أولياء الأمور والحضور:**
- صفحة `/tickets` (أنواع التذاكر، معلومات اليوم، ما يجب إحضاره، سياسة الاسترجاع) مع **زر شراء خارجي عبر Platinumlist** — لا يوجد دفع داخل الموقع.
- صفحة `/venue` (خريطة + موقع + معرض) وصفحات `/schedule` و`/faq`.
- الثنائية اللغوية الكاملة (EN/AR مع RTL) تخدم الجمهورين المحلي والدولي.

**الفئة 3 — رعاة الشركات والشركاء:**
- واجهة "Sponsorship" في فورم Contact تُوجّه لصندوق `partners@` (`src/app/api/contact/route.ts` — خريطة `inboxBySubject`).
- API مخصص `partner-inquiry` جاهز (بلا واجهة منشورة حاليًا — انظر الملاحظة في القسم 5.2) يرسل كامل بيانات الاستفسار لصندوق الشراكات.

---

## 3. حالة المشروع الحالية (دقيقة جدًا)

### 3.1 أسطورة الحالة

| الرمز | المعنى |
|---|---|
| ✅ | منفّذ ومتحقق منه فعليًا |
| ⏳ | جاهز في الكود ويُفعَّل بإضافة قيم (بيئة/محتوى) |
| 🔜 | مخطط له / اختياري (لم يُنفَّذ) |

### 3.2 "مكتمل وظيفيًا" — ماذا يعني هذا بالضبط؟

المشروع **مكتمل البرمجة وظيفيًا (Code Complete)**: كل صفحة، وكل مكوّن، وكل API route مبنية وتعمل. البناء الإنتاجي ناجح والفحص البرمجي نظيف:

- `npm run build` ✅ — **Next.js 16.2.10 (Turbopack)**: نجح مؤخرًا في 32/32 صفحة، والجدول الحراري يشمل 19 مسارًا (`/` للغة، 12 صفحة لغوية، 4 مسارات API، `/_not-found`، `robots.txt`، `sitemap.xml`).
- `npx tsc --noEmit` ✅ — صفر أخطاء.
- الخادم المحلي يعمل عبر `npm run start` على المنفذ 3000.

**معلومة مهمة عن "البيانات التجريبية":** وثائق README القديمة وصفت الموقع بأنه يعمل "ببيانات تجريبية (mock)". **لم يتم العثور على ملف `src/lib/mock-data.ts` في الكود الحالي.** الآلية الفعلية:

1. `src/lib/sanity.ts` ينشئ عميل Sanity إذا وُجد `NEXT_PUBLIC_SANITY_PROJECT_ID` (موجود = `hisn3dku`).
2. دوال الاستعلام في `src/lib/data.ts` تبدأ بـ `fetchSanity` التي ترجع `null` فورًا إن لم يكن العميل مضبوطًا:
   ```ts
   if (!isSanityConfigured || !sanityClient) return null;
   ```
3. عند غياب الإعداد ترجع الدوال قوائم فارغة `[]` وتحجز المكوّنات ذلك بأمان: `SpeakersPreview` يرجع `null` إذا لم يوجد متحدثون (`src/components/home/SpeakersPreview.tsx:12`)، وصفحة المتحدثين ترمي `notFound()` (`src/app/[locale]/speakers/page.tsx:16`).

الخلاصة الحقيقية: **مشروع Sanity القديم `5pbek4rg` حُذف نهائيًا من حساب المطور الشخصي** (قراءة الـ API له ترجع 404)، والمشروع الحالي **`hisn3dku`** (على حساب العميل `tedxalfalahyouth@gmail.com`) **جديد وفارغ تمامًا (0 وثائق)** — الموقع يقرأه مباشرة عبر CDN ويستقبل قوائم فارغة، فتنهار المكوّنات بأمان إلى فراغ أنيق بدل التعطل. بمجرد نشر أول وثيقة (`eventInfo` ثم المتحدثون/الرعاة) سيعرض الموقع المحتوى فورًا.

### 3.3 القنوات المعلّقة (4 قنوات تحتاج مفاتيح)

مرجع القائمة الكاملة: `.env.local.example` (كل متغير موثّق هناك بتعليقات عربية).

| القناة | المتغيرات المطلوبة | أثر التفعيل | الحالة |
|---|---|---|---|
| **Google Sheets** (تخزين طلبات التقديم) | `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | كل طلب Apply يُحفظ في الجدول (18 عمودًا) | ⏳ دالة `saveToGoogleSheet` جاهزة في `src/app/api/apply/route.ts:60` |
| **Cloudflare Turnstile** (حماية الفورمات) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | فحص بوتات فعلي في كل الفورمات | ⏳ widget + تحقق server-side جاهزان |
| **Upstash Redis** (تحديد عدد الطلبات) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate Limiting فعلي (5 طلبات/10 د) لكل فورم | ⏳ جاهز في `src/lib/rate-limit.ts` |
| **Sanity Webhook + eventInfo** (محتوى وتحديثات) | `SANITY_WEBHOOK_SECRET` + مستند `eventInfo` | إعادة توليد الصفحات تلقائيًا عند نشر المحتوى + مفاتيح إظهار/إخفاء الأقسام | ⏳ المسار `/api/revalidate` جاهز، والمستند غير منشور بعد |
| **SMTP Hostinger** (البريد) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` + متغيرات الصناديق الأربعة | إرسال فعلي لكل الإيميلات | ✅ **مفعّل ومُختبر بالفعل** (انظر 3.4) |

### 3.4 ما هو مفعّل فعليًا الآن (قبل مفاتيح العميل)

| النظام | الحالة | الدليل |
|---|---|---|
| Sanity read (المحتوى) | ✅ يقرأ مشروع `hisn3dku` (جديد وفارغ) — يظهر بلا محتوى حتى النشر | `NEXT_PUBLIC_SANITY_PROJECT_ID` في `.env.local` |
| SMTP (إرسال) | ✅ `SMTP-VERIFY-OK` على `smtp.hostinger.com:465` بحساب `marhaba@` | اختبار nodemailer + اختيار 5 إرسالات حقيقية ناجحة للصناديق الأربعة |
| GA4 | ✅ مفتاح `G-N3JFXW8D7J` | `Analytics.tsx` |
| خريطة المكان | ✅ `NEXT_PUBLIC_VENUE_MAP_URL` بالإحداثيات | `.env.local` |
| رابط التذاكر | ✅ `NEXT_PUBLIC_PLATINUMLIST_URL` | `.env.local` + `tickets/page.tsx:211` |
| Service Worker v2 | ✅ نشط (إصلاح خريطة الهوم) | `public/sw.js` |
| الخطوط | ✅ محلية 100% (بناء بلا إنترنت) | `src/app/[locale]/fonts/` + `next/font/local` |

### 3.5 سياسة "Fail-Open" (عدم الفشل عند غياب المفاتيح)

سياسة متّبعة في كل تكامل خارجي: **غياب المفاتيح لا يعطّل الموقع، بل يمرر الطلب مع تحذير في السجل**. الأدلة من الكود:

1. **Turnstile** — `src/lib/turnstile.ts:1`:
   ```ts
   const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
   ```
   وعند غيابه يكتب تحذيرًا ويكمل، ثم يرجع `true` (تمرير) بدل إسقاط التحقق. التحذير النصي (سطر 13): *"TURNSTILE_SECRET_KEY not configured — request allowed without bot verification. Add it before going live."*

2. **Rate Limit** — `src/lib/rate-limit.ts:38`: عند غياب `UPSTASH_REDIS_REST_URL/TOKEN` يُسجَّل تحذير مماثل ويُسمح بالطلب.

3. **البريد** — `src/lib/mailer.ts`: `isMailerConfigured()` + تحذير `[MAILER] SMTP not configured — email skipped`، ولا يفشل الطلب.

4. **Google Sheets** — بعد التعديل الأخير: فشل `saveToGoogleSheet` داخل `try/catch` يكتب خطأ فقط ولا يُسقط الطلب (`src/app/api/apply/route.ts` القسم "فشل الـ Sheet لا يُسقط الطلب").

5. **Sanity** — `fetchSanity` ترجع `null` عند أي خطأ وتبلغ فقط في وضع التطوير (`src/lib/data.ts:9`).

> **تنبيه أمني (من تعليقات الكود نفسها):** التحذيرات أعلاه موجهة للمطور — الوضع Fail-Open مقبول للتطوير، لكن **لا تُطلق الموقع للجمهور دون تفعيل Turnstile وRate Limit على الأقل**، وخاصة أن فورم Apply يجمع بيانات أطفال وأولياء أمور (انظر تعليق الحماية في `src/app/api/apply/route.ts` أعلى `saveToGoogleSheet`).

---

## 4. جدول ملخص التنفيذ (الحالة الحالية مقابل النهائية)

| البند | الحالة بدون مفاتيح | الحالة النهائية (بعد التفعيل) | أين يُفعَّل | المتغيرات المطلوبة |
|---|---|---|---|---|
| محتوى المتحدثين/الفريق/الفعاليات/الرعاة | ✅ يعمل — يقرأ Sanity مباشرة (مشروع `hisn3dku` الجديد، فارغ حاليًا) | يمتلئ بمحتوى العميل من Studio | Sanity Studio (`studio/`) | `NEXT_PUBLIC_SANITY_PROJECT_ID` (موجود) |
| إظهار/إخفاء أقسام المتحدثين والرعاة | مخفية (لا يوجد مستند `eventInfo`) — وهو المطلوب حاليًا | تظهر بتبديل المفتاحين في Studio | Studio → نوع `eventInfo` | — |
| تحديث الموقع عند تغيير المحتوى | يدوي (إعادة بناء) | تلقائي عبر Webhook | `manage.sanity.io` → Webhooks → `/api/revalidate` | `SANITY_WEBHOOK_SECRET` |
| حفظ طلبات التقديم | لا يُحفظ (يصل الإشعار الإداري فقط على apply@) | يُحفظ صف جديد في Google Sheet تلقائيًا | Google Cloud (Service Account) + Sheet مشاركة Editor | `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` |
| إيميل تأكيد المتقدم + الإشعار الإداري | ✅ **يعمل فعليًا** عبر SMTP | نفس السلوك (فوري) | `src/lib/mailer.ts` + `.env.local` | `SMTP_*`, `EMAIL_FROM`, `ADMIN_APPLICATIONS_EMAIL` |
| فورم Contact بتوجيه الصناديق | ✅ **يعمل فعليًا** (General→marhaba@، Sponsorship→partners@، Media→media@) | نفس السلوك | `src/app/api/contact/route.ts` | `CONTACT_EMAIL`, `PARTNER_EMAIL`, `MEDIA_EMAIL` |
| استفسارات الرعاة (API) | ✅ يعمل عند الاستدعاء (بلا واجهة) | واجهة نشر عند الحاجة | Route + (لاحقًا) صفحة Partners | `PARTNER_EMAIL` |
| حماية الفورمات من البوتات | تمرير آمن (Fail-Open) مع تحذير | فحص Turnstile حقيقي | dash.cloudflare.com → Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| تحديد عدد الطلبات | بلا تحديد (Fail-Open) | 5 طلبات/10 د/فورم/IP | console.upstash.com | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| التذاكر | ✅ صفحة كاملة + زر Platinumlist خارجي | نفس السلوك (لا دفع داخلي أبدًا) | `src/app/[locale]/tickets/page.tsx` | `NEXT_PUBLIC_PLATINUMLIST_URL` (موجود) |
| التحليلات GA4 | ✅ مفعّل | نفس السلوك | `src/components/Analytics.tsx` | `NEXT_PUBLIC_GA_ID` (موجود) |
| الخرائط | ✅ خريطة Leaflet (الرئيسية) + iframe (المكان) | نفس السلوك | `src/components/ui/LeafletMap.tsx` + `VenueMapSection` | `NEXT_PUBLIC_VENUE_MAP_URL` (موجود) |
| الخطوط/البناء بلا إنترنت | ✅ محلية | نفس السلوك | `layout.tsx` | — |
| النشر | يعمل محليًا (start:3000) | على استضافة Hostinger Node (Web App) | hPanel (انظر `docs/08-deployment-hosting.md`) | كل المتغيرات بإعدادات الموقع |

> **ملاحظة حول التذاكر:** لا يوجد مسار API للتذاكر (`src/app/api/tickets/route.ts`) — **لم يتم العثور على هذا الملف في الكود**. صفحة التذاكر صفحة عرض وتسويق، والشراء يتم خارجيًا عبر "Proceed" إلى Platinumlist. ولا يوجد `STRIPE_SECRET_KEY` في `.env.local.example` نهائيًا (مؤشر قاطع على عدم اعتماد Stripe).

---

## 5. الفروق المهمة عن الوثائق والتخطيطات السابقة

### 5.1 استبدال Resend بـ SMTP Hostinger (الأهم)

- **قبل** (وثائق/كود قديم): حزمة `resend` في `package.json` + شرط `RESEND_API_KEY` في كل route.
- **الآن**: بريد واحد في `src/lib/mailer.ts` عبر `nodemailer` (مثبّت حديثًا، إصدار 9) مع:
  ```ts
  nodemailer.createTransport({ host: "smtp.hostinger.com", port: 465, secure: true, auth: { user, pass } })
  ```
- حزمة `resend` **محذوفة نهائيًا** من `package.json` (رفعت في المرحلة النهائية قبل النشر) — لا توجد أي إشارة لها في الكود.
- المكاسب: لا تحقق DNS خارجي، رسائل حقيقية فورية من دومين العميل نفسه، وتوجه حسب الموضوع إلى الصناديق المختصة.

### 5.2 فصل Sanity Studio

`studio/` مجلد **مستقل تمامًا** له `package.json` و`package-lock.json` خاصان به (`studio/package.json`) وإعداداته `studio/sanity.config.ts` و`sanity.cli.ts`:

- التشغيل المحلي: `npx sanity dev` (أو `sanity start` للوحة النشر المضمنة — يوجد `dist/` جاهز من بناء سابق).
- النشر المنفصل: `npx sanity deploy` يرفع الستوديو إلى `https://<subdomain>.sanity.studio` دون أي علاقة باستضافة الموقع.
- أنواع المحتوى: 8 أنواع (6 وثائق قابلة للنشر + eventInfo + galleryImage) — التفاصيل في `docs/04-content-management.md`.
- التصميم: نفس المظهر والألوان عبر `studio/sanity.config.ts`.

### 5.3 دمج i18n واللغتين (EN/AR)

- التوجيه في `middleware.ts` (جذر المشروع — يعرضه Next 16 بالبناء كـ "Proxy (Middleware)") عبر `next-intl`:
  - لغتان: `en` (افتراضية) و`ar` مع `localePrefix: "always"` (`src/i18n/routing.ts`).
  - العربي يعمل RTL كاملًا: `dir="rtl"` في `src/app/[locale]/layout.tsx:119` + خط `Noto Kufi Arabic` المحلي.
- **عدد المسارات الفعلية** (من جدول `next build`): **12 صفحة داخل معامل اللغة × 2 لغة = 24 مسارًا لغويًا** + `robots.txt` + `sitemap.xml` + 4 مسارات API + `/_not-found`. (الرقم "38 مسارًا = 9×2×2" الذي ظهر في تخطيطات سابقة **لا يطابق مخرجات البناء** — التحقق الفعلي هو الأصح.)
- كل النصوص في `messages/en.json` و`messages/ar.json` (8 مجموعات: `common/footer/home/notFound/errorPage/countdown/thankYou/page`).

### 5.4 اعتماد Platinumlist للتذاكر (وليس Stripe)

- `.env.local.example`: `NEXT_PUBLIC_PLATINUMLIST_URL=https://platinumlist.net/event/tedx-youth-alfalah` ✅
- `src/app/[locale]/tickets/page.tsx:211`: زر يشير إلى `process.env.NEXT_PUBLIC_PLATINUMLIST_URL || "https://platinumlist.net/event/tedx-youth-alfalah"`
- **لا يوجد** `STRIPE_SECRET_KEY` في أي ملف أو متغير، ولا يوجد مسار دفع في الكود → التذاكر تُباع خارجيًا حصريًا.

### 5.5 فروق إضافية

| البند | قبل | الآن |
|---|---|---|
| الخطوط | Google Fonts (فشل البناء بلا إنترنت) | `next/font/local` — خطان محليان (Inter + Noto Kufi Arabic) |
| خريطة الهوم | بلاطات تختفي (Service Worker يرد 408 مختلقًا) | `sw.js` v2: أي طلب عبر الأصل يذهب للشبكة مباشرة + كاش `tedx-v2` |
| فشل حفظ الـ Sheet | كان يُسقط الطلب (500) | غير قاتل — الإشعار الإداري قناة الاستلام الأساسية |
| التوثيق السابق | `DOCUMENTATION.md` متمركزة حول Vercel/Resend | بنية `docs/` هذه (مع `08-deployment-hosting.md` للنشر على Hostinger) |
| `.env.local.example` | كان مستبعدًا من Git بنمط `.env*` | أصبح مرفوعًا مع الكود (استثناء مضاف في `.gitignore`) |

---

## 6. قائمة المصطلحات والاختصارات (Glossary)

| المصطلح / الاختصار | التعريف (من سياق المشروع) |
|---|---|
| **TEDx** | برنامج أحداث محلية مستقل مرخّص من TED — "TEDxAlFalah Youth" حدث من هذا النوع، وموضّح في JSON-LD كـ "independently organized TEDx event". |
| **Sanity CMS** | نظام إدارة المحتوى؛ مشروع `hisn3dku` (حساب العميل) بداتاسيت `production`، ويُدار من مجلد `studio/` ويُقرأ عبر `src/lib/sanity.ts` بـ CDN. |
| **GROQ** | لغة استعلامات Sanity المستخدمة في `src/lib/data.ts` (مثل `*[_type == "speaker" && isPublished == true]`) لجلب المنشور فقط. |
| **Next.js App Router** | هيكلة الموقع: مجلدات `src/app/[locale]/` و`src/app/api/` + ملفات `route.ts` و`page.tsx` و`layout.tsx`. |
| **Middleware (Proxy)** | ملف `middleware.ts` في الجذر — يعترض الطلبات لتوجيه اللغة (en/ar) قبل الوصول للصفحات؛ يعرضه Next 16 كـ "Proxy (Middleware)". |
| **i18n / next-intl** | نظام الترجمة الدولي؛ ملفات `messages/{en,ar}.json` و`src/i18n/` (routing/request/navigation). |
| **RTL** | اتجاه النص من اليمين لليسار — يُفعَّل للعربية عبر `dir="rtl"` في `layout.tsx` وحرف خط Noto Kufi. |
| **SSG / Static Generation** | توليد الصفحات وقت البناء — مخرجات `next build` صنّفت `/_not-found` و`/robots.txt` و`/sitemap.xml` كمسارات ثابتة (○)، بينما صفحات `[locale]` الـ12 ومسارات API الأربعة ديناميكية (ƒ) تُقدَّم عند الطلب مع كاش وإعادة توليد عبر Webhook. |
| **CSP** | سياسة أمان المحتوى (`Content-Security-Policy`) في `next.config.ts` — قائمة بيضاء صارمة للمصادر (Sanity API، Cloudflare، GTM، Google Maps...). |
| **eventInfo** | نوع Sanity (مستند تحكم واحد) بحقول `date`/`venue` و**المفاتيح الثلاثة** `showSpeakers`/`showSponsors`/`showTeam` التي تتحكم بقسم الرئيسية المقابل فقط — الصفحات المستقلة (`/speakers`، `/team`) تفتح دائمًا بحالة «قريبًا» (غياب الأعلام = إخفاء إرادي). |
| **Fail-Open** | سياسة عدم الفشل عند غياب المفاتيح: تمرير الطلب مع تحذير في السجل (Turnstile/Rate Limit/Mailer/Sheets/Sanity). |
| **Mock Data** | **لم يتم العثور على `src/lib/mock-data.ts` في الكود** — البيانات التجريبية عبارة عن وثائق منشورة فعلًا في Sanity (8 وثائق)، والسلوك عند غياب الإعداد هو فراغ آمن. |
| **Platinumlist** | منصة تذاكر خارجية في الإمارات — وجهة زر الشراء في `/tickets` عبر `NEXT_PUBLIC_PLATINUMLIST_URL`. |
| **Upstash Redis** | خدمة Redis سحابية — يستخدمها `src/lib/rate-limit.ts` عبر `@upstash/ratelimit` لتحديد 5 طلبات/10 د/فورم/IP. |
| **Turnstile** | خدمة Cloudflare لمكافحة البوتات — widget في `src/components/ui/TurnstileWidget.tsx` وتحقق server-side في `src/lib/turnstile.ts`. |
| **SMTP / nodemailer** | بروتوكول إرسال البريد مع مكتبة Node — ناقل الإرسال الحالي عبر Hostinger (`src/lib/mailer.ts`). |
| **Sanity Webhook / revalidate** | إشعار Sanity لـ `/api/revalidate` (`src/app/api/revalidate/route.ts`) — يستدعي `revalidatePath` للصفحات المرتبطة بالنوع عبر `TYPE_PATH_MAP`، محميًا بـ `SANITY_WEBHOOK_SECRET`. |
| **JSON-LD** | بيانات Schema.org المدمجة في HTML (Organization/WebSite/Event) عبر `src/lib/json-ld.ts` + مكوّن `JsonLd.tsx` — لتحسين ظهور نتائج البحث. |
| **isPublished / wave** | حقلا Sanity: `isPublished` يفلتر المنشور فقط في كل الاستعلامات؛ `wave` يحدد ترتيب إعلان المتحدثين (1,2,3...). |
| **APPLICATION_DEADLINE** | ثابت في `src/lib/constants.ts` = `2026-09-30T23:59:59+04:00` — يغلق فورم التقديم تلقائيًا ويعرض رسالة بديلة. |

---

## 7. خلاصة سريعة (أصابع اليد)

1. الموقع **مكتمل البرمجة** — كل شيء مبني ويعمل محليًا، والبناء والفحص نظيفان.
2. **البريد مفعّل فعليًا** عبر SMTP Hostinger (المسار الحرج الوحيد الذي لا ينتظر العميل).
3. **4 أنظمة** بانتظار مفاتيح العميل: Google Sheets، Turnstile، Upstash، Webhook Sanity + مستند eventInfo.
4. **النشر** على Hostinger Node (دومين يستضيف أصلًا) — خطواته في `docs/08-deployment-hosting.md`.
5. صفر صيانة تقنية للعميل بعد التسليم: المحتوى من Studio، والرسائل تصله في صناديقه، والتذاكر عبر Platinumlist.

> **مهم:** هذه الوثيقة مرجع قراءة وليست دليل تشغيل — الخطوات العملية في `docs/03-setup-and-env.md` (التشغيل) و`docs/09-operations-runbook.md` (التشغيل اليومي).