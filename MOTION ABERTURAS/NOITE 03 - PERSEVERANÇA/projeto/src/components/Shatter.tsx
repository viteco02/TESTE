import React from 'react';
import {clamp, rand} from '../utils/anim';

/** Fragmenta o conteúdo (w×h) em ladrilhos que se afastam. t: 0 inteiro → 1 desfeito. */
export const Shatter: React.FC<{w: number; h: number; cols: number; rows: number; t: number; seed?: number; spread?: number; children: React.ReactNode}> =
({w, h, cols, rows, t, seed = 1, spread = 1, children}) => {
  const tw = w / cols, th = h / rows;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      {Array.from({length: cols * rows}).map((_, i) => {
        const cx = i % cols, cy = Math.floor(i / cols);
        const r1 = rand(seed * 13 + i * 1.7), r2 = rand(seed * 29 + i * 2.3), r3 = rand(seed * 41 + i * 3.9);
        const delay = r1 * 0.35;
        const p = clamp((t - delay) / (1 - 0.35));
        const e = p * p;
        const dx = (r2 - 0.5) * 1100 * spread * e, dy = (r3 - 0.3) * 900 * spread * e;
        return (
          <div key={i} style={{
            position: 'absolute', left: cx * tw, top: cy * th, width: tw + 1, height: th + 1, overflow: 'hidden',
            transform: `translate(${dx}px, ${dy}px) rotate(${(r2 - 0.5) * 140 * e}deg) scale(${1 - e * 0.5})`,
            opacity: 1 - clamp(p * 1.15 - 0.15),
          }}>
            <div style={{position: 'absolute', left: -cx * tw, top: -cy * th, width: w, height: h}}>{children}</div>
          </div>
        );
      })}
    </div>
  );
};
