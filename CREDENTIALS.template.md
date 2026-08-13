# CREDENTIALS — سجل المفاتيح (قالب)

> **كيف تُستخدم**: انسخ هذا الملف إلى `CREDENTIALS.md` (`copy CREDENTIALS.template.md CREDENTIALS.md`) واملأ القيم محليًا.
> `CREDENTIALS.md` مرفوض في `.gitignore` — **لا يُرفع أبدًا**. هذا القالب (بلا قيم) هو المرفوع فقط.

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
