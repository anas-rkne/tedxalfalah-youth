"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Mail, Send } from "lucide-react";
import { motion } from "framer-motion";

import TurnstileWidget from "@/components/ui/TurnstileWidget";
import Input from "@/components/ui/Input";
import SectionBadge from "@/components/ui/SectionBadge";
import { useRTL } from "@/hooks/useRTL";

interface ContactFormProps {
  heading: string;
  badgeLabel: string;
  intro: string;
  emailLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectGeneral: string;
  subjectSpeaking: string;
  subjectSponsorship: string;
  subjectVolunteering: string;
  subjectMedia: string;
  messagePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  errorGeneric: string;
  nameRequired: string;
  emailInvalid: string;
  messageMinLength: string;
  leftImageSrc?: string;
  rightImageSrc?: string;
}

/* ═══════════════════════════════════════════════════════════════
   مكون صورة جانبية مائلة — تصميم TEDx عصري (تم توحيد الألوان)
   ═══════════════════════════════════════════════════════════════ */
function TiltedImage({
  src,
  alt,
  direction,
  delay,
}: {
  src: string;
  alt: string;
  direction: "left" | "right";
  delay: number;
}) {
  const rotate = direction === "left" ? "-6deg" : "6deg";
  const xInitial = direction === "left" ? -40 : 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: xInitial, rotate: 0 }}
      whileInView={{ opacity: 1, x: 0, rotate: direction === "left" ? -6 : 6 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ rotate: 0, scale: 1.03, transition: { duration: 0.4 } }}
      className="hidden lg:block flex-shrink-0 w-56 xl:w-72 relative"
    >
      {/* ظل TEDx (استخدام ألوان موحدة) */}
      <div
        className="absolute inset-0 rounded-[28px] bg-tedx-red/10 translate-x-3 translate-y-3"
        style={{ transform: `rotate(${rotate}) translate(12px, 12px)` }}
      />

      {/* الإطار الرئيسي */}
      <div
        className="relative rounded-[28px] bg-card border border-border overflow-hidden shadow-lg"
        style={{ transform: `rotate(${rotate})` }}
      >
        {/* خط TEDx علوي */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-tedx-red via-red-400 to-tedx-red" />

        {/* الصورة */}
        <div className="relative aspect-[3/4] w-full p-4">
          <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-muted">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain p-2"
              sizes="(max-width: 1280px) 224px, 288px"
            />
          </div>
        </div>

        {/* شارة TEDx سفلية */}
        <div className="px-4 pb-4 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tedx-red" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              TEDx Youth
            </span>
          </div>
        </div>
      </div>

      {/* نقاط زخرفية */}
      <div
        className="absolute -bottom-6 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #e62b1e 1.5px, transparent 1.5px)",
          backgroundSize: "12px 12px",
          width: direction === "left" ? "60px" : "60px",
          height: "60px",
          [direction === "left" ? "right" : "left"]: "-20px",
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   مكون زر إرسال TEDx (تم توحيد الألوان)
   ═══════════════════════════════════════════════════════════════ */
function SubmitButton({
  loading,
  children,
  submittingLabel,
}: {
  loading: boolean;
  children: React.ReactNode;
  submittingLabel: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-tedx-red text-white font-bold text-base rounded-xl hover:bg-tedx-red/90 transition-all duration-300 shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_12px_40px_-12px_rgba(230,43,30,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{submittingLabel}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </>
      )}
    </motion.button>
  );
}

export default function ContactForm({
  heading,
  badgeLabel,
  intro,
  emailLabel,
  namePlaceholder,
  emailPlaceholder,
  subjectLabel,
  subjectGeneral,
  subjectSpeaking,
  subjectSponsorship,
  subjectVolunteering,
  subjectMedia,
  messagePlaceholder,
  submitLabel,
  submittingLabel,
  errorGeneric,
  nameRequired,
  emailInvalid,
  messageMinLength,
  leftImageSrc,
  rightImageSrc,
}: ContactFormProps) {
  const { isRTL } = useRTL(); // ✅ فقط لتحديد اتجاه النص
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  const SUBJECT_VALUES = [
    "General",
    "Speaking",
    "Sponsorship",
    "Volunteering",
    "Media",
  ] as const;

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, nameRequired),
        email: z.string().email(emailInvalid),
        subject: z.enum(SUBJECT_VALUES),
        message: z.string().min(10, messageMinLength),
      }),
    [nameRequired, emailInvalid, messageMinLength]
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
    General: subjectGeneral,
    Speaking: subjectSpeaking,
    Sponsorship: subjectSponsorship,
    Volunteering: subjectVolunteering,
    Media: subjectMedia,
  };

  return (
    <section className="section-padding relative bg-background overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          HERO HEADER — تم توحيده باستخدام المكونات والمسافات الموحدة
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative pb-12 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 max-w-5xl mx-auto text-center">
          {/* ✅ الشارة الموحدة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <SectionBadge>{badgeLabel}</SectionBadge>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="heading-h1 tracking-[-0.03em] leading-[1.1] mt-6 heading-margin"
          >
            {heading}
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-center gap-3 origin-center"
          >
            <div className="h-px w-10 bg-border" />
            <div className="h-1 w-14 bg-gradient-to-r from-tedx-red to-red-400 rounded-full" />
            <div className="h-px w-10 bg-border" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground mt-8 text-lg font-light max-w-2xl mx-auto leading-relaxed"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {intro}
          </motion.p>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            href="mailto:marhaba@tedxalfalahyouth.com"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted border border-border text-foreground text-sm hover:bg-muted/80 hover:border-border/80 transition-colors duration-200"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{emailLabel}</span>
          </motion.a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FORM SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 ${isRTL ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
            {/* الصورة اليسرى — مائلة لليسار */}
            {leftImageSrc && (
              <TiltedImage
                src={leftImageSrc}
                alt="Contact illustration"
                direction="left"
                delay={0.2}
              />
            )}

            {/* النموذج */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-xl"
            >
              <div className="p-8 md:p-10 rounded-[24px] bg-card border border-border">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-6"
                  noValidate
                >
                  <Input
                    label={namePlaceholder}
                    id="contact-name"
                    registration={register("name")}
                    placeholder={namePlaceholder}
                    error={errors.name?.message}
                  />

                  <Input
                    label={emailPlaceholder}
                    id="contact-email"
                    registration={register("email")}
                    type="email"
                    placeholder={emailPlaceholder}
                    error={errors.email?.message}
                  />

                  <Input
                    label={subjectLabel}
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
                    label={messagePlaceholder}
                    id="contact-message"
                    registration={register("message")}
                    placeholder={messagePlaceholder}
                    textarea
                    rows={5}
                    error={errors.message?.message}
                  />

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
                    >
                      {errorGeneric}
                    </motion.div>
                  )}

                  <TurnstileWidget onVerify={setTurnstileToken} />

                  <SubmitButton loading={isSubmitting} submittingLabel={submittingLabel}>
                    {submitLabel}
                  </SubmitButton>
                </form>
              </div>
            </motion.div>

            {/* الصورة اليمنى — مائلة لليمين */}
            {rightImageSrc && (
              <TiltedImage
                src={rightImageSrc}
                alt="Contact illustration"
                direction="right"
                delay={0.4}
              />
            )}
          </div>
        </div>
      </div>

      {/* نمط نقاط زخرفي */}
      <div
        className="h-16 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #e62b1e 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </section>
  );
}