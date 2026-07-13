"use client";

import dynamic from "next/dynamic";

const HeroParticlesBackground = dynamic(
  () => import("@/components/home/HeroParticlesBackground"),
  { ssr: false }
);
const WelcomeConfetti = dynamic(
  () => import("@/components/ui/WelcomeConfetti"),
  { ssr: false }
);

export default function HeroDynamicContent() {
  return (
    <>
      <HeroParticlesBackground />
      <WelcomeConfetti />
    </>
  );
}
