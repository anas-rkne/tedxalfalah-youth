import { getTranslations } from "next-intl/server";
import ApplyBannerContent from "./ApplyBannerContent";
import { APPLICATION_DEADLINE } from "@/lib/constants";

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatDeadlineLabel(iso: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) {
    const d = new Date(iso);
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    if (locale === "ar") return `${day} ${MONTHS_AR[d.getUTCMonth()]} ${year}`;
    return `${day} ${MONTHS_EN[d.getUTCMonth()]} ${year}`;
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (locale === "ar") return `${day} ${MONTHS_AR[month]} ${year}`;
  return `${day} ${MONTHS_EN[month]} ${year}`;
}

export default async function ApplyBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.applyBanner" });
  const isClosed = new Date() > new Date(APPLICATION_DEADLINE);
  const deadlineLabel = formatDeadlineLabel(APPLICATION_DEADLINE, locale);

  return (
    <ApplyBannerContent
      isClosed={isClosed}
      closedCta={t("closedCta")}
      // ✅ نصوص الشارة والعنوان الرئيسي
      badgeLabel={t("badgeLabel")}
      text={t("text", { date: deadlineLabel })}
      subtitle={t("subtitle")}
      cta={t("cta")} // سيتم استخدام هذا للنص الموجود في الزر

      // ✅ نصوص قسم خطوات التقديم
      stepsHeading={t("stepsHeading")}
      step1Title={t("step1Title")}
      step1Desc={t("step1Desc")}
      step2Title={t("step2Title")}
      step2Desc={t("step2Desc")}
      step3Title={t("step3Title")}
      step3Desc={t("step3Desc")}

      // ✅ نصوص قسم "لماذا تقدم"
      whyApplyLabel={t("whyApplyLabel")}
      whyApplyHeading={t("whyApplyHeading")}
      reasons={[
        t("reason1"),
        t("reason2"),
        t("reason3"),
        t("reason4"),
        t("reason5"),
      ]}

      placeholderTitle={t("placeholderTitle")}
      placeholderSubtitle={t("placeholderSubtitle")}

      stageBadgeLabel={t("stageBadgeLabel")}
      stageTitle={t("stageTitle")}
      stageDescription={t("stageDescription")}

      // ✅ نصوص قسم CTA النهائي
      ctaHeading={t("ctaHeading")}
      ctaDescription={t("ctaDescription")}
    />
  );
}
