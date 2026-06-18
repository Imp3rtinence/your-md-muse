import { getLeague } from "@/lib/leagues";

type Props = { tier: number; size?: number; className?: string };

export function LeagueBadge({ tier, size = 88, className = "" }: Props) {
  const l = getLeague(tier);
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" className={className} aria-label={`Liga ${l.name}`}>
      <defs>
        <radialGradient id={`lg-${tier}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={l.glow} stopOpacity="1" />
          <stop offset="100%" stopColor={l.glow} stopOpacity="0.15" />
        </radialGradient>
        <linearGradient id={`ls-${tier}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* outer shield */}
      <path
        d="M50 6 L86 18 V46 C86 70 70 86 50 94 C30 86 14 70 14 46 V18 Z"
        fill={`url(#lg-${tier})`}
        stroke={l.glow}
        strokeWidth="2"
      />
      <path
        d="M50 6 L86 18 V46 C86 70 70 86 50 94 C30 86 14 70 14 46 V18 Z"
        fill={`url(#ls-${tier})`}
      />
      {/* tier marks (Roman-ish pips) */}
      <g fill="#ffffff" opacity="0.95">
        {Array.from({ length: tier }).map((_, i) => {
          const cols = Math.min(tier, 4);
          const row = Math.floor(i / cols);
          const col = i % cols;
          const totalCols = Math.min(tier - row * cols, cols);
          const xStart = 50 - (totalCols - 1) * 6;
          return (
            <circle
              key={i}
              cx={xStart + col * 12}
              cy={44 + row * 12}
              r={3.2}
            />
          );
        })}
      </g>
      {/* star top */}
      <path d="M50 22 L52.2 27 L57.5 27.6 L53.6 31.2 L54.7 36.4 L50 33.8 L45.3 36.4 L46.4 31.2 L42.5 27.6 L47.8 27 Z" fill="#fff" />
    </svg>
  );
}
