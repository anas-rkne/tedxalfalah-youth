"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Send, Loader2, Check } from "lucide-react";

import TurnstileWidget from "@/components/ui/TurnstileWidget";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { useRTL } from "@/hooks/useRTL";

interface ContactBoxProps {
  heading: string;
  badgeLabel: string;
  intro: string;
  emailLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  errorGeneric: string;
  nameRequired: string;
  emailInvalid: string;
  messageMinLength: string;
}

export default function ContactBox({
  heading,
  badgeLabel,
  intro,
  emailLabel,
  namePlaceholder,
  emailPlaceholder,
  messagePlaceholder,
  submitLabel,
  submittingLabel,
  errorGeneric,
  nameRequired,
  emailInvalid,
  messageMinLength,
}: ContactBoxProps) {
  const { isRTL } = useRTL();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [showSuccess, setShowSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, nameRequired),
        email: z.string().email(emailInvalid),
        message: z.string().min(10, messageMinLength),
      }),
    [nameRequired, emailInvalid, messageMinLength]
  );

  type ContactBoxValues = z.infer<typeof contactSchema>;

  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactBoxValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = useCallback(
    async (data: ContactBoxValues) => {
      setStatus("idle");
      setShowSuccess(false);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, subject: "General", turnstileToken }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          if (res.status === 429) throw new Error("rate_limit");
          if (res.status >= 500) throw new Error("server_error");
          throw new Error("request_failed");
        }
        setShowSuccess(true);
        setTimeout(() => router.push("/thank-you?type=contact"), 1200);
      } catch (e) {
        clearTimeout(timeout);
        setShowSuccess(false);
        const err = e as Error;
        const msg = err?.message;
        if (msg === "rate_limit") toast.error(tCommon("ui.tooManyRequests"));
        else if (msg === "server_error") toast.error(tCommon("ui.serverError"));
        else if (err?.name === "AbortError") toast.error(tCommon("ui.connectionTimedOut"));
        else toast.error(errorGeneric);
        setStatus("error");
      }
    },
    [turnstileToken, router, errorGeneric, tCommon]
  );

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  return (
    <section
      id="contact"
      className="section-padding relative bg-background overflow-hidden w-full scroll-mt-20"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tedx-red/5 blur-3xl" />
      </div>

      <div className="container-padding relative z-10 max-w-3xl mx-auto text-center">
        {/* صورة Artboard 7 في أعلى يمين عمود المحتوى */}
        <img
          src="/images/Artboard 7.svg"
          alt=""
          aria-hidden="true"
className="absolute -top-25 -right-5 w-32 md:w-40 lg:w-48 xl:w-56 pointer-events-none select-none z-0 opacity-80 -rotate-12"     />

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
<h2 className="heading-h1 tracking-[-0.03em] leading-[1.1] mb-0">{heading}</h2>

{/* استبدال الخطوط الزخرفية بصورة Artboard 2 copy 2 */}
<img
  src="/images/Artboard 2 copy 2.svg"
  alt=""
  aria-hidden="true"
className="mx-auto mt-0 block w-48 md:w-64 h-16 md:h-20 object-contain scale-125 origin-center pointer-events-none select-none"
/>

<motion.p
  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, delay: 0.3 }}
  className="text-muted-foreground mt-2 text-base sm:text-lg font-light leading-relaxed"
  dir={isRTL ? "rtl" : "ltr"}
>
  {intro}
</motion.p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative p-6 sm:p-8 md:p-10 rounded-[28px] bg-card/80 backdrop-blur-sm border border-border/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-tedx-red to-transparent rounded-full" />

          {/* صورة Artboard 8 على يمين الفورم عند 30% من الأعلى */}
          <img
            src="/images/Artboard 8.svg"
            alt=""
            aria-hidden="true"
            className="absolute -right-20 top-[20%] translate-x-1/2 w-40 md:w-24 lg:w-28 xl:w-32 pointer-events-none select-none z-10"
          />

          <form
            id="contact-box-form"
            onSubmit={handleSubmit(onSubmit)}
            className="relative z-10 flex flex-col gap-6 w-full text-left"
            noValidate
          >
            <style>{`
              #contact-box-form input,
              #contact-box-form textarea {
                width: 100% !important;
                box-sizing: border-box;
              }
            `}</style>

            <Input
              label={namePlaceholder}
              id="contact-box-name"
              registration={register("name")}
              placeholder={namePlaceholder}
              error={errors.name?.message}
            />

            <Input
              label={emailPlaceholder}
              id="contact-box-email"
              registration={register("email")}
              type="email"
              placeholder={emailPlaceholder}
              error={errors.email?.message}
            />

            <Input
              label={messagePlaceholder}
              id="contact-box-message"
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
                role="alert"
                aria-live="polite"
              >
                {errorGeneric}
              </motion.div>
            )}

            <TurnstileWidget onVerify={handleTurnstileVerify} />

            <motion.button
              type="submit"
              disabled={isSubmitting || showSuccess}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-tedx-red text-white font-bold text-base rounded-2xl hover:bg-tedx-red/90 transition-all duration-300 shadow-[0_8px_30px_-12px_rgba(230,43,30,0.4)] hover:shadow-[0_16px_48px_-12px_rgba(230,43,30,0.6)] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {showSuccess ? (
                <span className="flex items-center gap-2 relative z-10">
                  <Check className="w-5 h-5" />
                  <span>{submitLabel}</span>
                </span>
              ) : isSubmitting ? (
                <span className="flex items-center gap-2 relative z-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{submittingLabel}</span>
                </span>
              ) : (
                <>
                  <span className="relative z-10">{submitLabel}</span>
                  <Send className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.a
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          href="mailto:marhaba@tedxalfalahyouth.com"
          className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted border border-border text-foreground text-sm hover:bg-muted/80 hover:border-border/80 transition-colors duration-200"
        >
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span>{emailLabel}</span>
        </motion.a>
      </div>
    </section>
  );
}