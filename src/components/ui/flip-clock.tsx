"use client";

import React from "react"; // ✅ إضافة هذا السطر تحل مشكلة 'React refers to a UMD global'
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import {
  FC,
  HTMLAttributes,
  memo,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const flipUnitVariants = cva(
  "relative subpixel-antialiased perspective-[1000px] rounded-md overflow-hidden",
  {
    variants: {
      size: {
        sm: "w-[clamp(1.5rem,4.5vw,2rem)] min-w-[clamp(1.5rem,4.5vw,2rem)] h-[clamp(2rem,6vw,3rem)] text-[clamp(1rem,3vw,1.5rem)]",
        md: "w-[clamp(2rem,5.5vw,3rem)] min-w-[clamp(2rem,5.5vw,3rem)] h-[clamp(3rem,8vw,4.5rem)] text-[clamp(1.5rem,4.5vw,2.5rem)]",
        lg: "w-[clamp(2.5rem,6.5vw,3.5rem)] min-w-[clamp(2.5rem,6.5vw,3.5rem)] h-[clamp(3.5rem,9.5vw,5.5rem)] text-[clamp(1.75rem,5.5vw,3rem)]",
        xl: "w-[clamp(3rem,8vw,4.5rem)] min-w-[clamp(3rem,8vw,4.5rem)] h-[clamp(4rem,11vw,7rem)] text-[clamp(2rem,6.5vw,4.5rem)]",
      },
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background text-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

interface FlipUnitProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flipUnitVariants> {
  digit: number | string;
}

const commonCardStyle = cn(
  "absolute inset-x-0 overflow-hidden h-1/2 bg-inherit text-inherit",
);

const FlipUnit: FC<FlipUnitProps> = memo(function FlipUnit({
  digit,
  size,
  variant,
  className,
}: FlipUnitProps) {
  const [flipping, setFlipping] = useState(false);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setFlipping(false);
        prevDigitRef.current = digit;
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [digit]);

  return (
    <div className={cn(flipUnitVariants({ size, variant }), className)}>
      {/* Background Top */}
      <div className={cn(commonCardStyle, "rounded-t-lg top-0")}>
        <DigitSpan position="top">{digit}</DigitSpan>
      </div>
      <div className={cn(commonCardStyle, "rounded-b-lg translate-y-full")}>
        <DigitSpan position="bottom">{prevDigitRef.current}</DigitSpan>
      </div>
      <div
        className={cn(
          commonCardStyle,
          "z-20 origin-bottom backface-hidden rounded-t-lg",
          flipping && "animate-flip-top",
        )}
      >
        <DigitSpan position="top">{prevDigitRef.current}</DigitSpan>
      </div>
      <div
        className={cn(
          commonCardStyle,
          "z-10 origin-top backface-hidden rounded-b-lg translate-y-full",
          flipping && "animate-flip-bottom",
        )}
        style={{ transform: "rotateX(90deg)" }}
      >
        <DigitSpan position="bottom">{digit}</DigitSpan>
      </div>
      <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-background/50 z-30" />
    </div>
  );
});

interface DigitSpanProps {
  children: ReactNode;
  position?: "top" | "bottom";
}

function DigitSpan({ children, position }: DigitSpanProps) {
  return (
    <span
      className={cn(
        "absolute left-0 right-0 w-full flex items-center justify-center",
        "h-[200%]",
      )}
      style={{
        top: position === "top" ? "0%" : "-100%",
      }}
    >
      {children}
    </span>
  );
}

const flipClockVariants = cva(
  "relative flex justify-center items-center font-mono font-medium",
  {
    variants: {
      size: {
        sm: "text-2xl space-x-0.5",
        md: "text-4xl space-x-1",
        lg: "text-5xl space-x-1.5",
        xl: "text-7xl space-x-2",
      },
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        muted: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

interface FlipClockProps
  extends
    VariantProps<typeof flipClockVariants>,
    HTMLAttributes<HTMLDivElement> {
  countdown?: boolean;
  targetDate?: Date;
  showDays?: "auto" | "always" | "never";
  unitClassName?: string;
  separatorClassName?: string;
  labels?: string[];
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type FlipClockSize = NonNullable<
  VariantProps<typeof flipClockVariants>["size"]
>;

const heightMap: Record<FlipClockSize, string> = {
  sm: "text-[clamp(1rem,3vw,1.5rem)]",
  md: "text-[clamp(1.5rem,4.5vw,2.5rem)]",
  lg: "text-[clamp(1.75rem,5.5vw,3rem)]",
  xl: "text-[clamp(2rem,6.5vw,4.5rem)]",
};

function ClockSeparator({ size, className }: { size?: FlipClockSize; className?: string }) {
  return (
    <span
      className={cn(
        "text-center -translate-y-[8%]",
        size ? heightMap[size] : heightMap["md"],
        className
      )}
    >
      :
    </span>
  );
}

const FlipClock = ({
  countdown = false,
  targetDate,
  size,
  variant,
  showDays = "auto",
  className,
  unitClassName,
  separatorClassName,
  labels = [],
  ...props
}: FlipClockProps) => {
  const [time, setTime] = useState<TimeLeft>(getTime(countdown, targetDate));
  const [isMounted, setIsMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const newTime = getTime(countdown, targetDate);
      setTime((prev) => {
        if (
          prev.days === newTime.days &&
          prev.hours === newTime.hours &&
          prev.minutes === newTime.minutes &&
          prev.seconds === newTime.seconds
        ) {
          return prev;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [countdown, targetDate]);

  if (!isMounted) return <div className="h-24" />;

  const daysStr = String(time.days).padStart(3, "0");
  const hoursStr = String(time.hours).padStart(2, "0");
  const minutesStr = String(time.minutes).padStart(2, "0");
  const secondsStr = String(time.seconds).padStart(2, "0");

  const shouldShowDays =
    countdown && (showDays === "always" || (showDays === "auto" && time.days > 0));

  const unitOrder = [
    ...(shouldShowDays ? [{ type: 'days', label: labels[3] || 'Days', value: time.days, digits: 3 }] : []),
    { type: 'hours', label: labels[2] || 'Hours', value: time.hours, digits: 2 },
    { type: 'minutes', label: labels[1] || 'Minutes', value: time.minutes, digits: 2 },
    { type: 'seconds', label: labels[0] || 'Seconds', value: time.seconds, digits: 2 },
  ];

  return (
    <div
      className={cn(flipClockVariants({ size, variant }), className)}
      aria-live="polite"
      {...props}
    >
      <span dir="ltr" className="sr-only absolute">
        {`${time.hours}:${time.minutes}:${time.seconds}`}
      </span>

      {/* حاوية الأب: اتجاهها LTR للحفاظ على ترتيب الأرقام */}
      <div
        dir="ltr"
        className="flex flex-row flex-nowrap justify-center items-center gap-x-[clamp(0.05rem,0.3vw,0.15rem)]"
      >
        {unitOrder.map((unit, index) => {
          const digits = String(unit.value).padStart(unit.digits, "0").split("");
          const isLast = index === unitOrder.length - 1;

          return (
            <React.Fragment key={unit.type}>
              
              {/* 1. البوكس الفرعي (يحتوي على الأرقام في الأعلى والاسم في الأسفل) */}
              <div className="flex flex-col items-center justify-center gap-[clamp(0.25rem,1vw,0.5rem)] w-fit">
                
                {/* صف الأرقام (بشكل LTR) */}
                <div
                  dir="ltr"
                  className="flex flex-row items-center gap-[clamp(0.15rem,0.5vw,0.25rem)] w-fit"
                >
                  {digits.map((digit, i) => (
                    <FlipUnit
                      key={`${unit.type}-${i}`}
                      digit={digit}
                      size={size}
                      variant={variant}
                      className={unitClassName}
                    />
                  ))}
                </div>

                {/* النص أسفل الأرقام (مع dir="auto" للمحاذاة الصحيحة في المنتصف) */}
                <span
                  dir="auto"
                  className="text-[clamp(0.5rem,1.5vw,0.75rem)] font-mono text-black text-center w-full"
                >
                  {unit.label}
                </span>
              </div>

              {/* 2. الفاصل الزمني (النقاط :) يُوضع خارج البوكس بين البوكسات، وليس بداخله */}
              {!isLast && (
                <div className="px-[clamp(0.05rem,0.3vw,0.15rem)] self-center translate-y-[-20%]">
                  <ClockSeparator size={size!} className={separatorClassName} />
                </div>
              )}

            </React.Fragment>
          );
        })}
      </div>

      <style jsx global>{`
        .animate-flip-top { animation: flip-top-anim 0.6s ease-in forwards; }
        .animate-flip-bottom { animation: flip-bottom-anim 0.6s ease-out forwards; }
        @keyframes flip-top-anim {
          0% { transform: rotateX(0deg); z-index: 30; }
          50%, 100% { transform: rotateX(-90deg); z-index: 10; }
        }
        @keyframes flip-bottom-anim {
          0%, 50% { transform: rotateX(90deg); z-index: 10; }
          100% { transform: rotateX(0deg); z-index: 30; }
        }
      `}</style>
    </div>
  );
};

function getTime(countdown: boolean, targetDate?: Date): TimeLeft {
  const now = new Date();
  if (!countdown) {
    return { days: 0, hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() };
  }
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default FlipClock;