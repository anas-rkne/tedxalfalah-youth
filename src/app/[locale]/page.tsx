import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getEventInfo } from "@/lib/data";
import JsonLd from "@/components/JsonLd";
import { eventSchema, webSiteSchema } from "@/lib/json-ld";
import ScrollSection from "@/components/ui/ScrollSection";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Theme from "@/components/home/Theme";
import SpeakersPreview from "@/components/home/SpeakersPreview";
import Highlights from "@/components/home/Highlights";
import ScheduleBanner from "@/components/home/ScheduleBanner";
import ApplyBanner from "@/components/home/ApplyBanner";
import SponsorsStrip from "@/components/home/SponsorsStrip";
import ContactForm from "@/components/home/ContactFormWrapper";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
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
        <Hero locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="about" className="bg-white">
        <About locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="theme" className="bg-white">
        <Theme locale={locale} />
      </ScrollSection>

      <ScrollSection variant="stagger" id="speakers" className="bg-white">
        <SpeakersPreview locale={locale} />
      </ScrollSection>

      <ScrollSection variant="grid" id="highlights" className="bg-white">
        <Highlights locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="schedule" className="bg-white">
        <ScheduleBanner locale={locale}  />
        
      </ScrollSection>

      <ScrollSection variant="default" id="apply" className="bg-white">
        <ApplyBanner locale={locale} />
      </ScrollSection>

      <ScrollSection variant="stagger" id="sponsors" className="bg-white">
        <SponsorsStrip locale={locale} />
      </ScrollSection>

      <ScrollSection variant="default" id="contact" className="bg-white">
        <ContactForm locale={locale} />
      </ScrollSection>
    </>
  );
}