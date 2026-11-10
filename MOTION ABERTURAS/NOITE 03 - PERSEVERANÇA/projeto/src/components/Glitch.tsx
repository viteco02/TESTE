import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {rand} from '../utils/anim';

/** Imagem fatiada em faixas horizontais deslocadas — o "glitch" do cartaz. */
export const SlicedImage: React.FC<{
  src: string; w: number; h: number; amount: number; seed?: number; n?: number; style?: React.CSSProperties;
}> = ({src, w, h, amount, seed = 0, n = 16, style}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 2);
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      {Array.from({length: n}).map((_, i) => {
        const y0 = (h * i) / n;
        const active = rand(i * 7 + k * 3 + seed) > 0.5;
        const dx = active ? (rand(i * 13 + k + seed) - 0.5) * 2 * amount : 0;
        return (
          <div key={i} style={{
            position: 'absolute', left: 0, top: y0, width: w, height: h / n + 1,
            backgroundImage: `url(${src})`, backgroundSize: `${w}px ${h}px`, backgroundRepeat: 'no-repeat',
            backgroundPosition: `${dx}px ${-y0}px`,
          }} />
        );
      })}
    </div>
  );
};

/** Retângulos de interferência (verde-limão, marfim, vermelho/amarelo do cartaz). */
export const GlitchBars: React.FC<{intensity?: number; seed?: number; count?: number}> = ({intensity = 1, seed = 0, count = 9}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 3);
  const cols = [C.lime, C.white, '#E23B2E', '#F2C230', C.white];
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: count}).map((_, i) => {
        const on = rand(i * 11 + k * 5 + seed) < 0.45 * intensity;
        if (!on) return null;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: rand(i * 3 + k + seed) * 1080 - 100, top: rand(i * 5 + k * 2 + seed) * 1920,
            width: 80 + rand(i * 9 + k + seed) * 520, height: 4 + rand(i * 2 + k * 7 + seed) * 26,
            background: cols[Math.floor(rand(i + k + seed) * cols.length)], opacity: 0.85,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Aberração cromática barata: duas cópias deslocadas em ciano/magenta com blend. */
export const Chroma: React.FC<{amount: number; children: React.ReactNode}> = ({amount, children}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${-amount}px)`, mixBlendMode: 'screen', opacity: amount > 0.5 ? 0.55 : 0, filter: 'hue-rotate(160deg) saturate(2)'}}>{children}</div>
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${amount}px)`, mixBlendMode: 'screen', opacity: amount > 0.5 ? 0.55 : 0, filter: 'hue-rotate(-60deg) saturate(2)'}}>{children}</div>
    <div style={{position: 'absolute', inset: 0}}>{children}</div>
  </div>
);
