"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import Input from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

export default function PartnerInquiryForm() {
  const t = useTranslations("page.sponsors.form");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [showSuccess, setShowSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const partnerSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("errors.nameRequired")),
        organization: z.string().min(1, t("errors.organizationRequired")),
        email: z.string().email(t("errors.emailInvalid")),
        phone: z.string().min(1, t("errors.phoneRequired")),
        message: z.string().min(10, t("errors.messageMinLength")),
      }),
    [t]
  );

  type PartnerFormValues = z.infer<typeof partnerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormValues>({ resolver: zodResolver(partnerSchema) });

  async function onSubmit(data: PartnerFormValues) {
    setStatus("idle");
    setShowSuccess(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch("/api/partner-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        if (res.status === 429) throw new Error("rate_limit");
        if (res.status >= 500) throw new Error("server_error");
        throw new Error("request_failed");
      }
      setShowSuccess(true);
      setTimeout(() => router.push("/thank-you?type=partner"), 1200);
    } catch (e: any) {
      clearTimeout(timeout);
      setShowSuccess(false);
      const msg = e?.message;
      if (msg === "rate_limit") toast.error(tCommon("ui.tooManyRequests"));
      else if (msg === "server_error") toast.error(tCommon("ui.serverError"));
      else if (e?.name === "AbortError") toast.error(tCommon("ui.connectionTimedOut"));
      else toast.error(t("errorGeneric"));
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-lg mx-auto flex flex-col gap-4"
      noValidate
    >
      <Input
        label={t("namePlaceholder")}
        id="partner-name"
        registration={register("name")}
        placeholder={t("namePlaceholder")}
        error={errors.name?.message}
      />
      <Input
        label={t("organizationPlaceholder")}
        id="partner-org"
        registration={register("organization")}
        placeholder={t("organizationPlaceholder")}
        error={errors.organization?.message}
      />
      <Input
        label={t("emailPlaceholder")}
        id="partner-email"
        registration={register("email")}
        type="email"
        placeholder={t("emailPlaceholder")}
        error={errors.email?.message}
      />
      <Input
        label={t("phonePlaceholder")}
        id="partner-phone"
        registration={register("phone")}
        placeholder={t("phonePlaceholder")}
        error={errors.phone?.message}
      />
      <Input
        label={t("messagePlaceholder")}
        id="partner-message"
        registration={register("message")}
        placeholder={t("messagePlaceholder")}
        textarea
        rows={4}
        error={errors.message?.message}
      />

      {status === "error" && (
        <p className="text-red-600 text-sm">{t("errorGeneric")}</p>
      )}

      <TurnstileWidget onVerify={setTurnstileToken} />

      <Button variant="primary" size="md" loading={isSubmitting && !showSuccess} showCheck={showSuccess} loadingText={t("submit")}>
        {t("submit")}
      </Button>
    </form>
  );
}
