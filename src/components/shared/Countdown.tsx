"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO date string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    // Intentional: renders a placeholder on the server, then flips to the
    // live countdown once mounted client-side, avoiding a hydration
    // mismatch between server render time and client render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Avoid hydration mismatch: render nothing meaningful until mounted client-side
  if (!mounted) {
    return <div className="h-24" />;
  }

  if (!timeLeft) {
    return (
      <p className="text-2xl font-bold text-tedx-red">We&apos;re live!</p>
    );
  }

  const units: { label: string; value: number }[] = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-4 md:gap-6">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-tedx-white/10 border border-tedx-white/30 rounded">
            <span className="text-2xl md:text-3xl font-bold text-tedx-white tabular-nums">
              {String(unit.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs md:text-sm text-tedx-white/70 mt-1 uppercase tracking-wide">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
