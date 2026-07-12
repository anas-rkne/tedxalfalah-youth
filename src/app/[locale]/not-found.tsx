import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tNav = await getTranslations("common.nav");

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16">
      <SectionContainer className="max-w-xl text-center">
        <p className="text-tedx-red font-bold text-sm uppercase tracking-widest mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("title")}</h1>
        <p className="text-tedx-gray leading-relaxed mb-10">{t("body")}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" variant="primary" size="md">
            {t("backHome")}
          </Button>
          <Button href="/speakers" variant="outline" size="md">
            {t("meetSpeakers")}
          </Button>
        </div>

        <p className="text-sm text-tedx-gray mt-10">
          {t("exploreLabel")}{" "}
          <Link href="/apply" className="underline hover:text-tedx-red">
            {tNav("apply")}
          </Link>{" "}
          ·{" "}
          <Link href="/tickets" className="underline hover:text-tedx-red">
            {tNav("tickets")}
          </Link>{" "}
          ·{" "}
          <Link href="/venue" className="underline hover:text-tedx-red">
            {tNav("venue")}
          </Link>
        </p>
      </SectionContainer>
    </section>
  );
}
