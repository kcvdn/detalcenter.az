import { useId } from "react";

const baseTicks = [
  { x1: 39, y1: 78, x2: 47, y2: 72, color: "#cbd5e1" },
  { x1: 56, y1: 61, x2: 63, y2: 56, color: "#cbd5e1" },
  { x1: 79, y1: 52, x2: 79, y2: 43, color: "#e2e8f0" },
  { x1: 102, y1: 58, x2: 109, y2: 52, color: "#fca5a5" },
  { x1: 119, y1: 74, x2: 127, y2: 68, color: "#ef4444" },
];

export default function BrandMark({
  className = "",
  needleRotation = 0,
}) {
  const uniqueId = useId().replace(/:/g, "");
  const outerArcId = `${uniqueId}-outer-arc`;
  const redArcId = `${uniqueId}-red-arc`;
  const needleId = `${uniqueId}-needle`;
  const shadowId = `${uniqueId}-shadow`;

  return (
    <svg viewBox="0 0 168 118" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={outerArcId} x1="24" y1="92" x2="140" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e2e8f0" />
          <stop offset="0.42" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={redArcId} x1="98" y1="34" x2="148" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb7185" />
          <stop offset="0.55" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id={needleId} x1="83" y1="92" x2="130" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#991b1b" />
          <stop offset="0.52" stopColor="#ef4444" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <filter id={shadowId} x="0" y="0" width="168" height="118" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <path d="M24 92A60 60 0 0 1 144 92" stroke={`url(#${outerArcId})`} strokeWidth="8.5" strokeLinecap="round" />
        <path d="M38 92A46 46 0 0 1 130 92" stroke="rgba(15,23,42,0.2)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M101 38A58 58 0 0 1 144 92" stroke={`url(#${redArcId})`} strokeWidth="10" strokeLinecap="round" />

        {baseTicks.map((tick) => (
          <path
            key={`${tick.x1}-${tick.y1}`}
            d={`M${tick.x1} ${tick.y1}L${tick.x2} ${tick.y2}`}
            stroke={tick.color}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
        ))}

        <g transform={`rotate(${needleRotation} 84 92)`}>
          <path d="M83.5 90.2L129 49L89 95.4L83.5 90.2Z" fill={`url(#${needleId})`} />
          <path d="M84 92L129 49" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M84 92L122 55" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        <circle cx="84" cy="92" r="14" fill="#020617" stroke="#f8fafc" strokeWidth="2.4" />
        <circle cx="84" cy="92" r="6" fill="#e2e8f0" />
      </g>
    </svg>
  );
}
