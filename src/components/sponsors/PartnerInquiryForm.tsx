"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  organization: z.string().min(1, "Organization is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

export default function PartnerInquiryForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormValues>({ resolver: zodResolver(partnerSchema) });

  async function onSubmit(data: PartnerFormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/partner-inquiry", {
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
        Thank you — our partnerships team will be in touch soon.
      </p>
    );
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
          placeholder="Full name"
          className={inputClasses}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("organization")}
          placeholder="Organization"
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
        <textarea
          {...register("message")}
          placeholder="Tell us about your organization and interest in partnering"
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
        <p className="text-red-600 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <Button variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Inquiry"}
      </Button>
    </form>
  );
}
