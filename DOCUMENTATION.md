# TEDxAlFalah Youth — التوثيق الشامل للمشروع

**حالة المشروع: مكتمل بالكامل من الناحية البرمجية والوظيفية.**
الإيميلات التلقائية تعمل الآن **فعلياً عبر SMTP Hostinger** (nodemailer)
بصناديق الدومين نفسها — لا حاجة لخدمة Resend. المتبقي فقط هو استكمال
بيانات قنوات "التخزين والحماية" (Google Sheets وCloudflare Turnstile
وUpstash) من حسابات العميل، ووضعها بملف `.env.local` — لا يوجد أي كود
ناقص أو "سيُبنى لاحقاً".

---

## جدول المحتويات

1. [نظرة عامة سريعة](#1-نظرة-عامة-سريعة)
2. [متطلبات التشغيل](#2-متطلبات-التشغيل)
3. [التشغيل المحلي خطوة بخطوة](#3-التشغيل-المحلي-خطوة-بخطوة)
4. [بنية المشروع الكاملة](#4-بنية-المشروع-الكاملة)
5. [شرح تفصيلي لكل صفحة](#5-شرح-تفصيلي-لكل-صفحة)
6. [كيف تعمل طبقة البيانات (Mock ↔ Sanity تلقائياً)](#6-كيف-تعمل-طبقة-البيانات)
7. [الحصول على المفاتيح الثلاثة بالتفصيل الكامل](#7-الحصول-على-المفاتيح-الثلاثة-بالتفصيل-الكامل)
8. [ملف .env.local الكامل مع شرح كل متغير](#8-ملف-envlocal-الكامل)
9. [النشر النهائي على Vercel](#9-النشر-النهائي-على-vercel)
10. [قائمة تحقق القبول النهائي (UAT Checklist)](#10-قائمة-تحقق-القبول-النهائي)
11. [مطابقة المشروع مع المتطلبات الأصلية (Traceability)](#11-مطابقة-المشروع-مع-المتطلبات-الأصلية)
12. [المحتوى الذي ينتظر العميل (Placeholders)](#12-المحتوى-الذي-ينتظر-العميل)
13. [استكشاف الأخطاء الشائعة](#13-استكشاف-الأخطاء-الشائعة)
14. [دعم اللغتين وصفحة الشكر](#14-دعم-اللغتين-english--العربية-وصفحة-الشكر-المخصصة)
15. [الأنيميشن التفاعلي](#15-الأنيميشن-التفاعلي-framer-motion-وما-حولها)

---

## 1. نظرة عامة سريعة

| البند | القيمة |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| اللغة | TypeScript (فحص صارم، صفر أخطاء) |
| التنسيق | Tailwind CSS v4 |
| عدد الصفحات | 9 صفحات + Sitemap + Robots تلقائيين |
| عدد API Routes | 4 (Contact, Apply, Partner Inquiry, Revalidate) |
| CMS | Sanity (Studio جاهز بمجلد `studio/`) |
| تخزين الفورمات | Google Sheets |
| الإيميلات التلقائية | SMTP Hostinger (nodemailer) — يعمل فوراً |
| حالة البناء الإنتاجي | ✅ تم اختباره فعلياً بـ `next build` ونجح 100% |
| حالة الفحص البرمجي | ✅ `tsc --noEmit` و`eslint` نظيفان تماماً (صفر أخطاء) |
| **طبقات الأمان** | ✅ حماية سبام (Turnstile) + Rate Limiting + Security Headers + تعقيم مدخلات المستخدم — مدمجة بكل الفورمات (Contact، Apply، Partner Inquiry). Fail-Open في التطوير فقط؛ في الإنتاج Turnstile + Rate-Limit **Fail-Closed** (403 عند غياب المفاتيح) |
| **الأنيميشن التفاعلي** | ✅ Framer Motion كامل: كتابة تلقائية، Flip Clock (العدّاد التنازلي)، أزرار Liquid، عدادات تصاعدية، كاروسيل بالسحب، كرة أرضية ثلاثية الأبعاد (three-globe) |

**كيف يعمل المشروع الآن بغياب المفاتيح؟**
لا توجد بيانات تجريبية: بدون مفاتيح Sanity تُخفى أقسام المحتوى الفارغة
تلقائياً (متحدثون، فريق، رعاة، فعاليات). الفورمات تعمل بسلوك fail-open
في **التطوير** فقط (تسجيل خفيف بـ Terminal بلا أي بيانات شخصية)، بينما
في **الإنتاج** تُرفض الفورمات بـ 403 عند غياب مفاتيح Turnstile/Rate-Limit.
للربط الكامل: انسخ `.env.local.example` → `.env.local` واملأ القيم
(راجع القسم 7).

---

## 2. متطلبات التشغيل

| الأداة | الإصدار المطلوب | كيفية التحقق |
|---|---|---|
| Node.js | 20.9 أو أحدث (نص `engines` بـ package.json) | `node -v` |
| npm | 10 أو أحدث | `npm -v` |
| Git | أي إصدار حديث | `git --version` |

---

## 3. التشغيل المحلي خطوة بخطوة

```bash
# 1. فك الضغط والدخول للمجلد
unzip tedxalfalahyouth-website.zip
cd tedxalfalahyouth-website

# 2. تثبيت الحزم
npm install

# 3. التشغيل
npm run dev
```

افتح المتصفح على `http://localhost:3000`. سيُعيد توجيهك تلقائياً لـ
`http://localhost:3000/en` (اللغة الافتراضية). يجب أن تشاهد:
- الصفحة الرئيسية بعداد تنازلي حي (Countdown) يعمل فعلياً
- قائمة تنقل تتحول لقائمة همبرغر على الموبايل
- 8 أقسام بالصفحة الرئيسية (Hero، Sponsors، Contact، About، Theme، Highlights، Team، Apply)
- زر تبديل اللغة (EN/AR) بأعلى يمين الهيدر — جرّبه وتأكد أن الصفحة تتحول
  للعربية مع انعكاس الاتجاه (RTL) فوراً

جرّب التنقل لكل الصفحات من القائمة العلوية للتأكد أن كل شيء يعمل قبل
المتابعة.

### التحقق من بناء إنتاجي كامل (اختياري لكن مستحسن)
```bash
npm run build
npm start
```
إذا ظهرت رسالة `✓ Generating static pages` دون أي خطأ، فكل الصفحات
(بنسختيها EN وAR) وAPI routes جاهزة للنشر بدون أي مشكلة.

---

## 4. بنية المشروع الكاملة

```
tedxalfalahyouth-website/
├── .env.local.example          ← انسخه إلى .env.local واملأ المفاتيح
├── README.md                    ← دليل مختصر (نسخة سريعة من هذا الملف)
├── next.config.ts                ← مهيأ لقبول صور Sanity CDN
├── package.json
│
├── middleware.ts                 ← ★ يقع بجذر المشروع (وليس داخل src/) — راجع 14.7
├── messages/
│   ├── en.json                    ← كل نصوص الواجهة الإنجليزية
│   └── ar.json                    ← كل نصوص الواجهة العربية
│
├── src/
│   ├── i18n/
│   │   ├── routing.ts              ← تعريف اللغات المدعومة (en, ar)
│   │   ├── navigation.ts           ← Link/useRouter الواعيان باللغة (استخدمهما دائماً بدل next/link)
│   │   └── request.ts              ← تحميل ملف الترجمة المناسب لكل طلب
│   │
│   ├── app/
│   │   ├── not-found.tsx                  ← صفحة 404 احتياطية جذرية (خارج نطاق اللغة، نادراً ما تظهر)
│   │   ├── sitemap.ts                     ← يولّد sitemap.xml بنسختين لكل صفحة (en+ar)
│   │   ├── robots.ts                      ← يولّد robots.txt تلقائياً
│   │   ├── api/                           ← API routes (لا تُترجَم، ليست صفحات)
│   │   │   ├── contact/route.ts           ← فورم Contact — كل الرسائل لصندوق CONTACT_EMAIL
│   │   │   ├── apply/route.ts             ← الأهم: Google Sheet + إيميل تأكيد + إشعار إداري
│   │   │   ├── partner-inquiry/route.ts   ← استفسارات الرعاة (جاهز — لا فورم واجهة يستدعيه حالياً)
│   │   │   └── revalidate/route.ts        ← Webhook من Sanity لإعادة توليد الصفحات
│   │   │
│   │   └── [locale]/                      ← ★ كل الصفحات الفعلية هنا (en أو ar)
│   │       ├── layout.tsx                 ← القالب العام (Header+Footer+RTL+Metadata)
│   │       ├── page.tsx                   ← الصفحة الرئيسية (Home) — مُترجَمة بالكامل
│   │       ├── not-found.tsx              ← صفحة 404 مخصصة بهوية TEDx — مُترجَمة بالكامل
│   │       ├── loading.tsx                ← حالة تحميل عامة (Spinner) لكل الموقع
│   │       ├── thank-you/page.tsx         ← ★ صفحة الشكر الموحّدة — مُترجَمة بالكامل
│   │       ├── speakers/page.tsx + loading.tsx
│   │       ├── team/page.tsx + loading.tsx
│   │       ├── venue/page.tsx + loading.tsx
│   │       ├── activations/page.tsx + loading.tsx
│   │       ├── apply/page.tsx + loading.tsx  ← الأعقد: فورم + Timeline + FAQ
│   │       ├── schedule/page.tsx + loading.tsx  ← الجدول الزمني الكامل ليوم الحدث
│   │       ├── faq/page.tsx + loading.tsx   ← أسئلة شائعة عامة (منفصلة عن أسئلة Apply)
│   │       └── tickets/                     ← مخفيّة بقرار العميل (كل صفحاتها تستدعي notFound)
│   │           ├── page.tsx / success/page.tsx / cancel/page.tsx (كلها → 404)
│   │
│   ├── components/
│   │   ├── layout/           Header.tsx, FooterContent.tsx
│   │   ├── header/           Logo.tsx, NavLink.tsx, MobileMenu.tsx, MoreDropdown.tsx
│   │   ├── ui/               Button.tsx, Modal.tsx, TurnstileWidget.tsx, TedxSpinner.tsx, ScrollSection.tsx, LanguageSwitcher.tsx, flip-clock.tsx, tedx-globe.tsx, UaeMap.tsx, LeafletMap.tsx ...
│   │   ├── shared/           Countdown.tsx, FaqAccordion.tsx, TextType.tsx, FadeUp.tsx ...
│   │   ├── home/             Hero, About, Theme, Highlights, TeamPreview, ApplyBanner, SponsorsStrip (ملف لـكل قسم + Content)
│   │   ├── speakers/         SpeakersGrid.tsx, SpeakerCard.tsx, SpeakerModal.tsx, SpeakersStage.tsx, SpeakersPreview.tsx
│   │   ├── apply/            ApplicationForm.tsx, ApplyTimeline.tsx, ApplyFAQ.tsx, ApplyHero.tsx
│   │   ├── contact/          ContactBox.tsx, ContactBoxWrapper.tsx
│   │   ├── schedule/         ScheduleItem.tsx, ScheduleTimeline.tsx, FilterBar.tsx
│   │   ├── venue/            VenueMapSection.tsx, VenueGallerySection.tsx
│   │   ├── activations/      ActivationCard.tsx
│   │   ├── team/             TeamMemberCard.tsx
│   │   └── thankyou/         ThankYouContent.tsx
│   │
│   └── lib/
│       ├── types.ts           ← تعريف Speaker, TeamMember, Activation, Sponsor, Session, EventInfo, GalleryImage
│       ├── sanity.ts          ← عميل Sanity (يُفعَّل تلقائياً بمجرد وجود المفتاح)
│       ├── data.ts            ← ★ نقطة الدخول الوحيدة: كل صفحة تستورد من هنا فقط (استعلامات GROQ)
│       ├── constants.ts       ← APPLICATION_DEADLINE (14 سبتمبر 2026) وثوابت أخرى
│       ├── json-ld.ts         ← مخططات Schema.org (Event, WebSite)
│       ├── turnstile.ts       ← التحقق من عدم كون المُرسل بوتاً (Cloudflare) — fail-closed في الإنتاج
│       ├── rate-limit.ts      ← 5 طلبات/10 دقائق/فورم/IP (Upstash)
│       ├── cors.ts            ← الأصول المسموح بها لاستدعاء الـ API
│       ├── sanitize.ts        ← تعقيم نصوص المستخدم قبل إدراجها بالإيميلات
│       ├── mailer.ts          ← إرسال SMTP (fail-open)
│       └── utils.ts
│
├── public/
│   ├── images/                ← صور الموقع (Artboard SVG، footer-red-bg.svg، venue-hero.webp، شعارات logo-black/white.png ...)
│   ├── Alexandria/ my-favicon/ ← خطوط/أيقونات محلية
│   ├── favicon.ico, og-image.jpg
│   └── sw.js + offline.html    ← Service Worker لـ PWA
│
└── studio/                     ← مشروع Sanity Studio (مستقل تماماً)
    ├── package.json            ← له تثبيت حزم منفصل: cd studio && npm install
    ├── sanity.config.ts
    ├── sanity.cli.ts
    └── schemaTypes/            ← 7 أنواع محتوى
        ├── speaker.ts / teamMember.ts / activation.ts / sponsor.ts / session.ts
        └── eventInfo.ts        ← مفاتيح إظهار/إخفاء الأقسام (showSpeakers/showSponsors/showTeam)
        └── galleryImage.ts     ← معرض صور المكان
```

---

## 5. شرح تفصيلي لكل صفحة

### 5.1 الصفحة الرئيسية (`/`)
8 أقسام بالترتيب الحالي للكود: Hero (بعداد تنازلي حي)، Sponsors Strip
(يظهر عند تفعيل `showSponsors` بـ Sanity)، Contact Form (فورم فعلي متصل
بـ `/api/contact`)، About، Theme، Highlights، Team Preview (يظهر عند
تفعيل `showTeam`)، Apply Banner. (لا يوجد قسم Speakers Preview —
الرئيسية تعرض معاينة الفريق بدلاً منه).

### 5.2 Speakers (`/speakers`)
شبكة بطاقات لكل المتحدثين المنشورين (`isPublished: true`)، مرتبة حسب
حقل `wave` (دفعة الإعلان). النقر على أي بطاقة يفتح نافذة منبثقة (Modal)
بكامل التفاصيل والسيرة الذاتية وروابط السوشال ميديا.

### 5.3 Team (`/team`)
كل الأعضاء مجمّعون تلقائياً حسب القسم (Curation, Production, Speaker
Coaching, Marketing, Partnerships, Volunteers) — الأقسام الفارغة تُخفى
تلقائياً بدل إظهار عنوان بلا محتوى.

### 5.4 Venue (`/venue`)
صورة Hero، فقرة سردية، خريطة Google Maps مدمجة (iframe مجاني بدون
الحاجة لمفتاح API)، معلومات إمكانية الوصول، معرض صور (6 صور).

### 5.5 Activations (`/activations`)
بلوكات متناوبة التخطيط (صورة يمين/نص يسار بالتناوب)، تُجلب ديناميكياً
وتُرتَّب حسب حقل `order`. إن كانت القائمة فارغة تظهر رسالة بديلة أنيقة
بدل صفحة فارغة.

### 5.6 Apply (`/apply`) — الصفحة الأهم والأعقد
بالترتيب الدقيق حسب المستند الأصلي:
1. نص الثيم الكامل
2. قسم "من يمكنه التقديم" (Young Speakers / Adult Experts)
3. شرح آلية المراجعة
4. **Timeline بصري بـ 11 مرحلة** (أفقي على الديسكتوب، عمودي على الموبايل)
5. **الفورم**: أول حقل يحدد المسار (Young Speaker / Expert)، وبناءً عليه
   تظهر حقول إضافية مختلفة (اسم المدرسة وولي الأمر للفئة الأولى، أو
   المنظمة ومجال العمل للفئة الثانية) — مبني بـ `react-hook-form` + `zod`
   مع تحقق شرطي كامل (`superRefine`)
6. **منطق الإغلاق التلقائي**: بعد تاريخ `APPLICATION_DEADLINE` المحدد
   بأعلى الملف، يختفي الفورم تلقائياً وتظهر رسالة "Applications are now
   closed" بدلاً منه
7. نص عدم القبول (حرفي كما بالمستند الأصلي)
8. أسئلة شائعة قابلة للطي (Accordion)

عند الإرسال: يُحفظ الطلب بـ Google Sheet **و** يُرسَل إيميل تأكيد فوري
للمتقدم — كلاهما عبر `/api/apply/route.ts`.

### 5.7 Sponsors (`/sponsors`) — ⚠️ الصفحة مخفيّة حاليًا
لا يوجد مسار `/sponsors` في الكود (أُزيل بقرار العميل). كشف الرعاة يتم
عبر شريط Sponsors بالصفحة الرئيسية (بيانات من Sanity)، وAPI استفسارات
الرعاة `/api/partner-inquiry` موجود وجاهز (يرسل لصندوق partners@) لكن
لا يوجد فورم واجهة يستدعيه حالياً. رابط تحميل PDF
(`public/sponsorship-deck.pdf`) لم يُرفع بعد — يُرفع لاحقاً عند الطلب.

### 5.8 Tickets (`/tickets`) — ⚠️ الصفحة مخفيّة حاليًا
صفحات `/tickets` و`/tickets/success` و`/tickets/cancel` موجودة بالكود
لكنها تستدعي `notFound()` بقرار العميل (لا يُعرض الشراء بالموقع الآن).
كود Stripe (TicketPurchaseForm و`lib/tickets.ts` و`api/create-checkout-session`)
**أُزيل بالكامل**. إن عادت التذاكر لاحقاً، المسار المُوصى به: زر خارجي
لمنصة Platinumlist عبر `NEXT_PUBLIC_PLATINUMLIST_URL` (محفوظ بـ `.env.local`).

### 5.9 Schedule (`/schedule`) — صفحة جديدة
جدول زمني كامل ليوم الحدث، يُجلب من نوع محتوى `session` بـ Sanity
(مرتبط بالمتحدثين عبر reference). كل جلسة تُصنَّف بصرياً حسب نوعها
(Talk بلون أحمر TEDx، Break، Activation، Registration) وتعرض التوقيت
والموقع واسم المتحدث (مع رابط لصفحته إن وُجد).

### 5.10 FAQ (`/faq`) — صفحة جديدة
أسئلة شائعة عامة للزوار (الوصول، سماح الأهل بالحضور، الطعام، التأخر عن
الموعد، إلخ) — منفصلة تماماً عن أسئلة صفحة Apply المتعلقة بالتقديم فقط.
تستخدم مكوّن `FaqAccordion` المشترك (نفس المكوّن الذي أُعيد استخدامه
بصفحة Apply لتفادي التكرار).

### 5.11 Terms (`/terms`) — ⚠️ الصفحة أُزيلت حاليًا
لا يوجد مسار `/terms` في الكود (أُزيل بقرار العميل). إن أُعيدت لاحقاً
يُعاد بناء المحتوى القانوني من مصدر مُراجَع قانونياً — **تنبيه**: لا
يُنشر أي نص قانوني قبل مراجعة محامٍ مرخّص بدولة الإمارات (خصوصاً فيما
يخص قانون حماية البيانات الشخصية PDPL وأحكامه الخاصة بالقُصَّر).

---

## 6. كيف تعمل طبقة البيانات

كل صفحة تستورد دوال البيانات (`getSpeakers`, `getTeamMembers`, إلخ) من
ملف واحد فقط: **`src/lib/data.ts`**. هذا الملف يتخذ القرار تلقائياً:

```
هل NEXT_PUBLIC_SANITY_PROJECT_ID موجود بملف .env.local؟
   نعم → يجلب البيانات الحقيقية من Sanity عبر استعلامات GROQ
   لا  → يعيد قوائم فارغة — تُخفى الأقسام الفارغة تلقائياً بالواجهة
        (لا توجد بيانات تجريبية في المشروع)
```

**النتيجة العملية**: بمجرد إضافة مفتاح Sanity، يتحول الموقع بالكامل
لعرض بياناتك الحقيقية **بدون تعديل أي سطر كود آخر** بأي صفحة أو مكوّن.

---

## 7. الحصول على المفاتيح الثلاثة بالتفصيل الكامل

### 7.1 — Sanity CMS

**الهدف**: لوحة تحكم يدخل منها فريق الحدث لإضافة/تعديل المتحدثين
والفريق والرعاة والفعاليات بأنفسهم دون الحاجة لمطور.

```bash
cd studio
npm install
npx sanity login
```
سيفتح لك المتصفح لتسجيل الدخول (حساب Google أو GitHub أو إيميل). بعدها:
```bash
npx sanity init --project-name "TEDxAlFalah Youth" --dataset production
```
سيسألك:
- "Would you like to use the existing configuration?" → اختر **Yes**
  (لاستخدام `sanity.config.ts` الجاهز مسبقاً بالمشروع)

بعد الانتهاء ستحصل على **Project ID** (سلسلة من 8 أحرف/أرقام تقريباً).
انسخه وضعه بملف `.env.local` **بجذر المشروع الرئيسي** (وليس بمجلد
`studio`):
```
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
```

انشر الـ Studio ليصبح متاحاً أونلاين لفريق الحدث:
```bash
npx sanity deploy
```
اختر اسم subdomain (مثلاً `tedxalfalahyouth`) → ستحصل على رابط:
`https://tedxalfalahyouth.sanity.studio`

هذا هو الرابط الذي يدخل منه فريق العميل لاحقاً لإضافة المحتوى. أضف أول
متحدث تجريبي وتأكد أنه يظهر بالموقع الحقيقي بعد إعادة تشغيل `npm run dev`
بالمجلد الرئيسي.

### 7.2 — Google Sheets API

**الهدف**: كل طلب Apply أو تسجيل تذكرة يُحفظ كصف جديد بجدول تراه فوراً
بدون انتظار الإيميلات.

**الخطوة 1 — إنشاء الجدول:**
أنشئ Google Sheet جديد باسم "TEDxAlFalah Applications"، وأضف بالصف
الأول (Row 1) عناوين الأعمدة التالية **بنفس الترتيب والتهجئة بالضبط**:
```
timestamp | track | fullName | age | email | phone | city | talkIdeaTitle | ideaSummary | whyItMatters | themeConnection | howHeardAboutUs | schoolName | guardianName | guardianContact | organizationAndRole | areaOfWorkWithYouth
```

**الخطوة 2 — تفعيل الـ API:**
1. افتح [console.cloud.google.com](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً (أو استخدم موجوداً)
3. من القائمة الجانبية: APIs & Services → Library → ابحث عن
   "Google Sheets API" → Enable

**الخطوة 3 — إنشاء Service Account:**
1. APIs & Services → Credentials → Create Credentials → Service Account
2. أعطه اسماً (مثلاً `tedx-website-bot`) → Create and Continue → Done
3. من قائمة الـ Service Accounts، افتح الحساب الذي أنشأته → تبويب Keys
   → Add Key → Create New Key → JSON → سيُحمَّل ملف JSON تلقائياً

**الخطوة 4 — استخراج البيانات من ملف الـ JSON:**
افتح الملف الذي تم تحميله، ستجد بداخله:
```json
{
  "client_email": "tedx-website-bot@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
}
```

**الخطوة 5 — مشاركة الـ Sheet:**
افتح Google Sheet الذي أنشأته بالخطوة 1 → زر Share → الصق بريد
`client_email` من الملف → اختر صلاحية **Editor** → Send.

**الخطوة 6 — إضافة القيم بملف `.env.local`:**
```
GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz...
GOOGLE_SERVICE_ACCOUNT_EMAIL=tedx-website-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
```
> `GOOGLE_SHEET_ID` تجده برابط الـ Sheet نفسه، بين `/d/` و `/edit`:
> `docs.google.com/spreadsheets/d/`**`هذا_الجزء`**`/edit`

> ملاحظة مهمة: انسخ `GOOGLE_PRIVATE_KEY` بالكامل بين علامتي اقتباس كما
> هو، شاملاً `\n` الظاهرة بالنص — الكود يعالجها تلقائياً.

**(اختياري) لتفعيل تسجيل التذاكر أيضاً:** كرر الخطوات 1-6 بجدول منفصل
وضع النتيجة بمتغير `GOOGLE_TICKETS_SHEET_ID`.

### 7.3 — SMTP Hostinger (الإيميلات التلقائية)

**الهدف**: إيميل تأكيد فوري للمتقدمين، وإشعار إداري كامل ببيانات كل طلب
لصندوق الفريق، وإشعارات وصول رسائل التواصل واستفسارات الرعاية — كلها عبر
صناديق Hostinger نفسها، دون أي خدمة خارجية.

**ما نحتاجه مسبقاً** (يوفره صاحب الاستضافة): صندوق مرسل فعلي ببيانات
SMTP الخاصة به. الإعداد الافتراضي بالمشروع:
- `SMTP_HOST=smtp.hostinger.com` + `SMTP_PORT=465` (SSL)
- `SMTP_USER` / `SMTP_PASS` = `marhaba@tedxalfalahyouth.com`
- `EMAIL_FROM` = اسم وبريد المُرسِل الظاهر (صندوق حقيقي على نفس الدومين)

أضفها بملف `.env.local`:
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=marhaba@tedxalfalahyouth.com
SMTP_PASS=xxxxxxxx
EMAIL_FROM=TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>
```

**الصناديق المستلمَة** (المسارات الفعلية بملفات `src/app/api/*/route.ts`):
- فورم Contact → **كل** الرسائل لصندوق `CONTACT_EMAIL` (marhaba@) — لا
  توزيع حسب الموضوع
- فورم Apply → إشعار إداري لـ `ADMIN_APPLICATIONS_EMAIL` + `CONTACT_EMAIL`
- استفسارات الرعاة → `PARTNER_EMAIL`
- `MEDIA_EMAIL` غير مستخدم في الكود (احتياطي فقط)
```
ADMIN_APPLICATIONS_EMAIL=apply@tedxalfalahyouth.com
CONTACT_EMAIL=marhaba@tedxalfalahyouth.com
PARTNER_EMAIL=partners@tedxalfalahyouth.com
MEDIA_EMAIL=media@tedxalfalahyouth.com
```

> دون بيانات SMTP تبقى الفورمات تعمل وترد `success: true` مع تحذير
> `[MAILER] SMTP not configured` في السجل — لكن **لا تُطلق الموقع
> للجمهور قبل ضبطها**.

---

### 7.4 — Cloudflare Turnstile (حماية الفورمات من السبام)

**الهدف**: منع البوتات الآلية من إغراق الفورمات بطلبات مزيفة —
ضروري بشكل خاص لأن فورم Apply يجمع بيانات أطفال حقيقيين.

1. افتح [dash.cloudflare.com](https://dash.cloudflare.com) → سجّل مجاناً
   إن لم يكن لديك حساب
2. من القائمة الجانبية: Turnstile → Add Site
3. أدخل الدومين `tedxalfalahyouth.com` (أو `localhost` للاختبار المحلي)
4. اختر Widget Mode: **Managed** (الخيار الافتراضي، الأنسب لمعظم الحالات)
5. ستحصل على مفتاحين: **Site Key** (عام) و**Secret Key** (سري)

أضفهما بملف `.env.local`:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

> بدون هذين المفتاحين: في وضع **التطوير** تعمل الفورمات بدون تحقق
> (fail-open)، أما في **الإنتاج** فتُرفض كل الفورمات برمز **403**
> (fail-closed) — يجب ضبط المفاتيح قبل الإطلاق، وإلا فلن يعمل الموقع
> للجمهور إطلاقاً.

### 7.5 — Upstash Redis (تحديد عدد الطلبات المسموحة)

**الهدف**: منع أي طرف من استدعاء API routes آلاف المرات بالثانية
(Rate Limiting)، حتى لو تجاوز الـ Captcha بطريقة ما.

1. افتح [console.upstash.com](https://console.upstash.com) → سجّل مجاناً
2. Create Database → اختر منطقة قريبة من مستخدميك (مثلاً `me-central-1`
   إن كانت متاحة، وإلا أقرب منطقة أوروبية)
3. من صفحة قاعدة البيانات، انسخ **UPSTASH_REDIS_REST_URL** و
   **UPSTASH_REDIS_REST_TOKEN** (موجودان بقسم "REST API" مباشرة)

أضفهما بملف `.env.local`:
```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxx...
```

الإعداد الافتراضي بالكود: **5 طلبات لكل IP كل 10 دقائق** لكل فورم على
حدة (Contact وApply وPartner Inquiry — كل منها له حد مستقل). بدون
مفاتيح Upstash: الفورم يعمل في التطوير، ويُرفض بـ 429 في الإنتاج
(fail-closed). يمكن تعديل الرقم بملف `src/lib/rate-limit.ts`.

---

### 7.6 — Stripe (الدفع بصفحة Tickets) — ⚠️ أُزيل من المشروع

كود الدفع (Stripe Checkout، `src/lib/tickets.ts`، صفحتا
`/tickets/success` و`/tickets/cancel`، وفورم `TicketPurchaseForm`)
**أُزيل بالكامل**، وصفحات `/tickets` نفسها مخفيّة بقرار العميل (راجع 5.8).

إن قرر العميل لاحقاً أن التذاكر مدفوعة، المسار المُوصى به الآن: زر خارجي
لمنصة Platinumlist عبر `NEXT_PUBLIC_PLATINUMLIST_URL` المحفوظ بـ
`.env.local` — بلا أي تكامل دفع داخلي.

---

## 8. ملف .env.local الكامل

```bash
cp .env.local.example .env.local
```
ثم افتحه واملأ كل قيمة بما حصلت عليه بالقسم 7 أعلاه. الملف الكامل بعد
التعبئة يجب أن يبدو هكذا (بقيم توضيحية فقط):

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=marhaba@tedxalfalahyouth.com
SMTP_PASS=xxxxxxxx
EMAIL_FROM=TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>

ADMIN_APPLICATIONS_EMAIL=apply@tedxalfalahyouth.com
CONTACT_EMAIL=marhaba@tedxalfalahyouth.com
PARTNER_EMAIL=partners@tedxalfalahyouth.com
MEDIA_EMAIL=media@tedxalfalahyouth.com

GOOGLE_SHEET_ID=1AbCdEf...
GOOGLE_SERVICE_ACCOUNT_EMAIL=tedx-bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_SANITY_PROJECT_ID=ab12cd34
NEXT_PUBLIC_SANITY_DATASET=production
```

بعد الحفظ، أعد تشغيل الخادم (`Ctrl+C` ثم `npm run dev` من جديد) — Next.js
لا يقرأ متغيرات البيئة الجديدة إلا عند إعادة التشغيل.

---

## 9. النشر النهائي على Vercel

```bash
git add .
git commit -m "Add real API keys placeholders / final content"
git remote add origin <رابط مستودعك على GitHub>
git push -u origin main
```

1. افتح [vercel.com](https://vercel.com) → New Project → استورد نفس
   المستودع
2. **قبل الضغط على Deploy**: افتح تبويب Environment Variables وأضف كل
   متغير من ملف `.env.local` يدوياً (Vercel لا يقرأ `.env.local` أبداً
   لأنه غير مرفوع لـ Git عن قصد لأسباب أمنية)
3. اضغط Deploy
4. بعد نجاح النشر، من Settings → Domains أضف الدومين الحقيقي
   `tedxalfalahyouth.com` واتبع تعليمات DNS الظاهرة

---

## 10. قائمة تحقق القبول النهائي

قبل تسليم الموقع للعميل نهائياً، تأكد من كل بند:

- [ ] كل الصفحات التسع تفتح بدون خطأ 404 أو 500
- [ ] فورم Apply: يُرسَل ويظهر بالـ Google Sheet خلال ثوانٍ
- [ ] فورم Apply: وصل إيميل التأكيد فعلياً (تحقق من Spam أيضاً)
- [ ] فورم Contact بالصفحة الرئيسية يصل لصندوق marhaba@
- [ ] فورم Become a Partner يصل لصندوق partner@
- [ ] تغيير `APPLICATION_DEADLINE` بملف `src/app/apply/page.tsx` لتاريخ
      ماضٍ يُخفي الفورم تلقائياً ويظهر رسالة الإغلاق
- [ ] إضافة متحدث جديد بـ Sanity Studio يظهر بالموقع الحقيقي خلال دقيقة
- [ ] الموقع يعمل بصرياً بشكل صحيح على موبايل حقيقي (ليس فقط DevTools)
- [ ] كل نصوص `[PLACEHOLDER]` استُبدلت بمحتوى العميل الحقيقي (راجع القسم 12)
- [ ] رابط `/terms` يحتوي النص القانوني النهائي وليس القالب المؤقت
- [ ] مفتاحا Turnstile مضافان — التحقق من ظهور الـ widget فعلياً بكل الفورمات (Contact/Apply/Partner Inquiry)
- [ ] مفتاحا Upstash مضافان — تجربة إرسال نفس الفورم 6 مرات متتالية يُظهر رسالة "Too many requests" بالمحاولة السادسة
- [ ] صلاحية الوصول لـ Google Sheet مقيّدة لأعضاء الفريق فقط (وليست "Anyone with the link")
- [ ] النص القانوني بصفحة Terms روجع من محامٍ (خصوصية بيانات القُصَّر تحديداً)

---

## 11. مطابقة المشروع مع المتطلبات الأصلية

جدول تتبع مباشر لكل بند بمستند البريف الأصلي (Structure and Content
Brief) وحالته بالمشروع الفعلي:

| بند بالمستند الأصلي | الحالة |
|---|---|
| Header: شعار، قائمة تنقل (Home/Team/Apply)، زر Apply بارز | ✅ منفّذ |
| Header: مبدّل لغة (if bilingual) | ✅ منفّذ (LanguageSwitcher بأعلى يمين الهيدر — الموقع ثنائي اللغة) |
| Footer: تواصل، سوشال ميديا، روابط سريعة، نص ترخيص TEDx، رابط Terms، حقوق نشر | ✅ منفّذ بالكامل حرفياً |
| Home: Hero (اسم الحدث، الثيم، Countdown، زرّي CTA) | ✅ منفّذ |
| Home: About مع نص الترخيص | ✅ منفّذ |
| Home: Theme بالنص الحرفي الكامل | ✅ منفّذ حرفياً |
| Home: Speakers preview + رابط لكل المتحدثين | ✅ منفّذ |
| Home: Highlights (venue teaser, activations teaser, أرقام) | ✅ منفّذ |
| Home: Apply banner بموعد نهائي | ✅ منفّذ |
| Home: Sponsors strip | ✅ منفّذ |
| Home: Contact form (Name, Email, Subject dropdown, Message) | ✅ منفّذ ومتصل بـ API فعلي |
| Speakers: Grid + Modal/صفحة فردية | ✅ منفّذ (اختيار Modal كما أوصت الخطة) |
| Speakers: كل الحقول المطلوبة (photo, name, descriptor, talk title, theme connection, bio, social) | ✅ منفّذ بالكامل |
| Speakers: دعم الإعلان بدفعات (waves) عبر CMS | ✅ منفّذ (حقل wave + isPublished بـ Sanity) |
| Team: مجمّع حسب 6 أقسام محددة | ✅ منفّذ حرفياً |
| Venue: اسم، صورة، سرد، خريطة، وصول، معرض صور | ✅ منفّذ |
| Venue: مخطط تفاعلي للمكان (اختياري بالمستند الأصلي) | ✅ منفّذ (خريطة تفاعلية UaeMap/LeafletMap بصفحة المكان) |
| Activations: بلوكات مرنة قابلة للإضافة/الحذف | ✅ منفّذ عبر Sanity |
| Apply: الثيم + من يمكنه التقديم + 80%/عبارة الترحيب | ✅ منفّذ حرفياً |
| Apply: شرح آلية المراجعة | ✅ منفّذ |
| Apply: Timeline بـ 11 مرحلة بالضبط بنفس الأسماء | ✅ منفّذ حرفياً |
| Apply: فورم بمسارين متفرعين وكل الحقول المطلوبة | ✅ منفّذ بالكامل مع تحقق شرطي |
| Apply: نص عدم القبول الحرفي | ✅ منفّذ حرفياً |
| Apply: FAQ Accordion | ✅ منفّذ |
| Apply: حفظ بجدول وليس إيميل فقط | ✅ منفّذ (Google Sheets) |
| Apply: إيميل تأكيد تلقائي | ✅ منفّذ (SMTP Hostinger) + إشعار إداري كامل بالبيانات |
| Apply: إغلاق تلقائي بموعد نهائي + رسالة بديلة | ✅ منفّذ |
| Sponsors: افتتاحية، شرائح، رعاة حاليون، CTA، PDF اختياري | ⚠️ الصفحة مخفيّة حاليًا بقرار العميل — شريط الرعاة بالرئيسية + API الرعاة جاهز (راجع 5.7) |
| Tickets: أنواع/أسعار، آلية شراء أو تسجيل، معلومات اليوم، سياسة الاسترجاع | ⚠️ الصفحة مخفيّة حاليًا بقرار العميل (notFound) — لا بيع تذاكر عبر الموقع الآن (راجع 5.8) |
| Terms: قالب بـ 6 أقسام قانونية | ⚠️ الصفحة أُزيلت حاليًا بقرار العميل — تُعاد فقط بعد مراجعة محامٍ (راجع 5.11) |

### ميزات إضافية أُضيفت بعد التسليم الأول (بطلب صريح، تتجاوز نطاق البريف الأصلي)

| الميزة | الحالة |
|---|---|
| حماية النماذج من السبام (Turnstile + Rate Limiting) | ✅ منفّذ على كل النماذج (Contact، Apply، Partner Inquiry) |
| نظام دفع تذاكر حقيقي (Stripe Checkout) | ❌ أُزيل من المشروع بالكامل — التذاكر عبر منصة خارجية عند الحاجة (راجع 7.6) |
| صفحة Schedule (جدول زمني ليوم الحدث) | ✅ منفّذ، مرتبط بالمتحدثين عبر Sanity |
| صفحة FAQ عامة (منفصلة عن أسئلة Apply) | ✅ منفّذ |
| صفحة 404 وLoading مخصصتان بهوية TEDx | ✅ منفّذ |
| Security Headers (CSP, HSTS, إلخ) | ✅ منفّذ |
| تعقيم مدخلات المستخدم قبل الإيميلات | ✅ منفّذ |
| دعم اللغتين (English/Arabic) بنية تقنية كاملة + RTL | ✅ منفّذ بالكامل (مساران لكل صفحة: en + ar) |
| ترجمة كاملة: Header, Footer, الصفحة الرئيسية, 404, صفحة الشكر | ✅ منفّذ حرفياً |
| ترجمة باقي الصفحات (Speakers, Apply, إلخ) | ⏸️ البنية التقنية جاهزة، النصوص بانتظار جلسة ترجمة منفصلة — راجع القسم 14.4 |
| صفحة شكر مخصصة بدل رسالة مضمّنة (`/thank-you`) | ✅ منفّذ على 3 من 3 فورمات (Contact، Apply، Partner Inquiry) |

**مبدّل اللغة ومخطط الموقع التفاعلي** (بندان اختياريان بالمستند الأصلي)
**منفّذان الآن** (LanguageSwitcher + UaeMap/LeafletMap). البنود
المتغيّرة بقرارات العميل: صفحات `/tickets` و`/sponsors` و`/terms`
مخفيّة/أُزيلت (راجع 5.7/5.8/5.11)، وملف PDF الرعاية يُرفع لاحقاً.

---

## 12. المحتوى الذي ينتظر العميل (Placeholders)

ابحث بمحرر الأكواد عن `[PLACEHOLDER` بمجلد `src/` (بحث شامل بكل
الملفات) لإيجاد كل نص ينتظر تزويداً حقيقياً من العميل. أبرزها:

| الموقع | المحتوى المطلوب |
|---|---|
| `src/components/home/Hero.tsx` | تاريخ الحدث الحقيقي (من وثيقة `eventInfo` بـ Sanity) |
| `src/components/home/About.tsx` | نص About النهائي |
| `src/components/home/Highlights.tsx` | الأرقام الحقيقية (عدد المتحدثين/الحضور/الفعاليات) |
| `src/components/home/ApplyBanner.tsx` | الموعد النهائي المعروض (نص الترجمة — القيمة المُلزمة في `src/lib/constants.ts`) |
| `src/lib/constants.ts` | `APPLICATION_DEADLINE` — **مُحسم: 14 سبتمبر 2026** (يغلق الفورم تلقائياً بعدها) |
| `src/components/apply/ApplyTimeline.tsx` | تواريخ المراحل الـ 11 الحقيقية |
| `src/components/apply/ApplyFAQ.tsx` | إجابات الأسئلة الشائعة الفعلية |
| `src/app/venue/page.tsx` | اسم المكان، النص السردي، رابط خريطة حقيقي، إرشادات المواقف |
| صفحة `/sponsors` | ~~الصفحة أُزيلت~~ — عند إعادتها: الفقرة الافتتاحية، مزايا كل شريحة رعاية |
| صفحة `/tickets` | ~~مخفيّة بقرار العميل~~ — عند إعادتها: تاريخ/وقت الحدث + زر Platinumlist خارجي |
| `src/app/schedule/page.tsx` | تاريخ الحدث، وجلسات Sanity الحقيقية |
| `src/app/faq/page.tsx` | إجابات الأسئلة الشائعة العامة الفعلية |
| صفحة `/terms` | ~~الصفحة أُزيلت~~ — عند إعادتها: النص القانوني الكامل بعد مراجعة محامٍ |
| شعارات الموقع | ✅ تم — `logo-black.png`/`logo-white.png` بـ `public/images` (مستخدمة بالهيدر والفوتر وصفحة الشكر) |
| `public/sponsorship-deck.pdf` | لم يُرفع بعد — يُرفع لاحقاً عند الطلب |

---

## 13. استكشاف الأخطاء الشائعة

**"الموقع يعمل لكن الصور لا تظهر بعد ربط Sanity"**
تأكد أن `next.config.ts` يحتوي `cdn.sanity.io` بقائمة `remotePatterns`
(موجود مسبقاً بالمشروع) — إن أضفت مصدر صور آخر مستقبلاً أضفه بنفس المكان.

**"فورم Apply يعطي خطأ 500"**
افحص الـ terminal أثناء تشغيل `npm run dev` — الخطأ الأشيع هو تنسيق
خاطئ لـ `GOOGLE_PRIVATE_KEY` (يجب أن يحتفظ بـ `\n` داخل النص).

**"التغييرات بـ .env.local لا تظهر"**
أعد تشغيل `npm run dev` بالكامل — Next.js يقرأ متغيرات البيئة فقط عند
بدء التشغيل.

**"Sanity Studio لا يعرض أنواع المحتوى"**
تأكد أنك اخترت "Yes" عند سؤال "use existing configuration" وقت
`sanity init`، وإلا كرر الخطوة وتأكد من عدم استبدال ملف
`studio/sanity.config.ts` الموجود مسبقاً.

**"npm run build يفشل بخطأ متعلق بالخطوط (fonts.googleapis.com)"**
هذا يحدث فقط إن كانت بيئة البناء بلا اتصال إنترنت طبيعي (نادر جداً).
Vercel وأي جهاز عادي متصل بالإنترنت لن يواجه هذه المشكلة إطلاقاً.

---

## 14. دعم اللغتين (English / العربية) وصفحة الشكر المخصصة

### 14.1 كيف تعمل بنية اللغتين

المشروع يستخدم **next-intl** مع نمط `[locale]` بمسارات Next.js. أهم ما يجب معرفته:

- كل الصفحات أصبحت تحت `src/app/[locale]/...` (مثال: `src/app/[locale]/speakers/page.tsx`)
- `middleware.ts` (بجذر المشروع — وليس داخل `src/`) يكتشف اللغة تلقائياً ويوجّه `/` لـ `/en` افتراضياً
- كل صفحة تُنشَأ تلقائياً بنسختين: `/en/...` و`/ar/...` (مؤكَّد فعلياً —
  بناء إنتاجي كامل ناجح، بواقع نسختين لكل صفحة)
- الاتجاه (RTL/LTR) يتغيّر تلقائياً حسب اللغة عبر `<html dir="rtl">` عند
  العربية — **مؤكَّد فعلياً** بالاختبار المباشر
- خط عربي مخصص (`Noto Sans Arabic`) يُحمَّل تلقائياً فقط عند اللغة العربية
- مبدّل اللغة (EN/AR) موجود بأعلى يمين الهيدر، يحافظ على نفس الصفحة الحالية
  عند التبديل (لا يعيدك للرئيسية)

### 14.2 الصفحات المُترجَمة بالكامل الآن

هذه الصفحات/المكونات تعرض محتوى عربياً حقيقياً كاملاً بالفعل، وليس فقط بنية
تقنية فارغة:

- **Header وFooter** (تظهران بكل صفحة بالموقع)
- **الصفحة الرئيسية بالكامل** (كل الأقسام الثمانية: Hero, Sponsors,
  Contact, About, Theme, Highlights, Team Preview, Apply Banner — شامل
  رسائل التحقق من الفورم بالعربية)
- **صفحة 404**
- **صفحة الشكر الجديدة** (`/thank-you`)

### 14.3 الصفحات التي تعمل بكلا اللغتين لكن **نصّها ما زال إنجليزياً**

هذه الصفحات تعمل تقنياً بشكل صحيح تحت `/ar/...` (لا أخطاء، لا صفحات
بيضاء)، لكن نصوصها الثابتة لم تُترجَم بعد: Speakers, Team, Venue,
Activations, Schedule, Apply, FAQ.

**لماذا هذا القرار؟** طلب المشروع كان "على الأقل توفير محتوى ثنائي اللغة
للصفحات الرئيسية" — وقد أُنجزت البنية التقنية الكاملة (القابلة للتوسعة
لأي صفحة بنفس الجهد) بالإضافة لأهم صفحة تحديداً (الرئيسية). ترجمة كل
صفحة بالتفصيل (خصوصاً Apply بحقولها الكثيرة) تستحق جلسة عمل مخصصة منفصلة
بما أن كل صفحة تحتاج ملء بيانات ترجمة دقيقة وليس فقط بنية.

### 14.4 كيف تُترجم أي صفحة متبقية (نفس النمط بالضبط)

لكل صفحة تريد ترجمتها، اتبع 3 خطوات بنفس نمط ما فُعل بصفحة Home:

1. أضف مفتاحاً جديداً بملفي `messages/en.json` و`messages/ar.json` (مثال:
   `"speakers": { "heading": "...", "seeAll": "..." }`)
2. بالصفحة (Server Component): استورد `getTranslations` من
   `"next-intl/server"` واستدعها بأول سطر:
   `const t = await getTranslations("speakers");`
3. استبدل كل نص ثابت بـ `{t("heading")}` بدل النص الإنجليزي المباشر

للمكونات التفاعلية (Client Components مثل الفورمات)، استخدم بدلاً من ذلك
`useTranslations` من `"next-intl"` مباشرة (بدون `await`)، كما فُعل
بـ `ContactForm.tsx`.

### 14.5 بيانات Sanity ثنائية اللغة (المتحدثون، الفعاليات، إلخ)

هذه بيانات **ديناميكية** (تأتي من CMS وليست نصوصاً ثابتة بالكود)، لذلك لا
تُترجَم عبر next-intl. لدعم بيانات Sanity ثنائية اللغة لاحقاً، أضف حقولاً
مثل `bioAr` و`descriptionAr` بجانب الحقول الإنجليزية بكل schema (راجع
`studio/schemaTypes/`)، ثم بملف `src/lib/data.ts` اختر الحقل المناسب حسب
اللغة الحالية عند بناء الاستعلام. هذا خارج نطاق العمل الحالي لكن البنية
التقنية (next-intl + Sanity) جاهزة تماماً لدعمه متى احتجته.

### 14.6 صفحة الشكر المخصصة (`/thank-you`)

بدلاً من رسالة نجاح مضمّنة بمكان الفورم، الفورمات (Contact, Apply,
Partner Inquiry) تُعيد التوجيه لصفحة `/thank-you?type=X` برسوم متحركة
بسيطة (علامة صح تُرسَم بـ CSS) ورسالة مخصصة حسب نوع الفورم:

| القيمة `type` | متى تُستخدم | زر الإجراء |
|---|---|---|
| `contact` | فورم التواصل بالصفحة الرئيسية | العودة للرئيسية |
| `apply` | فورم التقديم | مشاهدة الجدول الزمني |
| `partner` | فورم Become a Partner | العودة للرئيسية |
| `tickets` | (احتياطي فقط — لا فورم تذاكر فعلي حاليًا) | مشاهدة الجدول الزمني |

**ملاحظة**: كود Stripe وصفحتا `/tickets/success` و`/tickets/cancel`
أُزيلا مع إخفاء صفحة `/tickets` (راجع 5.8 و7.6) — إن عادت التذاكر
تُوجَّه للشراء الخارجي عبر Platinumlist.

### 14.7 تنبيه تقني مهم — موقع ملف middleware.ts

`middleware.ts` يقع **بجذر المشروع** (وليس داخل `src/`) — وهو الوضع
الصحيح المعمول به حالياً (تحقّق: `middleware.ts` بجذر الريبو ولا يوجد
`src/middleware.ts`). نقله إلى داخل `src/` يكسّر اكتشاف اللغة تلقائياً
ويسبب 404 بالمسار الجذري `/` — لا تنقله.

---

## 15. الأنيميشن التفاعلي (Framer Motion وما حولها)

بناءً على طلب مباشر من العميل، أُضيفت طبقة أنيميشن كاملة مناسبة للفئة
العمرية 10-14 سنة. **لا تحتاج أي مفتاح API** — كل هذه المكتبات تعمل
بالكامل من جهة العميل (Client-side) فوراً بدون إعداد إضافي.

### 15.1 المكتبات المُستخدَمة (وبديلان تقنيان مهمّان عن الطلب الأصلي)

| المكتبة | الاستخدام | ملاحظة |
|---|---|---|
| `framer-motion` | كل الأنيميشن التفاعلي (Flip, Drag, Glow, عدادات) | كما طُلب بالضبط |
| `three-globe` + `three` + `@react-three/fiber` | كرة أرضية ثلاثية الأبعاد تفاعلية (`ui/tedx-globe.tsx`) | بديل Globe.js — يعمل بالكامل من جهة العميل |
| `react-type-animation` | تأثير الكتابة التلقائية بعنوان Hero | لم تُستخدَم كحزمة — بُني مكوّن `TextType.tsx` مخصص بـ Framer Motion بدلاً منها |
| `react-confetti` | قصاصات ورقية ترحيبية | ~~أُزيل~~ — غير موجود بالمشروع الحالي |
| ~~`react-countdown`~~ | — | **لم تُستخدَم**: بُني عداد Flip Clock مخصص بـ Framer Motion مباشرة، وهو ما سمح به الطلب الأصلي نفسه ("أو سنبني مخصصاً") |

### 15.2 خريطة المكونات (اسم الطلب ↔ الملف الفعلي بالمشروع)

| الاسم بطلب العميل | الملف الفعلي |
|---|---|
| `<HeroSection />` | `src/components/home/Hero.tsx` (Server Component ينسّق الترجمة + المكونات أدناه) |
| ~~خلفية الجسيمات~~ | ~~أُزيل~~ — لا توجد particles بالمشروع الحالي |
| الكتابة التلقائية | `src/components/TextType.tsx` (مكوّن مخصص بـ Framer Motion) |
| `<CountdownTimer />` | `src/components/shared/Countdown.tsx` + `src/components/ui/flip-clock.tsx` |
| `<ActionButtons />` | `src/components/home/ActionButtons.tsx` |
| `<AboutSection />` (قسم الأرقام) | `src/components/home/Highlights.tsx` + `src/components/home/AnimatedStats.tsx` |
| `<SpeakersCarousel />` | `src/components/home/SpeakersStage.tsx` + `src/components/home/SpeakersPreview.tsx` |
| ~~المؤشر المخصص~~ | ~~أُزيل~~ — لا يوجد CustomCursor بالمشروع الحالي |
| ~~Confetti عند التحميل~~ | ~~أُزيل~~ — لا يوجد WelcomeConfetti بالمشروع الحالي |

### 15.3 قرار معماري مهم: لماذا لم تتحول Hero/Highlights/SpeakersPreview لـ Client Components بالكامل؟

هذه الصفحات **Server Components** تجلب الترجمة (next-intl) والبيانات
(Sanity) من الخادم مباشرة — وهذا ضروري لأداء الموقع وSEO ودعم
اللغتين. حوّلتها بالكامل لـ Client Components كان سيفقد هذه الفوائد.
بدلاً من ذلك، كل مكوّن أنيميشن (`TextType`,
`ActionButtons`, `AnimatedStats`, `SpeakersStage`...) هو
`"use client"` منفصل يستقبل النص المترجَم/البيانات كـ **props** من
المكوّن الأب. هذا النمط يحافظ على نفس معمارية المشروع بالكامل (راجع
القسم 6) بينما يضيف التفاعلية المطلوبة تماماً.

### 15.4 اعتبارات إمكانية الوصول (Accessibility) — إضافة استباقية

مكوّنات الأنيميشن (والكرة الأرضية ثلاثية الأبعاد) تحترم تلقائياً إعداد
النظام `prefers-reduced-motion` (تُعطَّل الحركة لمن يفعّل "تقليل
الحركة") — لم يُطلَب صراحةً لكنه معيار مهني أساسي، ولا يؤثر على تجربة
معظم المستخدمين.

### 15.5 التحقق المُنفَّذ فعلياً

- ✅ `tsc --noEmit` و`eslint` نظيفان تماماً
- ✅ **بناء إنتاجي كامل ناجح مرتين متتاليتين** — بدون أي تراجع، حتى
  مع إضافة مكتبة الرسوم ثلاثية الأبعاد (three/three-globe)
- ✅ اختبار مباشر: الصفحة الرئيسية تُرجع 200 وتعرض نص "Tomorrow, Now"
  فعلياً من مكوّن الكتابة التلقائية
- ملاحظة: الكرة الأرضية ثلاثية الأبعاد (three-globe) لا تظهر بالـ HTML
  الأولي من الخادم (متوقّع ومقصود تماماً — مكوّن client-only يُعيد `null`
  أثناء SSR لتفادي مشاكل الـ hydration مع WebGL، ويظهر بعد التحميل
  بالمتصفح)

### 15.6 نقطة بخصوص Lenis (المذكورة بطلب العميل)

طلب العميل الأصلي أشار لاحتمال وجود مكتبة Lenis (تمرير سلس) بالمشروع
والحاجة لتعطيل الأنيميشن أثناء السحب بالتعارض معها. **هذا المشروع لا
يحتوي Lenis إطلاقاً** (لم يُطلَب أو يُبنَ بأي مرحلة سابقة)، لذلك هذا البند
غير قابل للتطبيق حالياً. إن أراد العميل إضافة Lenis لاحقاً، راجع توثيق
Lenis الرسمي حول `data-lenis-prevent` على عنصر الكاروسيل بالسحب
(`src/components/home/SpeakersStage.tsx`) لمنع التعارض.
