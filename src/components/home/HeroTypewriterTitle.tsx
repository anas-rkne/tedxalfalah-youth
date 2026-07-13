"use client";

import { TypeAnimation } from "react-type-animation";

interface HeroTypewriterTitleProps {
  title: string;
}

export default function HeroTypewriterTitle({
  title,
}: HeroTypewriterTitleProps) {
  return (
    <TypeAnimation
      sequence={[title, 3000]}
      wrapper="h1"
      speed={{ type: "keyStrokeDelayInMs", value: 100 }}
      cursor
      repeat={Infinity}
      className="text-5xl md:text-7xl font-bold text-tedx-white"
    />
  );
}
