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

export default function PartnerInquiryForm() {
  const t = useTranslations("page.sponsors.form");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
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
    try {
      const res = await fetch("/api/partner-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/thank-you?type=partner");
    } catch {
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

      <Button variant="primary" size="md" loading={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
