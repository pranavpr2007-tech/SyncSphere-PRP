interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function SyncSphereLogo({ size = 'md', showText = true }: Props) {
  const dims = { sm: 32, md: 40, lg: 56 };
  const d = dims[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* SVG logo mark */}
      <svg
        width={d}
        height={d}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SyncSphere logo"
      >
        <defs>
          <radialGradient id="ssGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#E8B830" />
            <stop offset="60%" stopColor="#C9950F" />
            <stop offset="100%" stopColor="#7A5200" />
          </radialGradient>
          <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9B59B6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6C3483" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Outer glow circle */}
        <circle cx="28" cy="28" r="27" fill="url(#ssGrad)" opacity="0.15" />

        {/* Main circle */}
        <circle cx="28" cy="28" r="22" fill="url(#ssGrad)" />

        {/* Planet ring — ellipse swoosh */}
        <ellipse
          cx="28"
          cy="28"
          rx="31"
          ry="9"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform="rotate(-22 28 28)"
          opacity="0.85"
        />
        {/* Ring back arc (darker) */}
        <ellipse
          cx="28"
          cy="28"
          rx="31"
          ry="9"
          fill="none"
          stroke="#5B2C8D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="28 40"
          transform="rotate(-22 28 28)"
          opacity="0.5"
        />

        {/* Letter S */}
        <text
          x="28"
          y="35"
          textAnchor="middle"
          fill="#0D1F14"
          fontFamily="Playfair Display, Georgia, serif"
          fontWeight="800"
          fontSize="20"
          letterSpacing="-1"
        >
          S
        </text>
      </svg>

      {/* Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="font-serif font-bold text-[var(--gold)]"
            style={{ fontSize: size === 'sm' ? 14 : size === 'md' ? 17 : 22 }}
          >
            Sync-Sphere
          </span>
          <span
            className="font-sans text-[var(--text-secondary)]"
            style={{ fontSize: size === 'sm' ? 9 : size === 'md' ? 11 : 13 }}
          >
            Events
          </span>
        </div>
      )}
    </div>
  );
}
