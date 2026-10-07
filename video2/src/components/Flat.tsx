import React from 'react';
import {useCurrentFrame} from 'remotion';
import {S, C} from '../lib/tokens';
import {ramp} from '../lib/anim';

// Deterministic soft field of floating 2D shapes. Replaces WebGL so renders are
// stable on a loaded machine; motion is real (float, drift, parallax by depth).
type Shape = {x: number; y: number; z: number; kind: number; c: string; d: number; size: number};

export const FlatShapes: React.FC<{at: number; count?: number; clear?: number}> = ({at, count = 16, clear = 0.28}) => {
  const f = useCurrentFrame();
  const cols = S.color.object3d;
  const items: Shape[] = React.useMemo(
    () =>
      Array.from({length: count}, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180;
        const ring = 1 + (i % 4) * 0.22;
        // push shapes to the border so the center text zone stays clear
        const rx = 0.5 + Math.cos(a) * (clear + ring * 0.22);
        const ry = 0.5 + Math.sin(a) * (clear + ring * 0.16);
        return {x: rx, y: ry, z: 0.4 + (i % 5) * 0.14, kind: i % 4, c: cols[i % cols.length], d: i * 2, size: 70 + (i % 4) * 22};
      }),
    [count, cols, clear],
  );

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {items.map((it, i) => {
        const appear = ramp(f, at + it.d, 22);
        const t = (f - at) / 30;
        const dx = Math.sin(t * 0.6 + i) * 22 * it.z;
        const dy = Math.cos(t * 0.5 + i * 1.3) * 16 * it.z;
        const rot = t * 14 * it.z + i * 20;
        const size = it.size * it.z;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(${it.x * 100}% + ${dx}px)`,
              top: `calc(${it.y * 100}% + ${dy}px)`,
              width: size,
              height: size,
              transform: `translate(-50%,-50%) rotate(${rot}deg)`,
              opacity: 0.5 * appear,
              filter: `blur(${(1 - it.z) * 2}px)`,
            }}
          >
            <ShapeSvg kind={it.kind} color={it.c} />
          </div>
        );
      })}
    </div>
  );
};

const ShapeSvg: React.FC<{kind: number; color: string}> = ({kind, color}) => {
  if (kind === 0)
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect x="8" y="8" width="84" height="84" rx="20" fill={color} opacity="0.9" />
      </svg>
    );
  if (kind === 1)
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="18" opacity="0.85" />
      </svg>
    );
  if (kind === 2)
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect x="34" y="6" width="32" height="88" rx="16" fill={color} opacity="0.85" />
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="40" fill={color} opacity="0.85" />
    </svg>
  );
};

// Fhin VEST mark, floating and slowly rotating. Pure 2D, no WebGL.
export const Logo2D: React.FC<{at: number; size?: number; color?: string}> = ({at, size = 260, color = C.accent}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, 20);
  const rot = Math.sin((f - at) / 40) * 6;
  const fl = Math.sin((f - at) / 26) * 10;
  return (
    <div style={{transform: `translateY(${fl}px) rotate(${rot}deg) scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p * 1.4)}}>
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M2.5 16 8 8l3.5 5L18 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16.5" cy="4.5" r="2.4" fill={color} />
      </svg>
    </div>
  );
};
