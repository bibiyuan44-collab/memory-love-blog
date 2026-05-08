import React from 'react';

/** Soft bubbles, musical notes, lens glints — sits under desktop UI (z-10), pointer-events none. */
export const DreamyDecor: React.FC = () => (
  <div
    className="dreamy-decor-layer fixed inset-0 z-[5] pointer-events-none overflow-hidden select-none"
    aria-hidden
  >
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="dreamy-flare-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#e8f4ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dreamy-flare-ring" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd6ef" stopOpacity="0" />
          <stop offset="70%" stopColor="#ffd6ef" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#b8ecff" stopOpacity="0" />
        </radialGradient>
        <filter id="dreamy-soft-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" />
        </filter>
        <filter id="dreamy-bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Lens glints — large soft blooms + small crosses */}
      <g style={{ animation: 'decor-lens-pulse 7s ease-in-out infinite', animationDelay: '0s' }}>
        <circle cx="78" cy="18" r="5" fill="url(#dreamy-flare-core)" filter="url(#dreamy-soft-blur)" />
        <circle cx="78" cy="18" r="14" fill="url(#dreamy-flare-ring)" opacity="0.9" />
      </g>
      <g style={{ animation: 'decor-lens-pulse 9s ease-in-out infinite', animationDelay: '-2.2s' }}>
        <circle cx="14" cy="72" r="4" fill="url(#dreamy-flare-core)" filter="url(#dreamy-soft-blur)" />
        <ellipse cx="14" cy="72" rx="16" ry="5" fill="#ffffff" opacity="0.06" transform="rotate(-28 14 72)" />
      </g>
      <g style={{ animation: 'decor-lens-pulse 6.5s ease-in-out infinite', animationDelay: '-4s' }}>
        <path
          d="M52 8 L53.2 12 L57.5 12 L54.1 14.5 L55.3 19 L52 16.2 L48.7 19 L49.9 14.5 L46.5 12 L50.8 12 Z"
          fill="#ffffff"
          opacity="0.35"
          filter="url(#dreamy-soft-blur)"
        />
      </g>

      {/* Four-point star glints */}
      {[
        { cx: 88, cy: 42, s: 1.1, rot: 12, delay: '-1s' },
        { cx: 24, cy: 28, s: 0.85, rot: -8, delay: '-3.5s' },
        { cx: 66, cy: 82, s: 0.95, rot: 35, delay: '-5s' }
      ].map((g, i) => (
        <g
          key={`glint-${i}`}
          transform={`translate(${g.cx} ${g.cy}) rotate(${g.rot}) scale(${g.s})`}
          style={{
            animation: 'decor-lens-pulse 5.5s ease-in-out infinite',
            animationDelay: g.delay,
            transformOrigin: 'center'
          }}
        >
          <path d="M0 -2.2 L0.35 -0.35 L2.2 0 L0.35 0.35 L0 2.2 L-0.35 0.35 L-2.2 0 L-0.35 -0.35 Z" fill="#ffffff" opacity="0.5" />
        </g>
      ))}

      {/* Bubbles */}
      <g
        style={{
          animation: 'decor-float-1 22s ease-in-out infinite',
          transformOrigin: '50% 50%',
          transformBox: 'fill-box'
        }}
      >
        {[
          { cx: 18, cy: 38, r: 3.1 },
          { cx: 42, cy: 22, r: 2.2 },
          { cx: 71, cy: 34, r: 4.0 },
          { cx: 56, cy: 58, r: 2.6 },
          { cx: 30, cy: 68, r: 3.4 },
          { cx: 84, cy: 64, r: 2.0 }
        ].map((b, i) => (
          <circle
            key={`bubble-${i}`}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.38)"
            strokeWidth="0.12"
            filter="url(#dreamy-bubble-glow)"
          />
        ))}
      </g>

      {/* More bubbles — second drift */}
      <g
        style={{
          animation: 'decor-float-2 26s ease-in-out infinite',
          transformOrigin: '50% 50%',
          transformBox: 'fill-box'
        }}
      >
        {[
          { cx: 92, cy: 28, r: 2.4 },
          { cx: 8, cy: 52, r: 3.0 },
          { cx: 48, cy: 78, r: 2.8 }
        ].map((b, i) => (
          <circle
            key={`bubble-b-${i}`}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill="rgba(232,244,255,0.07)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="0.1"
          />
        ))}
      </g>

      {/* Musical notes — simple eighth-note silhouettes (soft, low contrast) */}
      <g
        style={{
          animation: 'decor-float-3 24s ease-in-out infinite',
          transformBox: 'fill-box' as React.CSSProperties['transformBox']
        }}
      >
        <g transform="translate(26 50)" opacity="0.4" filter="url(#dreamy-soft-blur)">
          <ellipse cx="-0.9" cy="3.6" rx="2.4" ry="1.9" fill="#ffc8e8" transform="rotate(-22 -0.9 3.6)" />
          <line x1="2.1" y1="3.2" x2="2.1" y2="-11" stroke="#ffc8e8" strokeWidth="0.45" strokeLinecap="round" />
          <path d="M2.1 -11 Q5.2 -9.2 7.4 -12.6" stroke="#ffc8e8" strokeWidth="0.38" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(60 22)" opacity="0.36" filter="url(#dreamy-soft-blur)">
          <ellipse cx="-0.8" cy="3.4" rx="2.1" ry="1.7" fill="#b8ecff" transform="rotate(-18 -0.8 3.4)" />
          <line x1="1.8" y1="3" x2="1.8" y2="-9.5" stroke="#b8ecff" strokeWidth="0.4" strokeLinecap="round" />
          <path d="M1.8 -9.5 Q4.6 -8 6.4 -11" stroke="#b8ecff" strokeWidth="0.34" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(76 62)" opacity="0.34" filter="url(#dreamy-soft-blur)">
          <ellipse cx="-0.7" cy="2.9" rx="1.9" ry="1.5" fill="#f0d4ff" transform="rotate(-20 -0.7 2.9)" />
          <line x1="1.5" y1="2.6" x2="1.5" y2="-8.2" stroke="#f0d4ff" strokeWidth="0.36" strokeLinecap="round" />
          <path d="M1.5 -8.2 Q4 -6.8 5.6 -9.6" stroke="#f0d4ff" strokeWidth="0.3" fill="none" strokeLinecap="round" />
        </g>
      </g>

      <g
        style={{
          animation: 'decor-float-1 28s ease-in-out infinite',
          animationDelay: '-6s',
          transformBox: 'fill-box' as React.CSSProperties['transformBox']
        }}
      >
        <g transform="translate(12 22)" opacity="0.32" filter="url(#dreamy-soft-blur)">
          <ellipse cx="-0.85" cy="3.2" rx="2.2" ry="1.75" fill="#c8f0ff" transform="rotate(-16 -0.85 3.2)" />
          <line x1="1.9" y1="2.9" x2="1.9" y2="-10" stroke="#c8f0ff" strokeWidth="0.4" strokeLinecap="round" />
          <path d="M1.9 -10 Q4.8 -8.4 6.8 -11.2" stroke="#c8f0ff" strokeWidth="0.32" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);
