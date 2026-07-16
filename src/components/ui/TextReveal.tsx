"use client";

import { motion, useReducedMotion } from "framer-motion";

interface TextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  wordDelay?: number;
  serif?: boolean;
}

export default function TextReveal({
  text,
  as: Tag = "h1",
  className = "",
  delay = 0,
  wordDelay = 0.05,
  serif = false,
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const words = text.split(" ");

  if (shouldReduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: wordDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={`${serif ? "font-serif" : ""} ${className}`}
    >
      <Tag className="inline">
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={wordVariants}
            className="inline-block"
            style={{ marginInlineEnd: "0.25em" }}
          >
            {word}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
}
