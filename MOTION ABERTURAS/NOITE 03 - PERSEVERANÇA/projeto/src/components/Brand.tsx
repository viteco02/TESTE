import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT} from '../theme';
import {rand} from '../utils/anim';
import {Grain} from './Backdrop';

/** Fundo azul royal do cartaz: gradiente profundo, nuvens suaves, faixas diagonais e pílulas verde neon nas bordas. */
export const BlueBg: React.FC<{T?: number; tone?: 'royal' | 'deep' | 'night'; stripes?: boolean; pills?: boolean; grain?: number; children?: React.ReactNode}> =
({T = 0, tone = 'royal', stripes = true, pills = true, grain = 0.3, children}) => {
  const g = {
    royal: 'radial-gradient(ellipse 90% 60% at 50% 32%, #3B80FF 0%, #2368F2 38%, #1245C9 72%, #0B2C9A 100%)',
    deep: 'radial-gradient(ellipse 90% 60% at 50% 40%, #1E58E0 0%, #123FC0 45%, #0A2A93 80%, #061A66 100%)',
    night: 'radial-gradient(ellipse 90% 60% at 50% 40%, #0F2E99 0%, #081F73 50%, #040F3F 100%)',
  }[tone];
  const bl = (i: number) => ({x: 540 + Math.sin(T * 0.25 + i * 2.1) * 260, y: 300 + i * 520 + Math.cos(T * 0.2 + i) * 120});
  return (
    <AbsoluteFill style={{background: g, overflow: 'hidden'}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', left: bl(i).x - 420, top: bl(i).y - 260, width: 840, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,170,255,0.30), transparent 70%)', filter: 'blur(30px)'}} />
      ))}
      {stripes && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].map((i) => <polygon key={i} points={`0,${310 + i * 118} 78,${262 + i * 118} 78,${318 + i * 118} 0,${372 + i * 118}`} fill={C.lime} />)}
        </svg>
      )}
      {pills && (
        <>
          <div style={{position: 'absolute', right: -60, top: 330, width: 120, height: 330, borderRadius: '90px 0 0 90px', background: C.lime, opacity: 0.95}} />
          <div style={{position: 'absolute', right: -60, top: 790, width: 120, height: 330, borderRadius: '90px 0 0 90px', background: C.lime, opacity: 0.95}} />
        </>
      )}
      {children}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(2,10,50,0.55) 100%)'}} />
      <Grain opacity={grain} />
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{w?: number; style?: React.CSSProperties}> = ({w = 230, style}) => (
  <Img src={staticFile('images/logo_agape.png')} style={{width: w, ...style}} />
);

/** Placa verde neon inclinada (como o "DESAFIOS" do cartaz). */
export const Pill: React.FC<{children: React.ReactNode; size?: number; color?: string; bg?: string; px?: number; skew?: number; radius?: number; style?: React.CSSProperties}> =
({children, size = 120, color = C.navy, bg = C.lime, px = 40, skew = -8, radius = 26, style}) => (
  <div style={{display: 'inline-block', background: bg, borderRadius: radius, padding: `${size * 0.06}px ${px}px`, transform: `skewX(${skew}deg)`, boxShadow: `0 10px 0 rgba(3,14,58,0.35), 0 0 60px rgba(200,255,46,0.35)`, ...style}}>
    <span style={{display: 'block', fontFamily: FONT.title, fontStyle: 'italic', fontWeight: 900, fontSize: size, lineHeight: 1.04, color, letterSpacing: -2, whiteSpace: 'nowrap'}}>{children}</span>
  </div>
);

export const HeavyText: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; weight?: 800 | 900}> =
({children, size = 160, color = C.white, style, weight = 900}) => (
  <span style={{fontFamily: FONT.title, fontStyle: 'italic', fontWeight: weight, fontSize: size, lineHeight: 0.98, color, letterSpacing: -3, whiteSpace: 'nowrap', textShadow: '0 8px 0 rgba(3,14,58,0.32), 0 0 40px rgba(3,14,58,0.35)', display: 'inline-block', ...style}}>{children}</span>
);

export const Spaced: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; track?: number}> =
({children, size = 40, color = C.white, style, track = 8}) => (
  <div style={{fontFamily: FONT.body, fontWeight: 700, fontStyle: 'italic', fontSize: size, letterSpacing: track, color, textTransform: 'uppercase', ...style}}>{children}</div>
);

export const Brackets: React.FC<{w: number; h: number; color?: string; t?: number; arm?: number; style?: React.CSSProperties; children?: React.ReactNode}> =
({w, h, color = C.lime, t = 6, arm = 46, style, children}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}} fill="none" stroke={color} strokeWidth={t}>
      <path d={`M${arm} ${t / 2} H${t / 2} V${h - t / 2} H${arm}`} /><path d={`M${w - arm} ${t / 2} H${w - t / 2} V${h - t / 2} H${w - arm}`} />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{children}</div>
  </div>
);

export const Compass: React.FC<{size: number; needle?: number; glow?: number; style?: React.CSSProperties}> = ({size, needle = 0, glow = 1, style}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible', ...style}}>
    <defs><filter id="cg"><feGaussianBlur stdDeviation="6" /></filter></defs>
    <circle r={90} fill="none" stroke={C.lime} strokeWidth={9} opacity={0.55 * glow} filter="url(#cg)" />
    <circle r={90} fill="rgba(6,26,102,0.35)" stroke={C.lime} strokeWidth={8} />
    <circle r={76} fill="none" stroke={C.lime} strokeWidth={2} opacity={0.6} strokeDasharray="2 7" />
    {Array.from({length: 24}).map((_, i) => <line key={i} x1={0} y1={-90} x2={0} y2={i % 6 === 0 ? -76 : -83} stroke={C.lime} strokeWidth={i % 6 === 0 ? 4 : 2} transform={`rotate(${i * 15})`} />)}
    <g transform={`rotate(${needle})`}>
      <polygon points="0,-98 11,-11 0,0 -11,-11" fill={C.lime} /><polygon points="0,-98 0,0 -11,-11" fill="#9BD40F" />
      <polygon points="0,98 11,11 0,0 -11,11" fill={C.white} opacity={0.9} />
      <polygon points="-98,0 -11,-11 0,0 -11,11" fill={C.lime} /><polygon points="98,0 11,-11 0,0 11,11" fill={C.lime} />
      <polygon points="-48,-48 -6,-6 0,0 -10,-1" fill={C.lime} opacity={0.8} /><polygon points="48,-48 6,-6 0,0 10,-1" fill={C.lime} opacity={0.8} />
      <polygon points="-48,48 -6,6 0,0 -10,1" fill={C.lime} opacity={0.8} /><polygon points="48,48 6,6 0,0 10,1" fill={C.lime} opacity={0.8} />
    </g>
    <circle r={8} fill={C.navy} stroke={C.white} strokeWidth={3} />
  </svg>
);

/** Selo: p=0 slot vazio (tracejado), p→1 carimbado. since = segundos desde o carimbo (anel de choque). */
export const Seal: React.FC<{size: number; p: number; since?: number; label?: string; labelColor?: string}> = ({size, p, since = 99, label, labelColor = C.white}) => {
  const pts = Array.from({length: 24}).map((_, i) => { const a = (i / 24) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 40 : 48; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const sc = p < 1 ? 2.4 - 1.4 * p + Math.sin(p * Math.PI) * 0.0 : 1;
  const ring = since >= 0 && since < 0.55 ? since / 0.55 : -1;
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <svg width={size} height={size} viewBox="-60 -60 120 120" style={{overflow: 'visible', position: 'absolute', inset: 0}}>
        <circle r={50} fill="rgba(6,26,102,0.35)" stroke={C.white} strokeWidth={3} strokeDasharray="7 7" opacity={0.5 * (1 - p) + 0.0} />
        {p > 0.001 && (
          <g transform={`scale(${sc}) rotate(${(1 - p) * -40})`} opacity={Math.min(1, p * 3)}>
            <polygon points={pts} fill={C.lime} stroke={C.white} strokeWidth={3} />
            <circle r={31} fill="none" stroke={C.navy} strokeWidth={3} />
            <path d="M-16 1 L-5 12 L17 -12" fill="none" stroke={C.navy} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {ring >= 0 && <circle r={50 + ring * 70} fill="none" stroke={C.lime} strokeWidth={6 * (1 - ring)} opacity={1 - ring} />}
      </svg>
      {label && <div style={{position: 'absolute', left: 0, right: 0, top: size * 1.04, textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontStyle: 'italic', fontSize: size * 0.22, letterSpacing: 3, color: labelColor}}>{label}</div>}
    </div>
  );
};

/** Lockup "VERDADE E DESAFIO" (VERDADE branco / DESAFIO azul-marinho sobre faixa verde), como no cartaz. */
export const Lockup: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 120, style}) => (
  <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', ...style}}>
    <HeavyText size={size} style={{letterSpacing: -2}}>VERDADE</HeavyText>
    <div style={{display: 'flex', alignItems: 'center', gap: size * 0.1, marginTop: -size * 0.05}}>
      <HeavyText size={size * 0.62}>E</HeavyText>
      <Pill size={size * 0.9} px={size * 0.22} radius={size * 0.16}>DESAFIO</Pill>
    </div>
  </div>
);
