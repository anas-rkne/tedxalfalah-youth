"use client";

import { useMemo, useState, useRef, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Mail, Send } from "lucide-react";

import TurnstileWidget from "@/components/ui/TurnstileWidget";
import Input from "@/components/ui/Input";
import SectionBadge from "@/components/ui/SectionBadge";
import { useRTL } from "@/hooks/useRTL";
import SafeImage from "@/components/ui/SafeImage";

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

/* ═══════════════════════════════════════════
   SubmitButton – مذكَّر
   ═══════════════════════════════════════════ */
const SubmitButton = memo(function SubmitButton({
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
});

/* ═══════════════════════════════════════════
   ContactSideImage – نفس أنيميشن الهيرو
   ═══════════════════════════════════════════ */
const ContactSideImage = memo(function ContactSideImage({
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
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  const parallaxX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], direction === "left" ? [15, -15] : [-15, 15]),
    springConfig
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: direction === "left" ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className="hidden lg:flex flex-col items-center flex-shrink-0 w-56 lg:w-64 xl:w-72 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full aspect-[3/4] z-10 overflow-visible will-change-transform"
        style={{
          x: shouldReduceMotion ? 0 : parallaxX,
          y: shouldReduceMotion ? 0 : parallaxY,
        }}
        animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.42, 0, 0.58, 1],
          delay: delay + 0.5,
        }}
      >
        <SafeImage
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 1280px) 224px, 288px"
        />

        {/* 5 جزيئات حمراء */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-1/4 -left-4 w-2 h-2 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: delay + 0.5, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/3 -right-4 w-1.5 h-1.5 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -15, 0], opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: delay + 1.2, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -25, 0], x: [0, 10, 0], opacity: [0, 0.4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: delay + 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-[#e62b1e]/80 z-20"
              animate={{ y: [0, -18, 0], x: [0, -8, 0], opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: delay + 1.8, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-[#e62b1e] z-20"
              animate={{ y: [0, -22, 0], x: [0, -5, 0], opacity: [0, 0.5, 0], scale: [0.6, 1.1, 0.6] }}
              transition={{ duration: 3.8, repeat: Infinity, delay: delay + 2.2, ease: [0.23, 1, 0.32, 1] }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
});

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
  const { isRTL } = useRTL();
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
      {/* ═══════════ HEADER ═══════════ */}
      <div className="relative pb-12 md:pb-16">
        {/* توهج خلفي مزدوج (مطابق للأقسام الأخرى) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="container-padding relative z-10 max-w-5xl mx-auto text-center">
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

      {/* ═══════════ FORM + IMAGES ═══════════ */}
      <div className="container-padding relative pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <div
            dir="ltr"
            className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16"
          >
            {/* الصورة اليسرى (أنيميشن) */}
            {leftImageSrc && (
              <ContactSideImage
                src={leftImageSrc}
                alt="Left side visual"
                direction="left"
                delay={0.15}
              />
            )}

            {/* النموذج المركزي */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-xl"
              dir="auto"
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

            {/* الصورة اليمنى (أنيميشن) */}
            {rightImageSrc && (
              <ContactSideImage
                src={rightImageSrc}
                alt="Right side visual"
                direction="right"
                delay={0.3}
              />
            )}
          </div>
        </div>
      </div>

      {/* نمط نقاط زخرفي */}
      <div
        className="h-16 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #e62b1e 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </section>
  );
}