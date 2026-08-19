# 06 — الأمن والخصوصية (Security & Privacy)

**الملف**: `docs/06-security.md`
**الجمهور المستهدف**: العميل (أقسام 4.4 و6 بلغة بسيطة) + فريق التطوير (بقية الأقسام تقنيًا دقيقًا).
**المصدر**: الكود الفعلي — الرؤوس والقيم منسوخة حرفيًا من `next.config.ts`، وأرقام `npm audit` من تشغيل حقيقي بتاريخ 2026-08-11.

---

## 1. طبقات حماية الفورمات (Defense in Depth)

أي طلب `POST` إلى `/api/apply` أو `/api/contact` أو `/api/partner-inquiry` يمر بست طبقات بالترتيب التالي (الهرم):

```
                        ┌─────────────────────────────┐
                        │  6. Text Limits (حجم النص)   │  ← حدود كلمات في سكيما الفورم
                        └──────────────┬──────────────┘
                        ┌──────────────▼──────────────┐
                        │  5. Sanitization (تعقيم)     │  ← escapeHtml قبل الإيميل
                        └──────────────┬──────────────┘
                        ┌──────────────▼──────────────┐
                        │  4. Zod Validation (مخطط)    │  ← 400
                        └──────────────┬──────────────┘
                        ┌──────────────▼──────────────┐
                        │  3. Turnstile (مضاد بوتات)   │  ← 403
                        └──────────────┬──────────────┘
                        ┌──────────────▼──────────────┐
                        │  2. Rate Limit (حد الطلبات)  │  ← 429
                        └──────────────┬──────────────┘
                        ┌──────────────▼──────────────┐
                        │  1. CORS (الأصل المسموح)     │  ← 403
                        └─────────────────────────────┘
                                   ▲
                              الطلب الوارد
```

| الطبقة | الملف والدالة | ماذا تفعل | عند الرفض |
|---|---|---|---|
| **1. CORS** | `src/lib/cors.ts` — `validateOrigin(request)` (سطر 13) | يقارن `Origin` الوارد بقائمة `ALLOWED_API_ORIGINS` (أو القائمة الثابتة: `www.tedxalfalahyouth.com`, `tedxalfalahyouth.com`, `localhost:3000`, `localhost:3001` — أسطر 3–8). طلبات بلا Origin تمر (أغلب أدوات الاختبار) | **403** `Forbidden: origin not allowed` (سطر 22) |
| **2. Rate Limit** | `src/lib/rate-limit.ts` — `checkRateLimit(request, formKey)` (سطر 32) | نافذة منزلقة عبر Upstash: **5 طلبات لكل 10 دقائق لكل `formKey:IP`** (سطر 20) — مفتاح منفصل لكل فورم. يستخرج IP من `x-forwarded-for` ثم `x-real-ip` (أسطر 43–46). القيمتان `5` و`"10 m"` قابلتان للتعديل بسطر واحد | **429** `Too many requests. Please try again later.` |
| **3. Turnstile** | `src/lib/turnstile.ts` — دالة `verifyTurnstile(token)` | يرسل الرمز لـ `challenges.cloudflare.com/turnstile/v0/siteverify` ويتحقق أن `data.success === true`. بدون مفتاح (`TURNSTILE_SECRET_KEY`): **Fail-Open في وضع التطوير فقط** (تحذير + تمرير)؛ أما في **الإنتاج فهو Fail-Closed** — يُرفض الطلب (يرجع `false` → 403) | **403** `Verification failed. Please try again.` |
| **4. Zod** | مخططات الـ routes — `applicationSchema` (`apply/route.ts:14`)، `contactSchema` (`contact/route.ts:9`)، `partnerSchema` (`partner-inquiry/route.ts:9`) | تحقق صارم من الشكل: إيميل صالح، أطوال، قيم enum، منطق `superRefine` الشرطي، حدود الكلمات | **400** + تفاصيل `z.error.flatten()` |
| **5. Sanitization** | `src/lib/sanitize.ts` — `escapeHtml()` (سطر 9) + `sanitizePrivateKey()` (سطر 26) | يهرب `& < > " '` في كل نص مستخدم قبل إدراجه في قالب إيميل HTML (يمنع XSS عبر الحقول النصية). الثاني يصلح مفتاح Google (`\n` + 7-bit) قبل استخدامه في JWT | — (وقائي، لا يرفض) |
| **6. Text Limits** | `ApplicationForm.tsx:29-31` + `route.ts:9-11` — `wordCount()` | `ideaSummary ≤ 300 كلمة` و`whyItMatters ≤ 150 كلمة` — يمنع إدخال نصوص ضخمة (DoS خفيف، تضخم إيميل/Sheet) | عدّاد حي + رفض `safeParse` عند الخادم |

> **لماذا كل هذا؟** الموقع يجمع بيانات قُصَّر عبر Apply — وأي طبقة واحدة قابلة للتجاوز (سكيما العميل قابلة للتعديل من أدوات المطور)، فالست طبقات متتالية تجعل تجاوز النظام عمليًا مستحيلًا دون مفاتيح الخادم.

---

## 2. رؤوس الأمان (Security Headers) — من `next.config.ts:8-35` حرفيًا

تُطبَّق على **كل مسار** (`source: "/:path*"` — سطر 50).

| الـ Header | القيمة في الكود | الغرض |
| :--- | :--- | :--- |
| `X-Frame-Options` | `DENY` | منع عرض الموقع داخل أي `iframe` — حماية من Clickjacking |
| `X-Content-Type-Options` | `nosniff` | منع المتصفح من تخمين نوع الملفات — حماية من MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | إرسال الـ Referrer كاملًا فقط لنفس الأصل؛ لخارجي = الأصل فقط |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | تعطيل الكاميرا والميكروفون والموقع الجغرافي — أقل صلاحيات ممكنة |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | فرض HTTPS سنتين + شمول النطاقات الفرعية + الأهلية لقائمة preload (يُفعَّل كليًا بعد تأكيد الدومين في hsts-preload.appspot.com) |
| `Content-Security-Policy` | (القيمة الكاملة أدناه) | سياسة المصادر المسموحة — تفصيلها في القسم 3 |

القيمة الكاملة الحرفية (مع `isDev = NODE_ENV === "development"`):
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://cdnjs.cloudflare.com https://server.arcgisonline.com; frame-src https://challenges.cloudflare.com https://www.google.com/maps; connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://www.googletagmanager.com https://*.api.sanity.io https://*.sanity.io
```
> في بيئة التطوير يُضاف `'unsafe-eval'` لـ `script-src` فقط (سطر 26) — ضروري لـ Turbopack/HMR، ولا يُحمَل للإنتاج.

---

## 3. تحليل CSP تصريحًا بتصريح

| التصريح (Directive) | المصادر المسموحة (من الكود) | لماذا |
| :--- | :--- | :--- |
| `default-src` | `'self'` | الأساس: كل ما لم يُذكر صراحةً يُحمَّل من النطاق نفسه فقط — تقييد افتراضي صارم |
| `script-src` | `'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com` (+`'unsafe-eval'` في التطوير) | السكربتات: المحلية + Cloudflare (ودجت Turnstile — `TurnstileWidget.tsx` يحمّل `challenges.cloudflare.com/turnstile/v0/api.js`) + Google Tag Manager (التحليلات — `Analytics.tsx`). `unsafe-inline` مطلوب للمكوّنات الديناميكية |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | الأنماط المحلية + CSS خطوط Google (بقايا من مرحلة الخطوط القديمة — الخطوط الآن محلية، والإذن باقٍ بلا ضرر) |
| `font-src` | `'self' https://fonts.gstatic.com` | الخطوط (الإذن باقٍ أيضًا — الخطوط الفعلية `src/app/[locale]/fonts/` محلية) |
| `img-src` | `'self' data: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://cdnjs.cloudflare.com https://server.arcgisonline.com` | الصور: Sanity CDN (كل محتوى الموقع) + **Esri (قمر صناعي + تسميات إنجليزية — خريطة "About the Event")** + Google Analytics (بكسلات التتبع) |
| `frame-src` | `https://challenges.cloudflare.com https://www.google.com/maps` | الأطر: ودجت Turnstile + خريطة Google المضمّنة (`NEXT_PUBLIC_VENUE_MAP_URL`) — **لا شيء آخر يُسمح بدمجه** |
| `connect-src` | `'self' https://challenges.cloudflare.com https://www.google-analytics.com https://www.googletagmanager.com https://*.api.sanity.io https://*.sanity.io` | الطلبات: Turnstile (siteverify) + GA + GTM + **Sanity CDN API** — نطاق عام `*.api.sanity.io` (يعمل لكل المشاريع وبالتالي لا يتغير عند تبديل المشروع) |

> **مصادر مشروعة عمدًا خارج CSP:** جلب الصور يتم عبر `next/image` المقيّد بـ `remotePatterns` إلى `cdn.sanity.io` فقط (`next.config.ts:39-41`) — لا يمكن للموقع عرض أي صورة من أي CDN آخر حتى لو حقنها أحد في المحتوى.

---

## 4. التعامل الخاص ببيانات القُصَّر (Data Privacy — Minors)

### 4.1 ماذا يُجمع؟
فورم Apply يجمع **بيانات شخصية لأطفال 10–14 سنة**: الاسم، العمر، المدرسة، فكرة المحاضرة + **بيانات أولياء الأمور**: الاسم ورقم الهاتف + إقرار موافقة (الحقول في `apply/route.ts:26-31` وحارس `superRefine` أسطر 36-49).

### 4.2 الحماية المطبقة (من الكود)
- **التعقيم**: كل هذه البيانات تمر عبر `escapeHtml` قبل بناء الإشعار الإداري (دالة `sendAdminNotification` في `apply/route.ts`) — حتى لو كتب طفل `<script>...</script>` في أي حقل، يصل كنص معروض بلا تنفيذ (منع XSS في الإيميلات).
- **لا تسجيل**: حتى في بيئة التطوير يُسجَّل فقط `[DEV] Application received for track "..."` (فرع غياب إعدادات الـ Sheet داخل `POST`) — والتعليق في الكود أعلى `saveToGoogleSheet`: *"لا نسجّل بيانات الطلب الكاملة بالسجل (حتى محلياً) لأنها تحتوي بيانات شخصية حساسة لقُصَّر"*.
- **لا تدفق للعموم**: لا يوجد أي تخزين/عرض عام لهذه البيانات — وجهتها الوحيدة: إيميلا `apply@` و`marhaba@` (داخليان) + Google Sheet (اختياري).

> **تحذير أمني هام:** يجب أن يكون Google Sheet مقيّد الوصول (**Restricted**) وليس عامًا (ممنوع "Anyone with the link")، والوصول مقتصرًا على **أعضاء فريق المراجعة فقط** (بالبريد الإلكتروني، بحق Editor لـ `GOOGLE_SERVICE_ACCOUNT_EMAIL` وViewer للفريق). هذا التحذير مكتوب داخل الكود نفسه (`apply/route.ts:68-71`): *"لأنه يحتوي بيانات أطفال 10-14 سنة وبيانات أولياء أمورهم"*.

### 4.3 سياسة الاحتفاظ (توصية — غير مشفرة في الكود)
لا توجد سياسة احتفاظ مؤتمتة في الكود حاليًا. **موصى به**: حذف بيانات الطلبات (Sheet + الإيميلات) بعد انتهاء الحدث (ديسمبر 2026) أو إعادة توظيفها الحرج خلال فترة زمنية محددة، وتوثيق ذلك بصفحة سياسة خصوصية تُعرض للمتقدمين مع إقرار الموافقة الحالي.

---

## 5. حماية الإصدارات والتبعيات (Version Control & Dependencies)

### 5.1 `.gitignore` (جذر المشروع — قراءة فعلية)

| المستثنى | السبب |
|---|---|
| `.env*` **(مع استثناءين: `!.env.local.example` و`!.env.example`)** | الأسرار الحقيقية لا تصل لـ Git أبدًا؛ القوالب (بدون أسرار) تُرفع كدليل تعبئة |
| `/node_modules`, `.pnp.*`, `.yarn/*` | عدم رفع الحزم الثقيلة |
| `/.next/`, `/out/`, `/build`, `/coverage` | مخرجات بناء/اختبار |
| `.DS_Store` | ملفات نظام macOS |
| `*.pem` | ملفات مفاتيح خاصة |
| `npm-debug.log*`, `yarn-debug.log*`, `.pnpm-debug.log*` | سجلات أخطاء قد تحتوي مسارات/أسماء |
| `*.tsbuildinfo`, `next-env.d.ts` | مخرجات TypeScript |
| `.vercel` | بيانات توطين قديمة من مرحلة Vercel |
| **`package-lock.json`** ⚠️ | **مستثنى حاليًا — قرار تاريخي من مرحلة Railway قد يضر الإنتاج: غياب الـ lockfile عن الـ repo يفقد "قفل" إصدارات الحزم الدقيقة ويجعل كل تثبيت عرضة لنطاق `^`. يُنصح بإلغاء هذا الاستثناء قبل النشر النهائي (المشروع يحوي package-lock.json محليًا بالفعل).** |

> **تحذير أمني هام:** قبل أي `git push` افحص `git status --porcelain` — إذا ظهر `.env.local` في القائمة فتوقف فورًا (الاستثناء الحالي يمنع هذا، لكنه الفحص الختامي).

### 5.2 فحص التبعيات — `npm audit` (نتيجة حقيقية 2026-08-13)

**النتيجة: 0 ثغرات** ✅ — تم الإغلاق الكامل في 13-08-2026:

| الخطوة | ما نُفّذ |
|---|---|
| ترقية `next` | **16.2.10 → 16.3.0** (متعمدة — أصلحت تنبيهات next الـ 9: Middleware bypass، SSRF، Cache confusion، DoS Image Optimization...) + `eslint-config-next 16.3.0` |
| `npm audit fix` | رفع `undici` → 7.29.0 (خارج 7.0.0–7.28.0)، وتصحيح `hono`/`@hono/node-server`/`brace-expansion`/`fast-uri`/`ip-address`/`js-yaml` — كلها تبعيات عابرة |
| تبعيات `sharp` | وصلت 0.35.3 تلقائيًا مع next 16.3.0 (خارج < 0.35.0) |
| تحقق | `npm audit` → **found 0 vulnerabilities** (748 package) · `npm run build` سليم · `npm run lint` 0 أخطاء · `tsc --noEmit` سليم |

> **قاعدة للمستقبل**: لا تشغّل `npm audit fix --force` أبدًا؛ الترقيات الواعية مع `build` + `lint` + اختبار الفورمات (`docs/11`) كافية.

---

## 6. إرشادات العميل (Client Security Guidelines — بلغة مباشرة)

> اتبع هذه الخطوات فور استلام المفاتيح/الحسابات — وهي تفصّل "ماذا تفعل بنفسك" حتى يكتمل أمن المنظومة:

1. **غيّر كلمات المرور عند الاستلام فورًا:**
   - كلمة مرور صندوق البريد `SMTP_PASS` (ادخل `webmail.tedxalfalahyouth.com` ببياناتك ثم غيّرها، وأعطِ الفريق القيمة الجديدة لتحديث `.env.local`).
   - كلمة مرور حساب Sanity.io.
   - كلمة مرور hPanel.
   — كلها إلى كلمات مرور **قوية وفريدة** (مدير كلمات مرور يوصى به).
2. **فعّل المصادقة الثنائية (2FA)** على الأقل على: **حساب Sanity** (يتحكم بكل محتوى الموقع) + **حساب Google Cloud** (يملك مفاتيح Service Account). على البريد الإلكتروني إن توفرت.
3. **أضف سجلات SPF + DKIM** للبريد (في hPanel) — يرفع وثوقية الرسائل ويقلل وصولها للـ Spam.
4. **قيّد مشاركة Google Sheet** بأعضاء فريق المراجعة فقط (Restricted + مشاركة بالبريد)، ولا تنسَ مشاركته مع بريد الـ Service Account بحق Editor.
5. **لا تشارك أبدًا** مفتاح `GOOGLE_PRIVATE_KEY` أو `TURNSTILE_SECRET_KEY` أو `SMTP_PASS` في رسائل دردشة أو إيميلات عامة — شاركها فقط عبر قناة آمنة (إدارة كلمات المرور / لقاء مباشر)، وإذا سُربت يومًا، فاستبدلها فورًا.
6. **قبل الإطلاق العام**: تأكد خلو سجل الخادم من تحذيرات `[MAILER]` و`[TURNSTILE]` و`[RATE LIMIT] not configured` (انظر `docs/10-troubleshooting.md` §5) — فهي إشارة أن حماية ما ما زالت معطلة.