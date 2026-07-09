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
      <Hero />
      <About />
      <Theme />
      <SpeakersPreview />
      <Highlights />
      <ApplyBanner />
      <SponsorsStrip />
      <ContactForm />
    </>
  );
}
