"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { Link, useRouter } from "@/i18n/navigation";

const HOW_HEARD_VALUES = [
  "Social Media",
  "Friend/Family",
  "School",
  "Partner Organization",
  "Other",
] as const;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ═══════════════════════════════════════════════════════════════
   أيقونات
   ═══════════════════════════════════════════════════════════════ */
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   عنوان قسم النموذج
   ═══════════════════════════════════════════════════════════════ */
function FormSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-7 mb-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <h3 className="text-sm font-bold text-white mb-5 pb-3 border-b border-white/[0.08] flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#e62b1e]/[0.12] border border-[#e62b1e]/[0.2] text-[#e62b1e] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   حقل إدخال
   ═══════════════════════════════════════════════════════════════ */
function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <div className="flex justify-between items-center mt-1">{hint}</div>}
      {error && (
        <p className="text-xs text-[#e62b1e] mt-1 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ApplicationForm() {
  const t = useTranslations("page.apply.form");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  const applicationSchema = useMemo(
    () =>
      z
        .object({
          track: z.enum(["young-speaker", "expert"]),
          fullName: z.string().min(1, t("errors.fullNameRequired")),
          age: z.coerce.number().min(10).max(99),
          email: z.string().email(t("errors.emailInvalid")),
          phone: z.string().min(1, t("errors.phoneRequired")),
          city: z.string().min(1, t("errors.cityRequired")),
          talkIdeaTitle: z.string().min(1, t("errors.talkIdeaTitleRequired")),
          ideaSummary: z
            .string()
            .min(1, t("errors.ideaSummaryRequired"))
            .refine((val) => wordCount(val) <= 300, t("errors.maxWords", { count: 300 })),
          whyItMatters: z
            .string()
            .min(1, t("errors.thisFieldRequired"))
            .refine((val) => wordCount(val) <= 150, t("errors.maxWords", { count: 150 })),
          themeConnection: z.string().min(1, t("errors.themeConnectionRequired")),
          videoLink: z.string().url(t("errors.invalidUrl")).optional().or(z.literal("")),
          howHeardAboutUs: z.enum(HOW_HEARD_VALUES),
          consentToTerms: z.literal(true, {
            errorMap: () => ({ message: t("errors.consentRequired") }),
          }),
          schoolName: z.string().optional(),
          guardianName: z.string().optional(),
          guardianContact: z.string().optional(),
          parentalConsent: z.boolean().optional(),
          organizationAndRole: z.string().optional(),
          areaOfWorkWithYouth: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.track === "young-speaker") {
            if (!data.schoolName) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["schoolName"],
                message: t("errors.schoolNameRequired"),
              });
            }
            if (!data.guardianName) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["guardianName"],
                message: t("errors.guardianNameRequired"),
              });
            }
            if (!data.guardianContact) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["guardianContact"],
                message: t("errors.guardianContactRequired"),
              });
            }
            if (!data.parentalConsent) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["parentalConsent"],
                message: t("errors.parentalConsentRequired"),
              });
            }
          }
          if (data.track === "expert") {
            if (!data.organizationAndRole) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["organizationAndRole"],
                message: t("errors.organizationRequired"),
              });
            }
            if (!data.areaOfWorkWithYouth) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["areaOfWorkWithYouth"],
                message: t("errors.areaOfWorkRequired"),
              });
            }
          }
        }),
    [t]
  );

  type ApplicationFormValues = z.infer<typeof applicationSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { track: "young-speaker", howHeardAboutUs: "Social Media" },
  });

  const track = watch("track");
  const ideaSummary = watch("ideaSummary") || "";
  const whyItMatters = watch("whyItMatters") || "";

  async function onSubmit(data: ApplicationFormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/thank-you?type=apply");
    } catch {
      setStatus("error");
    }
  }

  const inputClasses =
    "w-full border-[1.5px] border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white bg-white/[0.04] placeholder:text-slate-500 transition-all duration-250 ease-out outline-none hover:border-white/[0.15] hover:bg-white/[0.06] focus:border-[#e62b1e] focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(230,43,30,0.12)]";

  const textareaClasses = inputClasses + " resize-y min-h-[100px]";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-[680px] mx-auto flex flex-col gap-0"
      noValidate
    >
      {/* ═══════ العنوان ═══════ */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase text-[#e62b1e] mb-3 px-3.5 py-1.5 bg-[#e62b1e]/[0.08] border border-[#e62b1e]/[0.15] rounded-full">
          Speaker Application
        </span>
        <h2 className="font-bold text-2xl text-white tracking-[-0.02em]">
          {t("formTitle")}
        </h2>
      </div>

      {/* ═══════ القسم 1: اختيار المسار ═══════ */}
      <FormSection num={1} title={t("trackLabel")}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* متحدث شاب */}
          <label
            className={`relative flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              track === "young-speaker"
                ? "border-[#e62b1e] bg-white/[0.06] shadow-[0_4px_20px_-4px_rgba(230,43,30,0.15)]"
                : "border-white/[0.06] bg-white/[0.03] hover:border-[#e62b1e]/30 hover:bg-white/[0.05]"
            }`}
          >
            <input
              type="radio"
              value="young-speaker"
              className="absolute opacity-0"
              {...register("track")}
              onChange={() => setValue("track", "young-speaker")}
            />
            <div
              className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 transition-all duration-300 ${
                track === "young-speaker"
                  ? "bg-[#e62b1e]/[0.12] border border-[#e62b1e]/[0.2] text-[#e62b1e]"
                  : "bg-white/[0.06] border border-white/[0.08] text-slate-500"
              }`}
            >
              <LocationIcon />
            </div>
            <div className="text-[15px] font-bold text-white mb-1">{t("youngSpeakerLabel")}</div>
            <div className="text-[13px] text-slate-400/70 leading-relaxed">{t("youngSpeakerDesc")}</div>
            <div className="mt-3 text-[11px] font-semibold text-[#e62b1e] px-2 py-1 bg-[#e62b1e]/[0.08] border border-[#e62b1e]/[0.15] rounded-full inline-block">
              10–14 سنة
            </div>
          </label>

          {/* خبير */}
          <label
            className={`relative flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              track === "expert"
                ? "border-[#e62b1e] bg-white/[0.06] shadow-[0_4px_20px_-4px_rgba(230,43,30,0.15)]"
                : "border-white/[0.06] bg-white/[0.03] hover:border-[#e62b1e]/30 hover:bg-white/[0.05]"
            }`}
          >
            <input
              type="radio"
              value="expert"
              className="absolute opacity-0"
              {...register("track")}
              onChange={() => setValue("track", "expert")}
            />
            <div
              className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 transition-all duration-300 ${
                track === "expert"
                  ? "bg-[#e62b1e]/[0.12] border border-[#e62b1e]/[0.2] text-[#e62b1e]"
                  : "bg-white/[0.06] border border-white/[0.08] text-slate-500"
              }`}
            >
              <PenIcon />
            </div>
            <div className="text-[15px] font-bold text-white mb-1">{t("expertLabel")}</div>
            <div className="text-[13px] text-slate-400/70 leading-relaxed">{t("expertDesc")}</div>
            <div className="mt-3 text-[11px] font-semibold text-violet-400 px-2 py-1 bg-violet-500/[0.08] border border-violet-500/[0.15] rounded-full inline-block">
              بالغون
            </div>
          </label>
        </div>
      </FormSection>

      {/* ═══════ القسم 2: المعلومات الشخصية ═══════ */}
      <FormSection num={2} title={t("personalInfoTitle")}>
        <div className="flex flex-col sm:flex-row gap-4">
          <Field label={t("fullName")} error={errors.fullName?.message}>
            <input {...register("fullName")} className={inputClasses} placeholder={t("fullNamePlaceholder")} />
          </Field>
          <Field label={t("age")} error={errors.age?.message}>
            <input type="number" {...register("age")} className={inputClasses} placeholder="14" />
          </Field>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Field label={t("email")} error={errors.email?.message}>
            <input type="email" {...register("email")} className={inputClasses} placeholder="name@example.com" />
          </Field>
          <Field label={t("phone")} error={errors.phone?.message}>
            <input {...register("phone")} className={inputClasses} placeholder="+971 50 123 4567" />
          </Field>
        </div>
        <Field label={t("city")} error={errors.city?.message}>
          <input {...register("city")} className={inputClasses} placeholder={t("cityPlaceholder")} />
        </Field>
      </FormSection>

      {/* ═══════ القسم 3: فكرة المحاضرة ═══════ */}
      <FormSection num={3} title={t("talkIdeaTitle")}>
        <Field label={t("talkIdeaTitle")} error={errors.talkIdeaTitle?.message}>
          <input {...register("talkIdeaTitle")} className={inputClasses} placeholder={t("talkIdeaTitlePlaceholder")} />
        </Field>

        <Field
          label={t("ideaSummary")}
          error={errors.ideaSummary?.message}
          hint={<span className="text-[11px] text-slate-500 font-medium">{t("wordCount", { count: wordCount(ideaSummary), max: 300 })}</span>}
        >
          <textarea {...register("ideaSummary")} rows={4} className={textareaClasses} placeholder={t("ideaSummaryPlaceholder")} />
        </Field>

        <Field
          label={t("whyItMatters")}
          error={errors.whyItMatters?.message}
          hint={<span className="text-[11px] text-slate-500 font-medium">{t("wordCount", { count: wordCount(whyItMatters), max: 150 })}</span>}
        >
          <textarea {...register("whyItMatters")} rows={3} className={textareaClasses} placeholder={t("whyItMattersPlaceholder")} />
        </Field>

        <Field label={t("themeConnection")} error={errors.themeConnection?.message}>
          <textarea {...register("themeConnection")} rows={2} className={textareaClasses} placeholder={t("themeConnectionPlaceholder")} />
        </Field>

        <Field label={t("videoLink")} error={errors.videoLink?.message}>
          <input {...register("videoLink")} className={inputClasses} placeholder="https://... (60–90 ثانية)" />
        </Field>

        <Field label={t("howHeard")}>
          <select {...register("howHeardAboutUs")} className={`${inputClasses} appearance-none bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center] pr-10`}>
            <option value="Social Media">{t("howHeardOptions.socialMedia")}</option>
            <option value="Friend/Family">{t("howHeardOptions.friendFamily")}</option>
            <option value="School">{t("howHeardOptions.school")}</option>
            <option value="Partner Organization">{t("howHeardOptions.partnerOrganization")}</option>
            <option value="Other">{t("howHeardOptions.other")}</option>
          </select>
        </Field>
      </FormSection>

      {/* ═══════ القسم 4: حقول شرطية ═══════ */}
      {track === "young-speaker" && (
        <FormSection num={4} title={t("youngSpeakerSection")}>
          <Field label={t("schoolName")} error={errors.schoolName?.message}>
            <input {...register("schoolName")} className={inputClasses} placeholder={t("schoolNamePlaceholder")} />
          </Field>
          <div className="flex flex-col sm:flex-row gap-4">
            <Field label={t("guardianName")} error={errors.guardianName?.message}>
              <input {...register("guardianName")} className={inputClasses} placeholder={t("guardianNamePlaceholder")} />
            </Field>
            <Field label={t("guardianContact")} error={errors.guardianContact?.message}>
              <input {...register("guardianContact")} className={inputClasses} placeholder={t("guardianContactPlaceholder")} />
            </Field>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer p-3 -m-3 rounded-xl hover:bg-white/[0.03] transition-colors">
            <input type="checkbox" {...register("parentalConsent")} className="w-[18px] h-[18px] border-2 border-black/15 rounded-[5px] mt-0.5 flex-shrink-0 accent-[#e62b1e] cursor-pointer" />
            <span className="text-[13px] text-slate-400 leading-relaxed">{t("parentalConsentLabel")}</span>
          </label>
          {errors.parentalConsent && (
            <p className="text-xs text-[#e62b1e] mt-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.parentalConsent.message}
            </p>
          )}
        </FormSection>
      )}

      {track === "expert" && (
        <FormSection num={4} title={t("expertSection")}>
          <Field label={t("organizationAndRole")} error={errors.organizationAndRole?.message}>
            <input {...register("organizationAndRole")} className={inputClasses} placeholder={t("organizationPlaceholder")} />
          </Field>
          <Field label={t("areaOfWork")} error={errors.areaOfWorkWithYouth?.message}>
            <textarea {...register("areaOfWorkWithYouth")} rows={2} className={textareaClasses} placeholder={t("areaOfWorkPlaceholder")} />
          </Field>
        </FormSection>
      )}

      {/* ═══════ الموافقة على الشروط ═══════ */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-7 mb-5 hover:border-white/[0.1] transition-colors duration-300">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" {...register("consentToTerms")} className="w-[18px] h-[18px] border-2 border-black/15 rounded-[5px] mt-0.5 flex-shrink-0 accent-[#e62b1e] cursor-pointer" />
          <span className="text-[13px] text-slate-400 leading-relaxed">
            {t("agreeToTerms")}{" "}
            <Link href="/terms" className="text-[#e62b1e] font-semibold hover:underline">
              {t("termsLink")}
            </Link>
          </span>
        </label>
        {errors.consentToTerms && (
          <p className="text-xs text-[#e62b1e] mt-2 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.consentToTerms.message}
          </p>
        )}
      </div>

      {/* ═══════ خطأ عام ═══════ */}
      {status === "error" && (
        <div className="p-4 rounded-xl bg-[#e62b1e]/[0.08] border border-[#e62b1e]/[0.15] text-[#e62b1e] text-sm font-medium text-center mb-4">
          {t("errorGeneric")}
        </div>
      )}

      {/* ═══════ Turnstile ═══════ */}
      <TurnstileWidget onVerify={setTurnstileToken} />

      {/* ═══════ زر الإرسال ═══════ */}
      <Button
        variant="primary"
        size="lg"
        className="w-full mt-2"
        loading={isSubmitting}
      >
        {t("submit")}
      </Button>
    </form>
  );
}