import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from './theme';
import {E, clamp, lerp} from './utils/anim';
import {pa} from './utils/t';
export {pa, E, clamp, lerp};

export const Big: React.FC<{children: React.ReactNode; size: number; color?: string; skew?: number; track?: number; style?: React.CSSProperties}> =
({children, size, color = C.white, skew = -9, track = 1, style}) => (
  <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 0.95, color, letterSpacing: track, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `skewX(${skew}deg)`,
    textShadow: '0 7px 0 rgba(6,26,102,0.5), 0 0 50px rgba(3,14,58,0.7)', ...style}}>{children}</div>
);
export const Plate: React.FC<{children: React.ReactNode; size: number; px?: number; style?: React.CSSProperties}> = ({children, size, px = 40, style}) => (
  <div style={{display: 'inline-block', background: C.lime, padding: `${size * 0.06}px ${px}px ${size * 0.02}px`, borderRadius: size * 0.08, transform: 'skewX(-9deg)', boxShadow: '0 12px 0 rgba(6,26,102,0.4), 0 0 60px rgba(200,255,46,0.35)', ...style}}>
    <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 1, color: C.ink, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{children}</div>
  </div>
);
export const Tag: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; track?: number}> = ({children, size = 30, color = C.white, style, track}) => (
  <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: size, letterSpacing: track ?? size * 0.3, color, textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 2px 18px rgba(3,14,58,0.9)', ...style}}>{children}</div>
);
/** Entrada com máscara + blur; saída suave. */
export const Reveal: React.FC<{T: number; at: number; out?: number; children: React.ReactNode; dir?: 'up' | 'left' | 'zoom'; dur?: number; style?: React.CSSProperties}> =
({T, at, out, children, dir = 'up', dur = 0.6, style}) => {
  const pin = pa(T, at, dur, E.out); const pout = out === undefined ? 0 : pa(T, out, 0.45, E.in);
  if (T < at - 0.02 || pout >= 1) return null;
  const d = 1 - pin;
  const tr = {up: `translateY(${d * 60 - pout * 30}px)`, left: `translateX(${-d * 120 - pout * 60}px)`, zoom: `scale(${lerp(1.35, 1, pin) + pout * 0.06})`}[dir];
  return <div style={{opacity: clamp(pin * 1.4) * (1 - pout), filter: `blur(${(d + pout) * 14}px)`, transform: tr, ...style}}>{children}</div>;
};
export const Pos: React.FC<{children: React.ReactNode; x?: number; y: number; align?: 'center' | 'left'; style?: React.CSSProperties}> = ({children, x = 120, y, align = 'center', style}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', top: y, left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 14, ...style}}>{children}</div>
  </AbsoluteFill>
);
