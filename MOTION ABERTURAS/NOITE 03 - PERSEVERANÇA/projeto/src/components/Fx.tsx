import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, FPS} from '../theme';
import {E, clamp, lerp, rand} from '../utils/anim';
import {HeavyText} from './Brand';

export const Grain16: React.FC<{opacity?: number}> = ({opacity = 0.22}) => {
  const k = Math.floor(useCurrentFrame() / 2);
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <div style={{position: 'absolute', left: -200, top: -200, width: 2400, height: 1500, backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px 512px', transform: `translate(${rand(k) * 160}px, ${rand(k + 9) * 160}px)`}} />
    </AbsoluteFill>
  );
};

/** Fundo azul royal 16:9. `geo` = faixas diagonais e pílulas do cartaz nas bordas. */
export const Bg16: React.FC<{T?: number; tone?: 'royal' | 'deep' | 'night' | 'bright'; geo?: boolean; vignette?: number; grain?: number; children?: React.ReactNode}> =
({T = 0, tone = 'royal', geo = false, vignette = 0.55, grain = 0.22, children}) => {
  const g = {
    bright: 'radial-gradient(ellipse 80% 90% at 50% 40%, #4A8BFF 0%, #2368F2 40%, #1448CC 75%, #0C2FA0 100%)',
    royal: 'radial-gradient(ellipse 80% 90% at 50% 42%, #2F78FF 0%, #2368F2 36%, #1245C9 72%, #0A2A93 100%)',
    deep: 'radial-gradient(ellipse 80% 90% at 50% 45%, #1B54DC 0%, #123FC0 40%, #0A2A93 78%, #061A66 100%)',
    night: 'radial-gradient(ellipse 80% 90% at 50% 50%, #0F2E99 0%, #081F73 50%, #030C3A 100%)',
  }[tone];
  return (
    <AbsoluteFill style={{background: g, overflow: 'hidden'}}>
      {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 960 + Math.sin(T * 0.22 + i * 2.3) * 520 - 520, top: 200 + i * 300 + Math.cos(T * 0.17 + i) * 80 - 260, width: 1040, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,170,255,0.26), transparent 70%)', filter: 'blur(26px)'}} />)}
      {geo && (
        <>
          <svg width={W16} height={H16} style={{position: 'absolute', inset: 0}}>
            {[0, 1, 2].map((i) => <polygon key={i} points={`0,${470 + i * 70} 70,${430 + i * 70} 70,${470 + i * 70} 0,${510 + i * 70}`} fill={C.lime} opacity={0.9} />)}
          </svg>
          <div style={{position: 'absolute', right: -50, top: 120, width: 100, height: 250, borderRadius: '70px 0 0 70px', background: C.lime, opacity: 0.92}} />
          <div style={{position: 'absolute', right: -50, top: 470, width: 100, height: 250, borderRadius: '70px 0 0 70px', background: C.lime, opacity: 0.92}} />
        </>
      )}
      {children}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 48%, rgba(2,10,50,${vignette}) 100%)`, pointerEvents: 'none'}} />
      <Grain16 opacity={grain} />
    </AbsoluteFill>
  );
};
const W16 = 1920, H16 = 1080;

export const Particles16: React.FC<{n?: number; seed?: number; color?: string; speed?: number; size?: number; opacity?: number; up?: boolean}> =
({n = 40, seed = 1, color = C.white, speed = 0.5, size = 5, opacity = 0.6, up = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: n}).map((_, i) => {
        const x0 = rand(seed + i * 1.3) * W16, y0 = rand(seed + i * 2.9) * H16;
        const sp = (0.4 + rand(i * 5 + seed)) * speed;
        const y = (((y0 + (up ? -1 : 1) * f * sp * 2) % H16) + H16) % H16;
        const x = x0 + Math.sin(f * 0.02 + i) * 22;
        const s = size * (0.4 + rand(i * 8 + seed));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: opacity * (0.3 + rand(i + 4)), boxShadow: `0 0 ${s * 3}px ${color}`}} />;
      })}
    </AbsoluteFill>
  );
};

export const GlitchBars16: React.FC<{intensity?: number; seed?: number; count?: number}> = ({intensity = 1, seed = 0, count = 8}) => {
  const k = Math.floor(useCurrentFrame() / 3);
  const cols = [C.lime, C.white, C.blueHi, C.lime];
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: count}).map((_, i) => {
        if (rand(i * 11 + k * 5 + seed) >= 0.4 * intensity) return null;
        return <div key={i} style={{position: 'absolute', left: rand(i * 3 + k + seed) * W16 - 150, top: rand(i * 5 + k * 2 + seed) * H16, width: 120 + rand(i * 9 + k + seed) * 720, height: 3 + rand(i * 2 + k * 7 + seed) * 18, background: cols[Math.floor(rand(i + k + seed) * cols.length)], opacity: 0.85}} />;
      })}
    </AbsoluteFill>
  );
};

/** Caixa 3D (w×h×d) centrada na origem. Use dentro de um container com transform-style: preserve-3d. */
export const Box3D: React.FC<{w: number; h: number; d: number; front: React.ReactNode; side: React.ReactNode; top?: React.ReactNode; style?: React.CSSProperties}> = ({w, h, d, front, side, top, style}) => {
  const face: React.CSSProperties = {position: 'absolute', backfaceVisibility: 'hidden'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', ...style}}>
      <div style={{...face, width: w, height: h, left: -w / 2, top: -h / 2, transform: `translateZ(${d / 2}px)`}}>{front}</div>
      <div style={{...face, width: w, height: h, left: -w / 2, top: -h / 2, transform: `rotateY(180deg) translateZ(${d / 2}px)`}}>{front}</div>
      <div style={{...face, width: d, height: h, left: -d / 2, top: -h / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)`}}>{side}</div>
      <div style={{...face, width: d, height: h, left: -d / 2, top: -h / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)`}}>{side}</div>
      <div style={{...face, width: w, height: d, left: -w / 2, top: -d / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)`}}>{top ?? side}</div>
    </div>
  );
};

/** Letras em 3D que se reorganizam: p 0→1 leva cada letra de uma posição aleatória no espaço até o lugar final. */
export const Letters3D: React.FC<{text: string; size: number; p: number; seed?: number; spread?: number; color?: string; stagger?: number; style?: React.CSSProperties; gap?: number}> =
({text, size, p, seed = 1, spread = 1, color = C.white, stagger = 0.04, style, gap = 0}) => (
  <div style={{display: 'flex', transformStyle: 'preserve-3d', ...style}}>
    {Array.from(text).map((ch, i) => {
      const q = E.out(clamp((p - i * stagger) / (1 - Math.min(0.6, text.length * stagger))));
      const r = (n: number) => rand(seed * 17 + i * n) - 0.5;
      return (
        <span key={i} style={{display: 'inline-block', width: ch === ' ' ? size * 0.3 : undefined, marginRight: gap, fontFamily: FONT.title, fontStyle: 'italic', fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: -3,
          transform: `translate3d(${r(3.1) * 2600 * spread * (1 - q)}px, ${r(5.3) * 1400 * spread * (1 - q)}px, ${r(7.7) * 3600 * spread * (1 - q)}px) rotateX(${r(1.7) * 360 * (1 - q)}deg) rotateY(${r(2.9) * 360 * (1 - q)}deg) rotateZ(${r(4.3) * 120 * (1 - q)}deg)`,
          opacity: clamp(q * 3), textShadow: '0 8px 0 rgba(3,14,58,0.32), 0 0 40px rgba(3,14,58,0.3)'}}>{ch === ' ' ? ' ' : ch}</span>
      );
    })}
  </div>
);

/** Janelas digitais abstratas (sem marcas). */
export const WinPane: React.FC<{kind: number; seed: number; w?: number; h?: number; T?: number}> = ({kind, seed, w = 460, h = 300, T = 0}) => {
  const bars = (n: number) => Array.from({length: n}).map((_, i) => <div key={i} style={{height: 14, width: `${40 + rand(seed + i) * 55}%`, background: 'rgba(255,255,255,0.28)', borderRadius: 7, marginBottom: 12}} />);
  return (
    <div style={{width: w, height: h, borderRadius: 18, background: 'linear-gradient(160deg, rgba(20,60,190,0.94), rgba(8,30,120,0.96))', border: '3px solid rgba(255,255,255,0.8)', boxShadow: '0 24px 60px rgba(2,10,50,0.55)', overflow: 'hidden', position: 'relative'}}>
      <div style={{height: 44, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16}}>
        {[C.lime, '#fff', '#fff'].map((c, i) => <div key={i} style={{width: 14, height: 14, borderRadius: '50%', background: c, opacity: i ? 0.5 : 1}} />)}
      </div>
      <div style={{padding: 22}}>
        {kind % 5 === 0 && <><div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18}}><div style={{width: 62, height: 62, borderRadius: '50%', background: C.white}} /><div style={{flex: 1}}>{bars(2)}</div></div>{bars(3)}</>}
        {kind % 5 === 1 && <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, height: h - 110}}>{Array.from({length: 7}).map((_, i) => <div key={i} style={{flex: 1, height: `${25 + rand(seed + i * 3) * 75}%`, background: i % 3 === 0 ? C.lime : 'rgba(255,255,255,0.6)', borderRadius: 6}} />)}</div>}
        {kind % 5 === 2 && <>{[0, 1, 2].map((i) => <div key={i} style={{width: `${48 + rand(seed + i) * 40}%`, marginLeft: i % 2 ? 'auto' : 0, height: 46, borderRadius: 23, background: i % 2 ? C.lime : 'rgba(255,255,255,0.85)', marginBottom: 14}} />)}</>}
        {kind % 5 === 3 && <div style={{position: 'relative', height: h - 110, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: 0, height: 0, borderLeft: '46px solid #fff', borderTop: '28px solid transparent', borderBottom: '28px solid transparent'}} /></div>}
        {kind % 5 === 4 && <>{bars(5)}<div style={{position: 'absolute', right: 22, top: 62, minWidth: 54, height: 54, borderRadius: 27, background: C.lime, color: C.navy, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px'}}>{Math.floor(3 + rand(seed) * 96)}</div></>}
      </div>
    </div>
  );
};

/** Vídeo em recorte (papel) com leve grade azul royal e borda branca. */
export const PhotoCut: React.FC<{src: string; from?: number; w: number; h: number; clip: string; scale?: number; panX?: number; panY?: number; grade?: number; style?: React.CSSProperties; rate?: number}> =
({src, from = 0, w, h, clip, scale = 1.2, panX = 0, panY = 0, grade = 0.5, style, rate = 1}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <div style={{position: 'absolute', inset: -8, background: C.white, clipPath: clip, transform: 'translate(6px, 8px)', opacity: 0.95}} />
    <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${scale}) translate(${panX}px, ${panY}px)`}}>
        <OffthreadVideo src={staticFile(`video/${src}`)} startFrom={Math.round(from * FPS)} playbackRate={rate} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(35,104,242,${grade * 0.7}), rgba(6,26,102,${grade}))`, mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(74,139,255,${grade * 0.4}), transparent 55%)`, mixBlendMode: 'screen'}} />
    </div>
  </div>
);
export const CLIPS = {
  torn1: 'polygon(0% 4%, 6% 0%, 15% 3%, 28% 0%, 44% 3%, 60% 0%, 78% 3%, 92% 0%, 100% 3%, 98% 30%, 100% 55%, 97% 80%, 100% 97%, 85% 100%, 66% 97%, 48% 100%, 30% 97%, 12% 100%, 0% 96%, 2% 70%, 0% 45%, 3% 20%)',
  torn2: 'polygon(2% 0%, 22% 3%, 40% 0%, 63% 3%, 82% 0%, 100% 2%, 97% 28%, 100% 52%, 96% 76%, 100% 100%, 76% 96%, 56% 100%, 34% 96%, 14% 100%, 0% 97%, 3% 72%, 0% 48%, 3% 24%)',
  slant: 'polygon(7% 0%, 100% 0%, 93% 100%, 0% 100%)',
};

/** Cruz de luz branca com detalhes verdes e raios volumétricos. k 0→1 = intensidade. */
export const LightCross: React.FC<{size: number; k: number; T: number}> = ({size, k, T}) => {
  const vw = size * 0.115, vh = size, hw = size * 0.62, hh = size * 0.115, hy = size * 0.27;
  const rays = Array.from({length: 14}).map((_, i) => ({a: i * (360 / 14) + T * 4, o: 0.35 + 0.35 * Math.abs(Math.sin(T * 0.8 + i))}));
  const bar = (extra: React.CSSProperties): React.CSSProperties => ({position: 'absolute', background: 'linear-gradient(180deg, #FFFFFF, #E8F1FF)', borderRadius: 6, ...extra});
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div style={{position: 'absolute', left: size / 2 - size * 1.6, top: hy + hh / 2 - size * 1.6, width: size * 3.2, height: size * 3.2, opacity: k * 0.85,
        background: `conic-gradient(${rays.map((r, i) => `rgba(255,255,255,${r.o * 0.0}) ${r.a % 360}deg`).join(',')})`}} />
      <div style={{position: 'absolute', left: size / 2 - size * 1.1, top: hy + hh / 2 - size * 1.1, width: size * 2.2, height: size * 2.2, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,${0.55 * k}) 0%, rgba(120,175,255,${0.35 * k}) 25%, transparent 62%)`}} />
      <div style={{position: 'absolute', left: size / 2 - vw * 3, top: -size * 0.15, width: vw * 6, height: size * 1.3, opacity: k * 0.6, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.8) 70%, transparent)', filter: 'blur(26px)'}} />
      <div style={{position: 'absolute', left: size / 2 - hw / 2 - size * 0.1, top: hy + hh / 2 - size * 0.14, width: hw + size * 0.2, height: size * 0.28, opacity: k * 0.6, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.8) 70%, transparent)', filter: 'blur(24px)'}} />
      <div style={bar({left: size / 2 - vw / 2, top: 0, width: vw, height: vh, boxShadow: `0 0 ${size * 0.08 * k}px rgba(255,255,255,${k}), 0 0 ${size * 0.2 * k}px rgba(120,175,255,${k})`, opacity: clamp(k * 2)})} />
      <div style={bar({left: size / 2 - hw / 2, top: hy, width: hw, height: hh, boxShadow: `0 0 ${size * 0.08 * k}px rgba(255,255,255,${k}), 0 0 ${size * 0.2 * k}px rgba(120,175,255,${k})`, opacity: clamp(k * 2)})} />
      <div style={{position: 'absolute', left: size / 2 - 3, top: size * 0.04, width: 6, height: vh - size * 0.08, background: C.lime, opacity: 0.9 * k, borderRadius: 3, boxShadow: `0 0 18px ${C.lime}`}} />
      <div style={{position: 'absolute', left: size / 2 - hw / 2 + size * 0.04, top: hy + hh / 2 - 3, width: hw - size * 0.08, height: 6, background: C.lime, opacity: 0.9 * k, borderRadius: 3, boxShadow: `0 0 18px ${C.lime}`}} />
    </div>
  );
};
