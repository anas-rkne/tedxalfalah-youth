# 05 — نظام الفورمات والإيميلات (Forms & Email System)

**الملف**: `docs/05-forms-email-system.md`
**الجمهور المستهدف**: مطورون + فريق العمليات — المرجع الوظيفي الكامل: كيف يُعالَج الطلب من البداية إلى النهاية.
**المصدر**: الكود الفعلي — كل سطر محقق، والنصوص الحرفية منسوخة 100% من الملفات.

---

## 1. الفورمات ومساراتها (جدول شامل)

| الفورم | مسار الـ API | مكان الظهور في الواجهة | الغرض | نموذج البيانات (zod) |
|---|---|---|---|---|
| **Apply** (تقديم كمتحدث) | `POST /api/apply` | `src/components/apply/ApplicationForm.tsx` — صفحة `/apply` (قسم 4 من الصفحة) | جمع طلبات المتحدثين (شبان 10–18 وخبراء) ببيانات أولياء الأمور | `applicationSchema` — مخطط داخل `src/app/api/apply/route.ts` (20 حقلاً مع `superRefine`) |
| **Contact** (تواصل) | `POST /api/contact` | `src/components/contact/ContactBox.tsx` (ملفوف بـ `ContactBoxWrapper`) — أسفل صفحة الرئيسية | رسائل عامة للمنظمة | `contactSchema` — مخطط داخل `src/app/api/contact/route.ts` |
| **Partner Inquiry** (شراكة) | `POST /api/partner-inquiry` | **لا توجد واجهة حاليًا** — الـ API مبرمج وجاهز | استفسارات الرعايات/الشراكات | `partnerSchema` — مخطط داخل `src/app/api/partner-inquiry/route.ts` |
| **Tickets** (تذاكر) | **لا يوجد `/api/tickets`** | صفحة `/tickets` **مخفية حاليًا** (`notFound()` — قرار العميل)؛ زر Platinumlist الخارجي جاهز في الكود | التوجيه لمنصة Platinumlist الخارجية | — (لا نموذج zod؛ الضغط = رابط خارجي) |

> **توضيح التذاكر (محقق):** لا يوجد ملف `src/app/api/tickets/route.ts` في المشروع. صفحة `/tickets` (وكذلك `/tickets/success` و`/tickets/cancel`) ترجع `notFound()` حاليًا — قرار العميل بإخفائها؛ والزر الخارجي إلى `NEXT_PUBLIC_PLATINUMLIST_URL` قائم في الكود (`src/app/[locale]/tickets/page.tsx`). أي إشارة قديمة في README إلى "فورم Tickets يحفظ في Google Sheet" **غير مطابقة للكود الحالي**.

**التشابهات بين الثلاثة:** كل مسار يبدأ بالترتيب نفسه: `validateOrigin` → `checkRateLimit(formKey)` → `safeParse` → `verifyTurnstile` → ثم منطق الإرسال الخاص به.

---

## 2. مخطط توجيه البريد النهائي (ASCII)

```
المتصفح (Frontend — react-hook-form + zodResolver)
   │  1. TurnstileWidget يولّد token (أو لا يعرض شيئًا بلا مفتاح عام)
   │  2. fetch("/api/...", { method:"POST", body: JSON.stringify({...fields, turnstileToken}) })
   ▼
┌──────────────────────────────  /api/apply | /api/contact | /api/partner-inquiry ──────────────────────────────┐
│ طبقة 1: validateOrigin(request)        [cors.ts]        — origin خارج القائمة → 403                          │
│ طبقة 2: checkRateLimit(request,"form") [rate-limit.ts]  — نافذة منزلقة 5/10د لكل formKey:IP → 429           │
│ طبقة 3: zod safeParse                  — بيانات غير صالحة → 400                                                │
│ طبقة 4: verifyTurnstile(token)         [turnstile.ts]   — بوت → 403                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   ▼
┌────────────────────────────────  sendMail() — src/lib/mailer.ts ─────────────────────────────────────────────┐
│ isMailerConfigured()؟  (SMTP_HOST+SMTP_USER+SMTP_PASS)                                                        │
│    └ لا → console.warn "[MAILER] SMTP not configured..." + عودة صامتة (Fail-Open)                             │
│    └ نعم → nodemailer.createTransport({ host: smtp.hostinger.com, port: 465, secure: true, auth })            │
│            → transport.sendMail({ from: EMAIL_FROM, to, replyTo?, subject, html })                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   ▼  SMTP Hostinger (SSL 465 — تحقق فعلي: SMTP-VERIFY-OK)
   ▼
التوجيه النهائي:
├── /api/apply:
│     ├── الإيميل 1: to = المتقدم نفسه (data.email)          ← تأكيد الاستلام (نص معتمد: يبدأ "Your idea is in." وينتهي "Warm regards," ثم "TEDxAlFalah Youth Team")
│     └── الإيميل 2: to = ADMIN_APPLICATIONS_EMAIL + CONTACT_EMAIL  ← إشعار إداري موازٍ للصندوقين
├── /api/contact: (بلا توجيه حسب الموضوع)
│     └── to = CONTACT_EMAIL (marhaba@) دائمًا — قيمة subject تُدرَج في عنوان الإيميل ومتنه فقط
└── /api/partner-inquiry:
      └── to = PARTNER_EMAIL (partners@)  + replyTo = بريد المُرسل
```

---

## 3. فورم Apply بالتفصيل (الأكثر تعقيدًا)

### 3.1 المساران (Tracks)

بطاقتا اختيار (radio) في الواجهة (`ApplicationForm.tsx:246-285`):
- **`young-speaker`** — متحدث شاب (10–18 عامًا): يعرض قسمًا إضافيًا (المدرسة + ولي الأمر + موافقة الوالدين).
- **`expert`** — خبير: يعرض قسمًا إضافيًا (المنظمة والدور + مجال العمل مع الشباب).

الاختيار يُراقَب بـ `watch("track")` (سطر 193) والواجهة تُبدّل الأقسام الشرطية فورًا (أسطر 348–383).

### 3.2 التحقق الشرطي (SuperRefine) — مطابق في الملفين

| المسار | تصبح إلزامية | دليل الخادم (`apply/route.ts`) | دليل العميل (`ApplicationForm.tsx`) |
|---|---|---|---|
| `young-speaker` | `schoolName` + `guardianName` + `guardianContact` + `parentalConsent === true` | أسطر 36–49 | أسطر 159–172 |
| `expert` | `organizationAndRole` + `areaOfWorkWithYouth` | أسطر 50–57 | أسطر 173–180 |

> **ملاحظة (محققة):** حقل `videoLink` **أُزيل من الفورم والمسارين نهائيًا** (أُغسطس 2026) — لا يُجمَع ولا يُطلب، وأي وصف سابق له كحقل إجباري أو اختياري غير مطابق للكود الحالي.

### 3.3 الحدود النصية (Word Count)

| الحقل | الحد | الدالة |
|---|---|---|
| `ideaSummary` | **≤ 300 كلمة** | `wordCount` — `ApplicationForm.tsx:29-31` + `route.ts:9-11` (نسخة مكررة في الملفين: يتحقق العميل أولًا، والخادم يعيد التحقق بصرامة) |
| `whyItMatters` | **≤ 150 كلمة** | نفس الدالة |

العدّاد الحي في الواجهة: `t("wordCount", { count, max })` (سطر 317 و322) — يحدّ الزائر قبل الإرسال، لكن الخادم هو الحكم النهائي (`refine` داخل `safeParse`).

### 3.4 تدفق المعالجة الكامل (خطوة بخطوة)

1. المستخدم يملأ الفورم ويضغط "إرسال" — يتحقق `zodResolver` محليًا.
2. `TurnstileWidget` يولّد `turnstileToken` (المفتاح العام غير مفعّل → `null`/فارغ مقبول في التطوير).
3. `fetch('/api/apply', { method: 'POST' })` مع `AbortController` مهلة 20 ثانية (سطر 200-201).
4. الخادم: `POST()` في `apply/route.ts` ينفذ `validateOrigin` → `checkRateLimit("apply")` → `safeParse` → `verifyTurnstile`.
5. **حفظ في Google Sheets**: إن وُجدت المتغيرات الثلاثة (`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` — الحارس `hasGoogleSheetConfig` داخل `POST`) يُستدعى دالة `saveToGoogleSheet` عبر `google-spreadsheet` + `JWT`. **فشله = `console.error` فقط والطلب يكمل.**
6. **تأكيد المتقدم**: دالة `sendConfirmationEmail(data)` في `apply/route.ts` — نص معتمد من العميل يبدأ بـ "Your idea is in." وينتهي بـ "Warm regards," ثم "TEDxAlFalah Youth Team".
7. **الإشعار الإداري**: دالة `sendAdminNotification` تُرسل إلى `ADMIN_APPLICATIONS_EMAIL` و`CONTACT_EMAIL` معًا — كل بيانات الطلب.
8. الواجهة تعرض زر "✓" ثم `router.push("/thank-you?type=apply")` بعد 1.2 ثانية (سطر 216).

> **سلوكيات دقيقة (مهمة للمساءلة):**
> - فشل أي إيميل في Apply = `console.error` **دون** إسقاط الطلب — الإشعار الإداري هو قناة الاستلام الأساسية والـ Sheet قناة تخزين إضافية.
> - البيانات الشخصية **لا تُطبع أبدًا** في السجلات (حتى في التطوير: `[DEV] Application received for track "..."` فقط في فرع غياب إعدادات الـ Sheet).
> - في تطوير بلا SMTP: `[DEV] Confirmation email would be sent...` فقط في فرع غياب إعداد البريد.

---

## 4. نصوص الإيميلات الحرفية (مطابقة 100% للكود)

### 4.1 رسالة التأكيد للمتقدم — دالة `sendConfirmationEmail` في `src/app/api/apply/route.ts`

> نص معتمد من العميل — **لا يُغيّر** (تعليق صريح في الكود أعلى الدالة).

**البنية الحالية (بداية ونهاية فقط — النص الكامل في الكود):**

```html
<p><strong>Your idea is in.</strong></p>
<p>... (بقية الفقرات كما اعتمدها العميل في الكود) ...</p>
<p>Warm regards,<br />TEDxAlFalah Youth Team</p>
```

- **المرسل إليه**: `data.email` (بريد المتقدم) — لا `replyTo`.
- **الموضوع**: `We've Received Your Application | TEDxAlFalah Youth`.
- **مهم**: الرسالة تبدأ بجملة "**Your idea is in.**" وتنتهي بتوقيع "**Warm regards,**" ثم "**TEDxAlFalah Youth Team**" — **بلا** توقيع "Tomorrow, Now." و**بلا** جملة "Tomorrow is shaped by what we do today." (أي اقتباس قديم لهما في رسالة التأكيد غير مطابق للكود الحالي).

### 4.2 الإشعار الإداري — دالة `sendAdminNotification` في `src/app/api/apply/route.ts`

**الموضوع**: `New Application: {Young Speaker|Expert Speaker} - {اسم المتقدم}`

```html
<p><strong>Track:</strong> Young Speaker|Expert Speaker</p>
<p><strong>Full name:</strong> {fullName}</p>
<p><strong>Age:</strong> {age}</p>
<p><strong>Email:</strong> {email}</p>
<p><strong>Phone:</strong> {phone}</p>
<p><strong>City:</strong> {city}</p>
<p><strong>Talk idea title:</strong> {talkIdeaTitle}</p>
<p><strong>Idea summary:</strong> {ideaSummary}</p>
<p><strong>Why it matters:</strong> {whyItMatters}</p>
<p><strong>Theme connection:</strong> {themeConnection}</p>
<p><strong>How they heard about us:</strong> {howHeardAboutUs}</p>
<p><strong>School name:</strong> {schoolName | "-"}</p>
<p><strong>Guardian name:</strong> {guardianName | "-"}</p>
<p><strong>Guardian contact:</strong> {guardianContact | "-"}</p>
<p><strong>Organization and role:</strong> {organizationAndRole | "-"}</p>
<p><strong>Area of work with youth:</strong> {areaOfWorkWithYouth | "-"}</p>
<p><strong>Submitted at:</strong> {الوقت المحلي الآن}</p>
```

- **كل قيمة تمر عبر `escapeHtml`** (`src/lib/sanitize.ts`) — يحوّل `& < > " '` إلى كيانات HTML، ليمنع حقن كود خبيث في الإيميل عبر أي حقل نصي (message/ideaSummary...).
- **المتلقي**: صندوقان معًا — `ADMIN_APPLICATIONS_EMAIL` (`apply@tedxalfalahyouth.com`) و`CONTACT_EMAIL` (`marhaba@tedxalfalahyouth.com`) — نسخة موازية لكل طلب.
- **الغرض**: تمكين فريق التقديم من مراجعة الطلب **دون فتح Google Sheets** — الصندوقان `apply@` و`marhaba@` هما الآن (بلا مفاتيح Google) القناتان الحيتان الفعليتان.

---

## 5. الإغلاق التلقائي (APPLICATION_DEADLINE)

**القيمة الحالية** (`src/lib/constants.ts:1-2`):
```ts
export const APPLICATION_DEADLINE =
  process.env.APPLICATION_DEADLINE || "2026-09-14T23:59:59+04:00";
```
توقيت **UTC+4 صريحًا** (= توقيت الإمارات) — يوم 14 سبتمبر 2026 حتى آخر لحظة.

**الآلية (خادم صرف — لا يمكن التلاعب بها من المتصفح):**
- `src/app/[locale]/apply/page.tsx:28`:
  ```ts
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);
  ```
- عند `isClosed: true` **لا يُعرض الفورم أصلًا** (سطر 100-113) — تظهر بطاقة إغلاق بترجمتي `page.apply.closed.title` و`page.apply.closed.body` (مفتاحا الترجمة من `messages/{en,ar}.json`).
- الفحص يحدث في **Server Component** — أي محاولة تلاعب بساعة المتصفح بلا جدوى.
- **نفس المنطق في الرئيسية**: `src/components/home/ApplyBanner.tsx:9` يخفي بانر التقديم بعد الموعد.
- متغير آخر ذو صلة (لعرض النص فقط): `NEXT_PUBLIC_APPLICATION_DEADLINE` يغير **تسمية** "September 14, 2026" في البانر (سطر 5) — **لا يتحكم بالإغلاق** (الإغلاق من الثابت أعلاه).
- **لتغيير الموعد مستقبلًا**: عدّل الثابت في `src/lib/constants.ts:1-2` (يقرأ متغير البيئة `APPLICATION_DEADLINE` أولًا ثم يسقط على القيمة الافتراضية) وأعد البناء.

---

## 6. فورم Contact وPartner

### 6.1 Contact — وجهة واحدة لكل الرسائل (من `contact/route.ts`)

حقل `subject` من نوع enum بخمس قيم صارمة: `General` / `Speaking` / `Sponsorship` / `Volunteering` / `Media` — لكنه **لا يوجّه الرسائل**.

| المتلقي | المتغير | الافتراضي |
|---|---|---|
| **كل الرسائل** (بكل المواضيع الخمسة) | `CONTACT_EMAIL` | `marhaba@tedxalfalahyouth.com` |

- **لا توجيه حسب الموضوع**: خريطة `inboxBySubject` أُزيلت نهائيًا من الكود — قيمة `subject` تُدرَج في **عنوان الإيميل ومتنه** فقط (`subject: [${subject}] New message from ...` + سطر `Subject:` في الجسم) ولا تغيّر المتلقي إطلاقًا.
- **معلومة ذات صلة**: `PARTNER_EMAIL` و`MEDIA_EMAIL` لم تعودا مستلزمتين من هذا الفورم — وجهة استفسارات الشراكة هي مسار Partner Inquiry، وصندوق الإعلام (media@) لا يستهلكه أي route حاليًا.
- `replyTo: email` — الرد يصل لبريد المرسل مباشرة.
- **فشل الإرسال = `500`** مع `{ error: "Failed to send message" }` — لا قناة بديلة لهذا الفورم.

### 6.2 Partner Inquiry

- المخطط: `name` + `organization` + `email` + `phone` + `message` (≥10 أحرف) + `turnstileToken` (`partner-inquiry/route.ts:9-16`).
- يصل دائمًا لـ `PARTNER_EMAIL` مع `replyTo` (سطر 51-65)، الموضوع: `New partnership inquiry from {المنظمة}`.
- **لا واجهة أمامية حاليًا** — البرمجة كاملة ومختبرة؛ أي صفحة/زر مستقبلي يحتاج فقط `fetch` إلى هذا المسار بنفس شكل الجسم.
- فشل الإرسال = `500` `{ error: "Failed to send" }`.

---

## 7. Google Sheets — الأعمدة والتحذيرات

### 7.1 أعمدة الصف الـ 19 (بالترتيب الدقيق في `addRow` — `apply/route.ts:111-131`)

```text
1.  timestamp          6.  phone              11. themeConnection    16. areaOfWorkWithYouth
2.  track              7.  city               12. schoolName         17. parentalConsent
3.  fullName           8.  talkIdeaTitle      13. guardianName       18. consentToTerms
4.  age                9.  ideaSummary        14. guardianContact    19. (timestamp يفتح الصف)
5.  email              10. whyItMatters       15. organizationAndRole
```

> **تحديث اليوم:** عمود `videoLink` أُزيل من `setHeaderRow`/`addRow` (أُغسطس 2026) — الصفوف الجديدة 19 عمودًا؛ الجداول القائمة تحتفظ بعمود `videoLink` الفارغ (بلا إزالة) للحفاظ على توافق البيانات التاريخية.

**الصفوف تُضاف بنفس الترتيب حرفيًا** — إذا أعددت الـ Sheet يدويًا بعناوين أعمدة، انسخ هذه الأسماء **بنفس الإملاء** (الخادم يضيفها كخريطة `column: value` وليس موضعيًا، فالترتيب الفعلي للأعمدة في الجدول يرتب بنفس ترتيب المفاتيح).

### 7.2 التحذير الأمني

> **تحذير أمني هام:** يجب أن يكون هذا الجدول (Google Sheet) **مقيّد الوصول بشكل صارم (Restricted)** ولا يُفعل له أبدًا "Anyone with the link" — لأنه يحتوي بيانات حساسة: أسماء وأعمار وهواتف **لأطفال 10–14 سنة** وبيانات أولياء أمورهم. التعليق نفسه مكتوب داخل الكود (`route.ts:68-71`). الصلاحية الوحيدة المطلوبة: مشاركة الجدول **بالبريد** مع `GOOGLE_SERVICE_ACCOUNT_EMAIL` بحق **Editor** (وليس Anyone).

### 7.3 ملاحظة التنفيذ الفني

`GOOGLE_PRIVATE_KEY` يُعالَج بـ `sanitizePrivateKey` (`src/lib/sanitize.ts:26-32`): يحوّل `\n` الحرفية إلى أسطر جديدة حقيقية ويزيل أي حرف غير ASCII (لمنع خطأ ByteString مع PEM). انسخ المفتاح كما هو بين علامتي اقتباس في `.env.local` — **لا تعدّل تنسيقه يدويًا**.

---

## 8. `mailer.ts` — كيف يعمل وماذا يحدث عند الفشل

### 8.1 التشغيل (من `src/lib/mailer.ts` — 62 سطرًا)

- **التهيئة**: `transport` واحد (singleton) يُنشأ عند أول إرسال عبر `nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })` (أسطر 32-45). افتراضيًا: `smtp.hostinger.com:465` SSL.
- **المرسل**: `EMAIL_FROM` (افتراضي `TEDxAlFalah Youth <marhaba@tedxalfalahyouth.com>` — سطر 21-22).
- **`isMailerConfigured()`** (سطر 24-28): يتطلب `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS`.
- **`sendMail({to, subject, html, replyTo?})`** (سطر 54-61): إن لم يُعدّ SMTP → `console.warn` ويعود بلا إرسال (**Fail-Open — لا يرمي خطأ**). وإن أُعدّ → `await transport.sendMail(...)`، والأخطاء الحقيقية **تُرمى للمستدعي** (الذي يقرر كيف يتعامل، حسب جدول 8.2).

### 8.2 جدول الفشل لكل Route (سلوك محدد من الكود)

| الـ Route | عند فشل `sendMail` فعليًا | عند غياب إعداد SMTP | هل يُسقط الطلب (500)؟ |
| :--- | :--- | :--- | :--- |
| `/api/apply` | `console.error` لكل إيميل على حدة — الإيميلان مستقلان؛ فشل أحدهما لا يوقف الآخر | `[DEV]` في السجل فقط (فرع غياب SMTP في `POST`) | **لا** — يعيد `success: true` دائمًا (الأولوية للحفظ/الإشعار، الإيميل قناة تأكيد إضافية) |
| `/api/contact` | `console.error` + `{ error: "Failed to send message" }` | `[DEV]` فقط (فرع غياب SMTP في `POST`) | **نعم** — `500` (الإيميل هو القناة الوحيدة لهذا الفورم) |
| `/api/partner-inquiry` | `console.error` + `{ error: "Failed to send" }` | `[DEV]` فقط (فرع غياب SMTP في `POST`) | **نعم** — `500` (نفس السبب) |
| `/api/tickets` | **لا يوجد route** — وزر Platinumlist الخارجي جاهز في الكود لكن صفحة `/tickets` مخفية (`notFound()`) | — | — |

> **المنطق المعماري**: Apply يملك **ثلاث قنوات** (Sheet + تأكيد + إشعار إداري) فلا يسقط بأي فشل فرعي؛ Contact وPartner لهما **قناة واحدة** (الإيميل) فيفشلان صراحة ليعرف المستخدم أنه يجب إعادة المحاولة. هذا السلوك مقصود ومقنن — لا تغيّره دون مراجعة القرار المعماري في `docs/02` (ADR 6.3).

---

## 9. اختبار النظام (المُنجز فعليًا — 2026-08-11)

| الاختبار | النتيجة |
|---|---|
| `transport.verify()` عبر Hostinger 465 | **SMTP-VERIFY-OK** |
| Contact General → `marhaba@` | وصل |
| Contact Sponsorship → `marhaba@` (كل المواضيع لصندوق واحد بعد إزالة التوجيه) | وصل |
| Contact Media → `marhaba@` | وصل |
| Apply (مساران) → تأكيد المتقدم + إشعار `apply@` و`marhaba@` | وصلا |
| `npx tsc --noEmit` + `next build` | نظيفان |

**التحقق بنفسك**: كل الرسائل في WebMail الصناديق (`https://webmail.tedxalfalahyouth.com`). اختبار سريع محليًا:
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/contact -Method Post -ContentType "application/json" -Body '{"name":"Test","email":"a@b.com","subject":"General","message":"Test message ten chars."}'
```