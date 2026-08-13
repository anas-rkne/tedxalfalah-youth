# 07 — SEO والتحليلات (SEO & Analytics)

**الملف**: `docs/07-seo-and-analytics.md`
**الجمهور المستهدف**: العميل (فهم الظهور في محركات البحث) + المطورون (التعديلات الدقيقة).
**المصدر**: الكود الفعلي — `sitemap.ts`, `robots.ts`, `json-ld.ts`, `layout.tsx`, `Analytics.tsx`, `routing.ts`.

---

## 1. `robots.txt` و`sitemap.xml` والروابط البديلة (Alternates)

### 1.1 `robots.ts` — سياسة الزحف (ملف من 11 سطرًا)

`src/app/robots.ts` هو مكوّن MetadataRoute في Next.js App Router — يولّد `/robots.txt` ديناميكيًا:

| الخاصية | القيمة في الكود (سطر) | المعنى |
|---|---|---|
| `userAgent` | `"*"` (سطر 6) | السياسة تنطبق على كل محركات البحث |
| `allow` | `"/"` (سطر 7) | **السماح بالزحف لكل الصفحات** — لا يوجد حظر |
| `sitemap` | `` `${process.env.BASE_URL || "https://www.tedxalfalahyouth.com"}/sitemap.xml` `` (سطر 9) | يوجّه المحركات إلى ملف الخريطة (يُستخدم `BASE_URL` أو الافتراضي) |

### 1.2 `sitemap.ts` — خريطة الموقع (34 سطرًا)

**المسارات المولّدة** (`ROUTES` — أسطر 6–18، 11 مسارًا):
`/` · `/team` · `/venue` · `/activations` · `/schedule` · `/apply` · `/tickets` · `/tickets/success` · `/tickets/cancel` · `/faq` · `/thank-you`

**آلية التوليد** (أسطر 20–33): `routing.locales.flatMap` — لكل مسار × لكل لغة من `["en", "ar"]` (`src/i18n/routing.ts:4`) تُنشأ نسخة، بمجموع **22 عنوان URL**:
- `url`: `` `${BASE_URL}/${locale}${route}` `` (سطر 23) — مسار مطلق باللغة.
- `lastModified: new Date()` (سطر 24) — يتحدث مع كل بناء.
- `changeFrequency: "weekly"` (سطر 25).
- `priority`: `1` للرئيسية (`route === ""`) و`0.7` للباقي (سطر 26).

**الروابط البديلة (hreflang)** — الكود الحرفي (أسطر 27–31):
```ts
alternates: {
  languages: Object.fromEntries(
    routing.locales.map((l) => [l, `${BASE_URL}/${l}${route}`])
  ),
},
```
أي لكل صفحة نسختاها: `en → https://…/en/<route>` و`ar → https://…/ar/<route>` — تُخبر Google أن `/en/schedule` و`/ar/schedule` نفس المحتوى بلغتين، فتُفهرس النسخة الصحيحة حسب لغة الباحث.

> ⚠️ **ثغرة موثقة (ناقص من الخريطة):** صفحة **`/speakers` غير موجودة في `ROUTES`** رغم أنها صفحة فعلية (`src/app/[locale]/speakers/page.tsx`) — وهي مُدارة بمفتاح `eventInfo.showSpeakers` (مخفية افتراضيًا). عند الإعلان الرسمي عن المتحدثين يجب إضافة `"/speakers"` إلى `ROUTES` (سطر 6–18) وإعادة البناء. **لاحظ أيضًا:** الخريطة ثابتة — لا تُولَّد صفحات Sanity الديناميكية (متحدث/جلسة) فيها.

---

## 2. بيانات JSON-LD المنظمة (Structured Data)

### 2.1 آلية الإدراج

كل مخطط يُصيّر عبر مكوّن `JsonLd` (`src/components/JsonLd.tsx:5-11`) الذي ينتج:
```html
<script type="application/ld+json">{…JSON.stringify(data)…}</script>
```
أين تُوضع المخططات (من الاستخدام الفعلي):

| المخطط | الموضع |
|---|---|
| `organizationSchema()` | `<head>` لكل الصفحات — `src/app/[locale]/layout.tsx:130` |
| `webSiteSchema()` + `eventSchema(eventInfo)` | الصفحة الرئيسية — `src/app/[locale]/page.tsx:44-45` (البيانات من `getEventInfo()` سطر 32–40) |
| `breadcrumbListSchema(...)` | مكوّن `BreadcrumbJsonLd` في body لكل الصفحات — `layout.tsx:139` |
| `personSchema(...)` | صفحتا الفريق والمتحدثين — `team/page.tsx:36` و`speakers/page.tsx:40` |

كل الدوال في **`src/lib/json-ld.ts`** (117 سطرًا). `BASE_URL` يُقرأ من البيئة مع افتراضي `https://www.tedxalfalahyouth.com` (سطر 1).

### 2.2 المخططات (JSON الحرفي من الكود)

**① `webSiteSchema()`** (أسطر 70–87) — يُنشر بالرئيسية:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TEDxAlFalah Youth",
  "url": "https://www.tedxalfalahyouth.com",
  "description": "Young voices. Real ideas. The future starts earlier than we think.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://www.tedxalfalahyouth.com/?s={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
}
```
يعلن للمحركات أن هذا موقع مؤسسة ويوفر قالب بحث `?s=`.

**② `organizationSchema()`** (أسطر 3–18) — يُنشر في كل صفحة:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TEDxAlFalah Youth",
  "url": "https://www.tedxalfalahyouth.com",
  "logo": "https://www.tedxalfalahyouth.com/my-favicon/favicon-96x96.png",
  "description": "An independently organized TEDx event showcasing young voices and real ideas.",
  "sameAs": [
    "https://www.instagram.com/tedxalfalahyouth",
    "https://www.linkedin.com/company/tedxalfalahyouth",
    "https://x.com/tedxalfalahyouth"
  ]
}
```
مهم لـ Knowledge Panel: يربط حساباته الرسمية الثلاثة بالكيان.

**③ `eventSchema(eventInfo)`** (أسطر 20–68) — يُنشر بالرئيسية؛ الشكل المولد (مع القيم الحالية):
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "TEDxAlFalah Youth",
  "startDate": "2026-12-19",
  "endDate": "2026-12-19",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Abu Dhabi, United Arab Emirates",
    "address": { "@type": "PostalAddress", "addressLocality": "Abu Dhabi, United Arab Emirates", "addressCountry": "AE" }
  },
  "organizer": { "@type": "Organization", "name": "TEDxAlFalah Youth", "url": "https://www.tedxalfalahyouth.com" },
  "description": "Young voices. Real ideas. The future starts earlier than we think. An independently organized TEDx event."
}
```
يُضاف `performer` تلقائيًا (سطر 59–65) إن مُررت قائمة متحدثين — جاهز لليوم الذي تُمَر فيه القائمة.

**④ `breadcrumbListSchema(items)`** (أسطر 89–100) — مسار تنقل كل صفحة كـ `ListItem` بترتيب.

**⑤ `personSchema(person)`** (أسطر 102–117) — يضيف `description`/`image` إن وجدا (متحدث/عضو فريق).

### 2.3 الاحتياطات (Fallbacks & Cautions)

- **`BASE_URL`**: كل الروابط في المخططات مطلقة وتُبنى من `BASE_URL` — غياب المتغير يستخدم الافتراضي `https://www.tedxalfalahyouth.com` (سطر 1 في `json-ld.ts`، وكذلك `sitemap.ts:4` و`robots.ts:9` و`layout.tsx:22`).
- **البيانات الفارغة** في `eventSchema` (أسطر 27–29): غياب `eventInfo.date` → `"2026-12-19"`، وغياب `eventInfo.venue` → `"Abu Dhabi, United Arab Emirates"` — المخطط يعمل دائمًا بلا انكسار.
- **`eventInfo` غير موجود أصلًا**: `getEventInfo()` يرجع `null` → `eventSchema({...})` يتعامل بسلام (القيم الاختيارية).

> **تحذير:** يجب تحديث `startDate` و`endDate` في `eventSchema` بتاريخ الحدث الحقيقي قبل الإطلاق — القيمة الحالية (2026-12-19) **افتراضية من الكود** وقد لا تصح إن تغيّر الموعد (طريقة التحديث الصحيحة: ضبط حقل `date` في وثيقة `eventInfo` بـ Sanity Studio — سيعكسها الموقع تلقائيًا).

---

## 3. Open Graph وTwitter Cards (الوسوم الاجتماعية)

من `generateMetadata` في `src/app/[locale]/layout.tsx:41-99`:

| الوسم | القيمة في الكود (سطر) | ملاحظات |
|---|---|---|
| `metadataBase` | `new URL(baseUrl)` (49) | أساس كل الروابط النسبية في الـ metadata |
| `title.default` | `TEDxAlFalah Youth \| Tomorrow, Now.` (45، 51) | — |
| `title.template` | `%s \| TEDxAlFalah Youth` (52) | كل صفحة تدمج اسمها: "التقديم \| TEDxAlFalah Youth" |
| `og:title` | `TEDxAlFalah Youth \| Tomorrow, Now.` (78) | ثابت (سطر 45) |
| `og:description` | `Young voices. Real ideas. The future starts earlier than we think. An independently organized TEDx event.` (47، 79) | ثابت (سطر 46–47) |
| `og:image` | `${baseUrl}/og-image.jpg` — 1200×630 (86–89) | الملف في `public/og-image.jpg` |
| `og:url` | `baseUrl` (80) | — |
| `og:siteName` | `TEDxAlFalah Youth` (81) | — |
| `og:locale` | `ar_AE` للعربية / `en_US` للإنجليزية (82) | **الوسم الوحيد الذي يتغير حسب اللغة** |
| `og:type` | `website` (83) | — |
| `twitter:card` | `summary_large_image` (93) | صورة كبيرة عند المشاركة |
| `twitter:title` / `description` / `image` | نفس قيم OG (94–96) | — |
| `twitter:site` | **غير معرّف** | يُنصح بإضافته (`@tedxalfalahyouth`) إن وُجد الحساب الرسمي |
| `icons` / `manifest` / `appleWebApp` | أيقونات PWA + `site.webmanifest` (55–70) | تفاصيل العرض في التطبيقات |

**التعريب (بصدق تقني):**
- قيم الـ OG/Twitter الأساسية في الـ layout **ثوابت إنجليزية** للغتين — اللغة تؤثر فقط على `og:locale`.
- أما `title` و`description` فتتعرّب فعليًا على مستوى الصفحات: كل صفحة لها `generateMetadata` خاص يقرأ الترجمات من `messages/*.json` — مثال الرئيسية (`page.tsx:19-26`): `title: t("meta.title")` و`description: t("meta.description")` ينتجان عربيًا في `/ar` وإنجليزيًا في `/en`، والنتيجة النهائية تُدمج مع قالب الـ layout (`%s | TEDxAlFalah Youth`).

---

## 4. Google Analytics 4 (GA4)

### 4.1 المفتاح والإعداد
- **`NEXT_PUBLIC_GA_ID`** في `.env.local.example:83` = **`G-N3JFXW8D7J`** (موجود ومفعّل حاليًا في `.env.local`).
- الحمولة في مكوّن `Analytics` (`src/components/Analytics.tsx` — "use client") داخل `layout.tsx:137` (`<Analytics />` ضمن `ClientProvider`).

### 4.2 متى يُحمّل وما الشرط (الكود الحرفي المختصر)

```ts
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;        // سطر 14
const IS_PROD = process.env.NODE_ENV === "production"; // سطر 16
...
{GA_ID && IS_PROD && (                              // سطر 41 — الشرط المزدوج
  <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive" />         // بعد تفاعل الصفحة
    <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { page_path: window.location.pathname, anonymize_ip: true });
    `}</Script>
  </>
)}
```

- **لا يُحمّل في التطوير إطلاقًا** (`IS_PROD`) — تجنب تشويه إحصاءاتك وخصوصية المطور.
- **تتبع التنقل**: `useEffect` يرسل `gtag("config", GA_ID, { page_path: pathname, anonymize_ip: true })` عند كل تغيير مسار (سطر 22–29) — أهم منه مع App Router: بعد `afterInteractive` وحدها لا يُسجَّل التصفح بين الصفحات بدون هذا الـ hook.
- **`anonymize_ip: true`** في الحمولتين — إخفاء آخر أوكتيت من IP (تخفيف خصوصية).

> **تنبيه هام:** يتم حاليًا تحميل GA4 **افتراضيًا** (بلا أداة موافقة كوكيز). قبل الإطلاق في مناطق تتطلب موافقة صريحة (كأوروبا — GDPR / بريطانيا PECR) يجب إضافة أداة إدارة الموافقة (Cookiebot / OneTrust) تربط تحميل السكربت بموافقة الزائر. **كما يجب التأكد من ظهور البانر إعلانًا لخصوصية القُصَّر خاصةً لأن الجمهور الأساسي شباب وقاصرون.**

### 4.3 الخيار البديل (Plausible)
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (سطر 15، مفسّر في `Analytics.tsx:33-40`): إن عُرّف يُحمَّل `plausible.io/js/script.js` — بديل خصوصية صارم؛ التنبيه في `.env.local.example` يوصي بتعطيل GA4 عند استخدامه.

### 4.4 التوافق مع CSP
`next.config.ts` يسمح صراحةً بنطاقات Google في ثلاثة تصريحات: `script-src` و`img-src` و`connect-src` (أسطر 26، 29، 32 تشمل `https://www.google-analytics.com` و`https://www.googletagmanager.com`) — بدونها كانت سكربتات GA محجوبة.

---

## 5. خلاصة تنفيذية (للعميل)

| السؤال | الجواب |
|---|---|
| هل الموقع مفهرس بالكامل؟ | نعم — `robots.txt` يسمح بكل شيء، و22 عنوان URL في `sitemap.xml` (11 صفحة × لغتين) مع `hreflang` صحيح |
| ماذا سيرى جوجل؟ | مخططات منظمة: Organization في كل صفحة + Event وWebSite بالرئيسية + Breadcrumb لكل صفحة + Person للمتحدثين والفريق |
| هل التحليلات تعمل؟ | نعم — GA4 (`G-N3JFXW8D7J`) في الإنتاج فقط، مع `anonymize_ip` وتتبع تنقل كامل |
| **أين يجب العمل قبل الإطلاق؟** | ① تحديث تاريخ `eventInfo` الفعلي في Sanity · ② إضافة `/speakers` لـ `ROUTES` في `sitemap.ts` عند الإعلان · ③ أداة موافقة كوكيز (GDPR) · ④ إضافة `twitter:site` · ⑤ التحقق من `BASE_URL` في الاستضافة |