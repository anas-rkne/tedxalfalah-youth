"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image"; // ✅ استيراد الصورة
import { Mail } from "lucide-react";

import SectionContainer from "@/components/ui/SectionContainer";
import FadeInView from "@/components/ui/FadeInView";
import TextReveal from "@/components/ui/TextReveal";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import Input from "@/components/ui/Input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SUBJECT_VALUES = [
  "General",
  "Speaking",
  "Sponsorship",
  "Volunteering",
  "Media",
] as const;

// ✅ إضافة الـ Props لاستقبال مسارات الصور
interface ContactFormProps {
  leftImageSrc?: string;
  rightImageSrc?: string;
}

export default function ContactForm({ leftImageSrc, rightImageSrc }: ContactFormProps) {
  const t = useTranslations("home.contactForm");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

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
    <section className="relative flex min-h-screen flex-col items-center justify-start bg-white pt-24 pb-16 overflow-hidden">
      {/* ✅ تم إزالة الخلفية الحمراء تمامًا، والآن القسم أبيض نقي */}

      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        
        {/* 1. الصورة اليسرى (تظهر في الشاشات الكبيرة فقط) */}
        {leftImageSrc && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex flex-shrink-0 w-32 lg:w-48 xl:w-64 items-center justify-center"
          >
            <Image
              src={leftImageSrc}
              alt="Left decoration"
              width={300}
              height={400}
              className="w-full h-auto object-contain"
            />
          </motion.div>
        )}

        {/* 2. النموذج في المنتصف */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-8 md:mb-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
              {t("heading")}
            </h2>
            
            <div className="w-12 h-1 bg-red-600 mx-auto mt-4 rounded-full" />

            <p className="text-gray-500 mt-5 text-lg font-light max-w-2xl mx-auto leading-relaxed">
              فريقنا متواجد للإجابة على استفساراتك، أو استقبال أفكارك للمشاركة. فقط املأ النموذج وسنعود إليك قريباً.
            </p>

            <a
              href="mailto:marhaba@tedxalfalahyouth.com"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-sm hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200"
            >
              <Mail className="w-4 h-4 text-gray-500" />
              <span>marhaba@tedxalfalahyouth.com</span>
            </a>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
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

            <Input
              label={t("subjectLabel")}
              id="contact-subject"
              registration={register("subject")}
              select
            >
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
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 text-sm text-center"
              >
                {t("errorGeneric")}
              </motion.p>
            )}

            <TurnstileWidget onVerify={setTurnstileToken} />

            <Button
              variant="primary"
              size="md"
              className="w-full mt-2"
              loading={isSubmitting}
            >
              {t("submit")}
            </Button>
          </form>
        </motion.div>

        {/* 3. الصورة اليمنى (تظهر في الشاشات الكبيرة فقط) */}
        {rightImageSrc && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden lg:flex flex-shrink-0 w-32 lg:w-48 xl:w-64 items-center justify-center"
          >
            <Image
              src={rightImageSrc}
              alt="Right decoration"
              width={300}
              height={400}
              className="w-full h-auto object-contain"
            />
          </motion.div>
        )}
        
      </div>
    </section>
  );
}