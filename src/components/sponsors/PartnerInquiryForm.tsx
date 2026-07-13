"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { useRouter } from "@/i18n/navigation";

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

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
      <div>
        <input
          {...register("name")}
          placeholder={t("namePlaceholder")}
          className={inputClasses}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("organization")}
          placeholder={t("organizationPlaceholder")}
          className={inputClasses}
        />
        {errors.organization && (
          <p className="text-red-600 text-sm mt-1">
            {errors.organization.message}
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
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("phone")}
          placeholder={t("phonePlaceholder")}
          className={inputClasses}
        />
        {errors.phone && (
          <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <textarea
          {...register("message")}
          placeholder={t("messagePlaceholder")}
          rows={4}
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

      <Button variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
