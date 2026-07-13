"use client";

import { useTranslations } from "next-intl";
import FaqAccordion, { FaqItem } from "@/components/shared/FaqAccordion";

export default function ApplyFAQ() {
  const t = useTranslations("page.apply.faqItems");
  const items: FaqItem[] = Array.from({ length: 5 }, (_, i) => ({
    question: t(`item${i + 1}.question`),
    answer: t(`item${i + 1}.answer`),
  }));

  return <FaqAccordion items={items} />;
}
