# 08 — النشر والاستضافة (Deployment & Hosting) — Hostinger Node.js

**الملف**: `docs/08-deployment-hosting.md`
**الجمهور المستهدف**: العميل/مسؤول النظام (ينفذ الخطوات حرفيًا) + المطور (قرارات تقنية).
**المصدر**: `package.json` و`next.config.ts` و`.env.local.example` و`src/app/api/revalidate/route.ts` و`studio/sanity.cli.ts`.
**القرار المعماري**: النشر على **استضافة Hostinger Node.js** (وليس Vercel) — لا تغيير في DNS القائم.

---

## 1. الوضع الراهن للدومين وسجلات DNS (Domain & DNS)

الدومين **`tedxalfalahyouth.com`** مسجّل ومُدار عبر Hostinger (نظام أسماء النطاقات على `ns1.hostinger.com` / `ns2.hostinger.com`). **يوجد حاليًا سجل A نشيط**: `tedxalfalahyouth.com` → **`148.230.66.121`** (أو الـ IP الذي يظهر عند إنشاء Web App — راجع القسم 2؛ لو اختلف IP، يُحدَّث سجل A فقط).

### جدول السجلات المطلوبة (في hPanel → Advanced → DNS Zone Editor)

| النوع | الاسم | القيمة | الأولوية | الغرض |
|---|---|---|---|---|
| **A** | `@` (tedxalfalahyouth.com) | **IP خادم Web App** (الحالي: 148.230.66.121) | — | توجيه الموقع إلى استضافة Node |
| **A** (اختياري) | `www` | نفس IP | — | جعل `www.tedxalfalahyouth.com` يعمل |
| **CNAME** (اختياري) | `www` | `tedxalfalahyouth.com` | — | بديل للسطر أعلاه (إن لم يُستخدم A) |
| **MX** | `@` | `mx1.hostinger.com` | 10 | استقبال إيميلات `@tedxalfalahyouth.com` (مارحبا، apply، partners، media...) |
| **MX** | `@` | `mx2.hostinger.com` | 20 | بديل احتياطي للبريد |
| **TXT (SPF)** | `@` | `v=spf1 include:spf.hostinger.com ~all` | — | إذن خوادم Hostinger بالإرسال نيابة عن الدومين — **غيابه = رسائل المؤكدات تذهب لـ Spam** |
| **TXT (DKIM)** | حسب hPanel | يُنسخ من: Business Email → Manage → DKIM | — | توقيع الرسائل (موصى به قبل الإطلاق) |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@tedxalfalahyouth.com` | — | سياسة استلام المرسلين المخالفين (موصى به) |

### ما لا تمسّه أبدًا

> **تحذير هام:** لا تحذف أو تعدّل أي سجلات DNS **افتراضية** موجودة من Hostinger مثل `_acme-challenge` (إصدار شهادة SSL) أو إدخالات `ns1.hostinger.com`/`ns2.hostinger.com` (تسجيل الدخول إلى Nameservers) — هي مسؤولة عن إدارة النطاق والشهادات. عملك كله **إضافة** السجلات أعلاه فقط، وتعديل سجل A إن تغيّر IP الخادم.
>
> **توقيت:** انتشار أي تغيير DNS يستغرق **1–24 ساعة** (حسب TTL) — قد يكون الموقع غير مرئي لبعض الزوار مباشرة بعد النشر، وهذا طبيعي وليس عطلًا.

---

## 2. خطوات النشر على Hostinger Node.js (وصفة يوليو 2026)

### 2.1 التحقق من الباقة (قبل كل شيء)

- استضافة Node.js متوفرة في باقات **Business** أو **Cloud** (أو Web Apps المستقلة).
- **باقة "Single Web Hosting" البسيطة لا تدعم Node.js** — إن كانت باقة العميل منها، يلزم ترقية (دعم Hostinger يوضح الفرق).
- المطلوب تقنيًا: Node.js **20.9 أو أحدث** (متطلب Next.js 16 — ليس 18 كما قد تجد في مقالات قديمة؛ الإصدار الحالي `16.3.0` — و`package.json` يحوي `engines.node` إلزاميًا) — اختر **Node 22 LTS** إن وُجد كخيار.

### 2.2 إنشاء Web App (موصى به: الاستيراد من GitHub)

1. **لوحة تحكم Hostinger** → **Web Apps** → **Create New (New Web App)**.
2. اختر **"Import from GitHub"** واربط مستودع `tedxalfalahyouth-website` (سيُطلب ربط حساب GitHub عبر تطبيق Hostinger التابع — الصلاحية للقراءة فقط على هذا المستودع).
3. **إصدار Node.js**: اختر **22** (LTS) — أو أحدث LTS معروض.
4. **Build Command** (من واقع `package.json:5-10` — السكربت الحرفي `build: next build`):
   ```
   npm install && npm run build
   ```
   (إن ركّب النظام الحزم تلقائيًا، يكني `npm run build` وحده).
5. **Start Command**:
   ```
   npm start
   ```
   (`package.json:8` — يشغّل فعليًا `next start`).
6. **دليل الإدخال (Entry Point/Directory)**: اتركه فارغًا ليعتمد على `package.json` (أو حدده كجذر المستودع إن طُلبت قيمة).
7. أنشئ التطبيق → Hostinger ينشر، يثبّت، يبني، ويشغّل العملية عبر مدير عمليات Node خاص به (مكافئ pm2) — يعمل باستمرار ويعيد التشغيل تلقائيًا.

### 2.3 إعدادات النشر: `output: 'standalone'` (مفعّل إلزاميًا)

**الوضع الحالي**: `output: "standalone"` **مفعّل بالفعل** في `next.config.ts` (أعلى كتلة `images`). بعد `npm run build` ينتج مجلد `.next/standalone/` — و**سكربت `postbuild` في `package.json` ينسخ تلقائيًا** `public` → `.next/standalone/public` و`.next/static` → `.next/standalone/.next/static` (متطلب Next الرسمي للـ standalone — بدونها تتعطل كل الأصول: sw.js → 404 والموقع يقف عند "Loading..."). تحقق منه قبل النشر:

1. أعد البناء محليًا: `npm run build` (يعمل النسخ تلقائيًا بعد البناء — تحقق من رسالة `postbuild` في نهاية الإخراج) ثم تأكد من وجود `.next/standalone/server.js` و`.next/standalone/public/sw.js`.
2. في Hostinger غيّر Start Command إلى:
   ```
   node .next/standalone/server.js
   ```
   **والخطوة 2 لا تتطلب أوامر نسخ يدوية إضافية** — `postbuild` يتشغّل تلقائيًا مع `npm run build`.

### 2.4 متغيرات البيئة في Hostinger

| الطريقة | متى تستخدمها |
|---|---|
| **رفع ملف `.env` عبر File Manager** إلى جذر المشروع (في مجلد التطبيق المحدد من Hostinger) | **الموصى بها** — خصوصًا لمفاتيح متعددة الأسطر |
| قسم **Environment Variables** داخل إعدادات Web App (لوحة → Web Apps → التطبيق → Environment Variables) | عمل سريع للمتغيرات القصيرة |

> **تحذير خطير — `GOOGLE_PRIVATE_KEY`:** هذا المفتاح يحتوي أحرف `\n` (أسطر جديدة حرفيًا). عند لصقه في حقل بيئة داخل لوحة Hostinger **قد تُحذف الأسطر أو تُفسَّر خطأ** فيفشل اتصال Google Sheets بخطأ ByteString. الحلول الآمنة بالترتيب: ① رفع ملف `.env` كاملًا عبر File Manager (المفتاح بين علامتي اقتباس كما هو من Google Cloud بلا أي تعديل) — أو ② تشفيره base64 ووضعه كقيمة سطر واحد ثم فك التشفير في بيئة البناء. (وعلى أي حال يعالج الكود ما ورد من `\n`/غير-ASCII عبر `sanitizePrivateKey` في `src/lib/sanitize.ts:26-32` — لكن لا تعتمد عليه لتعويض لصق مكسور).

**قائمة المتغيرات الكاملة قبل أول بناء** (من `.env.local.example`):
`BASE_URL=https://tedxalfalahyouth.com` (أو www حسب النسخة المعتمدة — راجع 2.6) · `NEXT_PUBLIC_PLATINUMLIST_URL` · `NEXT_PUBLIC_VENUE_MAP_URL` · `ALLOWED_API_ORIGINS` · `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/EMAIL_FROM` · `ADMIN_APPLICATIONS_EMAIL/CONTACT_EMAIL/PARTNER_EMAIL/MEDIA_EMAIL` · `GOOGLE_SHEET_ID/GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY` · `NEXT_PUBLIC_TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY` · `UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN` · `NEXT_PUBLIC_SANITY_PROJECT_ID/NEXT_PUBLIC_SANITY_DATASET` · `SANITY_WEBHOOK_SECRET` · `NEXT_PUBLIC_GA_ID`.

**قاعدة ذهبية**: أي متغير يبدأ بـ `NEXT_PUBLIC_` يُدمج في كود المتصفح **وقت البناء** — يعني: ① لا تضع أي سر فيه إطلاقًا (سيظهر لأي زائر)، و② بأي تغيير عليه يجب **إعادة البناء** (Rebuild) وليس فقط إعادة تشغيل.

### 2.5 السجلات وإعادة التشغيل

- **السجلات**: Hostinger Dashboard → Web Apps → التطبيق → **Logs** (أو Runtime Logs) — ابحث عن تحذيرات `[MAILER]` / `[TURNSTILE]` / `[RATE LIMIT]` وأخطاء `ECONNREFUSED` (معناها ونص حلولها في `docs/10-troubleshooting.md`).
- **إعادة التشغيل بعد تغيير المتغيرات**: Web Apps → التطبيق → **Restart** (أو "Deploy" لإعادة البناء عند تغيير `NEXT_PUBLIC_*`).

### 2.6 `BASE_URL` والنطاق الأساسي (www أو بدونه؟)

النطاق الأساسي كتابيًا في الكود بوضع **`https://www.tedxalfalahyouth.com`**: `next.config.ts` يرccc إلى `BASE_URL` الافتراضي فيه (`json-ld.ts:1`, `sitemap.ts:4`, `robots.ts:9`, `layout.tsx:22`). قرار تشغيلي مطلوب من العميل: اعتماد **www أو غير-www كنسخة واحدة** وإعداد إعادة توجيه (301) للنسخة الأخرى (Hostinger Web App يقدّم إعداد Domain Redirect). الحرص هنا مطلوب لـ JSON-LD والـ sitemap: أرشفة كاملة بمجال واحد.

### 2.7 تحذير `.htaccess`

> **تنبيه:** لا تنشئ ملف `.htaccess` في جذر المشروع أبدًا ما لم تطلبها إدارة Hostinger صراحةً — التوجيه في Next.js يتم عبر ملفاته الخاصة (middleware وnext.config) و`.htaccess` على استضافة Node قد يعرقل أو يلغي هذا التوجيه (خاصة مسارات `/en` و`/ar`).

---

## 3. تحديث Sanity Webhook للنطاق الحي

1. ادخل [Sanity Dashboard](https://www.sanity.io/manage) → مشروع **`hisn3dku`** ("TEDxAlFalah Youth") → **API** → **Webhooks**.
2. عدّل URL الـ Webhook الحالي (كان `localhost` تجريبيًا) إلى:
   ```
   https://tedxalfalahyouth.com/api/revalidate?secret=YOUR_STRONG_SECRET
   ```
   (`YOUR_STRONG_SECRET` = نفس قيمة `SANITY_WEBHOOK_SECRET` في متغيرات منصة Hostinger؛ ونطاق `www` إن اعتمدته في 2.6).
3. تأكد أن **Frequency** تشمل **On Publish** و **On Unpublish** على dataset `production`.
4. **Save** — ثم جرّب: انشر متحدثًا في Studio وراقب ظهوره بالموقع حيًا خلال ثوانٍ.

> **حالة التحقق المحلي (قبل أي تكوين في اللوحة):** المسار `/api/revalidate` خضع لاختبار فعلي على الخادم المحلي ونجح بجميع السيناريوهات: بلا سر → `401`، بسر خاطئ → `401`، بسر صحيح (هيدر `x-sanity-webhook-secret`) → `200` مع إعادة توليد مسارات `eventInfo`، بجسم JSON مكسور → `400`، وبسر صحيح عبر `?secret=` → `200`، وتجاوز حد الطلبات (6 طلبات) → `429`.

لماذا هذا ضروري؟ بدون الـ Webhook تبقى الصفحات مبنية بآخر نشر يدوي؛ معه أي تعديل محتوى يعيد بناء الصفحات المتأثرة تلقائيًا (الخريطة الكاملة للمسارات: `src/app/api/revalidate/route.ts:8-14` — راجع `docs/04` §5).

> **تحذير:** `SANITY_WEBHOOK_SECRET` سر حقيقي — اجعله عشوائيًا قويًا، لا تضعه بمتغير يبدأ بـ `NEXT_PUBLIC_`، ولا ترفعه مع الكود.

---

## 4. فحص ما بعد النشر (Post-Deployment Checklist)

> نفّذ بالترتيب — كل بند له دليل نصي؛ لا تنتقل للبند التالي قبل نجاح سابقه.

1. **HTTPS/SSL**: تصفح `https://tedxalfalahyouth.com` — شهادة تلقائية (Let's Encrypt مجاني عبر Hostinger) وينبغي تفعيلها ضمن إعدادات التطبيق قبل الغاء الإصدار النهائي. تحقق من حماية الاتصال وتجددها تلقائيًا.
2. **فحص الصفحات الأساسية**: `/`, `/speakers`, `/team`, `/apply`, `/tickets`, `/schedule`, `/venue`, `/faq` — باللغتين `/en` و`/ar` — كلها تعمل وتظهر المحتوى بصور سليمة (لا صور مكسورة من CDN).
3. **فحص الفورمات (بريد حقيقي)**: أرسل طلب Apply + رسالة Contact — تأكد وصول **تأكيد المتقدم + الإشعار الإداري** إلى `apply@tedxalfalahyouth.com` ورسالة Contact إلى `marhaba@tedxalfalahyouth.com` (WebMail — وليس Spam؛ إن وصلت Spam فراجع SPF/DKIM في القسم 1).
4. **فحص Google Sheets**: افتح الـ Sheet وتأكد ظهور صف جديد بكامل الحقول (بعد تعبئة `GOOGLE_*` الثلاثة).
5. **فحص Turnstile**: الودجت يظهر في الفورمات (بعد تعبئة المفتاحين) والقبول/الرفض يعمل بلا أخطاء في السجل.
6. **فحص Rate Limiting**: أرسل 6 طلبات متتالية لنفس الفورم من نفس IP — الطلب السادس يعيد `429 Too many requests` (سجل التوكن يستقبلها: `rate-limit.ts:20` — 5/10د).
7. **فحص Webhook**: انشر وثيقة `speaker` جديدة (isPublished: ON) في Studio → تظهر على `/speakers` حيًا خلال ثوانٍ بلا إعادة نشر يدوية (+ نتيجة `{"revalidated": true}` في سجل الطلب).
8. **فحص SMTP داخلي**: تحقق من السجلات: اتصال `smtp.hostinger.com:465` ناجح بلا `ECONNREFUSED` (إن حُظر المنفذ من بيئة الاستضافة، اضبط إعدادات SMTP أو تواصل مع دعم Hostinger — الاختبار المعياري يعيد `SMTP-VERIFY-OK`).
9. **فحص `BASE_URL`**: تأكد قيمته في الاستضافة هي `https://tedxalfalahyouth.com` (نسخة www إن اُعتمدت) — **ليست localhost** — وإلا خرّبت الروابط المطلقة في JSON-LD وصور المشاركات (راجع `docs/07` §2.3).
10. **مراجعة السجلات**: Web Apps → Logs — بلا أخطاء متكررة (`ECONNREFUSED`, `[Sanity] Fetch failed`, `[MAILER]/[TURNSTILE]/[RATE LIMIT] not configured` — ء من الثلاثة الأخيرة تعني حماية معطلة، راجع `docs/06` §5 و`docs/10` §5).
11. **اختبار مقلب بعدها**: رابط `GET /api/revalidate?secret=<خطأ>` يعيد 401، ورابط Takedown غير مسموح الأصول يعيد 403 — حجر الزاوية الأمني قيد التفعيل.

---

## ملاحظات ختامية

- **GitHub أو ZIP؟** لا يزال قرارًا مفتوحًا بين المستخدم والعميل — مسار GitHub أعلاه هو الموصى به (نشر تلقائي عند كل push للمستودع بعيدًا عن المفاتيح؛ المستودع خاص ولا يحتوي أسرارًا إن التُزم بـ`docs/06` §5).
- **أداة الدقة**: أي تعديل لاحق على `next.config.ts` (كخطة الفيديو — CSP) يستلزم إعادة بناء كاملة (Rebuild) في Hostinger.
- **بهذا يكتمل**: بناء محلي نظيف (`npm run build`) + ورقة نشر Hostinger (هذه الوثيقة) + خطة جلسة مفاتيح العميل (`docs/01`).