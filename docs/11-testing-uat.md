# 11 — الاختبارات وقائمة التحقق النهائية (Testing & UAT)

**الملف**: `docs/11-testing-uat.md`
**الجمهور المستهدف**: مطورون (أقسام 1–3) + العميل (قسم 4 — اختبار قبول مبسط بلا أوامر).
**المصدر**: الكود الفعلي — السيناريوهات مبنية على السلوك المبرمج في الـ routes والفورمات.

> **تحذير:** أثناء أي اختبار **لا تستخدم بيانات حقيقية إطلاقًا** — لا أسماء ولا أرقام هواتف ولا إيميلات حقيقية. استخدم دائمًا وهمية (`test@example.com`، `0501234567`...). فورم Apply يرسل **إشعارًا إداريًا حقيقيًا** لكل طلب ممكن — البيانات الوهمية تحمي خصوصية الجميع.

---

## 1. سيناريوهات الاختبار المحلي (أوامر CURL جاهزة)

> **متطلب مسبق**: الخادم يعمل (`npm run dev`). وإذا كان `TURNSTILE_SECRET_KEY` **معبّأ** في `.env.local` فالتوكن `"dummy-token"` سيرفض (403) — للاختبار الكامل إما أزله مؤقتًا (يعمل Fail-Open) أو استخدم التوكن الحقيقي من الودجت. **وأهم ملاحظة للأصل**: هذه الأوامر ترسل من الـ Terminal **بلا `Origin`** — فتتجاوز طبقة CORS (سلوك طبيعي موثق في `src/lib/cors.ts:16`).

### 1.1 فورم Apply — مسار «متحدث شاب» (Young Speaker)

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "track": "young-speaker",
    "fullName": "أحمد محمد",
    "age": 12,
    "email": "test@example.com",
    "phone": "0501234567",
    "city": "دبي",
    "talkIdeaTitle": "الذكاء الاصطناعي في المستقبل",
    "ideaSummary": "كيف يمكن للذكاء الاصطناعي أن يساعد الأطفال على التعلم وتطوير مهاراتهم الإبداعية في المستقبل",
    "whyItMatters": "لأن المستقبل يحتاج إلى مبتكرين شباب يفكرون خارج الصندوق",
    "themeConnection": "spark",
    "videoLink": "",
    "howHeardAboutUs": "Social Media",
    "consentToTerms": true,
    "schoolName": "مدرسة دبي الدولية",
    "guardianName": "محمد العلي",
    "guardianContact": "0507654321",
    "parentalConsent": true,
    "turnstileToken": "dummy-token"
  }'
```
**المتوقع**: `200` + `{"success": true}`.

**إخفاقات مقصودة لتجربتها (اختبار التحقق):**
- احذف `guardianName` → **400** (المخطط الشرطي يرفض — `apply/route.ts:36-49`).
- `"age": 5` → **400** (حد الخادم الصارم `z.coerce.number().min(10).max(99)` — `apply/route.ts:33-34`).
- `"email": "bad"` → **400**.
- أرسل جسدًا غير JSON (`-d 'broken'` بلا هيدر contentType) → **400** `{"error": "Invalid JSON body"}` (إصلاح اليوم — كان خطأ 500 سابقًا).
- **اختبار إغلاق التقديم (403)**: أعد تشغيل dev مع `APPLICATION_DEADLINE=(تاريخ ماضٍ)` في `.env.local` → الطلب الصحيح كاملًا يعيد **403** `{"error": "Applications are closed"}`. (القيمة الافتراضية في `src/lib/constants.ts` — قراءة من البيئة أولًا.)

### 1.2 فورم Apply — مسار «خبير» (Expert)

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "track": "expert",
    "fullName": "سارة أحمد",
    "age": 28,
    "email": "sara@example.com",
    "phone": "0509876543",
    "city": "أبوظبي",
    "talkIdeaTitle": "بناء منظومات تعليمية للمستقبل",
    "ideaSummary": "تجربة عملية في تصميم برامج تعليمية تفاعلية للشباب في المدارس الحكومية",
    "whyItMatters": "لأن التعليم هو الرافعة الحقيقية لنهضة الأجيال",
    "themeConnection": "beyond",
    "howHeardAboutUs": "School",
    "consentToTerms": true,
    "organizationAndRole": "أكاديمية الشباب - مستشار تعليمي",
    "areaOfWorkWithYouth": "تصميم برامج تعليمية وتدريبية لفئة الشباب",
    "turnstileToken": "dummy-token"
  }'
```
**المتوقع**: `200` — احذف `organizationAndRole` لترى **400**.

### 1.3 فورم Contact — موضوع Sponsorship (يُوجَّه لـ partners@)

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "شركة الابتكار",
    "email": "partner@example.com",
    "subject": "Sponsorship",
    "message": "نحن مهتمون بالرعاية الذهبية للحدث ونتطلع للتفاصيل",
    "turnstileToken": "dummy-token"
  }'
```
وموضوع **General** (يُوجَّه لـ marhaba@):
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "subject": "General",
    "message": "رسالة تجريبية للتحقق من وصول البريد العام",
    "turnstileToken": "dummy-token"
  }'
```
**المتوقع**: `200` — والتحقق من الوجهة عبر المرسل إليه الفعلي (انظر المصفوفة §2).

### 1.4 فورم Partner Inquiry

```bash
curl -X POST http://localhost:3000/api/partner-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "name": "خالد العمري",
    "organization": "مؤسسة المستقبل",
    "email": "khaled@example.com",
    "phone": "0501122334",
    "message": "نرغب بشراكة استراتيجية مع الحدث وتقديم دعم لوجستي",
    "turnstileToken": "dummy-token"
  }'
```
**المتوقع**: `200` → وصول `partners@`.

**إخفاق مقصود (إصلاح اليوم)**: أرسل جسدًا غير JSON إلى `contact` أو `partner-inquiry` (`-d 'not-json'` بلا هيدر) → **400** `{"error": "Invalid JSON body"}` (كان خطأ 500 سابقًا).

### 1.5 اختبار Rate Limiting (429)

```bash
# شغّل الأمر نفسه 6 مرات متتالية (مثال: فورم Contact):
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "طلبية $i → %{http_code}\n" -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"a@b.com","subject":"General","message":"Test message ten chars","turnstileToken":"dummy-token"}'
done
```
**المتوقع**: الطلبات 1–5 → `200`، والسادسة → **429** (`src/lib/rate-limit.ts:20` — 5/10د لكل IP). (تحقق أن Upstash مفعّل؛ بدونه يعود 200 دائمًا مع تحذير السجل.)

### 1.6 اختبار CORS (403)

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{"track":"young-speaker","fullName":"X","age":12,"email":"a@b.com","phone":"1","city":"X","talkIdeaTitle":"X","ideaSummary":"X","whyItMatters":"X","themeConnection":"spark","howHeardAboutUs":"Other","consentToTerms":true,"turnstileToken":"dummy-token"}'
```
**المتوقع**: **403** `{"error":"Forbidden: origin not allowed"}` — بينما مع `Origin: http://localhost:3000` يمر.

### 1.7 بديل PowerShell (لبيئة Windows الحالية)

سطر مكافئ لأمر Contact:
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/contact -Method Post -ContentType "application/json" -Body '{"name":"Test","email":"a@b.com","subject":"General","message":"Test message ten chars.","turnstileToken":"dummy-token"}'
```

---

## 2. مصفوفة اختبار البريد الكامل (Test Matrix)

| الحدث (Event) | السلوك المتوقع (Expected) | مكان التحقق (Where to verify) |
|---|---|---|
| Apply — Young Speaker | ① صف كامل (18 عمودًا) في Google Sheets · ② تأكيد للمتقدم النص الحرفي (`sendConfirmationEmail` — `apply/route.ts:111`) · ③ إشعار إداري بكامل الحقول | ① الـ Sheet (صف جديد) · ② بريد `test@example.com` الوهمي · ③ `apply@` في WebMail |
| Apply — Expert | ① صف بـ `organizationAndRole` و`areaOfWorkWithYouth` مملوءَين · ② نفس الإيميلين | ① الـ Sheet · ②/③ صناديق البريد أعلاه |
| Contact — `Sponsorship` | ① الإيميل إلى **`PARTNER_EMAIL`** · ② `replyTo` = بريد المُرسِل (الرد يعود له) | صندوق `partners@` — عنوان الرسالة يبدأ `[Sponsorship]` |
| Contact — `Media` | الإيميل إلى `MEDIA_EMAIL` | صندوق `media@` |
| Contact — `General`/`Speaking`/`Volunteering` | الإيميل إلى `CONTACT_EMAIL` | صندوق `marhaba@` |
| Partner Inquiry | الإيميل إلى `PARTNER_EMAIL` بعنوان `New partnership inquiry from ...` | صندوق `partners@` |
| إرسال Apply بعد `APPLICATION_DEADLINE` | ① الفورم يختفي من `/apply` · ② تظهر بطاقة الإغلاق (`page.apply.closed.*`) | المتصفح — صفحة `/apply` (الفحص من الخادم: `apply/page.tsx:28`) |
| 6 طلبات متتالية لنفس الفورم | الخمس الأولى تنجح والسادسة **429** | أوامر curl §1.5 + شريط الشبكة |
| فشل الـ Sheet | الطلب ينجح (`success: true`) و`Google Sheets save failed` بالسجل | سجل الخادم (`apply/route.ts:211`) |
| بلا إعداد SMTP | الطلب ينجح و`[MAILER] SMTP not configured` بالسجل — **لا يعتبر نجاحًا للبريد** | سجل الخادم |

---

## 3. قائمة التحقق بعد أي تغيير (Checklist)

### 3.1 قبل النشر (Pre-Deployment) — للمطور

- [ ] `npm run build` — بناء نظيف بلا أخطاء.
- [ ] `npm run lint` — بلا أخطاء/تحذيرات ESLint.
- [ ] `npx tsc --noEmit` — بلا أخطاء TypeScript.
- [ ] (قرار معلق — لا تتفاجأ) `output: 'standalone'` **غير مفعّل حاليًا** في `next.config.ts` — هذا خيار موصى به لمضيف Node (خطواته في `docs/08` §2.3) ولكنه **اختياري**؛ إن اخترت تفعيله قبل النشر فاختبر البناء بعده.
- [ ] `.env.local` محدث كاملًا ومطابق لقالب `.env.local.example` (بدون أسرار مفقودة).
- [ ] **لا** `[MAILER]/[TURNSTILE]/[RATE LIMIT] not configured` متبقية في سجل الخادم (شرط الإنتاج — `docs/06` §5).
- [ ] عدم تسريب `.env.local` في `git status` (فحص: `git status --porcelain`).

### 3.2 بعد النشر (Post-Deployment)

- [ ] صفحتا `/en` و`/ar` — اللغة تعمل والـ RTL سليم للعربية (النص يبدأ من اليمين، والخط العربي ظاهر).
- [ ] صفحات `speakers`, `team`, `venue`, `schedule`, `activations` تعرض المحتوى بصور سليمة.
- [ ] فورم Apply تجريبي (بيانات وهمية): إيميل التأكيد يصل + صف جديد في الـ Sheet (إن عُدّت Google).
- [ ] فورم Contact تجريبي يصل `marhaba@`.
- [ ] Turnstile **يظهر** في فورمات Apply وContact (المفتاحان معبآن) — الودجت جزء من الفورمات الثلاثة المبرمجة (فورم Partner بلا واجهة حاليًا).
- [ ] صفحة `/tickets` — زر التذاكر يوجه لرابط Platinumlist الصحيح.
- [ ] صفحة `/apply` — الفورم ظاهر وموعد `APPLICATION_DEADLINE` الصحيح يظهر في البانر.
- [ ] Webhook: تنشر `speaker` جديد (Published ON) في Studio → يظهر حيًا خلال دقيقة بلا إعادة نشر.
- [ ] **نقطة معلّقة موثقة**: لا توجد صفحة **`/terms`** ولا صفحة **`/privacy`** في الموقع حاليًا (قائمة الصفحات المؤكدة: home/team/venue/activations/schedule/apply/tickets/faq/thank-you/speakers) — **إضافة صفحة الشروط والسياسة إلزامية قبل الإطلاق** (خصوصية بيانات قُصَّر — راجع `docs/06` §4.3).

---

## 4. اختبار قبول العميل (UAT — تجاوزًا لأي أوامر)

> هذا الاختبار لك أنت (العميل) — خطوات انقر وجرّب فقط، بلا تقنية. **استخدم دائمًا بيانات وهمية في الفورمات** (اسم/رقم/إيميل غير حقيقي).

### الخطوة 1 — تصفح الموقع
1. افتح `https://tedxalfalahyouth.com`.
2. تأكد من ظهور الهيدر والشعار والصفحة الرئيسية.
3. انقر زر اللغة (EN/AR) — يجب أن تتحول الصفحة للعربية **وينعكس الاتجاه** (النص من اليمين لليسار).
4. افتح كل صفحة بالقائمة (Speakers, Team, Venue, Apply, Tickets, Schedule, FAQ) وتأكد أنها تفتح سليمًا.

### الخطوة 2 — فورم التواصل (Contact)
1. انتقل لأسفل الرئيسية لقسم Contact.
2. املأ اسمًا وإيميلًا وهميّين واكتب رسالة قصيرة واضغط **Send**.
3. تحقق: ① رسالة نجاح/علامة صح تظهر · ② الرسالة وصلت صندوق `marhaba@tedxalfalahyouth.com` (WebMail — إن لم تجدها فافحص Spam).

### الخطوة 3 — فورم التقديم (Apply) — الأهم
1. افتح `/apply` واختر مسار **Young Speaker**.
2. املأ ببيانات **وهمية** (اسم/عمر/إيميل وهمي تستطيع الوصول إليه).
3. فعّل **Parental Consent** و**Agree to Terms**.
4. اضغط **Submit** وتحقق:
   - ① علامة نجاح ثم الانتقال لصفحة الشكر.
   - ② وصول إيميل التأكيد للإيميل الوهمي.
   - ③ (للمسؤول) صف جديد ببياناتك في Google Sheet التطبيقات.

### الخطوة 4 — التذاكر
1. افتح `/tickets` — يجب أن تجد زر شراء (Platinumlist).
2. انقر عليه — يُحولك لمنصة التذاكر (الرابط من `NEXT_PUBLIC_PLATINUMLIST_URL`).

### الخطوة 5 — محتوى Sanity (للإداري فقط)
1. ادخل `https://tedxalfalahyouth.sanity.studio` بحسابك.
2. أنشئ متحدثًا تجريبيًا (Speaker) — فعّل **Published** ثم **Publish**.
3. افتح الموقع الحي `/speakers` وانتظر دقيقة — يجب أن يظهر المتحدث تلقائيًا (Webhook).

### الخطوة 6 — التحقق النهائي
1. روابط الـ Footer (Instagram/LinkedIn/X) تعمل وتفتح حسابات المنظمة.
2. جميع الأقسام تظهر بدقة في اللغتين.
3. أي مشكلة صادفتها؟ سجّلها (ما، أي صفحة، أي لغة) وأرسلها لفريق التطوير مع لقطة شاشة.

---

## ملاحظات ختامية للتسليم

- **المرجعية**: مسار كل سلوك موثق في الجداول أعلى — أي فشل يمكن تتبعه للملف عبر `docs/10-troubleshooting.md`.
- **الأوامر فوق تعمل محليًا وبعد النشر** بتبديل `localhost:3000` بالنطاق الحي.
- **تسليم متكامل**: هذه الوثيقة + `docs/09` (عمليات العميل) + `docs/10` (استكشاف) تشكّل حزمة "افتح واعمل" الكاملة للعميل والفريق.