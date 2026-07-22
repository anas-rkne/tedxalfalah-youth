import ScrollSection from "@/components/ui/ScrollSection";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Theme from "@/components/home/Theme";
import SpeakersPreview from "@/components/home/SpeakersPreview";
import Highlights from "@/components/home/Highlights";
import ApplyBanner from "@/components/home/ApplyBanner";
import SponsorsStrip from "@/components/home/SponsorsStrip";
import ContactForm from "@/components/home/ContactForm";

export default function Home() {
  return (
    <>
      <ScrollSection variant="hero" id="hero" className="bg-white">
        <Hero />
      </ScrollSection>

      <ScrollSection variant="default" id="about" className="bg-white">
        <About />
      </ScrollSection>

      <ScrollSection variant="default" id="theme" className="bg-white">
        <Theme />
      </ScrollSection>

      <ScrollSection variant="stagger" id="speakers" className="bg-white">
        <SpeakersPreview />
      </ScrollSection>

      <ScrollSection variant="grid" id="highlights" className="bg-white">
        <Highlights />
      </ScrollSection>

      <ScrollSection variant="default" id="apply" className="bg-white">
        <ApplyBanner />
      </ScrollSection>

      <ScrollSection variant="stagger" id="sponsors" className="bg-white">
        <SponsorsStrip />
      </ScrollSection>
    </>
  );
}