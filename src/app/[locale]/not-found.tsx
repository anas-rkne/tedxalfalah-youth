import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";
import TextReveal from "@/components/ui/TextReveal";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for does not exist.",
};

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tNav = await getTranslations("common.nav");

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16">
      <SectionContainer className="max-w-xl text-center">
        <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-4">
          {t("eyebrow")}
        </p>
        <TextReveal text={t("title")} as="h1" className="text-4xl md:text-5xl font-bold mb-6" />
        <p className="text-gray-500 leading-relaxed mb-10">{t("body")}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" variant="primary" size="md">
            {t("backHome")}
          </Button>
          <Button href="/apply" variant="outline" size="md">
            {tNav("apply")}
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-10">
          {t("exploreLabel")}{" "}
          <Link href="/team" className="underline hover:text-red-600">
            {tNav("team")}
          </Link>{" "}
          ·{" "}
          <Link href="/apply" className="underline hover:text-red-600">
            {tNav("apply")}
          </Link>
        </p>
      </SectionContainer>
    </section>
  );
}
