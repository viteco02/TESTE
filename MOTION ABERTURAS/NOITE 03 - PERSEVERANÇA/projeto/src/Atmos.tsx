import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H} from './theme';
import {clamp, lerp, rand} from './utils/anim';

/** Céu noturno azul (paleta oficial em variações escuras) com luz de fundo opcional. */
export const Sky: React.FC<{top?: string; bottom?: string; glowX?: number; glowY?: number; glow?: number; glowColor?: string}> =
({top = '#030E3A', bottom = '#123FC0', glowX = 0.7, glowY = 0.55, glow = 0.5, glowColor = '120,170,255'}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 45% 40% at ${glowX * 100}% ${glowY * 100}%, rgba(${glowColor},${glow}), transparent 70%)`}} />
  </AbsoluteFill>
);

/** Névoa em camadas (parallax). */
export const Fog: React.FC<{T: number; y?: number; opacity?: number; speed?: number; color?: string}> = ({T, y = 0.65, opacity = 0.5, speed = 20, color = '160,190,255'}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: ((i * 700 + T * speed * (1 + i * 0.4)) % 2800) - 900, top: H * y - 160 + i * 40, width: 1400, height: 320, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${color},0.35), transparent 70%)`, filter: 'blur(30px)'}} />)}
  </AbsoluteFill>
);

/** Chuva com profundidade: 3 camadas, inclinação e velocidade variáveis. density 0..1 */
export const Rain: React.FC<{T: number; density?: number; angle?: number; speed?: number; seed?: number}> = ({T, density = 1, angle = 12, speed = 1, seed = 1}) => {
  const n = Math.round(160 * density);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const layer = i % 3; const v = (1400 + layer * 700) * speed; const L = 40 + layer * 40; const x0 = rand(i * 3 + seed) * (W + 400) - 200;
        const y = ((rand(i * 7 + seed) * (H + 300) + T * v) % (H + 300)) - 150; const dx = Math.tan((angle * Math.PI) / 180) * L;
        const x = x0 - Math.tan((angle * Math.PI) / 180) * y;
        return <line key={i} x1={x} y1={y} x2={x - dx} y2={y + L} stroke="#CFE0FF" strokeWidth={1 + layer * 0.9} opacity={(0.18 + layer * 0.14) * clamp(density * 1.5)} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Respingos no chão. */
export const Splashes: React.FC<{T: number; y: number; n?: number; density?: number}> = ({T, y, n = 40, density = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {Array.from({length: Math.round(n * density)}).map((_, i) => {
      const per = 0.35 + rand(i) * 0.4; const ph = ((T + rand(i * 5) * per) % per) / per; const x = rand(i * 9) * W; const yy = y + rand(i * 13) * 120;
      return <ellipse key={i} cx={x} cy={yy} rx={4 + ph * 22} ry={1 + ph * 4} fill="none" stroke="#CFE0FF" strokeWidth={1.5} opacity={(1 - ph) * 0.5} />;
    })}
  </svg>
);

/** Partículas genéricas (poeira em feixe de luz, cinzas, brasas). */
export const Motes: React.FC<{T: number; n?: number; color?: string; size?: number; vy?: number; vx?: number; area?: [number, number, number, number]; seed?: number; opacity?: number; glow?: boolean}> =
({T, n = 60, color = '#FFFFFF', size = 4, vy = -10, vx = 6, area = [0, 0, W, H], seed = 1, opacity = 0.6, glow = false}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: n}).map((_, i) => {
      const [ax, ay, aw, ah] = area; const x = ax + ((rand(i * 3 + seed) * aw + T * vx * (0.5 + rand(i))) % aw + aw) % aw + Math.sin(T * 0.7 + i) * 12;
      const y = ay + ((rand(i * 5 + seed) * ah + T * vy * (0.5 + rand(i + 2))) % ah + ah) % ah; const s = size * (0.4 + rand(i * 11));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: opacity * (0.3 + 0.7 * Math.abs(Math.sin(T * 1.3 + i))), boxShadow: glow ? `0 0 ${s * 3}px ${color}` : undefined}} />;
    })}
  </AbsoluteFill>
);

/** Feixe de luz volumétrico. */
export const Beam: React.FC<{x: number; y: number; angle: number; length?: number; width?: number; opacity?: number; color?: string}> = ({x, y, angle, length = 1400, width = 260, opacity = 0.5, color = '255,255,255'}) => (
  <div style={{position: 'absolute', left: x - width / 2, top: y, width, height: length, transform: `rotate(${angle}deg)`, transformOrigin: '50% 0', background: `linear-gradient(180deg, rgba(${color},${opacity}), rgba(${color},${opacity * 0.25}) 60%, transparent)`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', filter: 'blur(14px)', mixBlendMode: 'screen', pointerEvents: 'none'}} />
);

/** Chão com textura e reflexo molhado. */
export const Ground: React.FC<{y: number; T?: number; wet?: number; color?: string}> = ({y, T = 0, wet = 0.6, color = '#020A2E'}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, bottom: 0, background: `linear-gradient(180deg, ${color}, #01051A)`}}>
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(120,170,255,${0.18 * wet}), transparent 40%)`}} />
    {Array.from({length: 18}).map((_, i) => <div key={i} style={{position: 'absolute', left: rand(i) * W, top: 10 + rand(i + 3) * 160, width: 80 + rand(i + 5) * 260, height: 3, borderRadius: 3, background: `rgba(160,200,255,${0.25 * wet})`, transform: `scaleX(${0.8 + Math.sin(T * 2 + i) * 0.2})`}} />)}
  </div>
);

/** Relâmpago suave (sem estrobo): clareia o céu em rampa. */
export const SoftFlash: React.FC<{T: number; at: number[]; color?: string}> = ({T, at, color = '200,220,255'}) => {
  const k = at.reduce((m, a) => Math.max(m, T >= a && T < a + 1.2 ? Math.sin(Math.PI * Math.min(1, (T - a) / 1.2)) ** 2 * (1 - (T - a) / 1.4) : 0), 0);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 60% 0%, rgba(${color},${0.35 * k}), transparent 70%)`, pointerEvents: 'none'}} />;
};

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.2}) => {
  const k = Math.floor(useCurrentFrame() / 2);
  return <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px', backgroundPosition: `${rand(k) * 400}px ${rand(k + 9) * 400}px`, pointerEvents: 'none'}} />;
};

export const Vignette: React.FC<{k?: number}> = ({k = 0.6}) => <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(1,5,26,${k}) 100%)`, pointerEvents: 'none'}} />;

/** Camera 2.5D: aplica escala/deslocamento a um grupo de camadas com profundidade z (0 = fundo, 1 = frente). */
export const Layer: React.FC<{z: number; cam: {x: number; y: number; s: number}; children: React.ReactNode; style?: React.CSSProperties}> = ({z, cam, children, style}) => (
  <AbsoluteFill style={{transform: `translate(${-cam.x * (0.2 + z)}px, ${-cam.y * (0.2 + z)}px) scale(${1 + (cam.s - 1) * (0.3 + z)})`, transformOrigin: '50% 60%', ...style}}>{children}</AbsoluteFill>
);
