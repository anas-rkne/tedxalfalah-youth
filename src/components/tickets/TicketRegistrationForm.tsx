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

export default function TicketRegistrationForm() {
  const t = useTranslations("page.tickets.registerForm");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  const ticketSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("errors.nameRequired")),
        email: z.string().email(t("errors.emailInvalid")),
        phone: z.string().min(1, t("errors.phoneRequired")),
        numberOfTickets: z.coerce.number().min(1).max(10),
      }),
    [t]
  );

  type TicketFormValues = z.infer<typeof ticketSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { numberOfTickets: 1 },
  });

  async function onSubmit(data: TicketFormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/thank-you?type=tickets");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto flex flex-col gap-4"
      noValidate
    >
      <Input
        label={t("namePlaceholder")}
        id="reg-name"
        registration={register("name")}
        placeholder={t("namePlaceholder")}
        error={errors.name?.message}
      />
      <Input
        label={t("emailPlaceholder")}
        id="reg-email"
        registration={register("email")}
        type="email"
        placeholder={t("emailPlaceholder")}
        error={errors.email?.message}
      />
      <Input
        label={t("phonePlaceholder")}
        id="reg-phone"
        registration={register("phone")}
        placeholder={t("phonePlaceholder")}
        error={errors.phone?.message}
      />
      <Input
        label={t("numberOfTickets")}
        id="reg-tickets"
        registration={register("numberOfTickets")}
        type="number"
        min={1}
        max={10}
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
