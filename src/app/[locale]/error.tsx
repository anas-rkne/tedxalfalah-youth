"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="min-h-[60vh] flex items-center justify-center section-padding">
      <SectionContainer className="max-w-lg text-center">
        <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          {t("title")}
        </h1>
        <p className="text-gray-500 leading-relaxed mb-10">
          {t("description")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="md" onClick={reset}>
            {t("tryAgain")}
          </Button>
          <Button variant="outline" size="md" href="/">
            {t("backToHome")}
          </Button>
        </div>
      </SectionContainer>
    </section>
  );
}
