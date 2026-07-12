import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
import AnimatedCheck from "@/components/ui/AnimatedCheck";

export const metadata: Metadata = {
  title: "Thank You",
};

const VALID_TYPES = ["contact", "apply", "partner", "tickets"] as const;
type ThankYouType = (typeof VALID_TYPES)[number];

function isValidType(value: string | undefined): value is ThankYouType {
  return Boolean(value && (VALID_TYPES as readonly string[]).includes(value));
}

interface ThankYouPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ThankYouPage({
  searchParams,
}: ThankYouPageProps) {
  const { type } = await searchParams;
  const key = isValidType(type) ? type : "default";

  const t = await getTranslations(`thankYou.${key}`);
  const ctaHref =
    key === "apply" || key === "tickets" ? "/schedule" : "/";

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16">
      <SectionContainer className="max-w-lg text-center">
        <AnimatedCheck />
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-tedx-gray leading-relaxed mb-10">{t("body")}</p>
        <Button href={ctaHref} variant="primary" size="md">
          {t("cta")}
        </Button>
      </SectionContainer>
    </section>
  );
}
