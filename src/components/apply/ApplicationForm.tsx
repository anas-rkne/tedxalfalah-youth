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

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";
const labelClasses = "block text-sm font-medium mb-1";
const errorClasses = "text-red-600 text-sm mt-1";

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
          age: z.coerce.number().min(5).max(99),
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto flex flex-col gap-6"
      noValidate
    >
      {/* Track selector */}
      <fieldset>
        <legend className={labelClasses}>{t("trackLabel")}</legend>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 border rounded px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-tedx-red">
            <input
              type="radio"
              value="young-speaker"
              {...register("track")}
            />
            {t("youngSpeakerLabel")}
          </label>
          <label className="flex items-center gap-2 border rounded px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-tedx-red">
            <input type="radio" value="expert" {...register("track")} />
            {t("expertLabel")}
          </label>
        </div>
      </fieldset>

      {/* Shared fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>{t("fullName")}</label>
          <input {...register("fullName")} className={inputClasses} />
          {errors.fullName && (
            <p className={errorClasses}>{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClasses}>{t("age")}</label>
          <input
            type="number"
            {...register("age")}
            className={inputClasses}
          />
          {errors.age && <p className={errorClasses}>{errors.age.message}</p>}
        </div>
        <div>
          <label className={labelClasses}>{t("email")}</label>
          <input
            type="email"
            {...register("email")}
            className={inputClasses}
          />
          {errors.email && (
            <p className={errorClasses}>{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className={labelClasses}>{t("phone")}</label>
          <input {...register("phone")} className={inputClasses} />
          {errors.phone && (
            <p className={errorClasses}>{errors.phone.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClasses}>{t("city")}</label>
          <input {...register("city")} className={inputClasses} />
          {errors.city && (
            <p className={errorClasses}>{errors.city.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClasses}>{t("talkIdeaTitle")}</label>
        <input {...register("talkIdeaTitle")} className={inputClasses} />
        {errors.talkIdeaTitle && (
          <p className={errorClasses}>{errors.talkIdeaTitle.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>
          {t("ideaSummary")}{" "}
          <span className="text-xs text-tedx-gray">
            {t("wordCount", { count: wordCount(ideaSummary), max: 300 })}
          </span>
        </label>
        <textarea
          {...register("ideaSummary")}
          rows={4}
          className={inputClasses}
        />
        {errors.ideaSummary && (
          <p className={errorClasses}>{errors.ideaSummary.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>
          {t("whyItMatters")}{" "}
          <span className="text-xs text-tedx-gray">
            {t("wordCount", { count: wordCount(whyItMatters), max: 150 })}
          </span>
        </label>
        <textarea
          {...register("whyItMatters")}
          rows={3}
          className={inputClasses}
        />
        {errors.whyItMatters && (
          <p className={errorClasses}>{errors.whyItMatters.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>{t("themeConnection")}</label>
        <textarea
          {...register("themeConnection")}
          rows={2}
          className={inputClasses}
        />
        {errors.themeConnection && (
          <p className={errorClasses}>{errors.themeConnection.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>{t("videoLink")}</label>
        <input {...register("videoLink")} className={inputClasses} />
        {errors.videoLink && (
          <p className={errorClasses}>{errors.videoLink.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>{t("howHeard")}</label>
        <select {...register("howHeardAboutUs")} className={inputClasses}>
          {HOW_HEARD_VALUES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional: Young Speaker fields */}
      {track === "young-speaker" && (
        <div className="border-t pt-6 flex flex-col gap-4">
          <h3 className="font-semibold">{t("youngSpeakerSection")}</h3>
          <div>
            <label className={labelClasses}>{t("schoolName")}</label>
            <input {...register("schoolName")} className={inputClasses} />
            {errors.schoolName && (
              <p className={errorClasses}>{errors.schoolName.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>{t("guardianName")}</label>
            <input {...register("guardianName")} className={inputClasses} />
            {errors.guardianName && (
              <p className={errorClasses}>{errors.guardianName.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>{t("guardianContact")}</label>
            <input
              {...register("guardianContact")}
              className={inputClasses}
            />
            {errors.guardianContact && (
              <p className={errorClasses}>
                {errors.guardianContact.message}
              </p>
            )}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...register("parentalConsent")} />
            {t("parentalConsentLabel")}
          </label>
          {errors.parentalConsent && (
            <p className={errorClasses}>{errors.parentalConsent.message}</p>
          )}
        </div>
      )}

      {/* Conditional: Expert fields */}
      {track === "expert" && (
        <div className="border-t pt-6 flex flex-col gap-4">
          <h3 className="font-semibold">{t("expertSection")}</h3>
          <div>
            <label className={labelClasses}>{t("organizationAndRole")}</label>
            <input
              {...register("organizationAndRole")}
              className={inputClasses}
            />
            {errors.organizationAndRole && (
              <p className={errorClasses}>
                {errors.organizationAndRole.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClasses}>{t("areaOfWork")}</label>
            <textarea
              {...register("areaOfWorkWithYouth")}
              rows={2}
              className={inputClasses}
            />
            {errors.areaOfWorkWithYouth && (
              <p className={errorClasses}>
                {errors.areaOfWorkWithYouth.message}
              </p>
            )}
          </div>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm border-t pt-6">
        <input type="checkbox" {...register("consentToTerms")} />
        <span>
          {t("agreeToTerms")}{" "}
          <Link href="/terms" className="underline text-tedx-red">
            {t("termsLink")}
          </Link>
        </span>
      </label>
      {errors.consentToTerms && (
        <p className={errorClasses}>{errors.consentToTerms.message}</p>
      )}

      {status === "error" && (
        <p className={errorClasses}>{t("errorGeneric")}</p>
      )}

      <TurnstileWidget onVerify={setTurnstileToken} />

      <Button variant="primary" size="lg" className="w-full" loading={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
