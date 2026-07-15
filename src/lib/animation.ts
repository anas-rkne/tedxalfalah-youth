/** ثوابت زمنية موحّدة للرسوم المتحركة — Framer Motion v12 */

export const DURATIONS = {
  fast: 0.2,
  normal: 0.4,
  medium: 0.5,
  slow: 0.6,
  reveal: 0.8,
} as const;

export const EASINGS = {
  standard: "easeOut" as const,
  smooth: "easeInOut" as const,
};

export const SPRING = {
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 10 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 20 },
};

export const VIEWPORT = {
  once: true as const,
  amount: 0.2 as const,
};

export const STAGGER = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.1,
  card: 0.15,
};

export const FADE_UP = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: DURATIONS.medium, ease: EASINGS.standard },
};

export const SLIDE_UP = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: DURATIONS.medium, ease: EASINGS.standard },
};

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: VIEWPORT,
  transition: { duration: DURATIONS.medium, ease: EASINGS.standard },
};

export const CLIP_REVEAL = {
  initial: { clipPath: "inset(0 100% 0 0)" },
  whileInView: { clipPath: "inset(0 0% 0 0)" },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: DURATIONS.reveal, ease: "easeInOut" },
};

export const SPRING_LIFT = {
  whileHover: { y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" },
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

export const MAGNETIC = {
  stiffness: 150,
  damping: 15,
  mass: 0.1,
};
