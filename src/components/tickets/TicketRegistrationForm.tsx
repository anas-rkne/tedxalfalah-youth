"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";

const ticketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  numberOfTickets: z.coerce.number().min(1).max(10),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

export default function TicketRegistrationForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
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
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-center text-tedx-gray py-8">
        You&apos;re registered! We&apos;ll send event details to your email.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto flex flex-col gap-4"
      noValidate
    >
      <div>
        <input
          {...register("name")}
          placeholder="Full name"
          className={inputClasses}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          className={inputClasses}
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("phone")}
          placeholder="Phone"
          className={inputClasses}
        />
        {errors.phone && (
          <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Number of Tickets
        </label>
        <input
          type="number"
          min={1}
          max={10}
          {...register("numberOfTickets")}
          className={inputClasses}
        />
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <Button variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? "Registering..." : "Register"}
      </Button>
    </form>
  );
}
