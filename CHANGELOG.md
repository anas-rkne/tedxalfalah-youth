# Changelog — TEDxAlFalah Youth Website

سجل التغييرات الرسمي للموقع. المرقّم حسب الإصدارات التطويرية حتى الاستعداد للإطلاق.
معيار التواريخ: `YYYY-MM-DD` · شرح مبني على الكود الفعلي (`src/`، `studio/`، `docs/`) — التفاصيل التشغيلية الحيّة في `docs/01`–`docs/12`.

---

## [v1.0.0-alpha] — 2026-06-15 · الهيكل الأولي

الانسحاب من القالب غير التفاعلي إلى تطبيق Next.js App Router حديث.

### Added
- تهيئة مشروع **Next.js 16.2.10 (App Router)** مع **Turbopack** و**React 19** و**TypeScript** — (`package.json`، `next.config.ts`).
- تفعيل **Tailwind CSS v4** (`globals.css`، `@tailwindcss/postcss`) ومكتبات UI (`class-variance-authority`، `tailwind-merge`، `lucide-react`).
- طبقة الهيكل العام: `layout.tsx` باللغتين، `Header` مع `MobileMenu` و`NavLink` على `header/`، `FooterContent`، صفحات `not-found` و`error` و`loading` لكل المسارات.
- نظام **next-intl v4**: **i18n routing** (`src/i18n/`) بدعم EN/AR، `LanguageSwitcher`، وهوك **`useRTL`** لانعكاس الاتجاه عربيًا.
- صفحة رئيسية غنية: `Hero` مع `HeroTypewriterTitle` و`Countdown`، `About`، `Highlights`، `SpeakersPreview`، `SponsorsStrip`، `ApplyBanner`، `ScheduleBanner` — بأقسام قابلة للتبديل بين ثابتة وديناميكية (`HeroDynamicContent`، `AboutContent`، `SponsorsStripContent`...).
- تأثيرات وأنيميشن: `framer-motion` + مكونات `ui/` (FlipClock، `globe` ثلاثي الأبعاد عبر `three`/`three-globe`/`react-three-fiber`، `UaeMap`، `LeafletMap`، `TrackingEyes`، `smooth-cursor`، ScrollReveal).
- صفحات `venue`، `tickets` (+ `success`/`cancel` للإرجاع من منصة التذاكر)، `faq`، `schedule` (بفلترة `FilterBar`)، `apply`، `speakers`، `team`، `activations`، `thank-you` — كل منها مع `loading.tsx` و `SchedulePageClient`.

### Changed
- الخطوط المحلية بدل Google Fonts: **`localFont` لـ Inter وNoto Kufi Arabic** (`src/app/[locale]/fonts/`، تحميل ذاتي بلا طلبات خارجية) — وفّرت الأداء ووفرت مشكلة إخفاق الخطوط عالميًا.
- `robots.ts` و`sitemap.ts` ثابتا المسارات (22 URL مع hreflang) — وُثّق نقص `/speakers` لاحقًا في `docs/07`.

---

## [v1.0.0-beta] — 2026-07-10 · تكامل Sanity CMS

ربط إدارة المحتوى بالكامل — الموقع يقرأ الحقيقة من Sanity مع بيانات احتياطية.

### Added
- حزمة **Sanity**: `@sanity/client` + `@sanity/image-url`، عميل `src/lib/sanity.ts` مع مخططات أنواع كاملة في `studio/schemaTypes/` (speaker · teamMember · activation · sponsor · galleryImage · session · eventInfo).
- **لوحة Studio** (`studio/`): `sanity.config.ts` + `sanity.cli.ts` (projectId `hisn3dku`، dataset `production`، مضيف `tedxalfalahyouth`).
- طبقة **بيانات احتياطية** `src/lib/data.ts` + `src/lib/types.ts`: كل الأنواع مرصوفة لكي يعمل الموقع بلا Sanity (وضع Fail-Open الموثق في `docs/06`).
- صفحات ديناميكية: `speakers` (بطاقات + `SpeakerModal`)، `team` (`TeamMemberCard`)، `schedule`، `activations`، `venue` (خريطة + معرض الصور) — تستهلك Sanity مع احتياطي.
- `eventInfo` بمفاتيح تشغيل: `showSpeakers`/`showSponsors` لإظهار/إخفاء المتحدثين والرعاة من اللوحة.
- مكونات SEO: `JsonLd` و`BreadcrumbJsonLd` و`Breadcrumb` + `Analytics` — وجدول بيانات JSON-LD (Event, Organization, FAQPage, BreadcrumbList, WebSite) في `src/lib/json-ld.ts`.

### Changed
- مكونات الرئيسية قُسّمت لنسخ `*Content` (ثابتة/ديناميكية) لتمكين التبديل من Sanity لاحقًا دون كسر النسخة.
- `SafeImage` (دعم Sanity image URL + اختلافات المجالين) كبديل آمن عن `<img>` المباشرة.

### Fixed
- سقوط النسخة الاحتياطية عند غياب Sanity — `fetchSanity` ترجع `null` بهدوء وتُستخدم `data.ts` (Fail-Open).

---

## [v1.0.0-rc] — 2026-07-25 · الفورمات ومحرك البريد

أنظمة التقديم والتواصل تعمل من طرف لطرف — формы + تحقق Zod + بريد حقيقي.

### Added
- الفورمات الأربعة بواجهات: `ApplicationForm` (مساران: `young-speaker` و`expert` عبر `react-hook-form` + مخططات **Zod** مع `superRefine` شرطي) · `ContactForm` (مواضيع: General/Speaking/Sponsorship/Media/Volunteering) · فورم Partner (API فقط — بلا واجهة بعد).
- APIs: `POST /api/apply` (إدراج Google Sheets + تأكيد + إشعار إداري) · `POST /api/contact` (توجيه حسب الموضوع) · `POST /api/partner-inquiry` — كلها بـ`sanitize.ts` لتعقيم المدخلات + `cors.ts` لأصل-مسموح.
- **محرك بريد SMTP حقيقي** `src/lib/mailer.ts`: استبدال Resend بـ **Nodemailer v9.0.5** عبر `smtp.hostinger.com:465` (SSL) — إيميل التأكيد النص الحرفي + الإشعار الإداري بكامل بيانات المتقدم + `replyTo` بريد المُرسِل في Contact.
- صفحات `apply`: `ApplyHero`، `ApplyTimeline`، `ApplyFAQ` + بطاقة **`APPLICATION_DEADLINE`** (`src/lib/constants.ts:1` — `2026-09-30T23:59:59+04:00`) تُغلق الفورم بعد الموعد (`apply/page.tsx:28`).
- `thank-you` صفحة ناجحة + `SonnerProvider` للإشعارات + `TurnstileWidget` (مضمن لاحقًا أمنيًا).

### Changed
- توجيه البريد حسب الموضوع — جدول الصناديق: General→`CONTACT_EMAIL` (marhaba@) · Sponsorship→`PARTNER_EMAIL` (partners@) · Media→`MEDIA_EMAIL` (media@) · Apply→`ADMIN_APPLICATIONS_EMAIL` (apply@) — مركزي في `.env` (`docs/03`: جدول الـ29 متغيرًا).

### Fixed
- **الأحرف الخاصة في مفاتيح Google**: `sanitizePrivateKey` (`src/lib/sanitize.ts:26`) تنظّف `\n` و`===` المشقوقة في `GOOGLE_PRIVATE_KEY` قبل تمريرها لـ `google-spreadsheet` — إصلاح فشل المصادقة الشهير لسيرفس أكاونت.
- تجاوز تجمّد النماذج عند فشل الإيميل: **Fail-Open** في `mailer.ts` (سجل `"[MAILER] SMTP not configured"` والطلب ينجح بما يعادل الرسالة).

---

## [v1.0.0-staging] — 2026-08-05 · طبقات الأمان والوقاية

حماية كل نقطة دخول + نشر تلقائي من الاستوديو.

### Added
- **Turnstile** (Cloudflare): `src/lib/turnstile.ts` تحقق من التوكن في كل API (Fail-Open عند عدم ضبط المفتاح) + `TurnstileWidget` في الواجهة (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
- **Rate Limiting** (Upstash Redis): `src/lib/rate-limit.ts` — 5 طلبات/10 دقائق لكل IP على كل الفورمات (قالب `@upstash/ratelimit`) وفشل صامت إن لم يُضبط.
- **Webhook إبطال الكاش**: `POST /api/revalidate` بخريطة `TYPE_PATH_MAP` (speaker/teamMember/activation/session/eventInfo→المسارات المعنية) — تحقق من السر (`SANITY_WEBHOOK_SECRET` عبر `secret` أو `x-sanity-webhook-secret`) + `validateOrigin` + Rate Limit → `revalidatePath` — المحتوى المنشور يظهر حيًا خلال دقيقة.
- **Google Sheets**: إدراج صف بكل البيانات الـ18 للحقول (ترتيب الأعمدة موثق في `docs/05`) + فشل غير قاتل.
- CORS صارم: `src/lib/cors.ts` — 403 لأي `Origin` خارج `ALLOWED_API_ORIGINS` (اختبار كامل في `docs/11` §1.6).

### Security
- **Security Headers + CSP** كامل في `next.config.ts` (رؤوس: CSP، `X-Frame-Options`، `Referrer-Policy`،...) — تفصيل تصريحًا بتصريح في `docs/06` §2.
- إخفاء الأسرار: `.env*` مستثنى بالكامل من Git (مع إبقاء `!.env.local.example`)، فحص Git بلا تسريب في `docs/11` §3.1.

---

## [v1.0.0-prod] — 2026-08-11 · الاستعداد النهائي للإطلاق

غلق الأخطاء المتبقية، تحقق فعلي من البريد، وتوثيق شامل.

### Added
- **توثيق 12 مرجعًا** (`docs/01`–`docs/12`): نظرة عامة، بنية، بيئة (جدول 29 متغيرًا)، إدارة محتوى، فورمات وبريد، أمان، SEO/تحليلات، نشر Hostinger، تشغيل، استكشاف، اختبارات/UAT، تسليم — آخرها `12-handover.md` هذه الليلة.
- `.env.local.example` معبّأ بالكامل (+ Templates وCOMMENTS حقلًا بحقل) و`README.md` محدّث.
- **تحقق فعلي من البريد**: 5 إرسالات حقيقية عبر SMTP Hostinger + تأكيد الصناديق الأربعة (marhaba/apply/partners/media) — `SMTP-VERIFY-OK`.
- قوائم تحقق نشر: 11 بندًا قبل/بعد النشر (`docs/08` §4 و`docs/11` §3) + دليل UAT صفحة-واحدة للعميل (`docs/12` §2).

### Changed
- إشعار Apply الإداري مكتمل البيانات (كل الحقول النصية + المسار + كيفية السماع) في `apply/route.ts` — بدل الإشعار المختصر السابق.
- انتهاء أدوار الوكالات: إعداد `NEXT_PUBLIC_GA_ID=G-N3JFXW8D7J` (تحميل Production-only مع `anonymize_ip` — بلا كوكيز).
- `public/sw.js` → v2: تجاوز الطلبات الخارجية في خريطة الخدمة (`docs/10` §1).

### Security
- **npm audit (2026-08-11)**: 12 ثغرة قائمة (3 متوسطة + 9 عالية؛ `next@16.2.10` ضمن النطاق) — توثيق في `docs/06` §5.2؛ الغلق في خطة ما بعد الإطلاق: `npm audit fix` ثم ترقية واعية إلى `next@16.3.0` (تُعد إصدار تصحيح وليست تغييرًا رئيسيًا).
- إرشادات سرية نهائية (CREDENTIALS.md + منع مشاركة المفاتيح) في `docs/12` §1.3/§5.

### Fixed
- إصلاح خريطة `sw.js` (تعليق طلبات خارجية) ومنع `Safari` من كسر الـ PWA وجوهريًا.
- إزالة صفحة `/privacy` و `/terms` من الادعاء — **مسجّلة كبند إلزامي قبل الإطلاق** (غير موجودة بعد؛ `docs/11` §3.2) بدل الادعاء بوجودها.
- تعديلات طفيفة للعين: عرض التاريخ من `messages/en.json:66` + `venue` من Sanity `eventInfo` (ازدواجية موثقة في `docs/09` §1.2).

---

## ملاحظة التسجيل القادم

| بعد | التحديث المتوقع |
| :--- | :--- |
| تعبئة مفاتيح Google/Turnstile/Upstash/Sanity | قفل Fail-Open → تشغيل الحماية الكاملة (جلسة العميل — `docs/03`) |
| النشر على Hostinger Node.js | إضافة `output: 'standalone'` (اختياري — `docs/08` §2.3) |
| ترقية التبعيات | `next@16.3.0` + غلق ثغرات npm audit |
| إطلاق صفحات الشروط/الخصوصية | إضافة `/terms` و`/privacy` (إلزامي) |