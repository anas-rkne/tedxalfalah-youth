"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { TicketType } from "@/lib/tickets";

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

interface TicketPurchaseFormProps {
  ticketTypes: TicketType[];
}

export default function TicketPurchaseForm({
  ticketTypes,
}: TicketPurchaseFormProps) {
  const t = useTranslations("page.tickets.purchaseForm");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");

  const purchaseSchema = useMemo(
    () =>
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.coerce.number().min(1).max(10),
        name: z.string().min(1, t("errors.nameRequired")),
        email: z.string().email(t("errors.emailInvalid")),
      }),
    [t]
  );

  type PurchaseFormValues = z.infer<typeof purchaseSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { ticketTypeId: ticketTypes[0]?.id, quantity: 1 },
  });

  async function onSubmit(data: PurchaseFormValues) {
    setStatus("loading");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error("Checkout failed");
      // إعادة توجيه المتصفح لصفحة Stripe Checkout الخارجية — استخدام
      // قياسي وآمن، وليس تعديلاً لحالة React.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = json.url;
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
      <div>
        <label className="block text-sm font-medium mb-1">{t("ticketType")}</label>
        <select {...register("ticketTypeId")} className={inputClasses}>
          {ticketTypes.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.name} — {ticket.priceAED} AED
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("quantity")}</label>
        <input
          type="number"
          min={1}
          max={10}
          {...register("quantity")}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="purchase-name" className="block text-sm font-medium mb-1">
          {t("namePlaceholder")}
        </label>
        <input
          id="purchase-name"
          {...register("name")}
          placeholder={t("namePlaceholder")}
          className={inputClasses}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1" role="alert">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="purchase-email" className="block text-sm font-medium mb-1">
          {t("emailPlaceholder")}
        </label>
        <input
          id="purchase-email"
          {...register("email")}
          type="email"
          placeholder={t("emailPlaceholder")}
          className={inputClasses}
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1" role="alert">{errors.email.message}</p>
        )}
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">{t("errorGeneric")}</p>
      )}

      <TurnstileWidget onVerify={setTurnstileToken} />

      <Button variant="primary" size="md" disabled={status === "loading"}>
        {status === "loading" ? t("submitting") : t("submit")}
      </Button>

      <p className="text-xs text-tedx-gray text-center">
        {t("stripeNote")}
      </p>
    </form>
  );
}
