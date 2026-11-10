import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, FPS, SCENE_START, TOTAL_SEC} from './theme';
import {E, clamp, lerp, rand} from './utils/anim';
import {pa} from './utils/t';
export {pa, E, clamp, lerp, rand};

export const sceneStart = (i: number) => SCENE_START[i - 1];
export const sceneEnd = (i: number) => (i < SCENE_START.length ? SCENE_START[i] : TOTAL_SEC);
export const useT = (i: number) => sceneStart(i) + useCurrentFrame() / FPS;

export const SceneFade: React.FC<{i: number; d?: number; children: React.ReactNode}> = ({i, d = 0.6, children}) => {
  const T = useT(i);
  const k = i === 1 ? 1 : E.inOut(clamp((T - sceneStart(i)) / d));
  return <AbsoluteFill style={{opacity: k, transform: `scale(${i === 1 ? 1 : lerp(1.03, 1, k)})`}}>{children}</AbsoluteFill>;
};

/** Tipografia da identidade: condensada, pesada, inclinada. */
export const Big: React.FC<{children: React.ReactNode; size: number; color?: string; skew?: number; track?: number; style?: React.CSSProperties; shadow?: boolean}> =
({children, size, color = C.white, skew = -9, track = 1, style, shadow = true}) => (
  <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 0.95, color, letterSpacing: track, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `skewX(${skew}deg)`,
    textShadow: shadow ? '0 7px 0 rgba(6,26,102,0.45), 0 0 40px rgba(6,26,102,0.45)' : 'none', ...style}}>{children}</div>
);
/** Faixa verde neon inclinada com texto azul (como "DESAFIO" no cartaz). */
export const Plate: React.FC<{children: React.ReactNode; size: number; px?: number; style?: React.CSSProperties; color?: string; bg?: string}> = ({children, size, px = 40, style, color = C.ink, bg = C.lime}) => (
  <div style={{display: 'inline-block', background: bg, padding: `${size * 0.06}px ${px}px ${size * 0.02}px`, borderRadius: size * 0.08, transform: 'skewX(-9deg)', boxShadow: '0 12px 0 rgba(6,26,102,0.35), 0 0 50px rgba(200,255,46,0.35)', ...style}}>
    <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 1, color, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{children}</div>
  </div>
);
export const Tag: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; track?: number}> = ({children, size = 32, color = C.white, style, track}) => (
  <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: size, letterSpacing: track ?? size * 0.3, color, textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 2px 14px rgba(6,26,102,0.8)', ...style}}>{children}</div>
);

/** Revelação em tempo absoluto (máscara + blur), saída suave opcional. */
export const Reveal: React.FC<{T: number; at: number; out?: number; children: React.ReactNode; dir?: 'up' | 'down' | 'left' | 'right' | 'zoom'; style?: React.CSSProperties; dur?: number; outDur?: number}> =
({T, at, out, children, dir = 'up', style, dur = 0.55, outDur = 0.4}) => {
  const pin = pa(T, at, dur, E.out); const pout = out === undefined ? 0 : pa(T, out, outDur, E.in);
  if (T < at - 0.02 || pout >= 1) return null;
  const d = 1 - pin;
  const tr = {up: `translateY(${d * 80 - pout * 40}px)`, down: `translateY(${-d * 80 + pout * 40}px)`, left: `translateX(${-d * 160 - pout * 100}px)`, right: `translateX(${d * 160 + pout * 100}px)`, zoom: `scale(${lerp(1.5, 1, pin) - pout * 0.1})`}[dir];
  return <div style={{opacity: clamp(pin * 1.7) * (1 - pout), transform: tr, filter: `blur(${d * 12 + pout * 10}px)`, ...style}}>{children}</div>;
};

/** Palavra a palavra / letra a letra com tracking animado. */
export const TrackIn: React.FC<{T: number; at: number; text: string; size: number; color?: string; dur?: number; from?: number; style?: React.CSSProperties}> = ({T, at, text, size, color = C.white, dur = 0.9, from = 60, style}) => {
  const p = pa(T, at, dur, E.out); if (T < at) return null;
  return <Big size={size} color={color} track={lerp(from, 2, p)} style={{opacity: clamp(p * 2), filter: `blur(${(1 - p) * 8}px)`, ...style}}>{text}</Big>;
};

export const Center: React.FC<{children: React.ReactNode; top?: number; style?: React.CSSProperties}> = ({children, top, style}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: top ?? 0, bottom: top === undefined ? 0 : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</div>
);

/** Onda sonora ↔ linha (morphing): m 0 = onda, 1 = linha reta. */
export const Wave: React.FC<{T: number; w: number; amp: number; m?: number; color?: string; width?: number; y: number; x?: number; freq?: number; glow?: string; opacity?: number; draw?: number}> =
({T, w, amp, m = 0, color = C.white, width = 6, y, x = 0, freq = 3, glow, opacity = 1, draw = 1}) => {
  const n = 160; const pts: string[] = [];
  for (let i = 0; i <= n * draw; i++) {
    const u = i / n; const env = Math.sin(Math.PI * u) ** 1.4;
    const v = (Math.sin(u * Math.PI * 2 * freq + T * 6) * 0.6 + Math.sin(u * Math.PI * 2 * freq * 2.3 - T * 9) * 0.4) * env * amp * (1 - m);
    pts.push(`${(x + u * w).toFixed(1)},${(y + v).toFixed(1)}`);
  }
  return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} style={{filter: glow ? `drop-shadow(0 0 12px ${glow})` : undefined}} />;
};

/** Silhueta humana abstrata (sem rosto). */
export const Person: React.FC<{h: number; color?: string; opacity?: number; style?: React.CSSProperties; glow?: number}> = ({h, color = C.white, opacity = 1, style, glow = 0}) => {
  const w = h * 0.52;
  return (
    <svg width={w} height={h} viewBox="0 0 52 100" style={{overflow: 'visible', opacity, filter: glow ? `drop-shadow(0 0 ${12 * glow}px ${color}) drop-shadow(0 0 ${30 * glow}px ${color})` : undefined, ...style}}>
      <circle cx="26" cy="15" r="11" fill={color} />
      <path d="M4 100 C4 62 10 34 26 34 C42 34 48 62 48 100 Z" fill={color} />
    </svg>
  );
};

/** Linhas de energia/sinais. */
export const EnergyLine: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; color?: string; width?: number; glow?: boolean}> = ({x1, y1, x2, y2, p, color = C.lime, width = 4, glow = true}) => (
  <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={width} strokeLinecap="round" style={{filter: glow ? `drop-shadow(0 0 10px ${color})` : undefined}} />
);
