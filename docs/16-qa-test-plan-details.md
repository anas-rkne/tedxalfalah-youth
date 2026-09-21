# 16 — خطة اختبار تفصيلية شاملة لنظام الأسئلة والأجوبة الحية (Live Q&A)

**الملف**: `docs/16-qa-test-plan-details.md`
**النطاق**: تغطية «بالتفصيل الممل» لكل مكوّن وزر وحقل وشاشة وAPI وسيناريو ومسار في نظام جدار الأسئلة الحية (Q&A).
**المرجع التنفيذي**: `docs/14-live-qa-wall.md` (معمارية) و `docs/15-qa-test-plan.md` (نظرة عامة + سكربت `qa-smoke`).
**بيئة التنفيذ المحلية**: `node`/`npm` على Windows، خادم `next dev` على منفذ معزول، بيانات مخزنة في `QA_DATA_DIR` مؤقت.

> هذه الخطة تُكمّل `docs/15` ولا تستبدلها. تركّز على **كل حالة فردية**: كل زر وحقل وقيمة حدّية ومسار نجاح/فشل، مع **نتائج موثقة** بعد كل تنفيذ.

---

## 0. الأهداف ومستويات الاختبار

| المستوى | ماذا نختبر | كيف |
|---|---|---|
| L0 — منطق | `service.ts`, `storage.ts`, `http.ts`, `sanitize`, `sentiment`, `duplicate`, `WordCloud` | فحص كودي موثق + حالات حدّية |
| L1 — API | كل نقطة (نجاح + فشل + حديّة + أمان) | سكربت `fetch`/curl في PowerShell |
| L2 — تدفق | سيناريو يوم الفعالية الكامل (الجلسة → السؤال → الموافقة → الاستفتاء → الإجابة → التنظيف) | `qa-smoke.mjs` الموسّع |
| L3 — واجهة | كل شاشة وزر وحقل (سلوك المتصفح) | تحقق يدوي موجّه + فحص DOM/صفحة SSR |
| L4 — أمان | صلاحيات/مصادقة/تعقيم/تقييد/تزامن/turnstile | API + تحليل كود |

---

## 1. إعداد بيئة اختبار معزولة

لا نلوّث المتجر الحقيقي (`store/`) ولا ورقة Google الحقيقية.

```powershell
# 1) تأكد أن .env.local لا يحتوي أسطر Upstash أو Turnstile الحقيقية (محلياً غير موجودة → Fail-Open بأمان).
#    أبقِ ADMIN_PASSWORD كما هو (يُشتق منه حساب admin).

# 2) شغّل خادماً معزولاً على منفذ حر مع بيانات معزولة:
$env:QA_DATA_DIR = "C:\Users\LENOVO\AppData\Local\Temp\opencode\qa-test-store"
$env:PORT = "3100"
npm run dev
```

- بيانات الجلسات والأصوات ← `qa-data.json` و `qa-votes.json` في `QA_DATA_DIR` المؤقت.
- ملاحظة: `qa-surveys.json` يُكتب داخل `store/` (المسار النسبي) وليس `QA_DATA_DIR`؛ أثناء الاختبار المعزول نرصد الملف ونحذفه بعد الاختبار حتى لا يلوّث بيانات المتجر الحقيقية (أو نشغّل الخادم من مجلد عمل مؤقت بالكامل).
- تسجيل الدخول: `POST /api/admin/login` بـ `{username, password}`؛ محلياً `admin` + `ADMIN_PASSWORD` من `.env.local` (يُنشأ الحساب تلقائياً إذا لم توجد ورقة Users).
- ملاحظة «الدفع»: لا نصدّر أي شيء. نكتفي بالتحقق المحلي.

---

## 2. مصفوفة الموارد المختبرة

### 2.1 صفحات الواجهة
| الشاشة | المسار | المكوّن الرئيسي |
|---|---|---|
| الجمهور (تسجيل حضور / سؤال / استفتاء) | `/{locale}/live` | `LiveParticipate` |
| شاشة عرض الحائط | `/{locale}/live/screen` | `LiveScreen` + `useQaStream` + `WordCloud` |
| شاشة المتحدث | `/{locale}/live/speaker` | `SpeakerView` |
| استبيان ما بعد الفعالية | `/{locale}/live/survey` | `PostEventSurvey` |
| لوحة الإدارة (تحكم + تحليلات) | `/{locale}/admin/live` | `QaAdminPanel` + `AnalyticsDashboard` |

### 2.2 نقاط API
| النقطة | الإجراءات |
|---|---|
| `POST /api/admin/login` | دخول المشرف |
| `POST /api/qa/admin/session` | create / activate / toggle / delete |
| `POST /api/qa/admin/moderate` | approve / reject / feature / answer / setVisibility / setSpeaker |
| `POST /api/qa/admin/poll` | create / start / stop / showResults / delete |
| `GET /api/qa/admin/questions` | بيانات اللوحة |
| `GET /api/qa/admin/analytics` | إحصائيات |
| `GET /api/qa/admin/export` | تصدير CSV |
| `GET /api/qa/session/current` | `?view=live|speaker` |
| `POST /api/qa/attendee/join` | تسجيل حضور |
| `POST /api/qa/question` | إرسال سؤال |
| `POST /api/qa/poll/vote` | تصويت |
| `GET /api/qa/stream` | SSE |
| `POST /api/qa/survey` + `GET /api/qa/survey` | استبيان ما بعد الفعالية |

### 2.3 مكتبات المنطق
- `src/lib/qa/service.ts` — `newId`, `getActiveSession`, `getSessionById`, `normalizeData`, `emptyQaData`, `emptyData` (الافتراضيات).
- `src/lib/qa/storage.ts` — قراءة/كتابة `qa-data.json`, `qa-votes.json`, `qa-surveys.json`, `mutateBoth`, `clearDataFile`, `loadSurveys`.
- `src/lib/qa/http.ts` — `qaJson`, `qaErrorFromKnown`.
- `src/lib/sanitize.ts` — `escapeHtml`.
- `src/lib/turnstile.ts` — `verifyTurnstile`.
- `src/lib/rate-limit.ts` — `checkRateLimit` (Upstash؛ fail-open محلياً).
- `src/lib/users.ts` — `seedAdminIfNeeded`, `verifyUserPassword`, `updateLastLogin`.

---

## 3. L0 — اختبارات المنطق (فحص كودي + حالات حدّية)

> كل بند يُعلَّم بنتيجة: ✅ مطابق / ❌ مخالف مع تفاصيل.

### 3.1 `newId(prefix)`
- [ ] يعيد `prefix_<16 hex>` (مثال `q_ab12...`).
- [ ] معرفان متتاليان مختلفان (عشوائية).
- [ ] لا يحتوي أحرفاً خطرة في مسارات.

### 3.2 `getActiveSession` / `getSessionById`
- [ ] يعيد الجلسة الوحيدة `active === true`.
- [ ] عند عدة جلسات نشطة (حالة شاذة) يعيد الأولى فقط دون انهيار.
- [ ] بلا جلسة نشطة يعيد `null`.
- [ ] `getSessionById` يعيد الجلسة الصحيحة فقط؛ و`null` لغير الموجودة.

### 3.3 `normalizeData` — درع بيانات قديمة/ناقصة
- [ ] `null`/`undefined` → يعيد مخطط `emptyQaData()` كامل.
- [ ] كائن بلا `sessions` → `sessions: []`.
- [ ] جلسة قديمة بلا `speakerEnabled` → تُملأ `true`.
- [ ] سؤال قديم بلا `showOnSpeaker`/`showOnLive` → كلاهما `true`.
- [ ] جلسة قديمة بلا `questions`/`polls` → `[]`.
- [ ] `false` الصريح يبقى `false` (لا يُعاد تعيينه).
- [ ] `settings` تندمج بلا فقد الافتراضيات.

### 3.4 `qaErrorFromKnown` — `http.ts`
- [ ] `no-active-session`→409، `not-accepting`→409، `session-not-found`→404، `question-not-found`→404، `poll-not-found`→404، `poll-closed`→409، `invalid-option`→400، `already-voted`→409.
- [ ] مفتاح غير معروف → `null` (يُعالج كخطأ عام).

### 3.5 `qaJson`
- [ ] يضبط `Cache-Control: no-store`.
- [ ] الحالة الافتراضية 200 عند عدم تمريرها.

### 3.6 `escapeHtml` — `sanitize.ts`
- [ ] `&`→`&amp;`، `<`→`&lt;`، `>`→`&gt;`، `"`→`&quot;`، `'`→`&#39;`.
- [ ] `null`/`undefined` → `""`.
- [ ] نص عربي عادي يُحفظ كما هو.
- [ ] لا يُنتج تسلسل تعقيم مزدوج–مكسور (`&amp;lt;` في سياق خاطئ).

### 3.7 كشف التكرار (`getSimilarity`) — `question/route.ts`
- [ ] نصان متطابقان → ≥0.75 → `duplicate:true` مع `duplicateOf`.
- [ ] نصان مختلفان كلياً → يُنشأ سؤال جديد.
- [ ] نص متقارب بأحرف → يُعتبر مكرراً.
- [ ] النص القصير جداً (طول 0) لا يقسم على صفر.
- [ ] يقارن مقابل الأسئلة `approved` و`pending` فقط (لا `rejected`).

### 3.8 تحليل المشاعر `analyzeSentiment`
- [ ] كلمات إيجابية (`رائع`/`excellent`) → `positive`.
- [ ] كلمات سلبية (`سيء`/`bad`) → `negative`.
- [ ] محايد بلا كلمات مفاتيح → `neutral`.
- [ ] إيجابي = سلبي → `neutral`.
- [ ] أحرف كبيرة/صغيرة في الإنجليزية لا تُخل بالتجميع.

### 3.9 `WordCloud.calculateWordFrequency`
- [ ] يزيل كلمات التوقف (عربي/إنجليزي) والكلمات ≤ 2 حرف.
- [ ] يعيد التكرارات مرتبة تنازلياً ويقتطع `maxWords`.
- [ ] ينظف غير الحروف/الأرقام (regex Unicode `[\p{L}\p{N}\s]`).
- [ ] نص فارغ → `[]`.

---

## 4. L1 — اختبارات API التفصيلية (كل نقطة)

> الحروف `{TOKEN}` = توكن أدمن. كل حالة تُنفَّذ وتُوثَّق نتيجتها. ملاحظة: الحزم (headers) شائعة:
> - مع `Origin` غير مسموح → 403.
> - بدون أصل (curl/Node) يُسمح به.
> - Upstash/Turnstile غير مهيأة محلياً → fail-open.

### 4.1 `POST /api/admin/login`
| # | الحالة | المتوقع |
|---|---|---|
| 4.1.1 | `{username,password}` صحيحان | 200 `{ok:true, token, user:{username,displayName,role}}` |
| 4.1.2 | كلمة مرور خاطئة | 401 |
| 4.1.3 | بدون `username` | 400 |
| 4.1.4 | بدون `password` | 400 |
| 4.1.5 | JSON مكسور | 400 `Invalid JSON body` |
| 4.1.6 | بدون ADMIN_PASSWORD (كشف بيئة) | 503 |
| 4.1.7 | `role` الظاهر (admin/viewer) صحيح | 200 |
| 4.1.8 | الـ token JWT يمر على `verifyJwt` (sub, role, tv) | 200 |

### 4.2 `POST /api/qa/admin/session`
| # | الحالة | المتوقع |
|---|---|---|
| 4.2.1 | `create` بعنوان فقط | 200 `result.id` يبدأ `sess_` |
| 4.2.2 | `create` بعنوان + `titleAr` | 200 |
| 4.2.3 | عنوان فارغ/مسافات فقط | 400 `title required` |
| 4.2.4 | بدون `action` | 400 |
| 4.2.5 | `action` غير معروف | 400 (zod enum) |
| 4.2.6 | عنوان > 200 حرف | 400 |
| 4.2.7 | جلسة جديدة: `active:false, acceptingQuestions:false, questions:[], polls:[], attendeeNames:[]` | تحقق |
| 4.2.8 | `activate` جلسة جديدة | 200 `active:true, acceptingQuestions:true` |
| 4.2.9 | `activate` يعطّل باقي الجلسات النشطة | تحقق عبر GET |
| 4.2.10 | `activate` بلا sessionId | 400 |
| 4.2.11 | `activate` لمعرف غير موجود | 404 `session-not-found` |
| 4.2.12 | `toggle` مع `acceptingQuestions:false` | 200 `acceptingQuestions:false` |
| 4.2.13 | `toggle` مع `acceptingQuestions:true` | 200 |
| 4.2.14 | `toggle` بلا `acceptingQuestions` | سلوك موثق (يعكس active/يوقف) |
| 4.2.15 | `delete` جلسة لها أسئلة+أصوات | 200؛ الأصوات المرتبطة تُحذف و`meta.totalVotes` يعاد حسابه |
| 4.2.16 | `delete` جلسة غير موجودة | 404 |
| 4.2.17 | Origin غير مسموح | 403 |
| 4.2.18 | بلا توكن | 401 |
| 4.2.19 | بتوكن viewer | 403 |

### 4.3 `POST /api/qa/admin/moderate`
| # | الحالة | المتوقع |
|---|---|---|
| 4.3.1 | `approve` سؤال معلّق | 200 `status:approved` + `approvedAt` |
| 4.3.2 | `approve` بلا questionId | 400 |
| 4.3.3 | `feature {featured:true}` | 200 `featured:true` |
| 4.3.4 | `feature {featured:false}` | 200 |
| 4.3.5 | `feature` بلا `featured` | 400 |
| 4.3.6 | `answer` أول مرة | 200 `answered:true` |
| 4.3.7 | `answer` مرة أخرى (toggle) | 200 `answered:false` |
| 4.3.8 | `setVisibility {showOnSpeaker:false}` | 200 `showOnSpeaker:false` |
| 4.3.9 | `setVisibility {showOnLive:false}` | 200 `showOnLive:false` |
| 4.3.10 | `setVisibility` بكلتا القيمتين | 200 |
| 4.3.11 | `setVisibility` بلا أياً من الحقلين | 400 |
| 4.3.12 | `setVisibility` بلا questionId | 400 |
| 4.3.13 | `setSpeaker {enabled:false}` | 200 `speakerEnabled:false` |
| 4.3.14 | `setSpeaker {enabled:true}` | 200 |
| 4.3.15 | `setSpeaker` بلا `enabled` | 400 |
| 4.3.16 | `setSpeaker` بلا sessionId | 200 (يعمل على الجلسة النشطة) أو خطأ موثق |
| 4.3.17 | `setSpeaker` لجلسة غير موجودة | 404 |
| 4.3.18 | أي إجراء على جلسة غير موجودة | 404 |
| 4.3.19 | أي إجراء على سؤال غير موجود | 404 `question-not-found` |
| 4.3.20 | `action` غير معروف | 400 |
| 4.3.21 | `reject` سؤال | 200 `status:rejected` |
| 4.3.22 | بلا توكن / viewer | 401 / 403 |
| 4.3.23 | `reject` ثم إعادة `approve` لنفس السؤال | 200 (تحوّل حالة) |

### 4.4 `POST /api/qa/admin/poll`
| # | الحالة | المتوقع |
|---|---|---|
| 4.4.1 | `create` prompt + خياران | 200 `id`, `options`, tallies `[0,0]` |
| 4.4.2 | `create` prompt + 6 خيارات | 200 |
| 4.4.3 | `create` بخيار واحد | 400 |
| 4.4.4 | `create` بدون خيارات | 400 |
| 4.4.5 | `create` بلا prompt | 400 |
| 4.4.6 | `create` خيار > 120 حرف | 400 |
| 4.4.7 | `create` بلا sessionId | 400 |
| 4.4.8 | `create` لجلسة غير موجودة | 404 |
| 4.4.9 | `create` مع promptAr/optionsAr | 200 ويُحفظان |
| 4.4.10 | تعقيم prompt/options من HTML | يُخزَّن مُهرَّباً |
| 4.4.11 | `start` استفتاء | 200 `active:true, showResults:false` |
| 4.4.12 | `stop` استفتاء | 200 `active:false, showResults:true` |
| 4.4.13 | `showResults {show:true}` | 200 |
| 4.4.14 | `showResults {show:false}` | 200 |
| 4.4.15 | `showResults` بلا `show` | 400 |
| 4.4.16 | `stop`/`showResults` بلا pollId | 400 |
| 4.4.17 | `delete` استفتاء له أصوات | 200 + حذف سجل أصواته من `qa-votes.json` |
| 4.4.18 | `delete` استفتاء غير موجود | 404 |
| 4.4.19 | `start` استفتاء غير موجود | 404 |
| 4.4.20 | بلا توكن / viewer | 401 / 403 |

### 4.5 `GET /api/qa/admin/questions`
| # | الحالة | المتوقع |
|---|---|---|
| 4.5.1 | بلا توكن | 401 |
| 4.5.2 | بتوكن viewer | 403 |
| 4.5.3 | بالتوكن | 200 `{settings, meta, sessions}` |
| 4.5.4 | كل سؤال يحوي `answered, showOnSpeaker, showOnLive` | تحقق |
| 4.5.5 | كل جلسة تحوي `speakerEnabled` | تحقق |
| 4.5.6 | جلسة نشطة واحدة فقط `active:true` | تحقق |
| 4.5.7 | متجر فارغ يعيد بنية فارغة بلا خطأ | تحقق |

### 4.6 `GET /api/qa/admin/analytics`
| # | الحالة | المتوقع |
|---|---|---|
| 4.6.1 | بدون sessionId (آخر جلسة) | 200 `{session, stats}` |
| 4.6.2 | مع sessionId صحيح | 200 |
| 4.6.3 | مع sessionId غير موجود | 404 `No session found` |
| 4.6.4 | بلا جلسات إطلاقاً | 404 |
| 4.6.5 | `totalQuestions` يوافق عدد الأسئلة (تحضير 3) | تحقق |
| 4.6.6 | `approved/pending/rejected/answered/featured/anonymous` صحيحة | تحقق |
| 4.6.7 | `sentiment` يطابق `analyzeSentiment` | تحقق |
| 4.6.8 | `tags` مرتبة تنازلياً وتحسب `untagged` | تحقق |
| 4.6.9 | `topQuestions` = أعلى 10 معتمدة مرتبة تنازلياً | تحقق |
| 4.6.10 | `timeline` تغطي 0–23 | تحقق |
| 4.6.11 | `polls.totalVotes` = مجموع tallies | تحقق |
| 4.6.12 | بلا توكن / viewer | 401 / 403 |

### 4.7 `GET /api/qa/admin/export`
| # | الحالة | المتوقع |
|---|---|---|
| 4.7.1 | بالتوكن (Bearer) | 200 `text/csv` + `Content-Disposition: attachment; filename="qa-<sessionId>.csv"` |
| 4.7.2 | بـ `?token=` في query (لـ window.open) | 200 |
| 4.7.3 | توكن query غير صالح | 401 |
| 4.7.4 | بدون sessionId → آخر جلسة | 200 |
| 4.7.5 | sessionId غير موجود | 404 |
| 4.7.6 | سؤال يحوي `,` أو `"` أو سطر جديد | إفلات CSV صحيح (اقتباسان مزدوجان) |
| 4.7.7 | رأس CSV: id,author,text,status,votes,featured,answered,createdAt,approvedAt | تحقق |
| 4.7.8 | بلا توكن | 401 |

### 4.8 `GET /api/qa/session/current`
| # | الحالة | المتوقع |
|---|---|---|
| 4.8.1 | بلا جلسة نشطة | 200 `{active:false, session:null, settings}` |
| 4.8.2 | جلسة نشطة | 200 `{active:true, session:{id,title,titleAr,acceptingQuestions,speakerEnabled,attendeeCount}, questions, polls}` |
| 4.8.3 | `?view=live` (افتراضي أو صريح) | أسئلة `showOnLive !== false` |
| 4.8.4 | `?view=speaker` | أسئلة `showOnSpeaker !== false` |
| 4.8.5 | `showOnLive:false` → يظهر بـ speaker ولا يظهر بـ live | تحقق العكسين |
| 4.8.6 | `showOnSpeaker:false` → يظهر بـ live ولا يظهر بـ speaker | تحقق العكسين |
| 4.8.7 | `status:rejected` لا يظهر إطلاقاً | تحقق |
| 4.8.8 | `status:pending` لا يظهر إطلاقاً | تحقق |
| 4.8.9 | ترتيب: featured أولاً ثم الأعلى vote | تحقق |
| 4.8.10 | كل سؤال يعيد `id,author,text,votes,featured,answered` | تحقق schema |
| 4.8.11 | `answered` ظاهرة في الرد | تحقق |
| 4.8.12 | `?view=bogus` | 400 `Invalid view` |
| 4.8.13 | الاستفتاء النشط: `tallies:null` (إخفاء لي)/`showResults:false` | تحقق |
| 4.8.14 | الاستفتاء الموقوف بـ `showResults:true` | tallies + totalVotes |
| 4.8.15 | استفتاء غير نشط `showResults:false` | tallies تُعرض (sum) |
| 4.8.16 | Rate limit محلياً | لا يُفرض (fail-open) |
| 4.8.17 | Origin غير مسموح | 403 |
| 4.8.18 | `?view=speaker` وجلسة `speakerEnabled:false` | أسئلتُها تُرسل لكن الواجهة تُظهر الحالة (موثق في L3) |

### 4.9 `POST /api/qa/attendee/join`
| # | الحالة | المتوقع |
|---|---|---|
| 4.9.1 | بلا جلسة نشطة | 409 `no-active-session` |
| 4.9.2 | اسم صالح | 200 `{ok, attendeeId, sessionId}` |
| 4.9.3 | نفس الاسم مرتين | 200، و`attendeeNames` لا يتكرر |
| 4.9.4 | `name` فارغ/مسافات | 400 |
| 4.9.5 | `name` > 60 حرف | 400 |
| 4.9.6 | اسم يحوي HTML | يُخزَّن مُهرَّباً |
| 4.9.7 | مع Turnstile مفعّل وتوكن خاطئ | 403 |
| 4.9.8 | مع Turnstile مفعّل بلا `turnstileToken` | 403 |

### 4.10 `POST /api/qa/question`
| # | الحالة | المتوقع |
|---|---|---|
| 4.10.1 | بلا جلسة نشطة | 409 |
| 4.10.2 | `acceptingQuestions:false` | 409 `not-accepting` |
| 4.10.3 | نص سليم (2–300) | 201 `{ok, question:{id,status:"pending"}}` |
| 4.10.4 | نص حرف واحد | 400 |
| 4.10.5 | نص 301 حرف | 400 |
| 4.10.6 | نص بمسافات فقط | 400 (trim) |
| 4.10.7 | بدون `attendeeId` | 400 |
| 4.10.8 | سؤال مكرر (>75%) | 200 `{ok, duplicate:true, duplicateOf}` |
| 4.10.9 | مكرر مقابل سؤال مرفوض → ليس مكرراً | 201 |
| 4.10.10 | `anonymous:true` → author=`Anonymous` | تحقق |
| 4.10.11 | `anonymous:false` → author=الاسم المُرسل | تحقق |
| 4.10.12 | مع `tag` | 201 ويُحفظ |
| 4.10.13 | `tag` > 40 حرف | 400 |
| 4.10.14 | مع Turnstile مفعّل وتوكن خاطئ | 403 |
| 4.10.15 | HTML script في النص | يُخزَّن `&lt;script&gt;...` |
| 4.10.16 | `sentiment` يُحفظ (positive/negative/neutral) | تحقق |
| 4.10.17 | `name` > 60 (عند إرساله) | 400 |
| 4.10.18 | نص عربي/رموز/أرقام | 201 |

### 4.11 `POST /api/qa/poll/vote`
| # | الحالة | المتوقع |
|---|---|---|
| 4.11.1 | بلا جلسة نشطة | 409 |
| 4.11.2 | استفتاء غير موجود | 404 |
| 4.11.3 | استفتاء غير نشط (`active:false`) | 409 `poll-closed` |
| 4.11.4 | `optionIndex` خارج النطاق | 400 `invalid-option` |
| 4.11.5 | `optionIndex` سالب | 400 |
| 4.11.6 | `optionIndex` غير عدد صحيح | 400 |
| 4.11.7 | أول صوت | 200 `tallies[i]=1, totalVotes=1` |
| 4.11.8 | صوت مكرر لنفس الحضور | 409 `already-voted` |
| 4.11.9 | بعد `stop` | 409 `poll-closed` |
| 4.11.10 | `meta.totalVotes` يتحدث | تحقق GET admin |
| 4.11.11 | كتابة `qa-votes.json` | تحقق الملف |
| 4.11.12 | مع Turnstile مفعّل بلا توكن | 403 |
| 4.11.13 | تزامن: تصويتان متوازيان من نفس الحضور → صوت واحد | تحقق |

### 4.12 `GET /api/qa/stream` (SSE)
| # | الحالة | المتوقع |
|---|---|---|
| 4.12.1 | الترويسات: `text/event-stream`, `Connection: keep-alive`, `X-Accel-Buffering:no` | تحقق |
| 4.12.2 | حدث أول يصل فوراً (`data: {...}\n\n`) | تحقق |
| 4.12.3 | إضافة/موافقة/تصويت → حدث خلال ≤3 ثوانٍ | تحقق |
| 4.12.4 | بلا تغييرات → لا أحداث مكررة (hash) | تحقق |
| 4.12.5 | البيانات تعبر `normalizeData` (تحتوي `answered/featured/speakerEnabled`) | تحقق |
| 4.12.6 | إغلاق العميل → `cancel()` يوقف المؤقت | فحص كودي |
| 4.12.7 | لا يتطلب توكن | تحقق |

### 4.13 `POST/GET /api/qa/survey`
| # | الحالة | المتوقع |
|---|---|---|
| 4.13.1 | POST بدون sessionId | 400 |
| 4.13.2 | POST بدون attendeeId | 400 |
| 4.13.3 | `nps` خارج 0–10 | 400 |
| 4.13.4 | `rating` خارج 1–5 | 400 |
| 4.13.5 | `comment` > 500 | 400 |
| 4.13.6 | POST صالح | 201 `{ok, surveyId}` |
| 4.13.7 | تكرار sessionId+attendeeId | 409 |
| 4.13.8 | GET بدون sessionId | 400 |
| 4.13.9 | GET يعيد total/avgNps/avgRating/npsScore/npsBreakdown/responses(آخر50) | تحقق حسابياً |
| 4.13.10 | npsScore = `round(((promoters-detractors)/total)*100)` | تحقق |
| 4.13.11 | استبيانان لنفس الجلسة بحضورين مختلفين | count=2 |
| 4.13.12 | `comment` يتعقّم من HTML | تحقق |

---

## 5. L2 — سيناريو التدفق الكامل (يوم الفعالية)

الترتيب الذي يجب أن يعمل به (يُنفَّذ ضمناً في `qa-smoke` ويعاد بخطوات API أعلاه):

1. دخول إداري → token.
2. إنشاء جلسة «الجلسة 1» (لا تظهر للجمهور).
3. تفعيل → تظهر للجمهور وتفتح الأسئلة.
4. الجمهور: join → يُحسب في `attendeeCount`/`attendeeNames`.
5. الجمهور: إرسال سؤال → `pending` (لا يظهر للجمهور ولا للشاشتين).
6. المشرف: موافقة → يظهر للجمهور/الشاشتين (بعد فلترة الرؤية).
7. المشرف: تمييز → يصعد لرأس القائمة.
8. المشرف: إخفاء عن المتحدث (`showOnSpeaker:false`) → يختفي من `view=speaker` ويبقى في `view=live`.
9. المشرف: إخفاء عن الشاشة (`showOnLive:false`) → يختفي من `view=live`.
10. المشرف: استعادة الرؤية.
11. المشرف: تعطيل شاشة المتحدث (`speakerEnabled:false`) → شاشة المتحدث تُظهر «معطّلة»؛ بلا أثر على الشاشة الرئيسية.
12. المشرف: إنشاء/بدء استفتاء → جمهور يصوّت.
13. منع التصويت المزدوج.
14. المشرف: إيقاف الاستفتاء → النتائج تظهر.
15. «تمّت الإجابة» → السؤال لا يظهر على الشاشتين (فلتر `!answered`).
16. إنشاء جلسة 2 وتفعيلها → جلسة 1 تتوقف تلقائياً.
17. حذف جلسة 1 → أصواتها تُحذف وmeta يُعاد حسابه.
18. نظافة: حذف جلسة 2.

---

## 6. L3 — اختبار واجهات المتصفح (بالزر والحقل)

> يفتح على `http://localhost:3100` عبر لوحة الإدارة والشاشتين وصفحة الجمهور. يسجَّل كل بند.
> مسارات العرض الجديدة: `/{locale}/live/screen` و `/{locale}/live/speaker` تعمل بوضع `x-stage-mode` (بلا Header/Footer/غلاف) — يُتحقق منها.

### 6.1 الجمهور `/{locale}/live`
**بوابة الدخول:**
- [ ] حقل الاسم يظهر عند عدم وجود حضور في sessionStorage.
- [ ] زر «انضمام» يشتغل عند تعبئة اسم غير فارغ، ويمنع عند الفراغ (خطأ «أدخل اسمك»).
- [ ] عند `accepting`؛ عند غير فاعل الجلسة تظهر رسالة «لا توجد جلسة نشطة».
- [ ] إعادة تحميل → «مرحباً بعودتك!» بلا إعادة دخول (مخزن في sessionStorage `tedx-qa-attendee`).
- [ ] زر «مرحباً بعودتك» يحذف المحفوظ ويعيد البوابة.
- [ ] تبديل اللغة ar/en يغيّر النصوص (الترجمة موجودة).

**صندوق السؤال:**
- [ ] حقل النص + زر «إرسال».
- [ ] زر «إرسال مجهول/معلن» (تبديل المجهولية) يعكس الرمز/Warning التوضيحي.
- [ ] مطالبة نصية عن حد 300 حرف عند الاقتراب (لا تقبل فوق 300).
- [ ] عند الإرسال الناجح: رسالة «في انتظار الموافقة»، يُمسح الحقل، يُعطَّل مؤقتاً (منع الازدواج).
- [ ] عند سؤال «مكرر»: رسالة تحذير واضحة.
- [ ] عند `acceptingQuestions:false`: صندوق السؤال يتحول إلى رسالة «لا تقبل أسئلة حالياً».

**الاستفتاء:**
- [ ] الاستفتاء النشط يظهر أسئلته وخياراته.
- [ ] الاختيار يصوّت ويُظهر «تم التصويت»/الكشف (حسب showResults).
- [ ] التصويت مرتين → منع/تجاهل الرسالة.
- [ ] عند إيقاف الاستفتاء وتفعيل showResults → تظهر النسب/الأرقام.

### 6.2 شاشة العرض `/{locale}/live/screen`
- [ ] تعرض السؤال الموافَق الأعلى تصويتاً + تدوير تلقائي كل 7 ثوانٍ.
- [ ] تشمل سحابة كلمات (WordCloud) وتحديثها بالتدفق.
- [ ] الأسئلة المجاب عنها (`answered:true`) **لا تُعرض**.
- [ ] سؤال `showOnLive:false` لا يظهر — ويظهر فور إعادة الرؤية (SSE ≤3 ث).
- [ ] عدّاد الحضور/الجلسة النشطة يُحدِّث عبر SSE.
- [ ] وضع صفحة ملء: بلا Header/Footer (تحقق `x-stage-mode`).
- [ ] عند محاولة وصول غير مصرّح: صفحة منفصلة (Layout) أو بقاء اللوحة بلا أزرار تحكم.
- [ ] إعادة تحميل الصفحة لا تكسر العرض (الجلسة تُبث بقوة).

### 6.3 شاشة المتحدث `/{locale}/live/speaker`
- [ ] تعرض الأسئلة حيث `showOnSpeaker !== false` فقط.
- [ ] تتحدث كل 5 ثوانٍ (polling) مع تلوين التغييرات.
- [ ] زر «تمّت الإجابة» لكل سؤال يتصل بـ admin/moderate ويميّز السؤال.
- [ ] عند `speakerEnabled:false` تظهر رسالة «تم إيقاف شاشة المتحدث» وتتوقف/تظهر تعليقاً.
- [ ] تحكم «تفعيل/تعطيل شاشة المتحدث» في لوحة الإدارة ينعكس خلال ≤5 ث.
- [ ] لا توجد عناصر Header/Footer (stage mode).

### 6.4 لوحة الإدارة `/{locale}/admin/live`
**قسم الجلسات:**
- [ ] زر «جلسة جديدة» → حوار (عنوان/عنوان عربي) ينشئ الجلسة.
- [ ] زر «تفعيل» يعمل ويُظهر شارتها (نشطة).
- [ ] زر «إيقاف/فتح الأسئلة» (toggle).
- [ ] قائمة جلستين: نشطة واحدة تحمل شارة، والتفعيل ينقله إليها.
- [ ] زر «حذف» يؤكد قبل الحذف ويمسح بياناتها.
- [ ] عداد الحضور (`attendeeCount`).

**قسم الأسئلة:**
- [ ] قائمة بكل أسئلة الجلسة (معلّق/معتمد/مرفوض) مع شارات.
- [ ] أزرار: موافقة / رفض / تمييز (نجمة) / تمت الإجابة.
- [ ] زر إخفاء/إظهار عن الشاشة (`showOnLive`) وأيقونته.
- [ ] زر إخفاء/إظهار عن المتحدث (`showOnSpeaker`) وأيقونته.
- [ ] عند «تمييز»: السؤال يصعد للأعلى في نفس الجلسة.
- [ ] فرز حسب النشاط والتحديث لحظي عبر polling/WebSocket (إن دُعّم).

**قسم الاستفتاءات:**
- [ ] إنشاء استفتاء (نص/نص عربي/خيارات قابلة للإضافة والحذف لا تقل عن 2).
- [ ] بدء / إيقاف / إظهار النتائج.
- [ ] حذف الاستفتاء (مع إزالة الأصوات).
- [ ] عرض النتائج بنسب مئوية بعد الإيقاف.

**قسم التحليلات:**
- [ ] `AnalyticsDashboard` يعرض: إجمالي الأسئلة، معلّق/معتمد/مرفوض، مجاب عنه، مميّزات، مجهول، المشاعر، الوسوم، top questions، التوزيع الزمني، الاستفتاءات.
- [ ] زر «تصدير CSV» يفتح رابطاً `window.open` ويحمّل الملف ويفتح في Excel بشكل صحيح (UTF-8 BOM).
- [ ] تبديل جلسة في التحليلات (dropdown/sessionId).
- [ ] منطقة الاستبيان: أوقات/من متوسط NPS والتصنيف (إن عُرضت في اللوحة أو صفحة منفصلة).

### 6.5 الاستبيان `/{locale}/live/survey`
- [ ] نموذج 0–10 (NPS) + 1–5 (تقييم) + تعليق.
- [ ] يمنع الإرسال الناقص.
- [ ] بعد الإرسال الناجح رسالة شكر وعدم تكرار (نفس الحضور).
- [ ] يتم قبول تعليق حتى 500 حرف.
- [ ] (يُطلق النار على `qa-surveys.json`) — لا تكرار لنفس sessionId+attendeeId.

---

## 7. L4 — الأمان والتزامن والتعقيم

| # | الحالة | المتوقع |
|---|---|---|
| 7.1 | وأضاف: لا توكن → 401 لجميع admin/* | تحقق |
| 7.2 | توكن viewer → 403 لجميع admin/* | تحقق |
| 7.3 | توكن منتهي/مزور → 401 | تحقق |
| 7.4 | Origin غير مسموح → 403 (`Origin: https://evil.com`) | تحقق |
| 7.5 | `Cache-Control: no-store` في كل نقطة | تحقق |
| 7.6 | تعقيم XSS في: اسم الحضور، نص السؤال، prompt، options، comment، tag | تحقق الإفلات وعدم تنفيذه في المتصفح |
| 7.7 | Rate limit محلياً fail-open؛ وفي الإنتاج يعمل 429 | فحص كودي `rate-limit.ts` |
| 7.8 | Turnstile: محلياً fail-open؛ إنتاجاً بلا توكن → 403 | فحص كودي `turnstile.ts` |
| 7.9 | التصويت يستعمل `mutateBoth` (write/read) لمنع تكرار الأصوات | تحقق تزامن تصويتين متوازيين |
| 7.10 | `delete` الجلسة يحذف أصواتها من `qa-votes.json` | تحقق الملف |
| 7.11 | مسح المتجر الفارغ لا يكسر أي نقطة | تحقق 200/404 رشيقة |
| 7.12 | `qa-data.json`/`qa-votes.json` أُغلقت interop صحيحة (JSON واحد) عند التوالي | تحقق |

---

## 8. قائمة المراجعة الختامية (علامة النجاح)

- [ ] كل L0 بند 3.x مختوم بنتيجة محددة.
- [ ] كل حالة 4.1–4.13 مختومة (PASS/FAIL) مع JSON.
- [ ] L2 سيناريو 18 خطوة يعمل من النهاية للنهاية دون فشل.
- [ ] L3 كل شاشة مفحوصة بالزر/الحقل (بما فيها صفحتا الوضع الكامل الجديدتان).
- [ ] L4 حالات الأمان كلها مختبَرة.
- [ ] المتجر الحقيقي `store/qa-data.json` لم يتغير صدى (صفر تعديل/أو نسخة احتياطية قبل البدء).
- [ ] تقرير قصير في نهاية الوثيقة يلخص: عدد حالات PASS/FAIL/ملاحظات.

---

## 9. مكان تسجيل النتائج

- المنطقة النهائية **«نتائج التنفيذ»** في نفس الملف (`docs/16-qa-test-plan-details.md`).
- Command line للسكربت الحالي:
  - `npm run test:qa` (يتيح `QA_USER`, `QA_PASS`, `QA_BASE`).
- نتائج فورية تُسجَّل حسب التنفيذ الفعلي في الأقسام الفرعية أدناه.

---

## نتائج التنفيذ (بعد الدورة الأولى — معزولة بالكامل)

> الحالة: خادم `next dev` معزول على المنفذ **3120**، `QA_DATA_DIR = %TEMP%\opencode\qa-verify-details-data`
> (بيانات الجلسات/الأسئلة/الأصوات مُسكنة هناك؛ ملف الاستبيان يُنشأ مؤقتاً في `store/qa-surveys.json`
> ويُحذف بعد الفحص؛ `store/qa-data.json` و`qa-votes.json` الحقيقيان لم يُمسّا).
> المُشغِّل: `scripts/qa-verify-details.mjs` + السكربت الأساسي `scripts/qa-smoke.mjs`.

| # | الفحص | الطبقة | النتيجة |
|---|---|---|---|
| 0 | تسجيل دخول إداري (`POST /api/qa/admin/login` → token) | L4 | ✅ PASS |
| 1 | إنشاء جلسة | L1 | ✅ PASS |
| 2 | تفعيل الجلسة | L1 | ✅ PASS |
| 3 | حضور (join → attendeeId) | L1 | ✅ PASS |
| 4 | إرسال سؤال → `status=pending` | L1 | ✅ PASS |
| 5 | موافقة إدارية (moderate/approve) | L1 | ✅ PASS |
| 6 | `view=live` يُظهر السؤال بعد الموافقة | L2 | ✅ PASS |
| 7 | `view=speaker` يُظهر السؤال بعد الموافقة | L2 | ✅ PASS |
| 8 | `setVisibility` إخفاء عن المتحدث فقط (showOnSpeaker=false) | L1 | ✅ PASS |
| 9 | المتحدث لا يرى السؤال بعد إخفاءه | L2 | ✅ PASS |
| 10 | الشاشة الحية ما زالت تراه (showOnLive=true) | L2 | ✅ PASS |
| 11 | إعادة الظهور على المتحدث (setVisibility showOnSpeaker=true) | L1 | ✅ PASS |
| 12 | `setSpeaker` تعطيل شاشة المتحدث (enabled=false) | L1 | ✅ PASS |
| 13 | `setSpeaker` إعادة التفعيل | L1 | ✅ PASS |
| 14 | إنشاء استفتاء (3 خيارات) | L1 | ✅ PASS |
| 15 | تصويت → tallies[1]=1 (Turnstile fail-open محلياً) | L1 | ✅ PASS |
| 16 | منع التصويت المزدوج من نفس الحضور → 409 | L1 | ✅ PASS |
| 17 | إرسال استبيان | L1 | ✅ PASS |
| 18 | منع التقديم المزدوج للاستبيان → 409 | L1 | ✅ PASS |
| 19 | جلب إحصائيات الاستبيان | L1 | ✅ PASS |
| 20 | تحليلات إدارية (`admin/analytics`) | L1 | ✅ PASS |
| 21 | تصدير CSV يشمل نص السؤال | L1 | ✅ PASS |
| 22 | `Content-Disposition: attachment` + CSV | L1 | ✅ PASS |
| 23 | تحليلات بلا token → 401 | L4 | ✅ PASS |
| 24 | Origin غير مسموح → 403 | L4 | ✅ PASS |
| 25 | تصدير بلا token → 401 | L4 | ✅ PASS |
| 26 | بث SSE استقبل أحداثاً فعلية (data:/event:) | L2 | ✅ PASS |
| 27 | السؤال المرفوض لا يظهر للعامة (منسوب للسكربت الأساسي) | L1 | ✅ PASS |

**الخلاصة**: `PASS 27 / FAIL 0`. لم تُسجَّل أي إخفاقات في الدورة الأولى. لم يبقَ أي أثر في
`store/` (لا استبيان) — كل بيانات الاختبار داخل `QA_DATA_DIR` المؤقت، وليس في المتجر الحقيقي.

### ملاحظات تستحق المتابعة (ليست فشلاً)
- `Users` tab في ورقة Google الحقيقية يحتوي **11 صفاً مكرراً بعنوان «admin»** — نتيجة seeding متكرر
  دون فحص وجود مسبق. لا يكسر الاختبار (التحقق يستخدم أول تطابق) لكنه تلوث بيانات يُوصى بتنظيفه
  (حبس سطر Admin واحد + حذف المكررات) في نسخة لاحقة.
- الاستبيان يكتب إلى `store/qa-surveys.json` (مسار ثابت قرب cwd) وليس `QA_DATA_DIR` — لذلك أثناء
  الاختبار عزلناه يدوياً (إنشاء مؤقت + حذف). يُنصح بجعله أيضاً ضمن `QA_DATA_DIR` في نسخة لاحقة
  ليتكامل العزل تلقائياً.
