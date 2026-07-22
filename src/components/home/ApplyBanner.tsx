import { getTranslations } from "next-intl/server";
import ApplyBannerContent from "./ApplyBannerContent";

// TODO: replace with real application deadline once confirmed by client
const APPLICATION_DEADLINE_LABEL = "September 30, 2026";

export default async function ApplyBanner() {
  const t = await getTranslations("home.applyBanner");
  const tCommon = await getTranslations("common"); // للـ CTA

  return (
    <ApplyBannerContent
      // ✅ نصوص الشارة والعنوان الرئيسي
      badgeLabel={t("badgeLabel")}
      text={t("text", { date: APPLICATION_DEADLINE_LABEL })}
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