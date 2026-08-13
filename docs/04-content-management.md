# 04 — نظام إدارة المحتوى (Sanity CMS)

**الملف**: `docs/04-content-management.md`
**الجمهور المستهدف**: فريق المحتوى (العميل) + المطورين — وثيقة "أين تعدّل ماذا في Sanity وكيف يصل للموقع".
**المصدر**: مجلد `studio/schemaTypes/` + `src/lib/data.ts` + `src/lib/sanity.ts` + `src/app/api/revalidate/route.ts` — كل معلومة بمسار سطر دقيق.

---

## 1. نظرة عامة على مشروع Sanity

| الخاصية | القيمة | الدليل في الكود |
|---|---|---|
| **Project ID** | `hisn3dku` | `studio/sanity.config.ts:19` و`studio/sanity.cli.ts:5` (الافتراضي — يُستبدل بـ `SANITY_STUDIO_PROJECT_ID` إن عُرف) |
| **Dataset** | `production` | `studio/sanity.config.ts:20` + `studio/sanity.cli.ts:6` + `src/lib/sanity.ts:11` |
| **اسم المشروع** | "TEDxAlFalah Youth" | `studio/sanity.config.ts:17` |
| **studioHost** | `tedxalfalahyouth` | `studio/sanity.cli.ts:8` — الرابط بعد النشر: `https://tedxalfalahyouth.sanity.studio` |
| **عدد أنواع المحتوى** | **7 أنواع** | `studio/schemaTypes/index.ts:9` |
| **عميل القراءة** | CDN عام، `apiVersion: "2025-01-01"`، مهلة 60 ثانية | `src/lib/sanity.ts:8-15` |
| **الصور** | من `cdn.sanity.io` فقط (وحيد في `remotePatterns`) | `next.config.ts:39-41` |

**الأنواع السبعة** (المحتوى الديناميكي كله): `speaker` (متحدث) · `teamMember` (فريق) · `activation` (نشاط) · `sponsor` (راعٍ) · `galleryImage` (معرض) · `session` (فقرة جدول) · `eventInfo` (إعدادات الحدث).

> **كيف يتصل الموقع بالبيانات؟** `src/lib/sanity.ts:8-16` ينشئ عميلًا عامًا (بلا توكن) **فقط إذا وُجد** `NEXT_PUBLIC_SANITY_PROJECT_ID`؛ وإلا `sanityClient = null` وكل الدوال تعيد قوائم فارغة بأمان (Fail-Gracefully — تفصيله في القسم 4).

---

## 2. شرح الأنواع السبعة حقلًا بحقل

### 2.1 `speaker` — المتحدثون (الملف: `studio/schemaTypes/speaker.ts`)

| الحقل | النوع | الشرط (Validation) | أين يظهر في الموقع |
| :--- | :--- | :--- | :--- |
| `name` | string | **مطلوب** (سطر 12) | اسم المتحدث — بطاقة `SpeakerCard` وصفحة `/speakers` و`SpeakersPreview` بالرئيسية |
| `photo` | image + hotspot | **مطلوب** (سطر 19) | الصورة — تُقص `width(400).quality(80)` (`data.ts:49`) في البطاقة والـ Modal |
| `shortDescriptor` | string | اختياري — مثال: "student innovator" (سطر 24) | سطر تحت الاسم بالبطاقة (`data.ts:50`) |
| `talkTitle` | string | اختياري (سطر 30) | عنوان المحاضرة (`data.ts:51`) |
| `themeConnection` | string | اختياري (سطر 36) | عبارة ربط بالثيم (`data.ts:52`) |
| `bio` | text | اختياري — إرشاد: 100–150 كلمة (سطر 41) | داخل النافذة المنبثقة `SpeakerModal` (`data.ts:53`) |
| `socialLinks` | object | اختياري — حقول: `instagram`, `linkedin`, `x` (روابط url) (أسطر 45–53) | أيقونات التواصل في البطاقة/الـ Modal (`data.ts:54`) |
| `wave` | number | **مطلوب** `min(1)` (سطر 59) — "1, 2, 3... ترتيب كشف المتحدثين" | **فرز** ترتيب الظهور: `order(wave asc)` (`data.ts:31`) |
| `isPublished` | boolean | افتراضي `false` (سطر 66) | **بوابة النشر**: الفلتر `isPublished == true` (`data.ts:31`) |

### 2.2 `teamMember` — الفريق (`studio/schemaTypes/teamMember.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `name` | string | **مطلوب** (سطر 12) | اسم العضو — صفحة `/team`، ترتيب `order(name asc)` (`data.ts:73`) |
| `photo` | image + hotspot | اختياري (سطر 18) | صورة 400px (`data.ts:89`) |
| `role` | string | **مطلوب** (سطر 24) | المسمى الوظيفي (`data.ts:91`) |
| `department` | string بقائمة | **مطلوب** — قائمة: Curation / Production / Speaker Coaching / Marketing / Partnerships / Volunteers (أسطر 30–39) | شارة/تصنيف القسم + الفلترة (`data.ts:92`) |
| `quote` | string | اختياري (سطر 45) | اقتباس العضو (`data.ts:93`) |
| `linkedinUrl` | url | اختياري (سطر 50) | رابط لينكدإن (`data.ts:94`) |
| `isPublished` | boolean | افتراضي `false` (سطر 56) | بوابة النشر (`data.ts:73`) |

### 2.3 `activation` — الأنشطة (`studio/schemaTypes/activation.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `name` | string | **مطلوب** (سطر 12) | عنوان النشاط — صفحة `/activations` |
| `image` | image + hotspot | **مطلوب** (سطر 19) | صورة 600px (`data.ts:124`) |
| `description` | text | **مطلوب** — إرشاد: 50–80 كلمة (سطر 26) | وصف البطاقة (`data.ts:126`) |
| `locationInVenue` | string | اختياري (سطر 31) | موقع النشاط في المكان (`data.ts:127`) |
| `order` | number | **مطلوب** (سطر 37) | **فرز**: `order(order asc)` (`data.ts:109`) |
| `isPublished` | boolean | افتراضي `false` (سطر 43) | بوابة النشر (`data.ts:109`) |

### 2.4 `sponsor` — الرعاة (`studio/schemaTypes/sponsor.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `name` | string | **مطلوب** (سطر 12) | اسم الراعي — `SponsorsStrip` بالرئيسية |
| `logo` | image | **مطلوب** (سطر 18) | الشعار 200px (`data.ts:156`) |
| `tier` | string بقائمة | **مطلوب** — Platinum / Gold / Silver / Community / Supporter (أسطر 24–26) | تقسيم الطبقات/المستوى (`data.ts:158`) |
| `websiteUrl` | url | اختياري (سطر 32) | رابط موقع الراعي (الضغط على الشعار) (`data.ts:159`) |
| `isPublished` | boolean | افتراضي `false` (سطر 38) | بوابة النشر (`data.ts:142`) |

### 2.5 `session` — فقرات الجدول (`studio/schemaTypes/session.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `title` | string | **مطلوب** (سطر 12) | عنوان الفقرة — صفحة `/schedule` + `Highlights` بالرئيسية (`data.ts:166`) |
| `type` | string بقائمة | **مطلوب** — talk / break / activation / registration (أسطر 18–25) | شارة نوع الفقرة + فلترة الجدول (`data.ts:167`) |
| `startTime` | string | **مطلوب** + regex `HH:MM` بصيغة 24 ساعة (أسطر 33–36) | وقت البداية — **يرتب الجدول**: `order(startTime asc)` (`data.ts:164`) |
| `endTime` | string | **مطلوب** + regex `HH:MM` 24 ساعة (أسطر 43–46) | وقت النهاية |
| `speaker` | reference → `speaker` | اختياري — "ذو صلة فقط لفقرات Talk" (سطر 52) | يُحلّ لاسم المتحدث: `"speakerName": speaker->name` (`data.ts:170`) |
| `location` | string | اختياري — "Main Stage", "East Hall" (سطر 59) | موقع الفقرة (`data.ts:172`) |
| `description` | text | اختياري — "للاستراحات والأنشطة" (سطر 65) | وصف الفقرة (`data.ts:173`) |
| `isPublished` | boolean | افتراضي `false` (سطر 71) | بوابة النشر (`data.ts:164`) |

### 2.6 `galleryImage` — معرض الصور (`studio/schemaTypes/galleryImage.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `name` | string | اختياري (سطر 11) | اسم داخلي للصورة |
| `image` | image + hotspot | **مطلوب** (سطر 18) | الصورة 1200px (`data.ts:218`) — معرض صفحة `/venue` (`venue/page.tsx:26`) |
| `alt` | string | اختياري (سطر 23) | النص البديل للوصول (`data.ts:219`) |
| `caption` | string | اختياري (سطر 28) | التسمية التوضيحية (`data.ts:220`) |
| `category` | string بقائمة | **مطلوب** — venue / speakers / behind (أسطر 34–40) | تبويبات المعرض (`data.ts:221`) |
| `order` | number | اختياري (سطر 46) | **فرز**: `order(order asc)` (`data.ts:204`) |
| `isPublished` | boolean | افتراضي `false` (سطر 52) | بوابة النشر (`data.ts:204`) |

### 2.7 `eventInfo` — إعدادات الحدث (`studio/schemaTypes/eventInfo.ts`)

| الحقل | النوع | الشرط | أين يظهر |
| :--- | :--- | :--- | :--- |
| `title` | string | اختياري (سطر 11) | اسم الحدث (`data.ts:182`) |
| `date` | date (`YYYY-MM-DD`) | اختياري — مثال 2026-12-19 (سطر 17) | تاريخ الحدث (JSON-LD والترجمات) |
| `venue` | string | اختياري (سطر 25) | مكان الحدث |
| `showSpeakers` | boolean | افتراضي `false` (سطر 33) — "شغّله ليظهر قسم المتحدثين وصفحتهم" | **يُظهر/يُخفي**: قسم `SpeakersPreview` بالرئيسية + صفحة `/speakers` (انظر القسم 4) |
| `showSponsors` | boolean | افتراضي `false` (سطر 41) — "شغّله ليظهر قسم الرعاة" | **يُظهر/يُخفي**: `SponsorsStrip` بالرئيسية |

> ⚠️ `eventInfo` **وثيقة مفردة** (يُقرأ `[0]` فقط — `data.ts:181`): لا تنشئ أكثر من نسخة.

---

## 3. دليل الاستوديو العملي (Workflow Guide)

### 3.1 إنشاء متحدث جديد (وصفة كاملة)

1. افتح **`https://tedxalfalahyouth.sanity.studio`** وسجّل الدخول بحساب Sanity.
2. من الشريط الجانبي الأيسر انقر **Speaker** (سترى قائمة المتحدثين الحاليين).
3. اضغط زر **"+ New Speaker"** أعلى القائمة — تفتح شاشة التحرير بحقول النوع أعلاه.
4. املأ:
   - **Full Name** (إجباري) — الاسم الظاهر للجمهور.
   - **Photo** (إجباري) — ارفع الصورة، ثم اضغط على الصورة لضبط **الـ hotspot** (نقطة تركيز الصورة — مهم لتقصّي القص الصحيح في البطاقات).
   - **Short Descriptor** — مثل "student innovator".
   - **Talk Title** / **Connection to the Event Theme** / **Biography** (100–150 كلمة).
   - **Social Links** — روابط Instagram وLinkedIn وX.
   - **Announcement Wave** (إجباري، ≥1) — رقم موجة الإعلان؛ المتحدثون يُرتبون بحسبه (الأصغر أولًا).
5. **دع "Published" كما هو (Off)** ما لم تكن مستعدًا لظهوره الآن.
6. اضغط **"Publish"** (الزر العلوي الأزرق — ينشر الوثيقة ولا يحتاج خطوات إضافية).

### 3.2 من النشر إلى الظهور (ماذا يحدث فورًا؟)

- **في الإنتاج مع Webhook مفعّل**: ظهر المتحدث خلال ثوانٍ — الـ Webhook يُرسل "يتحدث" إلى `/api/revalidate` الذي يعيد بناء الصفحات المتأثرة دون إعادة بناء الموقع كله (القسم 5).
- **في التطوير المحلي**: أعد تحميل الصفحة (البيانات تُجلب عند كل طلب عبر CDN — لا تخزين دائم).
- **بدون Webhook**: الصفحات تبقى مبنية مسبقًا حتى إعادة بناء/نشر جديدة.

### 3.3 مثال عملي (من الصفر إلى الظهور)

> أنشئ متحدثًا باسم **"أحمد"**: الاسم = أحمد، صورة، `wave: 1`، و`isPublished: ON`. النتيجة: يظهر فورًا (مع Webhook) في بطاقة `SpeakerCard` بقسم **"Speakers" بالصفحة الرئيسية** وصفحة **`/speakers`** — أولًا بين المتحدثين (لأن `wave: 1` هو الأصغر). إن أردت إظهار القسم كله من الأساس، فعّل **`showSpeakers`** في وثيقة `eventInfo` (القسم 4).

### 3.4 إخفاء متحدث (Unpublish) أو حذف (Delete)

- **لإخفاء مؤقت**: افتح الوثيقة → زر القائمة (•••) → **Unpublish** — يختفي من الموقع فورًا (والبيانات باقية).
- **لحذف نهائي**: زر القائمة → **Delete document** — تُحذف نهائيًا ولا تُستعاد؛ استخدمها فقط عند يقينك (في الأغلب **Export أولًا**، القسم 3.5).

### 3.5 نسخة احتياطية (Export)

1. من الشريط الجانبي: زر **"…"** أعلى يسار قائمة أي نوع.
2. اختر **Export Dataset** — تُصدَّر حزمة JSON/NDJSON لكل المحتوى (يُنصح بعملها قبل أي حذف جماعي).

---

## 4. إدارة الظهور (EventInfo + الأقسام المقفلة)

### 4.1 المنطق (من الكود الفعلي)

| مفتاح العرض | المواضع المتأثرة | الكود |
|---|---|---|
| `eventInfo.showSpeakers` | قسم الرئيسية + **صفحة `/speakers` كاملة** | `src/app/[locale]/page.tsx` (عرض مشروط) + `src/app/[locale]/speakers/page.tsx:15-16` (عند `false` → **`notFound()`**) |
| `eventInfo.showSponsors` | `SponsorsStrip` بالرئيسية فقط | `src/app/[locale]/page.tsx` (عرض مشروط) |

كلاهما `initialValue: false` — أي **الوضع الافتراضي = مخفي** عمدًا حتى الإعلان الرسمي.

### 4.2 Fail-Gracefully (لا أخطاء 500 أبدًا)

- `src/lib/sanity.ts:4-6`: غياب `NEXT_PUBLIC_SANITY_PROJECT_ID` → `isSanityConfigured: false`.
- `src/lib/data.ts:4-5`: `fetchSanity` ترجع `null` عند غياب الإعداد أو أي فشل (مع `console.error` في التطوير فقط، سطر 10).
- كل دالة جلب تنتهي بـ `if (!raw) return []` (`data.ts:44,84,119,151,176,214`) — القوائم تصبح فارغة بأناقة، والمكوّنات تعرض حالاتها الفارغة المصممة (مخفي/رسالة).
- `getEventInfo()` ترجع `null` — والصفحات تستخدم `?.` (`eventInfo?.showSpeakers`) فلا ينكسر شيء.
- **النتيجة**: موقع بلا بيانات = موقع "نظيف" يعمل، وليس صفحة خطأ.

---

## 5. Webhook وإعادة التحقق (Revalidation) — تحديث تلقائي للموقع

### 5.1 كيف يعمل (من `src/app/api/revalidate/route.ts`)

1. Sanity يرسل `POST` عند **Publish/Unpublish** إلى `https://<دومين>/api/revalidate?secret=<السر>`.
2. **التحقق** (`verifySecret`, أسطر 16–29): يقبل السر من `?secret=` أو رأس `x-sanity-webhook-secret`؛ **لا يُفعَّل التحقق أصلًا إلا إذا عُرّف `SANITY_WEBHOOK_SECRET`** (سطر 40: إن عُرّف وتخالف → `401`).
3. قبل المعالجة: فحص الأصل (CORS) + حد الطلبات (`checkRateLimit(request, "revalidate")`, سطر 35) — 429 بعد التجاوز.
4. يقرأ `_type` من الجسم، ويمطابق جدول المسارات، ثم `revalidatePath` لكل مسار — **فيُعاد بناء الصفحات المتأثرة فقط عند الزيارة التالية** (دون إعادة بناء الموقع كله).

### 5.2 جدول `TYPE_PATH_MAP` (أسطر 8–14) — المسارات المعاد بناؤها

| نوع المحتوى المتغير | الصفحات التي تُحدَّث فورًا |
|---|---|
| `speaker` | `/` الرئيسية (`/[locale]`) + صفحة المتحدثين (`/[locale]/speakers`) |
| `teamMember` | صفحة الفريق (`/[locale]/team`) |
| `activation` | صفحة الأنشطة (`/[locale]/activations`) |
| `session` | صفحة الجدول (`/[locale]/schedule`) |
| `eventInfo` | الرئيسية + المتحدثين + الجدول (تؤثر في مفاتيح العرض) |
| **أي نوع آخر** (sponsor / galleryImage / نوع مستقبلي) | احتياط عام: `revalidatePath("/", "layout")` (سطر 61) — يُعاد بناء كل شيء مرة واحدة |

> ملاحظة دقة: `sponsor` و`galleryImage` **غير مسجلين** في الخريطة — يمران بالاحتياط العام. إن أصبحا متكرري التعديل، أضفهما للجدول بنفس نمط الباقي.

### 5.3 تكوين الـ Webhook في Sanity (وصفة كاملة)

1. ادخل **Sanity Dashboard** → مشروع `TEDxAlFalah Youth` → **API** → **Webhooks** → **Create webhook**.
2. **URL**: `https://tedxalfalahyouth.com/api/revalidate?secret=YOUR_STRONG_SECRET` — وللاختبار المحلي: `http://localhost:3000/api/revalidate?secret=...` (يتطلب إنترنت عام لمشروع محلي — أو استخدمه لاحقًا بعد النشر).
3. **Frequency**: فعّل **Publish** و**Unpublish** (وأبقِ Create إيقافًا إلا إن أردت التحديث عند المسودات).
4. **Dataset**: `production`.
5. اضبط **نفس السر** بمتغير البيئة `SANITY_WEBHOOK_SECRET` في `.env.local`/لوحة الاستضافة.
6. **جرّب**: من Sanity غيّر محتوى منشورًا → خلال ثوانٍ يصبح الموقع الجديد مرئيًا في المتصفح (Hard Refresh) — والتحقق الهندسي: طلب `/api/revalidate` يدويًا يعيد `{"revalidated": true, ...}`.

> **تحذير:** `SANITY_WEBHOOK_SECRET` مفتاح أمان حقيقي — اجعله عشوائيًا طويلًا (مولّد كلمات مرور)، ولا ترفعه إلى Git (في `.env.local` فقط)، ولا تشاركه. أي من يملكه يمكنه مسح كاش الموقع بأكمله.

---

## 6. خطة الفيديو (Video Strategy — قسم مستقبلي)

### 6.1 الوضع الحالي (مؤكد بالكود)
- **لا يوجد أي حقل فيديو** في الأنواع السبعة — لا `videoUrl` في `speaker` ولا `session` ولا `activation`.
- الواجهة تعرض صورًا ونصوصًا فقط؛ لا مكوّن مشغّل فيديو في المشروع (لا `react-player` في `package.json`).
- `frame-src` في CSP يسمح حاليًا فقط بـ `challenges.cloudflare.com` و`google.com/maps` (`next.config.ts:30`).

### 6.2 خطة الإضافة المقترحة (5 خطوات لا تكسر شيئًا)

1. **المخططات**: أضف في `studio/schemaTypes/speaker.ts` (بجانب `talkTitle`) حقل:
   ```ts
   defineField({ name: "videoUrl", title: "Talk Video (YouTube/Vimeo)", type: "url" }),
   ```
   (وللجدول: الحقل نفسه في `session.ts`).
2. **الواجهة**: أنشئ مكوّن `VideoPlayer` (في `src/components/ui/`) يستقبل `videoUrl` كـ prop ويعرض iframe داخل `SpeakerModal` (أو صفحة المتحدثين). **استخدم iframe `youtube-nocookie.com`** أو مكتبة مثل `react-player` (يجب تثبيتها: `npm i react-player`).
3. **السياسة الأمنية**: حدّث `next.config.ts:30` — `frame-src` ليشمل `https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com` (+ `img-src` لصور اليوتيوب المصغرة إن استخدمتها).
4. **الاستعلامات**: أضف `videoUrl` لاستعلام `getSpeakers` في `src/lib/data.ts` (سطر 31–42) والأنواع في `src/lib/types.ts` (حقل اختياري `videoUrl?: string | null` — لا يُكسر أي كود قديم لكونه اختياريًا).
5. **النشر**: أنشر المخططات المحدّثة (`cd studio && npm run deploy`) — المحتوى الجديد قابل للإضافة فورًا، وحقول الفيديو تُضاف فقط للمتحدثين الذين يملكونه (القيم الفارغة لا تعرض شيئًا).

**تسلسل تنفيذي**: مخطط ← أنوع ← CSP ← واجهة ← محتوى — وكل خطوة قابلة للنشر مستقلة دون تعطيل الوضع الحالي (الحقل الاختياري مضمون بـ `?? ""`/فحص وجود في الواجهة).

---

## 7. نشر Sanity Studio (ليصبح متاحًا لفريق المحتوى)

```bash
cd studio          # 1) من مجلد المشروع الرئيسي
npm install        # 2) تثبيت حزم الستوديو (package.json خاص به)
npx sanity login   # 3) يفتح المتصفح — سجّل بحساب Sanity (حساب العميل/المشرف)
npx sanity deploy  # 4) نشر — سيعيد الرابط المُختار سابقًا
```

- `studioHost` **محدد مسبقًا** في `studio/sanity.cli.ts:8` = `tedxalfalahyouth` — النتيجة: **`https://tedxalfalahyouth.sanity.studio`** (هذا هو الرابط الذي تسلّمه لفريق المحتوى، ويُفضّل إضافته كمفضلة/وضع حجز للعميل).
- **مفتاح الإنتاج**: يمكن تعريف `SANITY_STUDIO_PROJECT_ID` في متغيرات بيئة الستوديو (`studio/.env`) لضمان ارتباط النسخة المنشورة بمشروع `hisn3dku` نفسه بغض النظر عن أي تعديل محلي.
- عند نشر مخططات معدّلة لاحقًا (كخطة الفيديو): أعد `npx sanity deploy` — والنسخ المقدمة تُحدَّث تلقائيًا.

---

## 8. خلاصة للفريق (قبلة أخيرة للمحتوى)

| تريد أن... | تفعل في Studio |
|---|---|
| تظهر متحدثًا | أنشئ `Speaker` + `wave` + **Published ON** + فعّل `showSpeakers` في `eventInfo` |
| يظهر قسم الرعاة | أنشئ `Sponsor`s + فعّل `showSponsors` |
| تحدث الجدول | عدّل/أنشئ `Session`s (أوقات بصيغة HH:MM 24h) |
| تخفي شيءًا بسرعة | Unpublish (وليس Delete) |
| تحفظ نسخة من كل شيء | … → Export Dataset |
| يتحدث الموقع فورًا | Webhook مفعّل + `SANITY_WEBHOOK_SECRET` مطابق |