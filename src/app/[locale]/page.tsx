import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getEventInfo } from "@/lib/data";
import { SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";
import { eventSchema, webSiteSchema } from "@/lib/json-ld";
import ScrollSection from "@/components/ui/ScrollSection";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Theme from "@/components/home/Theme";
import Highlights from "@/components/home/Highlights";
import TeamPreview from "@/components/home/TeamPreview";
import ApplyBanner from "@/components/home/ApplyBanner";
import SponsorsStrip from "@/components/home/SponsorsStrip";
import ContactBox from "@/components/contact/ContactBoxWrapper";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${SITE_URL}/${locale}` },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const eventInfo = await getEventInfo();

  const eventSchemaData = eventSchema({
    title: "TEDxAlFalah Youth",
    date: eventInfo?.date,
    venue: eventInfo?.venue,
    description:
      "Young voices. Real ideas. The future starts earlier than we think. An independently organized TEDx event.",
  });

  return (
    <>
      <JsonLd data={webSiteSchema()} />
      <JsonLd data={eventSchemaData} />
      <ScrollSection variant="hero" id="hero" className="bg-white min-h-[calc(100vh-5rem)]">
        <Hero locale={locale} eventDate={eventInfo?.date} />
      </ScrollSection>

      {eventInfo?.showSponsors && (
        <ScrollSection variant="default" id="sponsors" className="bg-white">
          <SponsorsStrip locale={locale} />
        </ScrollSection>
      )}

      <ScrollSection variant="default" id="contact" className="bg-white">
        <ContactBox locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="about" className="bg-white">
        <About locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="theme" className="bg-white">
        <Theme locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="highlights" className="bg-white">
        <Highlights locale={locale} />
      </ScrollSection>

      {eventInfo?.showTeam && (
        <ScrollSection variant="stagger" id="team" className="bg-white">
          <TeamPreview locale={locale} />
        </ScrollSection>
      )}

      <ScrollSection variant="default" id="apply" className="bg-white">
        <ApplyBanner locale={locale} />
      </ScrollSection>
    </>
  );
}