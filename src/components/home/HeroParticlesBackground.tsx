"use client";

import { useEffect, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

const PARTICLE_OPTIONS: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: { value: 40, density: { enable: true, width: 800, height: 800 } },
    color: { value: ["#E62B1E", "#3B82F6", "#FACC15", "#22C55E"] },
    shape: { type: "circle" },
    opacity: { value: 0.7 },
    size: { value: { min: 2, max: 6 } },
    move: {
      enable: true,
      speed: 0.5,
      direction: "none",
      random: true,
      outModes: { default: "out" },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "attract" },
    },
    modes: {
      attract: { distance: 150, duration: 0.4, factor: 3 },
    },
  },
  detectRetina: true,
};

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

export default function HeroParticlesBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentional: matchMedia is a browser-only API, must run inside an
    // effect. Single, non-cascading state update on mount.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || reducedMotion) return null;

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="hero-particles"
        options={PARTICLE_OPTIONS}
        className="absolute inset-0 z-[5] pointer-events-auto"
      />
    </ParticlesProvider>
  );
}
