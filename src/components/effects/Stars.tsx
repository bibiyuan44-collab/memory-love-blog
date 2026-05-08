import React, { useMemo, useState } from 'react';

const PASTEL_PALETTE = ['#ffe8f4', '#c8f7e4', '#d4f0ff', '#ffffff', '#f0e4ff', '#bff0ff'] as const;

const STAR_CLIP =
  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

type DustParticle = {
  x: number;
  y: number;
  s: number;
  d: number;
  del: number;
};

type PastelStar = {
  x: number;
  y: number;
  size: number;
  color: string;
  tw: number;
  twDel: number;
  dr: number;
  drDel: number;
  glow: string;
  isShape: boolean;
};

type NebulaBlob = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  delay: number;
  duration: number;
};

function roll<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Deterministic-ish field so SSR/hydration stay stable; still visually random. */
function makeField(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const dust: DustParticle[] = Array.from({ length: 160 }, () => ({
    x: rng() * 100,
    y: rng() * 100,
    s: rng() < 0.75 ? 1 : 2,
    d: 1.2 + rng() * 2.2,
    del: rng() * 4
  }));

  const stars: PastelStar[] = Array.from({ length: 72 }, () => {
    const isShape = rng() > 0.35;
    const size = isShape ? 10 + rng() * 22 : 2 + rng() * 3.5;
    const color = roll(rng, PASTEL_PALETTE);
    const glow =
      color === '#ffffff' || color === '#d4f0ff'
        ? `0 0 ${6 + rng() * 10}px rgba(255,255,255,0.95), 0 0 ${14 + rng() * 12}px rgba(186, 230, 255, 0.55)`
        : `0 0 ${4 + rng() * 8}px ${color}cc, 0 0 ${12 + rng() * 8}px rgba(255, 255, 255, 0.35)`;

    return {
      x: rng() * 100,
      y: rng() * 100,
      size,
      color,
      tw: 2.8 + rng() * 4.5,
      twDel: rng() * 6,
      dr: 14 + rng() * 18,
      drDel: rng() * 8,
      glow,
      isShape
    };
  });

  const blobs: NebulaBlob[] = [
    { x: 8, y: 10, w: 42, h: 38, color: 'rgba(200, 180, 255, 0.55)', delay: 0, duration: 28 },
    { x: 78, y: 8, w: 38, h: 36, color: 'rgba(130, 210, 255, 0.5)', delay: -4, duration: 34 },
    { x: 62, y: 72, w: 48, h: 40, color: 'rgba(180, 235, 255, 0.45)', delay: -9, duration: 30 },
    { x: 22, y: 68, w: 36, h: 44, color: 'rgba(255, 200, 235, 0.28)', delay: -2, duration: 36 }
  ];

  return { dust, stars, blobs, rng };
}

export const Stars: React.FC = () => {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const field = useMemo(() => makeField(seed), [seed]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 night-sky-breathing overflow-hidden">
      {field.blobs.map((b, i) => (
        <div
          key={`blob-${i}`}
          className="absolute"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="dreamy-nebula-blob"
            style={{
              width: `${b.w}vmin`,
              height: `${b.h}vmin`,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`
            }}
          />
        </div>
      ))}

      <div className="absolute inset-0 dreamy-vignette" />

      {field.dust.map((p, i) => (
        <div
          key={`d-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            animation: `dream-sparkle ${p.d}s ease-in-out infinite`,
            animationDelay: `${p.del}s`,
            boxShadow: p.s > 1 ? '0 0 4px rgba(255,255,255,0.8)' : undefined
          }}
        />
      ))}

      {field.stars.map((st, i) => {
        const w = st.isShape ? st.size : st.size * 2;
        const h = st.isShape ? st.size : st.size * 2;
        return (
          <div
            key={`s-${i}`}
            className="absolute"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: w,
              height: h,
              animation: `dream-drift ${st.dr}s ease-in-out infinite`,
              animationDelay: `${st.drDel}s`
            }}
          >
            <div
              style={{
                width: w,
                height: h,
                background: st.color,
                clipPath: st.isShape ? STAR_CLIP : undefined,
                borderRadius: st.isShape ? undefined : '50%',
                boxShadow: st.isShape ? st.glow : `0 0 ${Math.max(2, st.size)}px rgba(255,255,255,0.65)`,
                opacity: 0.85,
                animation: `dream-twinkle ${st.tw}s ease-in-out infinite`,
                animationDelay: `${st.twDel}s`
              }}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 dreamy-grain mix-blend-overlay" />
      <div className="absolute inset-0 dreamy-scanlines pointer-events-none" />
    </div>
  );
};

export const CRTOverlay: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-[10000] crt-overlay crt-flicker opacity-15" />
);

export const AmbientLight: React.FC<{ color: string }> = ({ color }) => (
  <div
    className="fixed inset-0 pointer-events-none z-[1] transition-colors duration-[3000ms] ease-in-out opacity-25 mix-blend-screen"
    style={{
      background: `radial-gradient(circle at center, ${color} 0%, transparent 80%)`
    }}
  />
);
