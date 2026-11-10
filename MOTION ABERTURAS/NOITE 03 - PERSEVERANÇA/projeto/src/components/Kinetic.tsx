import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {E, clamp, lerp, prog, rand} from '../utils/anim';

export type KMode = 'maskUp' | 'slam' | 'track' | 'drop' | 'assemble' | 'type' | 'blurIn' | 'maskSide';

/** Palavra animada letra a letra; cada modo tem personalidade própria. `start` em frames locais. */
export const KWord: React.FC<{
  text: string; mode: KMode; start?: number; size?: number; color?: string; font?: string;
  stagger?: number; seed?: number; skew?: number; style?: React.CSSProperties; outline?: boolean; dur?: number;
}> = ({text, mode, start = 0, size = 200, color = C.white, font = FONT.display, stagger = 2.5, seed = 1, skew = 0, style, outline, dur = 22}) => {
  const f = useCurrentFrame() - start;
  const chars = Array.from(text);
  const base: React.CSSProperties = {
    fontFamily: font, fontSize: size, lineHeight: 0.92, color: outline ? 'transparent' : color,
    WebkitTextStroke: outline ? `3px ${color}` : undefined, whiteSpace: 'nowrap', display: 'inline-flex',
    transform: skew ? `skewX(${skew}deg)` : undefined, ...style,
  };
  if (mode === 'track') {
    const p = prog(f, 0, dur + 8, E.out);
    return <span style={{...base, letterSpacing: `${lerp(1.1, 0.01, p)}em`, opacity: clamp(p * 2.2), filter: `blur(${(1 - p) * 14}px)`}}>{text}</span>;
  }
  return (
    <span style={base}>
      {chars.map((ch, i) => {
        const t0 = i * stagger;
        const r = rand(seed * 31 + i * 7.3);
        const r2 = rand(seed * 17 + i * 3.1);
        const content = ch === ' ' ? ' ' : ch;
        let st: React.CSSProperties = {display: 'inline-block'};
        if (mode === 'maskUp') {
          const p = prog(f, t0, dur, E.out);
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingTop: size * 0.24, paddingBottom: size * 0.16, marginTop: -size * 0.24, marginBottom: -size * 0.16}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 118}%)`}}>{content}</span>
            </span>
          );
        }
        if (mode === 'maskSide') {
          const p = prog(f, t0, dur, E.out);
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden'}}>
              <span style={{display: 'inline-block', transform: `translateX(${(1 - p) * -110}%)`}}>{content}</span>
            </span>
          );
        }
        if (mode === 'slam') {
          const p = prog(f, t0, 16, E.back);
          st = {...st, transform: `scale(${lerp(2.6, 1, p)}) rotate(${(1 - p) * (r - 0.5) * 30}deg)`, opacity: clamp(p * 3), filter: `blur(${(1 - p) * 10}px)`};
        } else if (mode === 'drop') {
          const g = clamp(f - t0, 0, 200);
          const sag = (g * g) / 14;
          st = {...st, transform: `translateY(${Math.min(sag, 90 + r * 60)}px) rotate(${Math.min(g * 0.5, 14) * (r > 0.5 ? 1 : -1)}deg)`,
            opacity: clamp(prog(f, t0, 6, E.out)), filter: `blur(${Math.min(g * 0.12, 5)}px)`};
        } else if (mode === 'assemble') {
          const p = prog(f, t0, dur + 6, E.out);
          st = {...st, transform: `translate(${(1 - p) * (r - 0.5) * 900}px, ${(1 - p) * (r2 - 0.5) * 900}px) rotate(${(1 - p) * (r - 0.5) * 120}deg)`, opacity: clamp(p * 4)};
        } else if (mode === 'type') {
          st = {...st, opacity: f >= t0 ? 1 : 0};
        } else if (mode === 'blurIn') {
          const p = prog(f, t0, dur, E.out);
          st = {...st, opacity: p, filter: `blur(${(1 - p) * 30}px)`, transform: `translateY(${(1 - p) * 30}px)`};
        }
        return <span key={i} style={st}>{content}</span>;
      })}
    </span>
  );
};
