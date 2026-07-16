"use client";

import { useReducedMotion, motion } from "framer-motion";
import dynamic from "next/dynamic";
import HeroTypewriterTitle from "@/components/home/HeroTypewriterTitle";
import Countdown from "@/components/shared/Countdown";
import ActionButtons from "@/components/home/ActionButtons";
import ScrollIndicator from "@/components/ui/ScrollIndicator";

const HeroBackgroundEffects = dynamic(
  () => import("@/components/home/HeroBackgroundEffects"),
  { ssr: false }
);

const EVENT_DATE = "2026-11-15T09:00:00+04:00";

interface Props {
  title: string;
  subtitle: string;
  scrollLabel: string;
  applyLabel: string;
  ticketsLabel: string;
}

export default function HeroDynamicContent({
  title,
  subtitle,
  scrollLabel,
  applyLabel,
  ticketsLabel,
}: Props) {
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = "relative z-10 px-4 flex flex-col items-center gap-4 md:gap-6 min-h-screen pt-20 pb-0 justify-center";

  if (shouldReduceMotion) {
    return (
      <>
        <HeroBackgroundEffects />
        <div className={containerClasses}>
          <HeroTypewriterTitle title={title} />
          <p className="text-lg md:text-2xl text-gray-700 max-w-2xl">{subtitle}</p>
          <Countdown targetDate={EVENT_DATE} />
          <ActionButtons applyLabel={applyLabel} ticketsLabel={ticketsLabel} />
        </div>
        <ScrollIndicator text={scrollLabel} />
      </>
    );
  }

  return (
    <>
      <HeroBackgroundEffects />
      <div className={containerClasses}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        >
          <HeroTypewriterTitle title={title} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="text-lg md:text-2xl text-gray-700 max-w-2xl"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
        >
          <Countdown targetDate={EVENT_DATE} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <ActionButtons applyLabel={applyLabel} ticketsLabel={ticketsLabel} />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
      >
        <ScrollIndicator text={scrollLabel} />
      </motion.div>
    </>
  );
}