# TEDxAlFalah Youth — دليل التشغيل والنشر

هذا المشروع **مكتمل وظيفياً بالكامل**. كل صفحة، كل فورم، وكل API route تعمل
الآن فعلياً. الموقع يعمل حالياً ببيانات تجريبية (mock) بحيث يمكنك تشغيله
وتصفحه فوراً بدون أي إعداد، وكل ما تبقى هو **إضافة مفاتيحك الحقيقية** بملف
`.env.local` ليتحول تلقائياً لاستخدام بياناتك ويصبح جاهزاً للنشر النهائي.

---

## 1. التشغيل المحلي فوراً (بدون أي إعداد)

```bash
npm install
npm run dev
```

افتح `http://localhost:3000` — سترى الموقع كاملاً بـ 9 صفحات، يعمل ببيانات
تجريبية، وكل الفورمات تعمل (تُسجَّل بالـ terminal بدل الإرسال الفعلي حتى
تضيف المفاتيح أدناه).

---

## 2. الحالة الحالية لكل جزء بالمشروع

| الجزء | الحالة بدون مفاتيح | الحالة بعد إضافة المفاتيح |
|---|---|---|
| كل الصفحات التسع | تعمل بالكامل ببيانات تجريبية | تعرض بياناتك الحقيقية من Sanity |
| فورم Contact | يعمل، يسجّل بالـ terminal | يرسل إيميل فعلي عبر Resend |
| فورم Apply | يعمل، يسجّل بالـ terminal | يحفظ بـ Google Sheet + يرسل تأكيد |
| فورم Sponsors (Become a Partner) | يعمل، يسجّل بالـ terminal | يرسل إيميل فعلي |
| فورم Tickets | يعمل، يسجّل بالـ terminal | يحفظ بـ Google Sheet |
| Speakers/Team/Activations/Sponsors | بيانات تجريبية جاهزة | بياناتك الحقيقية من Sanity Studio |

**لا توجد أي وظيفة معطّلة أو ناقصة — الفرق فقط بين بيانات تجريبية وبيانات حقيقية.**

---

## 3. خطوات الحصول على المفاتيح وتفعيلها (بالترتيب)

### 3.1 — Sanity CMS (لإدارة المتحدثين، الفريق، الفعاليات، الرعاة)

```bash
cd studio
npm install
npx sanity login
npx sanity init --project-name "TEDxAlFalah Youth" --dataset production
```
سيسألك عن ربط مجلد الكود الحالي — اختر "yes" لاستخدام نفس `sanity.config.ts`
الموجود مسبقاً. بعد الانتهاء، انسخ **Project ID** الذي يظهر لك، وضعه بملف
`.env.local` بجذر المشروع الرئيسي (وليس بمجلد studio):
```
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
```

انشر الـ Studio ليصبح متاحاً لك أونلاين لإضافة المحتوى:
```bash
npx sanity deploy
```
اختر subdomain (مثلاً `tedxalfalahyouth`)، وستحصل على رابط مثل
`https://tedxalfalahyouth.sanity.studio` — هذا هو الرابط الذي تدخل منه
لاحقاً لإضافة المتحدثين والفريق والرعاة والفعاليات.

**أعد تشغيل `npm run dev` بالمجلد الرئيسي بعد إضافة المفتاح** — سيتحول
الموقع تلقائياً لعرض بياناتك الحقيقية (حالياً فارغة حتى تضيف محتوى من
الـ Studio).

### 3.2 — Google Sheets (لتخزين طلبات Apply والتذاكر)

1. أنشئ Google Sheet جديد باسم "TEDxAlFalah Applications"، وأضف بالصف الأول
   عناوين الأعمدة التالية بالضبط:
   ```
   timestamp, track, fullName, age, email, phone, city, talkIdeaTitle,
   ideaSummary, whyItMatters, themeConnection, videoLink, howHeardAboutUs,
   schoolName, guardianName, guardianContact, organizationAndRole,
   areaOfWorkWithYouth
   ```
2. اذهب لـ Google Cloud Console (console.cloud.google.com) →
   أنشئ مشروعاً جديداً → فعّل **Google Sheets API**.
3. أنشئ **Service Account** (من IAM & Admin → Service Accounts) → أنشئ
   مفتاح JSON وحمّله.
4. من ملف الـ JSON، انسخ `client_email` و`private_key`.
5. **شارك** الـ Google Sheet مع بريد الـ Service Account (كـ Editor).
6. أضف بملف `.env.local`:
   ```
   GOOGLE_SHEET_ID=              # من رابط الشيت بين /d/ و /edit
   GOOGLE_SERVICE_ACCOUNT_EMAIL=
   GOOGLE_PRIVATE_KEY=
   ```
   ملاحظة: `GOOGLE_PRIVATE_KEY` يحتوي أسطراً متعددة (`\n`) — انسخه كما هو
   بين علامتي اقتباس بملف `.env.local`.

كرر نفس الخطوات بشيت منفصل إن أردت تفعيل تسجيل التذاكر (`GOOGLE_TICKETS_SHEET_ID`).

### 3.3 — Resend (لإرسال الإيميلات التلقائية)

1. سجّل مجاناً على resend.com.
2. من لوحة Resend → Domains → أضف tedxalfalahyouth.com وأضف سجلات DNS
   التي يعطيك إياها بلوحة تحكم الدومين (يحتاج الدومين أن يكون مفعّلاً أولاً).
3. من API Keys → أنشئ مفتاحاً جديداً وأضفه بملف `.env.local`:
   ```
   RESEND_API_KEY=
   ```

---

## 4. ملف `.env.local` الكامل

انسخ `.env.local.example` إلى `.env.local` واملأ كل القيم:
```bash
cp .env.local.example .env.local
```

---

## 5. النشر على Vercel

```bash
git init
git add .
git commit -m "Initial commit — TEDxAlFalah Youth website"
```
ثم:
1. أنشئ مستودع فارغ على GitHub وادفع الكود إليه.
2. من vercel.com → Import Project → اختر المستودع.
3. **مهم جداً**: أضف كل متغيرات `.env.local` بإعدادات Vercel
   (Settings → Environment Variables) — الملف المحلي لا يُرفع لـ GitHub
   ولا يصل لـ Vercel تلقائياً.
4. Deploy.
5. بعد الحصول على الدومين الحقيقي من العميل، اربطه من
   Settings → Domains على Vercel.

---

## 6. بنية المشروع

```
tedxalfalahyouth-website/     ← موقع Next.js (هذا المجلد)
  src/app/                     ← كل الصفحات التسع + API routes
  src/components/              ← كل المكونات مقسّمة حسب الصفحة
  src/lib/data.ts               ← نقطة الدخول الوحيدة للبيانات (Sanity أو mock تلقائياً)
  src/lib/mock-data.ts          ← بيانات تجريبية (تُستخدم فقط بغياب مفاتيح Sanity)
  .env.local.example            ← قائمة كل المفاتيح المطلوبة موثّقة

studio/                        ← مشروع Sanity Studio (مستقل تماماً، له
                                   package.json خاص به)
  schemaTypes/                  ← تعريف المتحدثين، الفريق، الفعاليات، الرعاة
```

---

## 7. المحتوى الذي ما زال ينتظر العميل (Placeholders)

ابحث عن `[PLACEHOLDER` بكل ملفات `src/` لإيجاد كل نص ينتظر محتوى حقيقياً
(نص About، تواريخ الحدث، سعر التذاكر، النص القانوني الكامل لصفحة Terms،
إلخ). كل هذه النصوص واضحة ومحددة الموقع، ولا تؤثر على عمل الموقع وظيفياً.
