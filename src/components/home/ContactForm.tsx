"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

const SUBJECT_VALUES = [
  "General",
  "Speaking",
  "Sponsorship",
  "Volunteering",
  "Media",
] as const;

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

export default function ContactForm() {
  const t = useTranslations("home.contactForm");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  // مخطط التحقق يُبنى داخل المكوّن حتى تُترجَم رسائل الخطأ حسب اللغة
  // الحالية، بدل تعريفه ثابتاً خارج المكوّن.
  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("nameRequired")),
        email: z.string().email(t("emailInvalid")),
        subject: z.enum(SUBJECT_VALUES),
        message: z.string().min(10, t("messageMinLength")),
      }),
    [t]
  );

  type ContactFormValues = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: "General" },
  });

  async function onSubmit(data: ContactFormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/thank-you?type=contact");
    } catch {
      setStatus("error");
    }
  }

  const subjectLabels: Record<(typeof SUBJECT_VALUES)[number], string> = {
    General: t("subjectGeneral"),
    Speaking: t("subjectSpeaking"),
    Sponsorship: t("subjectSponsorship"),
    Volunteering: t("subjectVolunteering"),
    Media: t("subjectMedia"),
  };

  return (
    <section className="section-padding bg-tedx-white">
      <SectionContainer className="max-w-xl">
        <FadeInView>
          <h2 className="text-3xl font-bold text-center mb-2">{t("heading")}</h2>
          <p className="text-center text-sm text-tedx-gray mb-8">
            marhaba@tedxalfalahyouth.com
          </p>
        </FadeInView>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div>
            <input
              {...register("name")}
              placeholder={t("namePlaceholder")}
              className={inputClasses}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              className={inputClasses}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <select {...register("subject")} className={inputClasses}>
              {SUBJECT_VALUES.map((value) => (
                <option key={value} value={value}>
                  {subjectLabels[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <textarea
              {...register("message")}
              placeholder={t("messagePlaceholder")}
              rows={5}
              className={inputClasses}
            />
            {errors.message && (
              <p className="text-red-600 text-sm mt-1">
                {errors.message.message}
              </p>
            )}
          </div>

          {status === "error" && (
            <p className="text-red-600 text-sm">{t("errorGeneric")}</p>
          )}

          <TurnstileWidget onVerify={setTurnstileToken} />

          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </SectionContainer>
    </section>
  );
}
