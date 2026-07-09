"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";

const HOW_HEARD_OPTIONS = [
  "Social Media",
  "Friend/Family",
  "School",
  "Partner Organization",
  "Other",
] as const;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const applicationSchema = z
  .object({
    track: z.enum(["young-speaker", "expert"]),
    fullName: z.string().min(1, "Full name is required"),
    age: z.coerce.number().min(5).max(99),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
    city: z.string().min(1, "City is required"),
    talkIdeaTitle: z.string().min(1, "Talk idea title is required"),
    ideaSummary: z
      .string()
      .min(1, "Idea summary is required")
      .refine((val) => wordCount(val) <= 300, "Maximum 300 words"),
    whyItMatters: z
      .string()
      .min(1, "This field is required")
      .refine((val) => wordCount(val) <= 150, "Maximum 150 words"),
    themeConnection: z.string().min(1, "Please describe the connection to the theme"),
    videoLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    howHeardAboutUs: z.enum(HOW_HEARD_OPTIONS),
    consentToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms and Conditions" }),
    }),
    // Young Speaker track fields
    schoolName: z.string().optional(),
    guardianName: z.string().optional(),
    guardianContact: z.string().optional(),
    parentalConsent: z.boolean().optional(),
    // Expert track fields
    organizationAndRole: z.string().optional(),
    areaOfWorkWithYouth: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.track === "young-speaker") {
      if (!data.schoolName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["schoolName"],
          message: "School name is required",
        });
      }
      if (!data.guardianName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianName"],
          message: "Parent/guardian name is required",
        });
      }
      if (!data.guardianContact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianContact"],
          message: "Parent/guardian contact is required",
        });
      }
      if (!data.parentalConsent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parentalConsent"],
          message: "Parental consent is required",
        });
      }
    }
    if (data.track === "expert") {
      if (!data.organizationAndRole) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationAndRole"],
          message: "Organization and role is required",
        });
      }
      if (!data.areaOfWorkWithYouth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["areaOfWorkWithYouth"],
          message: "Please describe your area of work with children/youth",
        });
      }
    }
  });

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";
const labelClasses = "block text-sm font-medium mb-1";
const errorClasses = "text-red-600 text-sm mt-1";

export default function ApplicationForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

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
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-3xl font-bold mb-4">Application Received</h2>
        <p className="text-tedx-gray">
          Thank you for applying to TEDxAlFalah Youth. A confirmation email
          is on its way to you, and we&apos;ll follow up according to the
          timeline above.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto flex flex-col gap-6"
      noValidate
    >
      {/* Track selector */}
      <fieldset>
        <legend className={labelClasses}>I am applying as a:</legend>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 border rounded px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-tedx-red">
            <input
              type="radio"
              value="young-speaker"
              {...register("track")}
            />
            Young Speaker (10–14)
          </label>
          <label className="flex items-center gap-2 border rounded px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-tedx-red">
            <input type="radio" value="expert" {...register("track")} />
            Expert in the Field of Children and Youth
          </label>
        </div>
      </fieldset>

      {/* Shared fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Full Name</label>
          <input {...register("fullName")} className={inputClasses} />
          {errors.fullName && (
            <p className={errorClasses}>{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClasses}>Age</label>
          <input
            type="number"
            {...register("age")}
            className={inputClasses}
          />
          {errors.age && <p className={errorClasses}>{errors.age.message}</p>}
        </div>
        <div>
          <label className={labelClasses}>Email</label>
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
          <label className={labelClasses}>Phone</label>
          <input {...register("phone")} className={inputClasses} />
          {errors.phone && (
            <p className={errorClasses}>{errors.phone.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClasses}>City</label>
          <input {...register("city")} className={inputClasses} />
          {errors.city && (
            <p className={errorClasses}>{errors.city.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClasses}>Talk Idea Title</label>
        <input {...register("talkIdeaTitle")} className={inputClasses} />
        {errors.talkIdeaTitle && (
          <p className={errorClasses}>{errors.talkIdeaTitle.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>
          Idea Summary{" "}
          <span className="text-xs text-tedx-gray">
            ({wordCount(ideaSummary)}/300 words)
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
          Why This Idea Matters to You{" "}
          <span className="text-xs text-tedx-gray">
            ({wordCount(whyItMatters)}/150 words)
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
        <label className={labelClasses}>Connection to the Theme</label>
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
        <label className={labelClasses}>
          Optional Video Link (60–90 second pitch)
        </label>
        <input {...register("videoLink")} className={inputClasses} />
        {errors.videoLink && (
          <p className={errorClasses}>{errors.videoLink.message}</p>
        )}
      </div>

      <div>
        <label className={labelClasses}>How did you hear about us?</label>
        <select {...register("howHeardAboutUs")} className={inputClasses}>
          {HOW_HEARD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional: Young Speaker fields */}
      {track === "young-speaker" && (
        <div className="border-t pt-6 flex flex-col gap-4">
          <h3 className="font-semibold">Young Speaker Details</h3>
          <div>
            <label className={labelClasses}>School Name</label>
            <input {...register("schoolName")} className={inputClasses} />
            {errors.schoolName && (
              <p className={errorClasses}>{errors.schoolName.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>Parent/Guardian Name</label>
            <input {...register("guardianName")} className={inputClasses} />
            {errors.guardianName && (
              <p className={errorClasses}>{errors.guardianName.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>Parent/Guardian Contact</label>
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
            I confirm I am the parent/guardian and consent to this
            application.
          </label>
          {errors.parentalConsent && (
            <p className={errorClasses}>{errors.parentalConsent.message}</p>
          )}
        </div>
      )}

      {/* Conditional: Expert fields */}
      {track === "expert" && (
        <div className="border-t pt-6 flex flex-col gap-4">
          <h3 className="font-semibold">Expert Details</h3>
          <div>
            <label className={labelClasses}>Organization and Role</label>
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
            <label className={labelClasses}>
              Area of Work with Children/Youth
            </label>
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
          I agree to the{" "}
          <a href="/terms" className="underline text-tedx-red">
            Terms and Conditions
          </a>
        </span>
      </label>
      {errors.consentToTerms && (
        <p className={errorClasses}>{errors.consentToTerms.message}</p>
      )}

      {status === "error" && (
        <p className={errorClasses}>
          Something went wrong submitting your application. Please try again.
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}
