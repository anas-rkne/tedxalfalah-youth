"use client";

interface UaeMapProps {
  ariaLabel?: string;
  venueName?: string | null;
}

interface Landmark {
  x: number;
  y: number;
  label: string;
}

/* مواضع معالم دبي ضمن viewBox (إحداثيات SVG التجريدية الخريطة) */
const LANDMARKS: Landmark[] = [
  { x: 336, y: 168, label: "Downtown Dubai" },
  { x: 300, y: 236, label: "Business Bay" },
  { x: 212, y: 336, label: "Dubai Marina" },
  { x: 128, y: 352, label: "Palm Jumeirah" },
  { x: 196, y: 262, label: "Burj Al Arab" },
];

/* نقطة مكان الحدث — تُملأ لاحقاً بإحداثيات المكان الحقيقي عند تأكيده */
const VENUE_POINT = { x: 312, y: 212 };

const CONNECTION_PATH =
  "M336 168 L300 236 L212 336 L128 352 M336 168 L196 262 L212 336";

export default function UaeMap({ ariaLabel, venueName }: UaeMapProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative w-full h-[340px] sm:h-[400px] rounded-[32px] overflow-hidden border border-border bg-card"
      dir="ltr"
    >
      <svg
        viewBox="0 0 600 460"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="uae-map-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fefefe" />
            <stop offset="100%" stopColor="#f5f4f0" />
          </linearGradient>
          <linearGradient id="uae-map-sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <pattern id="uae-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#f0ece5" strokeWidth="1" />
          </pattern>
        </defs>

        {/* خلفية */}
        <rect width="600" height="460" fill="url(#uae-map-sky)" />
        <rect width="600" height="460" fill="url(#uae-map-grid)" />

        {/* البحر */}
        <path
          d="M0 0 H232 C 200 60 188 96 208 128 C 226 156 220 192 196 220 C 176 244 168 278 186 310 C 150 336 120 340 96 330 L 0 330 Z"
          fill="url(#uae-map-sea)"
        />
        <path
          d="M0 0 H232 C 200 60 188 96 208 128 C 226 156 196 192 176 220 C 156 244 148 278 168 310 C 140 338 116 352 96 380 L 0 380 Z"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
        />

        {/* الخور */}
        <path
          d="M 600 96 C 528 100 488 128 452 172 C 424 206 392 220 360 240 C 336 256 330 284 344 308 C 360 336 400 344 452 342 C 504 340 560 344 600 348 Z"
          fill="url(#uae-map-sea)"
          opacity="0.85"
        />

        {/* أرض خفيفة */}
        <path
          d="M 396 40 C 470 80 512 120 516 168 L 560 180 L 600 132 L 600 96 C 528 100 488 128 452 172 C 424 206 398 220 360 240 C 336 256 330 284 320 308 C 306 336 296 356 282 376 C 252 384 224 372 202 386 L 120 400 L 0 380 L 0 330 C 96 330 120 294 150 268 C 176 246 168 220 186 220 C 204 220 220 190 208 160 C 198 134 176 96 220 60 C 252 36 300 26 396 40 Z"
          fill="#fdfcf9"
          stroke="#e4ded3"
          strokeWidth="1.5"
        />

        {/* الشوارع */}
        <g stroke="#e6e0d5" strokeWidth="1" fill="none" opacity="0.9">
          <path d="M 232 120 C 300 140 380 180 480 196" />
          <path d="M 214 176 C 300 200 380 236 470 250" />
          <path d="M 180 252 C 260 264 360 300 480 312" />
          <path d="M 220 330 C 300 336 380 356 470 350" />
          <path d="M 400 60 L 396 340" strokeDasharray="6 6" />
          <path d="M 470 80 L 430 330" strokeDasharray="6 6" />
        </g>

        {/* خط الربط الأحمر المتقطع */}
        <path
          d={CONNECTION_PATH}
          fill="none"
          stroke="#e62b1e"
          strokeWidth="2"
          strokeDasharray="8 7"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* معالم (نقاط حمراء صغيرة + تسميات) */}
        {LANDMARKS.map((lm) => (
          <g key={lm.label}>
            <circle cx={lm.x} cy={lm.y} r="6" fill="#e62b1e" stroke="#fff" strokeWidth="1.5" />
            <text
              x={lm.x}
              y={lm.y - 12}
              textAnchor="middle"
              className="fill-zinc-500"
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {lm.label}
            </text>
          </g>
        ))}

        {/* نقطة مكان الحدث — تظهر دائماً كنقطة حمراء نابضة */}
        <g>
          <circle
            cx={VENUE_POINT.x}
            cy={VENUE_POINT.y}
            r="6"
            fill="#e62b1e"
            stroke="#fff"
            strokeWidth="2"
          >
            <animate
              attributeName="r"
              values="6;14;6"
              dur="2s"
              repeatCount="indefinite"
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              values="0.55;0.12;0.55"
              dur="2s"
              repeatCount="indefinite"
              fill="freeze"
            />
          </circle>
          <circle cx={VENUE_POINT.x} cy={VENUE_POINT.y} r="6" fill="#e62b1e" stroke="#fff" strokeWidth="2" />
          <text
            x={VENUE_POINT.x}
            y={VENUE_POINT.y + 28}
            textAnchor="middle"
            className="fill-zinc-600"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}
          >
            {venueName ? "EVENT VENUE" : "EVENT LOCATION"}
          </text>
          {venueName && (
            <text
              x={VENUE_POINT.x}
              y={VENUE_POINT.y + 44}
              textAnchor="middle"
              className="fill-zinc-500"
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em" }}
            >
              {venueName}
            </text>
          )}
        </g>

        {/* شارة TEDx */}
        <g className="opacity-90">
          <text
            x="30"
            y="40"
            className="fill-zinc-400"
            style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.3em" }}
          >
            DUBAI
          </text>
          <text
            x="30"
            y="56"
            className="fill-zinc-500"
            style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.2em" }}
          >
            UNITED ARAB EMIRATES
          </text>
        </g>
      </svg>
    </div>
  );
}