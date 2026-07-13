"use client";

import { motion } from "framer-motion";
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
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      className={`flex flex-col md:flex-row gap-8 items-center ${
        isReversed ? "md:flex-row-reverse" : ""
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.15 }}
    >
      <div className="relative w-full md:w-1/2 aspect-video rounded-lg [perspective:800px]">
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          whileHover={{ rotateY: 180, y: -10 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg overflow-hidden">
            <Image
              src={activation.imageUrl}
              alt={activation.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg overflow-hidden bg-tedx-gray-light p-6 flex flex-col justify-center [transform:rotateY(180deg)]">
            <p className="text-sm text-tedx-red font-medium mb-2">
              {activation.locationInVenue}
            </p>
            <p className="text-tedx-gray leading-relaxed text-sm">
              {activation.description}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="w-full md:w-1/2"
        whileTap={{ scale: 0.98 }}
      >
        <h2 className="text-2xl font-bold mb-2">{activation.name}</h2>
        <p className="text-sm text-tedx-red font-medium mb-3">
          {activation.locationInVenue}
        </p>
        <p className="text-tedx-gray leading-relaxed">
          {activation.description}
        </p>
      </motion.div>
    </motion.div>
  );
}
