import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, FPS} from '../theme';
import {rand} from '../utils/anim';

/** Linhas técnicas: cruzes em grade, colchetes de canto e timecode. */
export const TechMarks: React.FC<{color?: string; opacity?: number; grid?: boolean; brackets?: boolean; code?: boolean}> =
({color = C.white, opacity = 0.5, grid = true, brackets = true, code = true}) => {
  const f = useCurrentFrame();
  const sec = Math.floor(f / FPS), fr2 = f % FPS;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      {grid && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 5}).flatMap((_, r) => Array.from({length: 4}).map((__, c) => {
            const x = 150 + c * 250, y = 330 + r * 290;
            return <g key={`${r}-${c}`} stroke={color} strokeWidth={2} opacity={0.5}><line x1={x - 9} y1={y} x2={x + 9} y2={y} /><line x1={x} y1={y - 9} x2={x} y2={y + 9} /></g>;
          }))}
        </svg>
      )}
      {brackets && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}} fill="none" stroke={color} strokeWidth={4}>
          <path d="M70 250 v-50 h50" /><path d="M1010 250 v-50 h-50" /><path d="M70 1490 v50 h50" /><path d="M1010 1490 v50 h-50" />
        </svg>
      )}
      {code && (
        <div style={{position: 'absolute', left: 74, top: 262, fontFamily: FONT.cond, fontWeight: 600, fontSize: 24, letterSpacing: 4, color}}>
          REC ● 00:{String(sec).padStart(2, '0')}:{String(fr2).padStart(2, '0')}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Particles: React.FC<{n?: number; seed?: number; color?: string; speed?: number; size?: number; opacity?: number}> =
({n = 40, seed = 1, color = C.lime, speed = 0.6, size = 5, opacity = 0.7}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: n}).map((_, i) => {
        const x0 = rand(seed + i * 1.3) * 1080, y0 = rand(seed + i * 2.9) * 1920;
        const sp = (0.4 + rand(i * 5 + seed)) * speed;
        const y = ((y0 - f * sp * 3) % 1920 + 1920) % 1920;
        const x = x0 + Math.sin(f * 0.02 + i) * 24;
        const s = size * (0.4 + rand(i * 8 + seed));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: opacity * (0.3 + rand(i + 4))}} />;
      })}
    </AbsoluteFill>
  );
};
