import React from 'react';

export type PixelIconProps = {
  size?: number;
  className?: string;
};

const O = '#0d1b3d';
const D = '#2a5a9e';
const M = '#4f8fd9';
const L = '#8ec8f5';
const S = '#dceeff';
const W = '#f4f9ff';
const Y = '#e8c84a';

const pal = { o: O, d: D, m: M, l: L, s: S, w: W, y: Y } as const;

function PixelGrid({ rows, size }: { rows: string[]; size: number }) {
  const h = rows.length;
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      shapeRendering="crispEdges"
    >
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => {
          if (ch === '.' || ch === ' ') return null;
          const fill = (pal as Record<string, string>)[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

/** Memories — blue pixel heart + shine */
export function PixelIconHeart({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '....oo....oo....',
          '...ossoo..osso..',
          '..osmmossossmmo.',
          '.osmmmmmmmmmmmo.',
          '.osmmmmmmmmmmmo.',
          '..ommmmmmmmmmo..',
          '...ommmmmmmmmo..',
          '....ommmmmmmmo..',
          '.....ommmmmmo...',
          '......ommmmo....',
          '.......ommo.....',
          '........oo......',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Photos — polaroid frame + sky blocks */
export function PixelIconPolaroid({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '....oooooooo....',
          '....owwwwwwwwo..',
          '....owsssssswo..',
          '....owslmmlswo..',
          '....owmllmmlwo..',
          '....owslmmlswo..',
          '....owsssssswo..',
          '....owwwwwwwwo..',
          '....owwwwwwwwo..',
          '....oooooooo....',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Generic text file */
export function PixelIconDoc({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '..ooooooooooo...',
          '..owwwwwwwwwwo..',
          '..owsssssssswo..',
          '..owmmmmmmmmwo..',
          '..owmmmmmmmmwo..',
          '..owllllllllwo..',
          '..owllllllllwo..',
          '..owllllllllwo..',
          '..owwwwwwwwwwo..',
          '..ooooooooooo...',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Chat / notes — doc with lines */
export function PixelIconDocLines({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '..ooooooooooo...',
          '..owwwwwwwwwwo..',
          '..owsssssssswo..',
          '..owmmmmmmmmwo..',
          '..owmssssssmwo..',
          '..owmssssssmwo..',
          '..owmssssssmwo..',
          '..owmssssssmwo..',
          '..owwwwwwwwwwo..',
          '..ooooooooooo...',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Sorry letter — band-aid heart accent */
export function PixelIconDocHeart({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '..ooooooooooo...',
          '..owwwwwwwwwwo..',
          '..owsssssssswo..',
          '..owmmoyyommmo..',
          '..owmmoyyommmo..',
          '..owmmossoommo..',
          '..owmmossoommo..',
          '..owsssssssswo..',
          '..owwwwwwwwwwo..',
          '..ooooooooooo...',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Recycle bin */
export function PixelIconRecycle({ full, size = 36, className }: PixelIconProps & { full?: boolean }) {
  const rows = full
    ? [
        '................',
        '......ssss......',
        '......ssss......',
        '....oooooooo....',
        '...oowwwwwwwoo...',
        '...oowwwwwwwoo...',
        '..owsssssswoo...',
        '.oowsssssssswoo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.oowwwwwwwwwwoo.',
        '..oooooooooooo..',
        '................'
      ]
    : [
        '................',
        '................',
        '................',
        '....oooooooo....',
        '...oowwwwwwoo...',
        '..owsssssswoo...',
        '.oowsssssssswoo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.owsssssssssswo.',
        '.oowwwwwwwwwwoo.',
        '..oooooooooooo..',
        '................'
      ];
  return (
    <div className={className}>
      <PixelGrid size={size} rows={rows} />
    </div>
  );
}

/** Task Manager — dual pixel meters */
export function PixelIconTaskmgr({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '..oooooooooooo..',
          '..owwwwwwwwwwo..',
          '..owddddddddwo..',
          '..owdmmmmmmddwo.',
          '..owdmmmmmmmdwo.',
          '..owddddddddwo..',
          '..owwwwwwwwwwo..',
          '..owwwwwwwwwwo..',
          '..owllllllllwo..',
          '..owlmmmmmmllwo.',
          '..owlmmmmmmmlwo.',
          '..owllllllllwo..',
          '..owwwwwwwwwwo..',
          '..oooooooooooo..',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Dial-up / BBS — CD + signal */
export function PixelIconDialup({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '.....oooooo.....',
          '...ooosssoooo...',
          '..oossssssssoo..',
          '.oossssssssssoo.',
          '.oossssssssssoo.',
          '.oosssowwosssoo.',
          '.oossowddwossoo.',
          '.oossowddwossoo.',
          '.oosssowwosssoo.',
          '.oossssssssssoo.',
          '.oossssssssssoo.',
          '..oossssssssoo..',
          '...ooossssoo....',
          '.....oooooo.....',
          '................'
        ]}
      />
    </div>
  );
}

/** Food log — pixel receipt with chopsticks */
export function PixelIconFoodLog({ size = 36, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '...oooooooooo...',
          '..owwwwwwwwwwo..',
          '..owsssssssswo..',
          '..owsossossowo..',
          '..owsssssssswo..',
          '..owmmmmmmmmwo..',
          '..owmssssssmwo..',
          '..owmmmmmmmmwo..',
          '..owsssssssswo..',
          '..owllllllllwo..',
          '..owllllllllwo..',
          '..owwwwwwwwwwo..',
          '...oooooooooo...',
          '....o.o.o.o.....',
          '................'
        ]}
      />
    </div>
  );
}

/** Start menu: programs folder tab */
export function PixelIconFolder({ size = 16, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '....oooooooo....',
          '...oossssssoo...',
          '..osddddddddso..',
          '.owsssssssssswo.',
          '.owsssssssssswo.',
          '.owsssssssssswo.',
          '.owsssssssssswo.',
          '.owsssssssssswo.',
          '.owsssssssssswo.',
          '.oooooooooooooo.',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Memory map — handheld / screen */
export function PixelIconMonitor({ size = 16, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '....oooooooo....',
          '...oossssssoo...',
          '..oswwwwwwwwso..',
          '.oswsssssssswso.',
          '.oswssllllsswso.',
          '.oswssllllsswso.',
          '.oswsssssssswso.',
          '.oswwwwwwwwwwso.',
          '..ossssssssoo...',
          '....oooooooo....',
          '................',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

export function PixelIconSettings({ size = 16, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '.......oo.......',
          '......osso......',
          '.....osssso.....',
          '....ooossooo....',
          '....osssssso....',
          '...oossssssoo...',
          '...osssssssso...',
          '...oossssssoo...',
          '....osssssso....',
          '....ooossooo....',
          '.....osssso.....',
          '......osso......',
          '.......oo.......',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

export function PixelIconTerminal({ size = 16, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '..oooooooooooo..',
          '..owwwwwwwwwwo..',
          '..owsssssssswo..',
          '..owsssssssswo..',
          '..owssossssswo..',
          '..owssossssswo..',
          '..owssooossswo..',
          '..owssossssswo..',
          '..owsssssssswo..',
          '..owwwwwwwwwwo..',
          '..oooooooooooo..',
          '................',
          '................',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

/** Shutdown — power (keeps red accent for UX) */
export function PixelIconPower({ size = 16, className }: PixelIconProps) {
  const R = '#c62828';
  const r = '#e57373';
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={`shrink-0 ${className || ''}`} shapeRendering="crispEdges">
      {[
        [7, 1, R],
        [7, 2, r],
        [7, 3, r],
        [7, 4, r],
        [4, 5, R],
        [5, 5, r],
        [6, 5, r],
        [7, 5, r],
        [8, 5, r],
        [9, 5, r],
        [10, 5, r],
        [11, 5, R],
        [3, 6, R],
        [4, 6, r],
        [11, 6, r],
        [12, 6, R],
        [3, 7, R],
        [12, 7, R],
        [4, 8, R],
        [11, 8, R],
        [5, 9, R],
        [10, 9, R],
        [6, 10, R],
        [9, 10, R],
        [7, 11, R],
        [8, 11, R]
      ].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={1} height={1} fill={c as string} />
      ))}
    </svg>
  );
}

export function PixelIconAlert({ size = 32, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '.......oo.......',
          '......oyyo......',
          '.....oyyyyo.....',
          '....oyyyyyyo....',
          '...oyyyyyyyyo...',
          '..oyyyyyyyyyyo..',
          '..oyyysyyysyyo..',
          '..oyyysyyysyyo..',
          '..oyyysyyysyyo..',
          '..oyyysyyysyyo..',
          '..oyyyyyyyyyyo..',
          '..oyyyyyyyyyyo..',
          '...oooooooooo...',
          '................',
          '................'
        ]}
      />
    </div>
  );
}

export function PixelIconVolume({ size = 14, className }: PixelIconProps) {
  return (
    <div className={className}>
      <PixelGrid
        size={size}
        rows={[
          '................',
          '................',
          '................',
          '................',
          '...oo...........',
          '..osso..........',
          '.ossssoo........',
          '.ossssssoo......',
          '.osssssssso.....',
          '.osssssssso.....',
          '.ossssssoo......',
          '.ossssoo........',
          '..osso..........',
          '...oo...........',
        '................',
        '................'
        ]}
      />
    </div>
  );
}
