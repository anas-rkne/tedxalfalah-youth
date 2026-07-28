"use client";

import { useMemo, useState, useRef, useCallback, memo } from "react";
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

const SUBJECT_VALUES = [
  "General",
  "Speaking",
  "Sponsorship",
  "Volunteering",
  "Media",
] as const;

/* ═══════════════════════════════════════════
   SubmitButton
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-tedx-red text-white font-bold text-base rounded-2xl hover:bg-tedx-red/90 transition-all duration-300 shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_16px_48px_-12px_rgba(230,43,30,0.6)] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
    >
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{submittingLabel}</span>
        </>
      ) : (
        <>
          <span className="relative z-10">{children}</span>
          <Send className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </>
      )}
    </motion.button>
  );
});

/* ═══════════════════════════════════════════
   CSS Particles
   ═══════════════════════════════════════════ */
const PARTICLES_CSS = `
  @keyframes particle-float {
    0%, 100% { transform: translateY(0) scale(0.5); opacity: 0; }
    50% { opacity: 0.6; }
    100% { transform: translateY(-25px) scale(1); opacity: 0; }
  }
  .particle {
    position: absolute;
    border-radius: 50%;
    background: #e62b1e;
    animation: particle-float 3s ease-in-out infinite;
    pointer-events: none;
  }
`;

/* ═══════════════════════════════════════════
   ContactSideImage
   ═══════════════════════════════════════════ */
const SPRING_CONFIG = { stiffness: 100, damping: 30, mass: 1 };

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
  const parallaxX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], direction === "left" ? [15, -15] : [-15, 15]),
    SPRING_CONFIG
  );
  const parallaxY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    SPRING_CONFIG
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

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

        {!shouldReduceMotion && (
          <>
            <style>{PARTICLES_CSS}</style>
            <div
              className="particle"
              style={{
                width: 8, height: 8,
                top: "25%", left: "-10%",
                animationDelay: `${delay + 0.5}s`,
                animationDuration: "3s",
              }}
            />
            <div
              className="particle"
              style={{
                width: 6, height: 6,
                top: "35%", right: "-8%",
                animationDelay: `${delay + 1.2}s`,
                animationDuration: "2.5s",
              }}
            />
            <div
              className="particle"
              style={{
                width: 5, height: 5,
                bottom: "30%", left: "20%",
                animationDelay: `${delay + 2}s`,
                animationDuration: "3.5s",
              }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════
   Main ContactForm
   ═══════════════════════════════════════════ */
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

  const onSubmit = useCallback(
    async (data: ContactFormValues) => {
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
    },
    [turnstileToken, router]
  );

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const subjectLabels: Record<(typeof SUBJECT_VALUES)[number], string> = {
    General: subjectGeneral,
    Speaking: subjectSpeaking,
    Sponsorship: subjectSponsorship,
    Volunteering: subjectVolunteering,
    Media: subjectMedia,
  };

  return (
    <section className="section-padding relative bg-background overflow-hidden w-full">
      {/* إصلاح عرض الفورم عن طريق تنسيق داخلي */}
      <style>{`
        #contact-form input,
        #contact-form select,
        #contact-form textarea {
          width: 100% !important;
          box-sizing: border-box;
        }
      `}</style>

      {/* ═══════════ HEADER ═══════════ */}
      <div className="relative pb-6 md:pb-10">
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
      <div className="container-padding relative pb-8 md:pb-12 w-full">
        {/* 🔥 تم إجبار الاتجاه LTR لضمان بقاء الصور في أماكنها: صورة اليسار -> نموذج -> صورة اليمين */}
        <div
          dir="ltr"
          className="w-full grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-8 lg:gap-12 xl:gap-16"
        >
          {/* 1. الصورة اليسرى (الولد) - ستظهر دائماً على اليسار بفضل dir="ltr" */}
          {leftImageSrc && (
            <ContactSideImage
              src={leftImageSrc}
              alt="Left side visual"
              direction="left"
              delay={0.15}
            />
          )}

          {/* 2. النموذج (المركز) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full min-w-0 lg:flex-1"
            // 🔥 النموذج نفسه يأخذ الاتجاه العكسي حسب اللغة (النص الداخلي)، دون التأثير على مكان الصور
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="relative w-full p-6 sm:p-8 md:p-10 lg:p-12 rounded-[28px] bg-card/80 backdrop-blur-sm border border-border/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-tedx-red to-transparent rounded-full" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-tedx-red/[0.04] blur-[80px] pointer-events-none" />

              <form
                id="contact-form"
                onSubmit={handleSubmit(onSubmit)}
                className="relative z-10 flex flex-col gap-6 md:gap-7 w-full"
                noValidate
              >
                {/* الاسم */}
                <div className="relative w-full">
                  <Input
                    label={namePlaceholder}
                    id="contact-name"
                    registration={register("name")}
                    placeholder={namePlaceholder}
                    error={errors.name?.message}
                  />
                </div>

                {/* البريد */}
                <div className="relative w-full">
                  <Input
                    label={emailPlaceholder}
                    id="contact-email"
                    registration={register("email")}
                    type="email"
                    placeholder={emailPlaceholder}
                    error={errors.email?.message}
                  />
                </div>

                {/* الموضوع */}
                <div className="relative w-full">
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
                </div>

                {/* الرسالة */}
                <div className="relative w-full">
                  <Input
                    label={messagePlaceholder}
                    id="contact-message"
                    registration={register("message")}
                    placeholder={messagePlaceholder}
                    textarea
                    rows={6}
                    error={errors.message?.message}
                  />
                </div>

                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
                    role="alert"
                    aria-live="polite"
                  >
                    {errorGeneric}
                  </motion.div>
                )}

                <TurnstileWidget onVerify={handleTurnstileVerify} />

                <SubmitButton loading={isSubmitting} submittingLabel={submittingLabel}>
                  {submitLabel}
                </SubmitButton>
              </form>
            </div>
          </motion.div>

          {/* 3. الصورة اليمنى (البنت) - ستظهر دائماً على اليمين بفضل dir="ltr" */}
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

    </section>
  );
}