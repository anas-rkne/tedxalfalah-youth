# TEDxAlFalah Youth — التوثيق الشامل للمشروع

**حالة المشروع: مكتمل بالكامل من الناحية البرمجية والوظيفية.**
الخطوة الوحيدة المتبقية هي الحصول على مفاتيح API الثلاثة من العميل
(Sanity, Google, Resend) ووضعها بملف `.env.local` — لا يوجد أي كود
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

---

## 1. نظرة عامة سريعة

| البند | القيمة |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| اللغة | TypeScript (فحص صارم، صفر أخطاء) |
| التنسيق | Tailwind CSS v4 |
| عدد الصفحات | 9 صفحات + Sitemap + Robots تلقائيين |
| عدد API Routes | 4 (Contact, Apply, Partner Inquiry, Tickets) |
| CMS | Sanity (Studio جاهز بمجلد `studio/`) |
| تخزين الفورمات | Google Sheets |
| الإيميلات التلقائية | Resend |
| حالة البناء الإنتاجي | ✅ تم اختباره فعلياً بـ `next build` ونجح 100% |
| حالة الفحص البرمجي | ✅ `tsc --noEmit` و`eslint` نظيفان تماماً (صفر أخطاء) |

**كيف يعمل المشروع الآن، هذه اللحظة، بدون أي مفتاح؟**
كل صفحة تعرض بيانات تجريبية واقعية (متحدثين، فريق، رعاة، فعاليات)، وكل
فورم يعمل بصرياً بالكامل (تحقق من الحقول، رسائل الخطأ، حالة الإرسال) لكنه
يسجّل الطلب بـ Terminal بدل الإرسال الفعلي. هذا يسمح لك بتصفح واختبار
الموقع بالكامل الآن، والتأكد أن كل شيء يعمل، **قبل** حتى الحصول على أي
مفتاح.

---

## 2. متطلبات التشغيل

| الأداة | الإصدار المطلوب | كيفية التحقق |
|---|---|---|
| Node.js | 18.17 أو أحدث (يُفضّل 20+) | `node -v` |
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

افتح المتصفح على `http://localhost:3000`. يجب أن تشاهد:
- الصفحة الرئيسية بعداد تنازلي حي (Countdown) يعمل فعلياً
- قائمة تنقل تتحول لقائمة همبرغر على الموبايل
- 8 أقسام بالصفحة الرئيسية بالترتيب الصحيح

جرّب التنقل لكل الصفحات من القائمة العلوية للتأكد أن كل شيء يعمل قبل
المتابعة.

### التحقق من بناء إنتاجي كامل (اختياري لكن مستحسن)
```bash
npm run build
npm start
```
إذا ظهرت لك رسالة `✓ Generating static pages using 1 worker (18/18)`
فهذا يعني أن كل الصفحات وAPI routes جاهزة للنشر بدون أي مشكلة.

---

## 4. بنية المشروع الكاملة

```
tedxalfalahyouth-website/
├── .env.local.example          ← انسخه إلى .env.local واملأ المفاتيح
├── README.md                    ← دليل مختصر (نسخة سريعة من هذا الملف)
├── next.config.ts                ← مهيأ لقبول صور Sanity CDN
├── package.json
│
├── src/
│   ├── app/                              ← كل الصفحات (Next.js App Router)
│   │   ├── layout.tsx                     ← القالب العام (Header+Footer+Metadata)
│   │   ├── page.tsx                       ← الصفحة الرئيسية (Home)
│   │   ├── sitemap.ts                     ← يولّد sitemap.xml تلقائياً
│   │   ├── robots.ts                      ← يولّد robots.txt تلقائياً
│   │   ├── speakers/page.tsx
│   │   ├── team/page.tsx
│   │   ├── venue/page.tsx
│   │   ├── activations/page.tsx
│   │   ├── apply/page.tsx                 ← الأعقد: فورم + Timeline + FAQ
│   │   ├── sponsors/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── terms/page.tsx
│   │   └── api/
│   │       ├── contact/route.ts           ← فورم Contact بالصفحة الرئيسية
│   │       ├── apply/route.ts             ← الأهم: يحفظ بـ Google Sheet + إيميل تأكيد
│   │       ├── partner-inquiry/route.ts   ← فورم Become a Partner
│   │       └── tickets/route.ts           ← فورم تسجيل التذاكر
│   │
│   ├── components/
│   │   ├── layout/          Header.tsx, Footer.tsx
│   │   ├── ui/               Button.tsx, Card.tsx, SectionContainer.tsx, SocialIcons.tsx
│   │   ├── shared/           Countdown.tsx
│   │   ├── home/             كل الأقسام الثمانية بالصفحة الرئيسية (ملف لكل قسم)
│   │   ├── speakers/         SpeakersGrid.tsx, SpeakerModal.tsx
│   │   ├── apply/            ApplicationForm.tsx, ApplicationTimeline.tsx, ApplyFAQ.tsx
│   │   ├── sponsors/         PartnerInquiryForm.tsx
│   │   └── tickets/          TicketRegistrationForm.tsx
│   │
│   └── lib/
│       ├── types.ts           ← تعريف Speaker, TeamMember, Activation, Sponsor
│       ├── mock-data.ts       ← بيانات تجريبية (تُستخدم بغياب مفاتيح Sanity)
│       ├── sanity.ts          ← عميل Sanity (يُفعَّل تلقائياً بمجرد وجود المفتاح)
│       └── data.ts            ← ★ نقطة الدخول الوحيدة: كل صفحة تستورد من هنا فقط
│
├── public/
│   ├── brand/                 ← ضع شعار TEDx الحقيقي هنا لاحقاً
│   └── mock/                  ← صور SVG بديلة (placeholders) للبيانات التجريبية
│
└── studio/                     ← مشروع Sanity Studio (مستقل تماماً)
    ├── package.json            ← له تثبيت حزم منفصل: cd studio && npm install
    ├── sanity.config.ts
    ├── sanity.cli.ts
    └── schemaTypes/
        ├── speaker.ts
        ├── teamMember.ts
        ├── activation.ts
        └── sponsor.ts
```

---

## 5. شرح تفصيلي لكل صفحة

### 5.1 الصفحة الرئيسية (`/`)
8 أقسام بالترتيب: Hero (بعداد تنازلي حي)، About، Theme، Speakers Preview
(4 متحدثين من البيانات الحقيقية/التجريبية)، Highlights، Apply Banner،
Sponsors Strip، Contact Form (فورم فعلي متصل بـ `/api/contact`).

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

### 5.7 Sponsors (`/sponsors`)
فقرة افتتاحية، عرض شرائح الرعاية (Platinum/Gold/Silver/Community)،
الرعاة الحاليون (من البيانات الحقيقية)، فورم "Become a Partner" متصل
بـ `/api/partner-inquiry`، رابط تحميل PDF (يحتاج رفع الملف الفعلي
بـ `public/sponsorship-deck.pdf`).

### 5.8 Tickets (`/tickets`)
أنواع التذاكر والأسعار، فورم تسجيل (الخيار الافتراضي حالياً بافتراض
حدث مجاني — راجع ملاحظة بالكود إن قرر العميل تذاكر مدفوعة عبر منصة
خارجية مثل Platinumlist)، معلومات يوم الحدث، سياسة الاسترجاع.

### 5.9 Terms (`/terms`)
قالب جاهز بـ 6 أقسام قانونية (Application Terms, Ticketing Terms,
Photography Consent, Data Privacy, TEDx Licensing, Liability) — ينتظر
النص القانوني النهائي من العميل. **لم يُكتب أي محتوى قانوني بالذكاء
الاصطناعي عمداً** — هذه مسؤولية العميل/محاميه.

---

## 6. كيف تعمل طبقة البيانات

كل صفحة تستورد دوال البيانات (`getSpeakers`, `getTeamMembers`, إلخ) من
ملف واحد فقط: **`src/lib/data.ts`**. هذا الملف يتخذ القرار تلقائياً:

```
هل NEXT_PUBLIC_SANITY_PROJECT_ID موجود بملف .env.local؟
   نعم → يجلب البيانات الحقيقية من Sanity عبر استعلامات GROQ
   لا  → يستخدم البيانات التجريبية من mock-data.ts تلقائياً
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
timestamp | track | fullName | age | email | phone | city | talkIdeaTitle | ideaSummary | whyItMatters | themeConnection | videoLink | howHeardAboutUs | schoolName | guardianName | guardianContact | organizationAndRole | areaOfWorkWithYouth
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

### 7.3 — Resend (الإيميلات التلقائية)

**الهدف**: إيميل تأكيد فوري للمتقدمين، وإشعارات لفريق العمل عند وصول
رسالة تواصل أو استفسار رعاية.

1. سجّل مجاناً على [resend.com](https://resend.com)
2. من القائمة الجانبية: Domains → Add Domain → اكتب `tedxalfalahyouth.com`
3. سيعطيك Resend سجلات DNS (عادة نوع TXT وMX وCNAME) → أضفها بلوحة تحكم
   الدومين (تحتاج الدومين مفعّلاً ومُشترى مسبقاً من قبل العميل حسب نطاق
   المشروع الأصلي)
4. انتظر التحقق (قد يأخذ من دقائق لساعات حسب مزوّد الدومين)
5. من القائمة الجانبية: API Keys → Create API Key → انسخه

أضفه بملف `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> إلى أن يتحقق الدومين، يمكنك اختبار الإيميلات مؤقتاً عبر تغيير عنوان
> `from` بملفات `src/app/api/*/route.ts` لعنوان Resend التجريبي
> `onboarding@resend.dev`، ثم إعادته لعنوان tedxalfalahyouth.com الحقيقي
> بعد التحقق.

---

## 8. ملف .env.local الكامل

```bash
cp .env.local.example .env.local
```
ثم افتحه واملأ كل قيمة بما حصلت عليه بالقسم 7 أعلاه. الملف الكامل بعد
التعبئة يجب أن يبدو هكذا (بقيم توضيحية فقط):

```env
RESEND_API_KEY=re_123456789

GOOGLE_SHEET_ID=1AbCdEf...
GOOGLE_SERVICE_ACCOUNT_EMAIL=tedx-bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"

GOOGLE_TICKETS_SHEET_ID=1XyZ...

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

---

## 11. مطابقة المشروع مع المتطلبات الأصلية

جدول تتبع مباشر لكل بند بمستند البريف الأصلي (Structure and Content
Brief) وحالته بالمشروع الفعلي:

| بند بالمستند الأصلي | الحالة |
|---|---|
| Header: شعار، قائمة تنقل 8 عناصر، زر Apply بارز | ✅ منفّذ |
| Header: مبدّل لغة (if bilingual) | ⏸️ لم يُبنَ — بانتظار تأكيد العميل إن كان الموقع ثنائي اللغة فعلاً |
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
| Venue: مخطط تفاعلي للمكان (اختياري بالمستند الأصلي) | ⏸️ لم يُبنَ — بند اختياري صراحة بالمستند الأصلي |
| Activations: بلوكات مرنة قابلة للإضافة/الحذف | ✅ منفّذ عبر Sanity |
| Apply: الثيم + من يمكنه التقديم + 80%/عبارة الترحيب | ✅ منفّذ حرفياً |
| Apply: شرح آلية المراجعة | ✅ منفّذ |
| Apply: Timeline بـ 11 مرحلة بالضبط بنفس الأسماء | ✅ منفّذ حرفياً |
| Apply: فورم بمسارين متفرعين وكل الحقول المطلوبة | ✅ منفّذ بالكامل مع تحقق شرطي |
| Apply: نص عدم القبول الحرفي | ✅ منفّذ حرفياً |
| Apply: FAQ Accordion | ✅ منفّذ |
| Apply: حفظ بجدول وليس إيميل فقط | ✅ منفّذ (Google Sheets) |
| Apply: إيميل تأكيد تلقائي | ✅ منفّذ (Resend) |
| Apply: إغلاق تلقائي بموعد نهائي + رسالة بديلة | ✅ منفّذ |
| Sponsors: افتتاحية، شرائح، رعاة حاليون، CTA، PDF اختياري | ✅ منفّذ بالكامل |
| Tickets: أنواع/أسعار، آلية شراء أو تسجيل، معلومات اليوم، سياسة الاسترجاع | ✅ منفّذ (فورم تسجيل — يحتاج قرار العميل إن كانت التذاكر مدفوعة عبر منصة خارجية) |
| Terms: قالب بـ 6 أقسام قانونية | ✅ منفّذ (بانتظار النص القانوني من العميل عمداً) |

**البندان الوحيدان غير المنفّذين حالياً بندان اختياريان/معلَّقان صراحةً
بالمستند الأصلي نفسه** (مبدّل اللغة يحتاج تأكيد العميل، ومخطط الموقع
التفاعلي كان اختيارياً بالنص الأصلي) — وليسا نقصاً بالتنفيذ.

---

## 12. المحتوى الذي ينتظر العميل (Placeholders)

ابحث بمحرر الأكواد عن `[PLACEHOLDER` بمجلد `src/` (بحث شامل بكل
الملفات) لإيجاد كل نص ينتظر تزويداً حقيقياً من العميل. أبرزها:

| الموقع | المحتوى المطلوب |
|---|---|
| `src/components/home/Hero.tsx` | تاريخ الحدث الحقيقي (`EVENT_DATE`) |
| `src/components/home/About.tsx` | نص About النهائي |
| `src/components/home/Highlights.tsx` | الأرقام الحقيقية (عدد المتحدثين/الحضور/الفعاليات) |
| `src/components/home/ApplyBanner.tsx` | الموعد النهائي الحقيقي للتقديم |
| `src/app/apply/page.tsx` | `APPLICATION_DEADLINE` الفعلي (يتحكم بالإغلاق التلقائي) |
| `src/components/apply/ApplicationTimeline.tsx` | تواريخ المراحل الـ 11 الحقيقية |
| `src/components/apply/ApplyFAQ.tsx` | إجابات الأسئلة الشائعة الفعلية |
| `src/app/venue/page.tsx` | اسم المكان، النص السردي، رابط خريطة حقيقي، إرشادات المواقف |
| `src/app/sponsors/page.tsx` | الفقرة الافتتاحية، مزايا كل شريحة رعاية |
| `src/app/tickets/page.tsx` | الأسعار الفعلية، تاريخ/وقت الحدث، سياسة الاسترجاع |
| `src/app/terms/page.tsx` | **النص القانوني الكامل من محامي العميل** |
| `public/brand/` | شعار TEDx الرسمي (استبدال الشعار النصي المؤقت بالهيدر) |
| `public/sponsorship-deck.pdf` | ملف PDF حقيقي لباقة الرعاية |

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

**"Sanity Studio لا يعرض الأنواع الأربعة"**
تأكد أنك اخترت "Yes" عند سؤال "use existing configuration" وقت
`sanity init`، وإلا كرر الخطوة وتأكد من عدم استبدال ملف
`studio/sanity.config.ts` الموجود مسبقاً.

**"npm run build يفشل بخطأ متعلق بالخطوط (fonts.googleapis.com)"**
هذا يحدث فقط إن كانت بيئة البناء بلا اتصال إنترنت طبيعي (نادر جداً).
Vercel وأي جهاز عادي متصل بالإنترنت لن يواجه هذه المشكلة إطلاقاً.
