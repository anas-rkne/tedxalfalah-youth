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

## [v1.0.0-release] — 2026-08-13 · المراجعة النهائية قبل النشر

إغلاق بنود التدقيق الشامل المتفق عليها (آخر تعليمات الفريق قبل النشر).

### Added
- **إغلاق التقديم من الخادم**: حارس `APPLICATION_DEADLINE` في `POST /api/apply` (`apply/route.ts` — بعد rate limit وقبل التحقق) → **403** بعد الموعد. قراءة الموعد من البيئة أولًا (`constants.ts:1-2`) — واختبار إغلاق تجريبي موثق في `docs/11` §1.1.
- **حقل ترتيب المتحدثين** `order` في `studio/schemaTypes/speaker.ts` (ترتيب داخل الموجة) + فرز GROQ `order(wave asc, order asc, name asc)` في `data.ts:31` + `order?` في `Speaker` (`types.ts`).
- `sponsor` و`galleryImage` إلى `TYPE_PATH_MAP` (`revalidate/route.ts`) — الحذف/النشر للرعاة ومعرض المكان يعيد بناء الهوم وصفحة venue.
- `CREDENTIALS.template.md` (نموذج سجل المفاتيح بلا قيم) + نمط `CREDENTIALS*` في `.gitignore` (مع `!CREDENTIALS.template.md`) — وإصلاح ذيل `.gitignore` المكسور ترميزًا.
- مفاتيح بيئة جديدة: `BASE_URL`/`ALLOWED_API_ORIGINS`/`NEXT_PUBLIC_PLATINUMLIST_URL`/`NEXT_PUBLIC_APPLICATION_DEADLINE` إلى `.env.local` + مثالها في `.env.local.example` (+ `APPLICATION_DEADLINE` اختياريًا).

### Changed
- **ترقية `next` إلى `16.3.0`** + `eslint-config-next 16.3.0` + `engines.node >=20.9` + **إزالة `resend`** نهائيًا (`package.json`).
- **`output: "standalone"`** مفعّل في `next.config.ts` (النشر عبر `node .next/standalone/server.js` — `docs/08` §2.3).
- **Google Sheets → 20 عمودًا**: `parentalConsent`/`consentToTerms` يُسجلان (موثق في `docs/05` §7.1) + `setHeaderRow` إلزامي.
- **JSON المكسور → 400** بدل 500 في `/api/apply` و`/api/contact` و`/api/partner-inquiry`.
- حد العمر في الخادم مغلق `min(10).max(99)` (`apply/route.ts`).
- وثائق: `docs/01` (resend محذوف) · `docs/03` (APPLICATION_DEADLINE قابل للتكوين) · `docs/05` (20 عمودًا) · `docs/08` (standalone مفعل + Node 16.3.0) · `docs/11` (اختبارات جديدة: JSON 400، إغلاق 403، age 5) · `README` (شارة 16.3.0).

### Security
- **`npm audit` → 0 ثغرات (مؤكد 13-08-2026)**: ترقية `next` إلى `16.3.0` حسمت تنبيهات next/sharp، و`npm audit fix` رفع `undici` → 7.29.0 واصلح tبعياته (hono/brace-expansion/fast-uri/ip-address/js-yaml). الشهادة الكاملة في `docs/06` §5.2.
- إشعار Apply الإداري يتضمن سطري `parentalConsent`/`consentToTerms` — تتبع الموافقات القانونية.

---

## [v1.0.0-cms] — 2026-08-13 · جلسة Sanity مع العميل

دخول بحساب المالك (`tedxalfalahyouth@gmail.com` عبر Google 2SV) وتفعيل إدارة المحتوى أول مرة على منصات Sanity الحية.

### Added
- **نشر Studio**: `https://tedxalfalahyouth.sanity.studio` (الأنواع السبعة — شملت `order` في speaker و`showSpeakers`/`showSponsors`).
- **Webhook "TEDxAlFalah Production"** (ID `IHLe79lih3XyTr82`): أحداث create/update/delete + فلتر الأنواع السبعة → `https://tedxalfalahyouth.com/api/revalidate?secret=…` — أنشئ برمجيًا عبر `sanity exec --with-user-token` (لأن `sanity hook create` بهذا الإصدار يفتح اللوحة فقط).
- **بذر المحتوى الأول**: `eventInfo-main` (Weaving Tomorrow · `date 2026-12-19` · venue "نبض الفلاح — درب الفلاح، الفلاح، أبو ظبي، الإمارات" · `showSpeakers`/`showSponsors` ON) + `speaker-demo-ahmed`/`speaker-demo-sara` (wave 1، order 0/1، منشوران دون صور — placeholder آمن).

### Changed
- `NEXT_PUBLIC_VENUE_MAP_URL` في `.env.local` ← `https://maps.app.goo.gl/3CngUphEsitFhBGo7?g_st=ic` (رابط المكان الرسمي — NO_BOM مؤكد).
- **الخرائط ثنائية اللغة**: popup خريطة الرئيسية (LeafletMap) يقرأ `home.about.venuePopupLabel` الجديد (EN "Nabd AlFalah — Abu Dhabi" / AR "نبض الفلاح — أبوظبي") بـ `dir="auto"` بدل النص العربي الثابت · خريطة صفحة Venue (iframe) تُبنى حسب اللغة (`hl=en`/`hl=ar` + استعلام المكان بلغتها) جاهزة لأول إظهار للصفحة.

### Security
- حذف التوكن المؤقت `Studio Deploy` (`siPsRhDxip7CUo`) — **المشروع الآن بلا API tokens** (الاستوديو عبر جلسة CLI للمالك؛ الويب يقرأ قراءة عامة).

### Fixed (ملاحظات تشغيلية)
- `sanity documents query` بهذا الإصدار يعيد `[]` (خلل في تحليل الوسائط) — التحقق عبر curl/`sanity exec` (موثق في `docs/12` §6).
- **خطأ "Map container is already initialized"** في Dev (سباق StrictMode): تحريك حارس `mapInstanceRef` بعد `await import("leaflet")` + `remove()` لأي خريطة سابقة في `LeafletMap.tsx` (لم يعد الخطأ يظهر — تحقق إنتاجي على standalone).
- **توحيد مصادر التاريخ**: العداد ونص تاريخ الهيرو يقرآن `eventInfo.date` من Sanity (`Hero` يستقبل `eventDate` ← `countdownTarget=${date}T09:00:00+04:00`، والنص عبر `toLocaleDateString` ar-AE/en-US) مع بقاء ثوابت `messages` و`EVENT_DATE` كـ fallback فقط.
- **تحذير «Ignored message from wrong origin» من Turnstile في Dev**: تحذير تشخيصي غير ضار من سكربت Cloudflare (يستمع لرسائل `window` فتصلبه رسائل الـ dev المحلية فيطبعها ويتجاهلها — لا أثر على التحقق ولا يظهر في الإنتاج) — تحصين إضافي في `TurnstileWidget.tsx`: `?render=explicit` + `turnstile.remove(widgetId)` عند unmount لقتل iframe متبقٍ أثناء تنقلات SPA.
- **خريطة إنجليزية دائمًا (قرار العميل 2026-08-13)**: كانت بلاطات CARTO تعرض أسماءً عربية حتى بالإنجليزية (تجريبيًا: `?lang=` متجاهل تمامًا — بايتات متطابقة). الآن بلا تفرع لغوي: `LeafletMap.tsx` = قاعدة **Esri World_Imagery** (قمر صناعي واقعي، مجاني بلا مفتاح) + تسميات **Esri World_Transportation** (إنجليزية) للغتين · صفحة Venue: iframe غوغل واحد `hl=en` (أُلغي فرع `isArabic`) · CSP `img-src`: أُضيف `https://server.arcgisonline.com` وأُزيل `https://*.basemaps.cartocdn.com` (غير مستخدم) · العلامة النابضة والبوب أب (ثنائي اللغة — نص موقع) بلا تغيير.
- **إخفاء قسم السبونسر**: السبب — بذر `eventInfo-main` اليوم بـ `showSponsors: true` مع صفر رعاة فأظهر «حالة فارغة» (40vh). الحل: `showSponsors: false` في Sanity (patch مباشر عبر `@sanity/client` بتوكن جلسة CLI) + تحصين `SponsorsStripContent.tsx` — لا يُعرض القسم أصلًا عند غياب رعاة (`return null`؛ أُزيلت أيقونة Handshake وprop `emptyLabel`).

---

## [v1.0.0-cleanup] — 2026-08-13 · تنظيف البيانات التجريبية وتحكّم العميل (قرارات جلسة العميل)

تنفيذ قرارات العميل (2026-08-13): صفحات المتحدثين والفريق **تفتح دائمًا** بحالة «قريبًا» (بلا 404)، والأعلام الثلاثة تتحكم **بقسم الرئيسية فقط**.

### Added
- **قسم «فريق المنظمة» بالرئيسية**: حقل `showTeam` في `eventInfo` (`studio/schemaTypes/eventInfo.ts`) + مكوّن `TeamPreview` (`src/components/home/TeamPreview.tsx` — 8 أعضاء كحد أقصى + زر "Meet the Team") + ترجمة `home.teamPreview` (en/ar) + النوع وGROQ (`src/lib/types.ts` / `data.ts`) — **نشر Studio محدّث**.
- **طبقة تعتيم داكنة** فوق الخريطتين لرفع تباين القراءة: `LeafletMap.tsx` (div `z-[450] bg-slate-900/20 pointer-events-none` — تحت العلامة والبوب أب، فوق البلاطات) + `VenueMapSection.tsx`.

### Changed
- **إلغاء نشر المتحدثين التجريبيين** `speaker-demo-ahmed`/`speaker-demo-sara` (`isPublished: false` — بلا حذف؛ البيانات باقية في Sanity) → عدّاد المتحدثين المنشورين = 0 والموقع نظيف.
- **دلالة الأعلام الثلاثة محدّدة**: `showSpeakers`/`showSponsors`/`showTeam` تتحكم **بقسم الرئيسية فقط**؛ صفحات `/speakers` و`/team` مفتوحة دائمًا وتعرض حالة الفراغ المصممة (أُزيلت بوابة `notFound()` من الصفحتين نهائيًا — قرار العميل الصريح). أوصاف الحقول في الـ schema نُقّحت («Homepage section»).
- `showSpeakers: false` في `eventInfo-main` (patch مباشر عبر `@sanity/client` بتوكن جلسة CLI — بلا سكربت مؤقت متبقٍ) → قسم المتحدثين بالرئيسية مخفي حتى يفعّله العميل.
- تحديث الوثائق: `docs/01` · `docs/02` §6.5 · `docs/04` §2.7/§4.1/§8 · `docs/07` · `docs/09` §2 · `docs/12` §4.2/§6.

### Fixed (نتائج الفحص الشامل قبل النشر — `docs/11` §1.8)
- **56/56 فحصًا فعليًا ناجحًا** على خادم standalone (منفذ 3001): كل المسارات 200 (en/ar) + الروبوتات/Sitemap/الترويسات (CSP/X-Frame/HSTS) + واجهات API + حالات الفراغ.
- **Turnstile**: النموذج يُبنى client-side (الحزمة `0ybt9bfy7l393.js` تحوي `render=explicit` + site key؛ `0_3tc6k_y0mrj.js` تحوي حقول النموذج) — غيابه من SSR متوقع وليس خللًا.
- **`/api/contact`**: مؤكد `{"success":true}` بجسم صالح (`subject` من القائمة المسموحة + `message` ≥10 — رسالة "Invalid form data" الدقيقة تُثبت عمل zod) · **`/en/apply`**: مفتوح (الموعد الافتراضي 2026-09-30T23:59:59+04:00 — أمامه 6 أسابيع).

---

## [v1.0.0-e2e] — 2026-08-13 · اختبار المتصفح الآلي الشامل (Playwright)

إغلاق فجوة «الفحص من المتصفح» التي لم تُغطَّ بالفحص الخادمي — بناءً على طلب العميل المباشر.

### Added
- **مجموعة Playwright كاملة** (`@playwright/test` + `playwright.config.ts` + `e2e/*.spec.ts` — **25 اختبارًا** على مشروعين desktop/mobile عبر `channel: "msedge"` (يستخدم Edge المثبت — بلا تنزيل متصفحات، لأن CDN غير مستقر في بيئة التشغيل): تنقل وعدّاد يعدّ + RTL ومبدّل اللغة، حالات فراغ كل الصفحات، فلترة الجدول، أكورديون FAQ، **فورمات من طرف لطرف** (Contact وApply → صفحتا الشكر)، خرائط (Leaflet علامة/بوب أب + تعتيم + iframe venue `hl=en`)، PWA (تسجيل + تحكم + **عمل بعد قطع الشبكة**)، وقائمة الجوال.
- **نتيجة: 25/25 ناجحة مرتين متتاليتين (2026-08-13)** — التوثيق والتفاصيل في `docs/11` §1.9.

### Fixed
- **اكتشاف واصلاح 403 "Forbidden: origin not allowed" في المتصفح**: `ALLOWED_API_ORIGINS` الافتراضية في `src/lib/cors.ts` أُضيف إليها `http://localhost:3001` (منفذ خادم الاختبار) — وأُكد أن origin دخيل (`evil.example.com`) يبقى 403.
- **إصلاح وصول (a11y) حقيقي**: نص العداد لقارئ الشاشة (`flip-clock.tsx` sr-only) كان غير مبطن بالأصفار ("13:4:53") → الآن "13:04:53".
- `.gitignore`: أنماط `test-results/` و`playwright-report/` و`blob-report/` و`playwright/.cache/`.
- وثائق: `docs/03` (ALLOWED_API_ORIGINS + 3001) · `docs/06` (القائمة الثابتة المحدّثة) · `docs/11` §1.9 (نتائج المتصفح الكاملة).

### ملاحظات فحصية (سلوك متوقع، لا أخطاء)
- Turnstile محليًا: خطأ `110200` (لا اتصال بـ challenges.cloudflare.com في بيئة الاختبار — fail-open بلا سر؛ في الإنتاج يُتحقق فعلًا).
- Sanity لحظيًا: هشاشة نشر → JSON-LD يعود لـ fallback ("Abu Dhabi, United Arab Emirates") — Fail-Open مصمم.
- قائمة الجوال تعرض 4 عناصر فقط (Home/Team/Apply/Tickets) — تصميم مقصود.
- GA4 يُطلق على standalone محليًا لأن `NODE_ENV=production` — كما صُمم.

---

| بعد | التحديث المتوقع |
| :--- | :--- |
| تعبئة مفاتيح Google/Turnstile/Upstash/Sanity | قفل Fail-Open → تشغيل الحماية الكاملة (جلسة العميل — `docs/03`) |
| النشر على Hostinger Node.js | تشغيل `node .next/standalone/server.js` + توثيق فعلي (standalone مفعّل الآن — `docs/08` §2.3) |
| إطلاق صفحات الشروط/الخصوصية | إضافة `/terms` و`/privacy` (إلزامي) |