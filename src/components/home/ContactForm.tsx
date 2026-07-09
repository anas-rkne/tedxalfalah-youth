"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  subject: z.enum([
    "General",
    "Speaking",
    "Sponsorship",
    "Volunteering",
    "Media",
  ]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClasses =
  "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tedx-red";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    reset,
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
      <section className="py-16 md:py-24 bg-tedx-white">
        <SectionContainer className="max-w-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Message Sent</h2>
          <p className="text-tedx-gray">
            Thanks for reaching out — we&apos;ll get back to you soon.
          </p>
        </SectionContainer>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-tedx-white">
      <SectionContainer className="max-w-xl">
        <h2 className="text-3xl font-bold text-center mb-2">Contact Us</h2>
        <p className="text-center text-sm text-tedx-gray mb-8">
          marhaba@tedxalfalahyouth.com
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div>
            <input
              {...register("name")}
              placeholder="Full name"
              className={inputClasses}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {errors.name.message}
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
              <p className="text-red-600 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <select {...register("subject")} className={inputClasses}>
              <option value="General">General</option>
              <option value="Speaking">Speaking</option>
              <option value="Sponsorship">Sponsorship</option>
              <option value="Volunteering">Volunteering</option>
              <option value="Media">Media</option>
            </select>
          </div>

          <div>
            <textarea
              {...register("message")}
              placeholder="Your message"
              rows={5}
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

          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </SectionContainer>
    </section>
  );
}
