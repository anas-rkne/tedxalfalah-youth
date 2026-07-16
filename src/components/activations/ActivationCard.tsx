"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Activation } from "@/lib/types";

interface ActivationCardProps {
  activation: Activation;
  index: number;
}

export default function ActivationCard({
  activation,
  index,
}: ActivationCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      className={`flex flex-col md:flex-row gap-8 items-center ${
        isReversed ? "md:flex-row-reverse" : ""
      }`}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.15 }}
    >
      <div className="relative w-full md:w-1/2 aspect-video rounded-lg [perspective:800px]">
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          whileHover={shouldReduceMotion ? {} : { rotateY: 180, y: -10 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg overflow-hidden">
            <Image
              src={activation.imageUrl}
              alt={activation.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg overflow-hidden bg-gray-100 p-6 flex flex-col justify-center [transform:rotateY(180deg)]">
            <p className="text-sm text-red-600 font-medium mb-2">
              {activation.locationInVenue}
            </p>
            <p className="text-gray-500 leading-relaxed text-sm">
              {activation.description}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="w-full md:w-1/2"
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      >
        <h2 className="text-2xl font-bold mb-2">{activation.name}</h2>
        <p className="text-sm text-red-600 font-medium mb-3">
          {activation.locationInVenue}
        </p>
        <p className="text-gray-500 leading-relaxed">
          {activation.description}
        </p>
      </motion.div>
    </motion.div>
  );
}
