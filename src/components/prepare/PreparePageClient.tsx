"use client";

import PrepareHero from "./PrepareHero";
import { TimeAndPlace, WhatToBring } from "./TimeAndPlaceSection";
import LogisticsSection from "./LogisticsSection";
import ProgressBar from "./ProgressBar";
import StickySummary from "./StickySummary";

export default function PreparePageClient() {
  return (
    <main className="relative min-h-screen bg-[#0A0A0A] text-white selection:bg-tedx-red selection:text-white font-sans">
      <ProgressBar />
      <PrepareHero />
      <TimeAndPlace />
      <WhatToBring />
      <LogisticsSection />
      <StickySummary />
    </main>
  );
}
