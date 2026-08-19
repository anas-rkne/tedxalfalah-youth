# CREDENTIALS — المرجع الشامل (قالب)

> **كيف تُستخدم**: انسخ هذا الملف إلى `CREDENTIALS.md` (`copy CREDENTIALS.template.md CREDENTIALS.md`) واملأ القيم محليًا.
> `CREDENTIALS.md` مرفوض في `.gitignore` — **لا يُرفع أبدًا**. هذا القالب (بلا قيم) هو المرفوع فقط. لا تضع فيه أي سر حقيقي.

---

## 1. الموقع والروابط

| الرابط | الوصف |
|---|---|
| `https://tedxalfalahyouth.com` | النطاق الرئيسي (بلا www) |
| `https://www.tedxalfalahyouth.com` | الأساسي المعتمد في الكود (`BASE_URL`) |
| `https://tedxalfalahyouth.com/en` | الرئيسية بالإنجليزية |
| `https://tedxalfalahyouth.com/ar` | الرئيسية بالعربية |
| `https://tedxalfalahyouth.com/en/apply` | التقديم بالإنجليزية (متحدث/خبير) |
| `https://tedxalfalahyouth.com/ar/apply` | التقديم بالعربية |
| `https://tedxalfalahyouth.com/thank-you?type=X` | شاشة ما بعد الفورم (أنواع: `apply`, `contact`, `partner` + `default`) |
| `https://tedxalfalahyouth.com/robots.txt` | ملف الروبوتات |
| `https://tedxalfalahyouth.com/sitemap.xml` | خريطة الموقع |
| `https://tedxalfalahyouth.com/speakers` | المتحدثون (من Sanity — يُنشر عبر Studio) |
| `https://tedxalfalahyouth.com/team` | الفريق (من Sanity — يُنشر عبر Studio) |
| `https://tedxalfalahyouth.com/api/apply` | نقطة API استقبال الطلبات (اختبار curl) |
| `https://tedxalfalahyouth.com/api/contact` | نقطة API التواصل |
| `https://tedxalfalahyouth.com/api/partner-inquiry` | نقطة API استفسارات الرعاة |
| `https://tedxalfalahyouth.com/api/revalidate` | نقطة Webhook (تستدعيها Sanity عند النشر) |

## 2. لوحات الخدمات (روابط الدخول)

| الخدمة | الرابط | الدخول/المعرف |
|---|---|---|
| **Sanity Studio (إدارة المحتوى)** | `https://<project-id>.sanity.studio/` | `<PROJECT_ID>` — dataset `<DATASET>` — `<عدد الوثائق>` وثيقة |
| Sanity Manage | `https://manage.sanity.io` | بريد صاحب المشروع (2SV) |
| **hPanel (الاستضافة)** | `https://hpanel.hostinger.com` | `<بريد hPanel>` / `<كلمة المرور>` |
| **WebMail (الصناديق)** | `https://webmail.hostinger.com` | حسب الجدول أدناه |
| Google Cloud (Service Account) | `https://console.cloud.google.com/iam-admin/serviceaccounts` | مشروع `<اسم>` — حساب `<الاسم>@<project>.iam.gserviceaccount.com` |
| **Google Sheet (طلبات التقديم)** | `https://docs.google.com/spreadsheets/d/<ID>` | صلاحية Editor لحساب الخدمة |
| Cloudflare Turnstile | `https://dash.cloudflare.com/?to=/turnstile` | Site Key: `<0x...>` |
| Upstash Redis (Rate Limit) | `https://console.upstash.com` | DB: `<اسم-القاعدة>` |
| Google Analytics | `https://analytics.google.com` | Measurement ID: `<G-XXXXXXX>` |
| GitHub (الكود) | `<رابط الريبو>` | فرع `<main>` |

## 3. كلمات المرور والدخول

### hPanel / Gmail
- **hPanel**: `<بريد>` / `<كلمة المرور>`
- **Gmail**: `<بريد>` — كلمة المرور: **`<ضعها هنا>`** (2FA: الهاتف مطلوب)

### الصناديق البريدية (WebMail: `https://webmail.hostinger.com`)

| الصندوق | كلمة المرور |
|---|---|
| `marhaba@tedxalfalahyouth.com` | `<كلمة المرور>` |
| `apply@tedxalfalahyouth.com` | `<كلمة المرور>` |
| `partners@tedxalfalahyouth.com` | `<كلمة المرور>` |
| `media@tedxalfalahyouth.com` | `<كلمة المرور>` |

> **قاعدة**: عند تغيير أي كلمة مرور/مفتاح → يُحدَّث هنا + `.env.local` + (إن ورد في الدوكس) + `CREDENTIALS.template.md` بلا قيمة، ثم يُعاد البناء/التشغيل.

### خوادم البنية التحتية (internal فقط — لا تُدرج في نسخة العميل)

| الهدف | قيمة |
|---|---|
| VPS | `<القيمة>` |
| Panel | `<القيمة>` |

## 4. المفاتيح الكاملة (`.env` — كما في `.env.local`)

```ini
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=<صندوق الإرسال>
SMTP_PASS=<كلمة المرور>
EMAIL_FROM=TEDxAlFalah Youth <<صندوق الإرسال>>

ADMIN_APPLICATIONS_EMAIL=<apply@...>
CONTACT_EMAIL=<marhaba@...>
PARTNER_EMAIL=<partners@...>
MEDIA_EMAIL=<media@...>

GOOGLE_SHEET_ID=<ID>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<name>@<project>.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
<المفتاح متعدد الأسطر — انسخه كما هو بلا تعديل>
-----END PRIVATE KEY-----
"

NEXT_PUBLIC_TURNSTILE_SITE_KEY=<0x...>
TURNSTILE_SECRET_KEY=<0x...>

UPSTASH_REDIS_REST_URL="https://<db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<token>"

NEXT_PUBLIC_SANITY_PROJECT_ID=<PROJECT_ID>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_WEBHOOK_SECRET=<secret>

NEXT_PUBLIC_GA_ID=<G-XXXXXXX>

NEXT_PUBLIC_VENUE_MAP_URL=<رابط Google Maps المضمّن في صفحة المكان>
# رابط مختصر بديل (إن وُجد): <https://maps.app.goo.gl/...>

BASE_URL=https://www.tedxalfalahyouth.com
ALLOWED_API_ORIGINS=https://www.tedxalfalahyouth.com,https://tedxalfalahyouth.com,http://localhost:3000
NEXT_PUBLIC_PLATINUMLIST_URL=<رابط منصة التذاكر — غير مستخدم حاليًا (صفحة /tickets مخفية)>
NEXT_PUBLIC_APPLICATION_DEADLINE=September 14, 2026
```

## 5. سجلات DNS (hPanel → Advanced → DNS Zone Editor)

| النوع | الاسم | القيمة | الأولوية | الغرض |
|---|---|---|---|---|
| **A** | `@` | `<IP الخادم>` | — | توجيه الموقع إلى استضافة Node (الحالي) |
| **A** (اختياري) | `www` | نفس IP | — | جعل `www.<domain>` يعمل |
| **CNAME** (اختياري) | `www` | `<domain>` | — | بديل عن سطر A أعلاه |
| **MX** | `@` | `mx1.hostinger.com` | 10 | استقبال إيميلات `@<domain>` |
| **MX** | `@` | `mx2.hostinger.com` | 20 | بديل احتياطي للبريد |
| **TXT (SPF)** | `@` | `v=spf1 include:spf.hostinger.com ~all` | — | **ضروري** — بدونها إيميلات التأكيد تذهب Spam |
| **TXT (DKIM)** | حسب hPanel | يُنسخ من: Business Email → Manage → DKIM | — | توقيع الرسائل (موصى به قبل الإطلاق) |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@<domain>` | — | سياسة استلام المرسلين المخالفين (موصى به) |
| NS (موجود — لا تمسه) | — | `ns1.hostinger.com` / `ns2.hostinger.com` | — | Nameservers تسجيل الدخول |
| (موجود — لا تمسه) | `_acme-challenge` | — | — | إصدار شهادة SSL |

> **لا تمسها أبدًا**: السجلات الافتراضية من Hostinger — `_acme-challenge` وإدخالات `ns1`/`ns2`. عملك **إضافة** ما سبق فقط. انتشار أي تغيير DNS يستغرق 1–24 ساعة.

## 6. معلومات التشغيل (التفاعل اليومي مع النظام)

- **تحديث المحتوى الفوري**: عند نشر أي وثيقة في Sanity Studio يتصل النظام بـ `/api/revalidate` (Webhook) ويعيد توليد الصفحات خلال ثوانٍ — بلا إعادة نشر يدوية.
- **إظهار/إخفاء الأقسام** (مستند `eventInfo` في Studio): مفاتيح `showSpeakers` / `showSponsors` / `showTeam` — كل مفتاح يتحكم بقسمه في الصفحة الرئيسية فقط.
- **قاعدة `NEXT_PUBLIC_`**: أي متغير بهذه البادئة يُدمج في كود المتصفح **وقت البناء** — تغييره يتطلب إعادة بناء (Deploy) لا مجرد Restart، ولا يوضع فيه سر أبدًا.
- **الحد**: 5 طلبات/10 دقائق/فورم/IP (Upstash) — الـ 429 سلوك مقصود.
- **سلوك الغياب**: SMTP/Rate-limit **fail-open** (يعملان بتراجع آمن عند غياب المفاتيح — تحذيرات `[MAILER]/[RATE LIMIT] not configured` فقط في السجل)، أما **Turnstile** ففي الإنتاج **fail-closed**: تُرفض الفورمات برمز 403 عند غياب المفاتيح — يجب ضبط المفاتيح قبل الإطلاق.
- **السجلات**: Hostinger → Web Apps → Logs — المرجع الأول لأي فحص.

## 7. ملاحظات التحقق والحسم المفتوح

> (قالب) أبقِ هذا القسم مطابقًا لشكل `CREDENTIALS.md` الفعلي — سجّل هنا كل بند
> تحقق/قرار مفتوح مع تاريخه. أمثلة على الصياغة (استبدل النص):

1. **<الخدمة>**: القيمة `<xxxxxxxx>` المذكورة خارجيًا **غير صحيحة** — التحقق الفعلي: `<نتيجة التحقق>` بينما `<xxxxx>` هي المعتمدة في الكود وStudio.
2. **<الموعد/القرار>**: **مُحسم**: <القيمة المعتمدة من العميل> (متسق في `constants.ts` / `.env.local` / الوثائق).
3. **<رابط بديل>**: المفعّل هو <الرابط الطويل>؛ البديل <الرابط المختصر> — قابل للاستبدال عند الرغبة ثم يُعاد البناء.
4. **قاعدة**: أي تغيير في كلمة مرور/مفتاح → يُحدَّث هنا + `.env.local` + (إن ورد في الدوكس) + `CREDENTIALS.template.md` بلا قيمة.
5. **<Token اختياري>**: غير موجود في `.env.local` (حُذف عمدًا) — لا حاجة لإضافته إلا عند طلب محدد.

---

## مرجع سريع للمفاتيح (حسب الخدمة)

| # | المفتاح/الخدمة | مكان القيمة الحقيقية | محفوظ في | ملاحظات |
|---|---|---|---|---|
| 1 | SMTP Hostinger | hPanel → Emails → Settings | `.env.local` (`SMTP_HOST/PORT/USER/PASS`) | كلمة المرور **لا** تُرفع؛ مثال: `.env.local.example` |
| 2 | Google Service Account (Sheets) | Google Cloud Console → Service Accounts | `.env.local` (`GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`) | المفتاح متعدد الأسطر — انسخه كما هو بلا تعديل |
| 3 | Google Sheet ID | رابط الجدول (`docs.google.com/spreadsheets/d/<ID>`) | `.env.local` (`GOOGLE_SHEET_ID`) | صلاحية Editor لحساب الخدمة فقط |
| 4 | Turnstile (Cloudflare) | dashboard.cloudflare.com → Turnstile | `.env.local` (`TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) | Site Key عامة / Secret سرّية |
| 5 | Upstash Redis | console.upstash.com → Database | `.env.local` (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) | لـ rate limiting |
| 6 | Sanity Token (API, قراءة فقط) | manage.sanity.io → API → Tokens | `.env.local` غير موجود (مستخدم مؤقتًا) | **حُذف؟** — يُحذف من اللوحة بعد النشر |
| 7 | Sanity Webhook Secret | مولّد محليًا | `.env.local` (`SANITY_WEBHOOK_SECRET`) | يُسجل في إعداد Webhook بلوحة Sanity |
| 8 | Google Analytics (GA4) | analytics.google.com → Measurement ID | `.env.local` (`NEXT_PUBLIC_GA_ID`) | عام (NEXT_PUBLIC) |
| 9 | Google OAuth (تسجيل دخول العميل للمشروع) | console.cloud.google.com → OAuth Client | خارج المستودع | صلاحيات 2SV على هاتف العميل |
| 10 | Hostinger hPanel | account.hostinger.com | كلمات مرور العميل | لا تُشارك عبر قنوات غير آمنة |

## قواعد صارمة

1. لا يُرفع أي ملف اسمه `CREDENTIALS.md` أو `.env.local` أو أي `*.pem` — مؤكد في `.gitignore` (تحقق بـ `git check-ignore CREDENTIALS.md`).
2. أي قيمة `NEXT_PUBLIC_` ليست سرًا (ظاهرة في المتصفح) — لا تضع فيها أبدًا شيئًا حقيقيًا.
3. عند إضافة مفتاح جديد: حدّث هذا القالب **بلا قيمة** + أضفه إلى `.env.local.example`.