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
import Input from "@/components/ui/Input";

const SUBJECT_VALUES = [
  "General",
  "Speaking",
  "Sponsorship",
  "Volunteering",
  "Media",
] as const;

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
          <Input
            label={t("namePlaceholder")}
            id="contact-name"
            registration={register("name")}
            placeholder={t("namePlaceholder")}
            error={errors.name?.message}
          />

          <Input
            label={t("emailPlaceholder")}
            id="contact-email"
            registration={register("email")}
            type="email"
            placeholder={t("emailPlaceholder")}
            error={errors.email?.message}
          />

          <Input label="Subject" id="contact-subject" registration={register("subject")} select>
            {SUBJECT_VALUES.map((value) => (
              <option key={value} value={value}>
                {subjectLabels[value]}
              </option>
            ))}
          </Input>

          <Input
            label={t("messagePlaceholder")}
            id="contact-message"
            registration={register("message")}
            placeholder={t("messagePlaceholder")}
            textarea
            rows={5}
            error={errors.message?.message}
          />

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
