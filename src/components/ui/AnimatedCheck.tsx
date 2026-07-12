export default function AnimatedCheck() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      className="mx-auto mb-6"
    >
      <circle
        cx="36"
        cy="36"
        r="34"
        stroke="currentColor"
        strokeWidth="3"
        className="text-tedx-red"
        style={{
          strokeDasharray: 214,
          strokeDashoffset: 214,
          animation: "tedx-circle-draw 0.6s ease-out forwards",
        }}
      />
      <path
        d="M22 37L31 46L50 27"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-tedx-red"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "tedx-check-draw 0.4s ease-out 0.5s forwards",
        }}
      />
      <style>{`
        @keyframes tedx-circle-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes tedx-check-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
