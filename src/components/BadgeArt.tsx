// Hand-designed SVG badges per slug. Rendered in a uniform medallion frame.
// `locked` desaturates and dims, while keeping the silhouette visible.

type Props = { slug: string; locked?: boolean; size?: number };

export function BadgeArt({ slug, locked = false, size = 96 }: Props) {
  const art = ART[slug] ?? ART.default;
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        filter: locked ? "grayscale(1) brightness(0.55) contrast(0.9)" : undefined,
        opacity: locked ? 0.55 : 1,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id={`bg-${slug}`} cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor={art.bgFrom} />
            <stop offset="100%" stopColor={art.bgTo} />
          </radialGradient>
          <linearGradient id={`rim-${slug}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* Outer rim */}
        <circle cx="50" cy="50" r="48" fill={art.rim} />
        <circle cx="50" cy="50" r="48" fill={`url(#rim-${slug})`} />
        {/* Inner medallion */}
        <circle cx="50" cy="50" r="40" fill={`url(#bg-${slug})`} />
        {/* Sheen */}
        <ellipse cx="50" cy="28" rx="28" ry="10" fill="#ffffff" opacity="0.18" />
        {/* Art */}
        {art.draw}
        {/* Inner ring */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.8" />
      </svg>
      {locked && (
        <div className="absolute inset-0 grid place-items-center">
          <svg viewBox="0 0 24 24" width={size * 0.32} height={size * 0.32} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      )}
    </div>
  );
}

type Art = { bgFrom: string; bgTo: string; rim: string; draw: React.ReactNode };

const ART: Record<string, Art> = {
  "first-challenge": {
    bgFrom: "#7C3AED", bgTo: "#3B0764", rim: "#A78BFA",
    draw: (
      <g>
        {/* rocket */}
        <path d="M50 22 C58 32 60 44 60 54 L40 54 C40 44 42 32 50 22 Z" fill="#F8FAFC" />
        <circle cx="50" cy="40" r="4" fill="#7C3AED" />
        <path d="M40 54 L34 64 L44 60 Z" fill="#F59E0B" />
        <path d="M60 54 L66 64 L56 60 Z" fill="#F59E0B" />
        <path d="M46 64 L50 76 L54 64 Z" fill="#EF4444" />
      </g>
    ),
  },
  "first-finish": {
    bgFrom: "#10B981", bgTo: "#064E3B", rim: "#34D399",
    draw: (
      <g>
        <circle cx="50" cy="50" r="22" fill="#ECFDF5" />
        <path d="M38 51 L47 60 L64 42" stroke="#10B981" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  "streak-7": {
    bgFrom: "#F97316", bgTo: "#7C2D12", rim: "#FB923C",
    draw: (
      <g>
        {/* flame */}
        <path d="M50 26 C56 36 64 40 64 52 C64 62 58 70 50 70 C42 70 36 62 36 52 C36 44 42 42 44 36 C46 40 48 42 50 26 Z" fill="#FDE68A" />
        <path d="M50 38 C53 44 58 48 58 56 C58 62 54 66 50 66 C46 66 42 62 42 56 C42 50 46 48 50 38 Z" fill="#F97316" />
        <text x="50" y="60" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7C2D12" fontFamily="system-ui">7</text>
      </g>
    ),
  },
  "streak-30": {
    bgFrom: "#06B6D4", bgTo: "#083344", rim: "#67E8F9",
    draw: (
      <g>
        {/* diamond */}
        <path d="M50 26 L72 46 L50 76 L28 46 Z" fill="#E0F2FE" />
        <path d="M50 26 L72 46 L50 46 Z" fill="#7DD3FC" />
        <path d="M50 26 L28 46 L50 46 Z" fill="#BAE6FD" />
        <path d="M50 76 L72 46 L50 46 Z" fill="#38BDF8" />
        <text x="50" y="56" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0E7490" fontFamily="system-ui">30</text>
      </g>
    ),
  },
  "chain-starter": {
    bgFrom: "#6366F1", bgTo: "#1E1B4B", rim: "#A5B4FC",
    draw: (
      <g stroke="#E0E7FF" strokeWidth="4" fill="none" strokeLinecap="round">
        <ellipse cx="40" cy="44" rx="10" ry="6" transform="rotate(-30 40 44)" />
        <ellipse cx="50" cy="54" rx="10" ry="6" transform="rotate(-30 50 54)" />
        <ellipse cx="60" cy="64" rx="10" ry="6" transform="rotate(-30 60 64)" />
      </g>
    ),
  },
  "trendsetter": {
    bgFrom: "#EC4899", bgTo: "#500724", rim: "#F9A8D4",
    draw: (
      <g>
        <path d="M28 64 L42 50 L52 58 L70 36" stroke="#FBCFE8" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 36 L70 36 L70 44" stroke="#FBCFE8" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="50" r="3" fill="#FFF" />
        <circle cx="52" cy="58" r="3" fill="#FFF" />
        <circle cx="70" cy="36" r="3" fill="#FFF" />
      </g>
    ),
  },
  "group-leader": {
    bgFrom: "#F59E0B", bgTo: "#78350F", rim: "#FCD34D",
    draw: (
      <g>
        {/* crown */}
        <path d="M28 58 L34 38 L44 52 L50 32 L56 52 L66 38 L72 58 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="28" y="60" width="44" height="6" rx="2" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
        <circle cx="50" cy="48" r="2.5" fill="#DC2626" />
        <circle cx="36" cy="50" r="2" fill="#2563EB" />
        <circle cx="64" cy="50" r="2" fill="#2563EB" />
      </g>
    ),
  },
  "crazy-50": {
    bgFrom: "#EF4444", bgTo: "#450A0A", rim: "#FCA5A5",
    draw: (
      <g>
        {/* star burst */}
        <g stroke="#FECACA" strokeWidth="2.5" strokeLinecap="round">
          <line x1="50" y1="18" x2="50" y2="28" />
          <line x1="82" y1="50" x2="72" y2="50" />
          <line x1="50" y1="82" x2="50" y2="72" />
          <line x1="18" y1="50" x2="28" y2="50" />
          <line x1="72" y1="28" x2="66" y2="34" />
          <line x1="72" y1="72" x2="66" y2="66" />
          <line x1="28" y1="72" x2="34" y2="66" />
          <line x1="28" y1="28" x2="34" y2="34" />
        </g>
        <circle cx="50" cy="50" r="18" fill="#FEF2F2" />
        <text x="50" y="57" textAnchor="middle" fontSize="18" fontWeight="900" fill="#B91C1C" fontFamily="system-ui">50</text>
      </g>
    ),
  },
  default: {
    bgFrom: "#64748B", bgTo: "#0F172A", rim: "#CBD5E1",
    draw: <circle cx="50" cy="50" r="14" fill="#E2E8F0" />,
  },
};
