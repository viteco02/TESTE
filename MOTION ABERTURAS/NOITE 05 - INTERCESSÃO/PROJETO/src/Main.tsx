import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './styles/fonts';
import {C, FONT, W, H, FPS, clamp, lerp, E, pa, win, rand, smoothPath, Stroke, Fig, Waves, Link, Particles, Heavy, Plate, Tag, In, DrawWord, GlitchBars} from './kit';

export const AUDIO_SEC = 173.453;

/* ───────────── utilidades de cena ───────────── */
const Scene: React.FC<{T: number; a: number; b: number; fi?: number; fo?: number; children: (t: number, k: number) => React.ReactNode}> = ({T, a, b, fi = 0.35, fo = 0.35, children}) => {
  if (T < a - fi || T > b + fo) return null;
  const k = Math.min(clamp((T - (a - fi)) / Math.max(fi, 0.001)), 1 - clamp((T - b) / Math.max(fo, 0.001)));
  return <AbsoluteFill style={{opacity: k}}>{children(T, k)}</AbsoluteFill>;
};
const Svg: React.FC<{children: React.ReactNode; cam?: {s?: number; x?: number; y?: number; ox?: number; oy?: number}}> = ({children, cam = {}}) => {
  const {s = 1, x = 0, y = 0, ox = W / 2, oy = H / 2} = cam;
  return (<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <g transform={`translate(${ox + x},${oy + y}) scale(${s}) translate(${-ox},${-oy})`}>{children}</g></svg>);
};
const Pos: React.FC<{x?: number; y: number; align?: 'center' | 'left' | 'right'; children: React.ReactNode; gap?: number}> = ({x = 0, y, align = 'center', children, gap = 10}) => (
  <div style={{position: 'absolute', top: y, left: align === 'center' ? 0 : align === 'left' ? x : undefined, right: align === 'center' ? 0 : align === 'right' ? W - x : undefined,
    display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', gap}}>{children}</div>
);
/* rachaduras / interferências ao redor de uma figura */
const Cracks: React.FC<{x: number; y: number; r: number; T: number; k: number; seed?: number}> = ({x, y, r, T, k, seed = 1}) => {
  if (k <= 0) return null;
  return (<g opacity={k}>{Array.from({length: 9}).map((_, i) => {
    const a0 = rand(i + seed) * 6.28; const pts: number[][] = []; let px = x + Math.cos(a0) * r * 0.55, py = y + Math.sin(a0) * r * 0.8;
    for (let j = 0; j < 5; j++) { pts.push([px, py]); px += Math.cos(a0 + (rand(i * 9 + j + seed) - 0.5) * 1.6) * r * 0.16; py += Math.sin(a0 + (rand(i * 5 + j) - 0.5) * 1.6) * r * 0.16; }
    const flick = rand(Math.floor(T * 8) + i * 3 + seed) > 0.25 ? 1 : 0.2;
    return <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={i % 3 ? C.white : C.lime} strokeWidth={1.6} opacity={0.55 * flick} />;
  })}</g>);
};
/* linhas "sonoras" que respiram ao redor; congelam quando t>freeze */
const SoundLines: React.FC<{T: number; y: number; k: number; freeze: number}> = ({T, y, k, freeze}) => {
  const f = 1 - pa(T, freeze, 0.5, E.inOut);
  return (<g opacity={k}>{[0, 1, 2].map((i) => {
    let d = ''; for (let x = 0; x <= W; x += 24) { const yy = y + (i - 1) * 26 + Math.sin(x * 0.012 + T * (2 + i) + i) * 22 * f * Math.sin(x / W * Math.PI); d += (x ? 'L' : 'M') + x + ',' + yy.toFixed(1); }
    return <path key={i} d={d} fill="none" stroke={i === 1 ? C.lime : C.white} strokeWidth={1.4} opacity={0.35 * (0.3 + 0.7 * f)} />;
  })}</g>);
};
const LightAbove: React.FC<{x: number; k: number; w?: number}> = ({x, k, w = 520}) => k > 0 ? (
  <g opacity={k}>
    <defs><linearGradient id={'beam' + x} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.85" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
    <polygon points={`${x - 60},-40 ${x + 60},-40 ${x + w / 2},${H} ${x - w / 2},${H}`} fill={`url(#beam${x})`} opacity={0.35} style={{filter: 'blur(18px)'}} />
    <ellipse cx={x} cy={-10} rx={260} ry={90} fill="#fff" opacity={0.7} style={{filter: 'blur(30px)'}} />
  </g>) : null;

/* cartões de nome */
const NAMES = ['ANA', 'LUCAS', 'PEDRO', 'JÚLIA', 'MATEUS', 'BEATRIZ', 'GABRIEL', 'LARISSA', 'JOÃO', 'CAMILA', 'RAFAEL', 'SOFIA', 'DAVI', 'MARIANA', 'TIAGO', 'ISABELA'];
const NameCard: React.FC<{x: number; y: number; name: string; k: number; sel?: number; rot?: number}> = ({x, y, name, k, sel = 0, rot = 0}) => k > 0 ? (
  <div style={{position: 'absolute', left: x - 150, top: y - 46, width: 300, height: 92, opacity: k, transform: `rotate(${rot}deg) scale(${lerp(0.85, 1, k) + sel * 0.12})`,
    background: sel > 0 ? 'rgba(200,255,46,0.10)' : 'rgba(255,255,255,0.06)', border: `${2 + sel * 2}px solid ${sel > 0 ? C.lime : 'rgba(255,255,255,0.35)'}`, borderRadius: 10,
    boxShadow: sel > 0 ? `0 0 ${40 * sel}px rgba(200,255,46,0.6)` : 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', backdropFilter: 'blur(6px)'}}>
    <div style={{width: 34, height: 34, borderRadius: 17, border: `2px solid ${sel > 0 ? C.lime : C.white}`}} />
    <div style={{fontFamily: FONT.cond, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: sel > 0 ? C.lime : C.white}}>{name}</div>
  </div>) : null;

/* moldura angular (selos da identidade) */
const Frame: React.FC<{x: number; y: number; w: number; h: number; p: number; color?: string; cut?: number}> = ({x, y, w, h, p, color = C.white, cut = 28}) => {
  const d = `M${x - w / 2 + cut},${y - h / 2} L${x + w / 2},${y - h / 2} L${x + w / 2},${y + h / 2 - cut} L${x + w / 2 - cut},${y + h / 2} L${x - w / 2},${y + h / 2} L${x - w / 2},${y - h / 2 + cut} Z`;
  return <Stroke d={d} p={p} color={color} w={2} glow={0.6} />;
};

/* ───────────── FUNDO ───────────── */
const Background: React.FC<{T: number}> = ({T}) => {
  // intensidade do azul por momento: escuro no início, royal na oração, etc.
  const lift = Math.max(win(T, 26.4, 28.4, 0.1, 0.4) * 0.9, win(T, 141.9, 155.4, 0.8, 0.5) * 0.75, win(T, 155.4, 161.9, 0.4, 0.4) * 0.9, win(T, 172.3, 200, 0.3, 0.3) * 0.9, win(T, 94.0, 98.5, 0.3, 0.8) * 0.5);
  const base = clamp(T / 18) * 0.35;
  const g = clamp(base + lift);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 75% at 50% 45%, ${mix('#0A1A5C', '#2E74FF', g)} 0%, ${mix('#040B2E', '#1650D8', g)} 55%, ${mix('#01030F', '#0A2A8C', g)} 100%)`}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.12}}>
        {Array.from({length: 13}).map((_, i) => <line key={'v' + i} x1={i * 160} y1={0} x2={i * 160 - 120} y2={H} stroke="#fff" strokeWidth={1} />)}
      </svg>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Particles T={T} n={70} seed={3} vy={-8} k={0.45} /></svg>
    </AbsoluteFill>
  );
};
const mix = (a: string, b: string, t: number) => { const pa_ = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = pa_(a), B = pa_(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };

/* ───────────── CENAS ───────────── */
const S1: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={0} b={5.3} fi={0.01} fo={0.3}>{() => {
    const cam = {s: lerp(1.0, 1.12, pa(T, 0, 5.3, E.inOut))};
    const who = T < 2.69 ? 'I01' : T < 3.6 ? 'I02' : 'I03';
    const t0 = T < 2.69 ? 0.15 : T < 3.6 ? 2.69 : 3.6;
    const frz = T > 3.92;
    return (<>
      <Svg cam={cam}>
        <SoundLines T={frz ? 3.92 : T} y={560} k={0.9} freeze={3.92} />
        <Fig id={who} x={who === 'I02' ? 640 : 620} y={930} h={who === 'I02' ? 520 : 680} p={pa(T, t0, who === 'I01' ? 1.6 : 0.7, E.inOut)} T={T} glitch={frz ? 0 : 0.55} pulse={frz ? pa(T, 4.1, 0.6) * (0.75 + 0.25 * Math.sin(T * 6)) : 0} />
        <Cracks x={620} y={620} r={420} T={T} k={frz ? 0 : pa(T, 0.6, 0.8) * 0.9} />
      </Svg>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><DrawWord T={T} a={0.45} text="batalhas" size={170} x={1300} y={520} /></svg>
      <Pos y={560} x={1300} align="center"><div style={{position: 'absolute', left: 1300 - 400, width: 800, textAlign: 'center'}}>
        <In T={T} a={1.2} b={3.85}><Tag size={36}>que ninguém vê</Tag></In></div></Pos>
      <div style={{position: 'absolute', left: 900, width: 800, top: 600, textAlign: 'center'}}>
        <In T={T} a={2.69} b={3.85}><Tag size={36} color={C.lime}>lutas que acontecem em</Tag></In>
        <In T={T} a={3.92} dir="slam" d={0.4}><Heavy size={150}>silêncio</Heavy></In>
      </div>
    </>);
  }}</Scene>
);

const S2: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={5.35} b={17.6} fi={0.3}>{() => {
    const reveal = pa(T, 6.4, 0.8, E.inOut); const sh = pa(T, 9.6, 1.4, E.in);
    const row = pa(T, 11.6, 0.6);
    return (<>
      <Svg cam={{s: lerp(1.0, 1.06, pa(T, 5.4, 6, E.inOut))}}>
        {/* camada escondida atrás do sorriso */}
        <g opacity={reveal * (1 - row)}>
          {Array.from({length: 26}).map((_, i) => { const r = rand(i * 3.3); const a = r * 6.28; const R = 260 + rand(i) * 260; const j = Math.sin(T * 3 + i) * 10;
            return <path key={i} d={`M${960 + Math.cos(a) * R * 0.4},${560 + Math.sin(a) * R * 0.3} q${30 + j},${-60} ${80 * Math.cos(a)},${80 * Math.sin(a) + j} t${60},${40}`} fill="none" stroke={i % 4 ? 'rgba(255,255,255,0.5)' : C.lime} strokeWidth={1.5} opacity={0.7} />; })}
          <GlitchBars T={T} x={960} y={420} k={0.8} wmax={340} />
        </g>
        {T < 11.8 && <Fig id="I06" x={960} y={1080} h={880} p={pa(T, 5.45, 1.3, E.inOut)} T={T} shatter={sh} fill={0.75} />}
        {sh > 0 && sh < 1 && <Particles T={T} n={90} seed={8} area={[560, 200, 800, 700]} vy={-60} k={sh * (1 - sh) * 2.4} color={C.lime} />}
        {row > 0 && [['I01', 330], ['I03', 760], ['I02', 1180], ['I08', 1600]].map(([id, x], i) => (
          <g key={i}><Fig id={id as string} x={x as number} y={900} h={id === 'I02' ? 360 : id === 'I08' ? 470 : 480} p={pa(T, 12.2 + i * 0.35, 0.9, E.inOut)} T={T} seed={i + 2} glitch={pa(T, 14.2, 0.4) * 0.6} opacity={row} />
            <Cracks x={x as number} y={680} r={260} T={T} k={pa(T, 14.28, 0.5) * row} seed={i + 4} /></g>))}
      </Svg>
      <Pos y={150} x={140} align="left">
        <In T={T} a={5.5} b={9.2} dir="left"><Heavy size={130}>sorrisos</Heavy></In>
        <In T={T} a={6.0} b={9.2} dir="left"><Tag size={40} color={C.lime}>escondem preocupações</Tag></In>
      </Pos>
      <Pos y={150} x={1780} align="right">
        <In T={T} a={8.34} b={11.6} dir="right"><Tag size={40}>palavras escondem</Tag></In>
        <In T={T} a={9.35} b={11.6} dir="slam" d={0.35}><Heavy size={200} color={C.lime}>dor</Heavy></In>
      </Pos>
      <Pos y={140}>
        <In T={T} a={12.2} b={17.4}><Tag size={36}>pessoas ao nosso lado enfrentam</Tag></In>
        <In T={T} a={14.28} b={17.4} dir="zoom"><Heavy size={120}>batalhas</Heavy></In>
        <In T={T} a={15.1} b={17.4}><Tag size={30} color={C.lime}>que jamais teremos conhecimento</Tag></In>
      </Pos>
    </>);
  }}</Scene>
);

const S3: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={17.95} b={28.3} fi={0.3} fo={0.3}>{() => {
    const wx = lerp(-200, 2300, pa(T, 19.0, 6.2, (t) => t)); const hit = pa(T, 19.9, 1.4, E.out);
    const prayer = T >= 26.52; const pr = pa(T, 26.52, 0.01);
    const letters = 'SILÊNCIO'.split('');
    return (<>
      {!prayer && (<>
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', gap: 6}}>
          {letters.map((ch, i) => { const r = rand(i * 5.1); const fly = hit * (wx > 700 + i * 70 ? 1 : 0);
            return <div key={i} style={{fontFamily: FONT.heavy, fontWeight: 900, fontStyle: 'italic', fontSize: 300, lineHeight: 1, color: '#DDE6FF', background: 'transparent',
              textShadow: '0 14px 0 #0A2A8C, 0 26px 40px rgba(0,0,0,0.6)', opacity: pa(T, 18.2 + i * 0.04, 0.4) * (1 - fly),
              transform: `translate(${fly * (300 + r * 600)}px, ${fly * (r - 0.5) * 700}px) rotate(${fly * (r - 0.5) * 120}deg) scale(${1 - fly * 0.4})`, filter: `blur(${fly * 8}px)`}}>{ch}</div>; })}
        </div>
        <Svg>
          <g opacity={pa(T, 19.0, 0.3)}>
            {[0, 1, 2].map((i) => <path key={i} d={`M${wx - i * 60},${180} Q${wx + 140 - i * 60},540 ${wx - i * 60},900`} fill="none" stroke={i ? C.white : C.lime} strokeWidth={6 - i * 2} opacity={1 - i * 0.3} style={{filter: `drop-shadow(0 0 18px ${C.lime})`}} />)}
          </g>
          {hit > 0 && <Particles T={T} n={120} seed={5} area={[700, 300, 900, 400]} vy={-40} k={(1 - hit) * 1.2} color={C.white} />}
          <Fig id="I05" x={330} y={1000} h={430} p={pa(T, 21.9, 1.2, E.inOut)} T={T} opacity={win(T, 21.8, 26.4)} />
          {T > 22.2 && [0, 1, 2, 3].map((i) => { const px = 980 + i * 260; const lit = pa(T, 22.4 + i * 0.6 + (px - 980) / 2500, 0.4);
            return <g key={i} opacity={win(T, 22.0, 26.4)}><circle cx={px} cy={760 - i * 50} r={10 + lit * 8} fill={lit > 0.5 ? C.lime : 'none'} stroke={C.white} strokeWidth={2} />
              <circle cx={px} cy={760 - i * 50} r={40 * lit} fill={C.lime} opacity={0.25 * lit} style={{filter: 'blur(10px)'}} /></g>; })}
        </Svg>
        <Pos y={150}>
          <In T={T} a={18.14} b={21.6}><Tag size={38}>mas existe algo que pode</Tag></In>
          <In T={T} a={19.33} b={21.6} dir="zoom"><Heavy size={110} color={C.lime}>atravessar</Heavy></In>
          <In T={T} a={21.83} b={26.3}><Tag size={34}>algo que alcança lugares</Tag></In>
          <In T={T} a={23.5} b={26.3}><Tag size={34} color={C.lime}>onde nossas mãos não conseguem chegar</Tag></In>
        </Pos>
      </>)}
      {prayer && (<>
        <Svg cam={{s: lerp(1.08, 1, pa(T, 26.52, 1.6))}}>
          <Waves x={960} y={640} T={T} t0={26.7} n={6} speed={0.85} maxR={1300} k={1} />
          <circle cx={960} cy={640} r={30 + 18 * Math.sin(T * 7)} fill="#fff" opacity={0.9 * pr} style={{filter: 'blur(14px)'}} />
          <Fig id="I05" x={960} y={1010} h={520} p={pa(T, 26.75, 1.1, E.inOut)} fill={pa(T, 27.6, 0.6)} T={T} />
        </Svg>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><DrawWord T={T} a={26.6} text="oração" size={250} x={960} y={330} fillAt={0.4} /></svg>
      </>)}
    </>);
  }}</Scene>
);

const S4: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={28.35} b={43.55} fi={0.3}>{() => {
    const toHands = pa(T, 30.2, 2.2, E.inOut) * (1 - pa(T, 36.6, 1.5, E.inOut));
    const up = pa(T, 41.61, 1.2, E.inOut);
    const slow = T > 38.3 && T < 41.6;
    const hx = 640, hy = 610; // mãos da pessoa ajoelhada
    return (<>
      <Svg cam={{s: 1 + toHands * 0.75 + (slow ? (T - 38.3) * 0.01 : 0), ox: hx, oy: hy, y: up * 160}}>
        <LightAbove x={1000} k={up} w={900} />
        <Fig id="I04" x={560} y={940} h={640} p={pa(T, 28.5, 1.8, E.inOut)} T={T} fill={0.35} />
        {/* linhas nascendo das mãos */}
        {Array.from({length: 7}).map((_, i) => { const p = pa(T, 32.4 + i * 0.12, 1.2); const a = -0.9 + i * 0.3;
          return <Stroke key={i} d={`M${hx},${hy} q${Math.cos(a) * 60},${Math.sin(a) * 60 - 30} ${Math.cos(a) * 140},${Math.sin(a) * 120}`} p={p} color={C.lime} w={2} />; })}
        <Fig id="I02" x={1480} y={860} h={300} p={pa(T, 34.1, 1.4, E.inOut)} T={T} color={C.lime} opacity={0.9} />
        <Link a={[hx + 20, hy - 10]} b={[1470, 700]} p={pa(T, 34.9, 1.2, E.inOut)} T={T} bend={-220} />
      </Svg>
      <Pos y={120}>
        <In T={T} a={28.56} b={33.6}><Tag size={36}>quando oramos por alguém</Tag></In>
        <In T={T} a={30.21} b={33.6}><Tag size={30} color={C.lime}>não estamos apenas dizendo algumas palavras</Tag></In>
        <In T={T} a={33.87} b={37.9}><Heavy size={84}>colocamos aquela vida</Heavy></In>
        <In T={T} a={35.11} b={37.9}><Plate size={70}>diante de Deus</Plate></In>
      </Pos>
      <Pos y={820}>
        <In T={T} a={38.37} b={41.5} d={1.0}><Tag size={44}>"Senhor, eu não consigo resolver isso..."</Tag></In>
      </Pos>
      <Pos y={760}>
        <In T={T} a={41.61} b={43.5} dir="zoom"><Heavy size={110}>mas eu sei <span style={{color: C.lime}}>quem pode.</span></Heavy></In>
      </Pos>
    </>);
  }}</Scene>
);

const S5: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={43.65} b={64.15} fi={0.3}>{(t) => {
    const ph = T < 50.3 ? 0 : T < 53.4 ? 1 : T < 55.6 ? 2 : T < 58.45 ? 3 : 4;
    const morph = pa(T, 46.42, 0.8, E.inOut);
    return (<>
      <Svg cam={{s: lerp(1, 1.05, pa(T, 43.7, 6))}}>
        {ph === 0 && (<g>
          <Fig id="I01" x={300} y={900} h={520} p={pa(T, 43.9, 1)} T={T} opacity={win(T, 43.8, 50.2)} />
          <Fig id="I02" x={1640} y={900} h={380} p={pa(T, 44.3, 1)} T={T} opacity={win(T, 43.8, 50.2)} />
          <Link a={[360, 520]} b={[1600, 640]} p={pa(T, 45.0, 1.3, E.inOut)} T={T} bend={-40} w={4} />
        </g>)}
        {ph === 1 && (<g opacity={win(T, 50.3, 53.4, 0.3, 0.3)}><Fig id="I02" x={960} y={900} h={460} p={pa(T, 50.4, 1)} T={T} glitch={0.3} />
          <Cracks x={960} y={720} r={300} T={T} k={0.7} /></g>)}
        {ph === 2 && (<g opacity={win(T, 53.4, 55.6, 0.3, 0.3)}>
          <Fig id="I01" x={180} y={900} h={420} p={pa(T, 53.5, 0.8)} T={T} /><Fig id="I03" x={1740} y={900} h={420} p={pa(T, 53.7, 0.8)} T={T} flip />
          <Link a={[220, 600]} b={[1700, 600]} p={pa(T, 54.0, 1.0, E.inOut)} T={T} bend={-160} w={4} /></g>)}
        {ph === 3 && (<g opacity={win(T, 55.6, 58.45, 0.3, 0.3)}>
          <LightAbove x={960} k={pa(T, 56.6, 1.4)} w={300 + 700 * pa(T, 56.9, 1.4)} />
          <Fig id="I02" x={960} y={930} h={300} p={pa(T, 55.7, 0.8)} T={T} /></g>)}
        {ph === 4 && (<g opacity={win(T, 58.45, 64.2, 0.3, 0.4)}>
          <LightAbove x={960} k={0.8} w={1400} />
          {[['I01', 220, 360], ['I03', 520, 330], ['I02', 820, 260], ['I08', 1120, 330], ['I11', 1420, 250], ['I07', 1700, 330]].map(([id, x, h], i) => (
            <g key={i}><Fig id={id as string} x={x as number} y={980} h={h as number} p={pa(T, 58.7 + i * 0.25, 0.9)} T={T} color={i % 2 ? C.white : '#CFE0FF'} />
              <Link a={[x as number, 980 - (h as number) - 10]} b={[960, 40]} p={pa(T, 59.6 + i * 0.2, 1.2, E.inOut)} T={T + i} bend={0} w={2} pulse /></g>))}
        </g>)}
      </Svg>
      {ph === 0 && (<>
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', opacity: 1 - morph * 0.85, transform: `scaleY(${1 - morph * 0.9})`, filter: `blur(${morph * 6}px)`}}>
          <svg width={W} height={260}><DrawWord T={T} a={44.4} text="intercessão" size={200} x={960} y={210} fillAt={0.5} /></svg>
        </div>
        <Pos y={210}><In T={T} a={43.84} b={46.3}><Tag size={34}>é aí que começa a</Tag></In></Pos>
        <Pos y={720}><In T={T} a={46.42} b={50.2}><Heavy size={96}>interceder</Heavy></In><In T={T} a={48.29} b={50.2}><Tag size={36} color={C.lime}>é carregar alguém em oração</Tag></In></Pos>
      </>)}
      {ph === 1 && <Pos y={130}><In T={T} a={50.45} b={53.3}><Tag size={34}>é lembrar de quem está passando por</Tag></In><In T={T} a={51.8} b={53.3} dir="zoom"><Heavy size={110}>dificuldades</Heavy></In></Pos>}
      {ph === 2 && <Pos y={130}><In T={T} a={53.51} b={55.5}><Tag size={34}>é orar por quem está</Tag></In><In T={T} a={54.4} b={55.5} dir="zoom"><Heavy size={120} color={C.lime}>distante</Heavy></In></Pos>}
      {ph === 3 && <Pos y={130}><In T={T} a={55.69} b={58.4}><Tag size={34}>é clamar por quem perdeu a</Tag></In><In T={T} a={56.95} b={58.4} dir="zoom"><Heavy size={140}>esperança</Heavy></In></Pos>}
      {ph === 4 && <Pos y={430}><In T={T} a={58.56} b={64.0}><Tag size={34}>é apresentar diante de Deus aqueles que</Tag></In><In T={T} a={60.66} b={64.0}><Plate size={62}>talvez nem saibam</Plate></In><In T={T} a={61.6} b={64.0}><Tag size={30} color={C.lime}>que alguém está orando por eles</Tag></In></Pos>}
    </>);
  }}</Scene>
);

const S6: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={64.2} b={76.9} fi={0.3}>{() => {
    const J = pa(T, 74.92, 0.8, E.inOut);
    const items: [string, string, number, number][] = [['I09', 'ABRAÃO', 68.85, 300], ['I10', 'MOISÉS', 70.77, 680], ['I11', 'SAMUEL', 72.88, 1240], ['I12', 'JESUS', 74.92, 960]];
    return (<>
      <Svg>
        {T > 74.9 && Array.from({length: 14}).map((_, i) => { const a = (i / 14) * 6.28; const p = pa(T, 75.0 + i * 0.03, 0.9);
          return <Stroke key={i} d={`M${960 + Math.cos(a) * 1100},${560 + Math.sin(a) * 700} L${960},${560}`} p={p} color={i % 2 ? C.lime : C.white} w={1.5} opacity={0.5} />; })}
        {items.map(([id, name, t, x], i) => { const isJ = i === 3; const k = pa(T, t, 0.5); const s = isJ ? lerp(0.6, 1.25, J) : 1 - J * 0.15;
          const cx = isJ ? 960 : x + (x < 960 ? -J * 140 : J * 280); const hgt = id === 'I11' ? 330 : 430;
          return (<g key={i} opacity={k * (isJ ? 1 : 1 - J * 0.45)}>
            <Frame x={cx} y={600} w={340 * s} h={500 * s} p={pa(T, t - 0.1, 0.7)} color={isJ ? C.lime : C.white} />
            <Fig id={id} x={cx} y={600 + 220 * s} h={hgt * s} p={pa(T, t, 1.0, E.inOut)} T={T} fill={isJ ? 0.3 : 0.15} color={isJ ? '#FFFFFF' : '#DCE7FF'} />
            {id === 'I10' && <Waves x={cx} y={430} T={T} t0={t + 0.4} n={3} maxR={240} k={0.7} w={2} />}
          </g>); })}
        {(() => { const p = pa(T, 76.0, 0.8, E.inOut); const pts = [[160 - 140 * J, 640], [680 - 140 * J, 640], [960, 560], [1240 + 280 * J, 640]];
          return <Stroke d={smoothPath(pts, false)} p={p} color={C.lime} w={3} />; })()}
      </Svg>
      <Pos y={90}><In T={T} a={64.48} b={68.6}><Tag size={36}>a Bíblia está cheia de pessoas</Tag></In><In T={T} a={66.0} b={68.6}><Heavy size={80}>que decidiram orar por outras</Heavy></In></Pos>
      {items.map(([, name, t, x], i) => { const isJ = i === 3; const cx = isJ ? 960 : x + (x < 960 ? -J * 140 : J * 280);
        return <div key={i} style={{position: 'absolute', left: cx - 250, width: 500, top: isJ ? 920 : 880, textAlign: 'center', opacity: (isJ ? 1 : 1 - J * 0.4)}}>
          <In T={T} a={t} dir="up"><Heavy size={isJ ? 92 : 64} color={isJ ? C.lime : C.white}>{name}</Heavy></In>
          {!isJ && <In T={T} a={t + 0.3}><Tag size={22}>intercedeu</Tag></In>}</div>; })}
    </>);
  }}</Scene>
);

const S7: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={76.95} b={84.55} fi={0.3}>{() => {
    const zin = pa(T, 77.0, 3.0, E.inOut); const zout = pa(T, 80.6, 3.2, E.inOut);
    const s = lerp(1, 1.35, zin) * lerp(1, 0.55, zout);
    const ring = Array.from({length: 10}).map((_, i) => { const a = (i / 10) * 6.28 + 0.3; return [960 + Math.cos(a) * 820, 760 + Math.sin(a) * 420] as [number, number]; });
    return (<>
      <Svg cam={{s, oy: 700}}>
        {ring.map(([x, y], i) => { const k = pa(T, 81.2 + i * 0.12, 0.6); return (<g key={i}>
          <Fig id={i % 2 ? 'I04' : 'I11'} x={x} y={y + 160} h={260} p={k} T={T} color={i % 3 ? '#DCE7FF' : C.white} flip={x > 960} />
          <Link a={[960, 560]} b={[x, y - 40]} p={pa(T, 81.6 + i * 0.1, 0.9, E.inOut)} T={T + i} bend={0} w={2} pulse={false} />
          {i > 0 && <Link a={[ring[i - 1][0], ring[i - 1][1] - 40]} b={[x, y - 40]} p={pa(T, 82.3 + i * 0.08, 0.6)} T={T} bend={30} w={1.5} pulse={false} color="#9DB8FF" />}
        </g>); })}
        <Fig id="I04" x={960} y={920} h={520} p={pa(T, 77.2, 1.8, E.inOut)} fill={0.4} T={T} />
        <circle cx={960} cy={560} r={60} fill={C.lime} opacity={0.15 + 0.1 * Math.sin(T * 4)} style={{filter: 'blur(20px)'}} />
      </Svg>
      <Pos y={110}><In T={T} a={77.2} b={80.0}><Tag size={36}>se existe algo que aprendemos com eles</Tag></In></Pos>
      <Pos y={90}><In T={T} a={80.03} b={84.4}><Tag size={34}>é que uma pessoa de</Tag></In><In T={T} a={81.23} b={84.4} dir="slam" d={0.45}><Heavy size={140}>joelhos</Heavy></In></Pos>
      <Pos y={930}><In T={T} a={82.3} b={84.4}><Tag size={30}>pode fazer parte de uma</Tag></In><In T={T} a={83.04} b={84.4}><Plate size={58}>grande mudança</Plate></In></Pos>
    </>);
  }}</Scene>
);

const S8: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={84.6} b={103.25} fi={0.3}>{() => {
    const ph = T < 87.6 ? 0 : T < 90.8 ? 1 : T < 93.95 ? 2 : T < 98.85 ? 3 : 4;
    const still = ph === 2 ? pa(T, 91.5, 2.2, E.inOut) : 0;
    return (<>
      <Svg>
        {ph === 0 && (<g opacity={win(T, 84.7, 87.6, 0.3, 0.3)}>
          <Stroke d="M760,960 L760,300 L1160,300 L1160,960" p={pa(T, 85.0, 1.0, E.inOut)} w={4} />
          <rect x={790} y={330} width={340} height={630} fill={C.deep} opacity={0.6 * pa(T, 85.8, 0.5)} stroke={C.white} strokeWidth={2} />
          <circle cx={1090} cy={650} r={12} fill={C.lime} opacity={pa(T, 86.0, 0.4)} />
          <Fig id="I01" x={470} y={960} h={480} p={pa(T, 85.1, 0.9)} T={T} />
        </g>)}
        {ph === 1 && (<g opacity={win(T, 87.6, 90.8, 0.3, 0.3)}>
          {[0, 1, 2, 3].map((i) => <Stroke key={i} d={`M${620},${420 + i * 70} L${1300 - i * 120},${420 + i * 70}`} p={pa(T, 87.8 + i * 0.15, 0.6)} w={8} dash={`${40 + i * 10} 26`} color={i === 3 ? C.lime : C.white} />)}
          <Stroke d="M580,360 L1360,360 L1360,700 L820,700 L740,790 L740,700 L580,700 Z" p={pa(T, 87.7, 1.0, E.inOut)} w={3} />
        </g>)}
        {ph === 2 && (<g opacity={win(T, 90.8, 93.95, 0.3, 0.3)}>
          <Fig id="I03" x={300} y={880} h={420} p={pa(T, 91.0, 0.8)} T={T} />
          <Fig id="I02" x={1640} y={880} h={320} p={pa(T, 91.2, 0.8)} T={T} />
          <Stroke d="M380,560 Q960,420 1560,640" p={pa(T, 91.4, 1.0) * 0.55} w={3} dash="10 18" color="#9DB8FF" />
          <text x={960} y={760} textAnchor="middle" fontFamily={FONT.cond} fontWeight={700} fontSize={34} letterSpacing={8} fill="#9DB8FF" opacity={pa(T, 91.8, 0.6)}>2.347 KM</text>
        </g>)}
        {ph === 3 && (<g>
          <Waves x={1500} y={560} T={T} t0={95.4} n={8} speed={0.7} maxR={1600} k={1} w={4} />
          <Fig id="I05" x={1500} y={940} h={600} p={pa(T, 95.15, 1.0, E.inOut)} fill={pa(T, 95.8, 0.6)} T={T} />
        </g>)}
        {ph === 4 && (<g>
          {(() => { const q = ((T - 98.9) * 0.22) % 1.2; let d = ''; for (let x = 0; x <= W; x += 16) { const yy = 600 + Math.sin(x * 0.006 + T * 1.6) * 40; d += (x ? 'L' : 'M') + x + ',' + yy.toFixed(1); }
            return <g><path d={d} fill="none" stroke={C.lime} strokeWidth={4} opacity={0.9} style={{filter: `drop-shadow(0 0 14px ${C.lime})`}} strokeDasharray="420 2400" strokeDashoffset={-q * 2400} /></g>; })()}
        </g>)}
      </Svg>
      {ph === 0 && <Pos y={120}><In T={T} a={85.01} b={87.5}><Tag size={34}>talvez você não possa mudar a</Tag></In><In T={T} a={86.3} b={87.5}><Heavy size={100}>situação</Heavy></In></Pos>}
      {ph === 1 && <Pos y={850}><In T={T} a={87.72} b={90.7}><Tag size={34}>talvez você não tenha as</Tag></In><In T={T} a={88.97} b={90.7}><Heavy size={96}>palavras certas</Heavy></In></Pos>}
      {ph === 2 && <Pos y={130}><In T={T} a={90.92} b={93.9}><Tag size={34}>talvez você não consiga estar</Tag></In><In T={T} a={92.3} b={93.9}><Heavy size={100}>presente</Heavy></In></Pos>}
      {ph === 3 && (<div style={{position: 'absolute', left: 140, top: 300}}>
        <In T={T} a={94.05} b={98.8} dir="left"><Tag size={46} color={C.lime}>mas você pode</Tag></In>
        <In T={T} a={95.1} b={98.8} dir="slam" d={0.45}><Heavy size={330}>orar.</Heavy></In>
        <In T={T} a={96.39} b={98.8} dir="left"><Tag size={40}>você pode interceder</Tag></In>
      </div>)}
      {ph === 4 && <Pos y={250}><In T={T} a={98.94} b={101.3} d={0.9}><Tag size={40}>porque quando a nossa força termina...</Tag></In></Pos>}
      {ph === 4 && <Pos y={700}><In T={T} a={101.48} b={103.2} d={0.8}><Heavy size={110}>a oração <span style={{color: C.lime}}>continua.</span></Heavy></In></Pos>}
      {still > 0 && <AbsoluteFill style={{background: `rgba(1,3,15,${0.35 * still})`}} />}
    </>);
  }}</Scene>
);

const S9: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={103.3} b={111.3} fi={0.3}>{() => {
    const keep = 7; const settle = pa(T, 107.71, 0.8, E.inOut);
    return (<>
      {NAMES.slice(0, 12).map((n, i) => { const t = 103.8 + i * 0.28; const k = pa(T, t, 0.35) * (i === keep ? 1 : 1 - settle);
        const gx = 260 + (i % 4) * 466, gy = 260 + Math.floor(i / 4) * 230; const x = i === keep ? lerp(gx, 960, settle) : gx, y = i === keep ? lerp(gy, 470, settle) : gy;
        return <NameCard key={i} x={x} y={y} name={n} k={k} sel={i === keep ? pa(T, 107.9, 0.5) : 0} rot={(rand(i) - 0.5) * 6 * (1 - settle)} />; })}
      <Svg><Stroke d="M960,520 L960,760" p={pa(T, 108.4, 0.6)} color={C.lime} w={3} /><circle cx={960} cy={770} r={8} fill={C.lime} opacity={pa(T, 108.9, 0.3)} /></Svg>
      <Pos y={110}><In T={T} a={103.71} b={107.5}><Tag size={34}>talvez alguém esteja esperando uma resposta de Deus</Tag></In></Pos>
      <Pos y={820}><In T={T} a={107.71} b={109.5}><Tag size={32}>e Deus esteja procurando alguém disposto a orar</Tag></In></Pos>
      <Pos y={800}><In T={T} a={109.6} b={111.25} dir="zoom"><Heavy size={96}>quem está na sua <span style={{color: C.lime}}>oração?</span></Heavy></In></Pos>
    </>);
  }}</Scene>
);

const S10: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={111.35} b={131.5} fi={0.3}>{() => {
    const ph = T < 117.7 ? 0 : T < 119.5 ? 1 : T < 121.0 ? 2 : T < 122.35 ? 3 : T < 123.8 ? 4 : T < 125.75 ? 5 : T < 128.35 ? 6 : 7;
    const lbl = (t: number, txt: string, until: number) => <Pos y={880}><In T={T} a={t} b={until}><Heavy size={84}>{txt}</Heavy></In></Pos>;
    return (<>
      <Svg>
        {ph === 1 && NAMES.slice(4, 10).map((n, i) => null)}
        {ph === 2 && <Fig id="I07" x={960} y={820} h={560} p={pa(T, 119.6, 1.0, E.inOut)} T={T} fill={0.25} />}
        {ph === 3 && (<g><Fig id="I08" x={960} y={820} h={560} p={pa(T, 121.1, 0.8)} T={T} /><Link a={[860, 420]} b={[1060, 420]} p={pa(T, 121.4, 0.5)} T={T} bend={-80} /></g>)}
        {ph === 4 && (<g><Fig id="I03" x={960} y={820} h={580} p={pa(T, 122.45, 0.7)} T={T} />
          {[0, 1, 2, 3, 4].map((i) => { const a = -2.6 + i * 0.55; const k = pa(T, 122.6 + i * 0.08, 0.3) * (1 - pa(T, 123.2, 0.4));
            return <rect key={i} x={960 + Math.cos(a) * 300 - 80} y={500 + Math.sin(a) * 260 - 26} width={160} height={52} rx={12} fill="none" stroke={i % 2 ? C.lime : C.white} strokeWidth={2} opacity={k} />; })}</g>)}
        {ph === 5 && (<g><Fig id="I01" x={1700} y={820} h={480} p={pa(T, 123.9, 0.7)} T={T} flip />
          <Stroke d="M120,560 Q900,380 1640,520" p={pa(T, 124.4, 1.2, E.inOut)} color={C.lime} w={4} /></g>)}
        {ph === 6 && (<g><Fig id="I02" x={960} y={820} h={420} p={pa(T, 125.85, 0.7)} T={T} glitch={0.5 * (1 - pa(T, 127.3, 0.6))} />
          <Cracks x={960} y={640} r={300} T={T} k={1 - pa(T, 127.3, 0.6)} />
          <Stroke d="M100,80 Q600,200 900,560" p={pa(T, 126.6, 0.9, E.inOut)} color={C.lime} w={4} /></g>)}
        {ph === 7 && (<g>
          {[[300, 300], [1620, 300], [300, 820], [1620, 820], [960, 120], [960, 980]].map(([x, y], i) => <Link key={i} a={[x, y]} b={[960, 540]} p={pa(T, 128.5 + i * 0.1, 0.9, E.inOut)} T={T + i} bend={0} w={2} />)}
          <Waves x={960} y={540} T={T} t0={129.6} n={4} maxR={1200} k={0.8} />
        </g>)}
      </Svg>
      {ph === 0 && (<Pos y={330}>
        <In T={T} a={111.56} b={117.6} dir="slam" d={0.4}><Heavy size={120}>hoje, o <span style={{color: C.lime}}>desafio</span></Heavy></In>
        <In T={T} a={112.5} b={117.6}><Tag size={38}>não é apenas pedir por você</Tag></In>
        <div style={{height: 30}} />
        <In T={T} a={115.86} b={117.6} dir="zoom"><Plate size={80}>é lembrar de alguém</Plate></In>
      </Pos>)}
      {ph === 1 && (<>{NAMES.slice(4, 10).map((n, i) => <NameCard key={i} x={420 + (i % 3) * 540} y={380 + Math.floor(i / 3) * 170} name={n} k={pa(T, 117.85 + i * 0.1, 0.3)} sel={i === 4 ? pa(T, 118.6, 0.4) : 0} />)}
        {lbl(117.84, 'escolher um nome', 119.5)}</>)}
      {ph === 2 && lbl(119.58, 'uma família', 121.0)}
      {ph === 3 && lbl(121.05, 'um amigo', 122.35)}
      {ph === 4 && lbl(122.42, 'um jovem', 123.8)}
      {ph === 5 && <Pos y={880}><In T={T} a={123.87} b={125.75}><Heavy size={76}>alguém que está <span style={{color: C.lime}}>afastado</span></Heavy></In></Pos>}
      {ph === 6 && <Pos y={880}><In T={T} a={125.8} b={128.35}><Heavy size={76}>lutando em <span style={{color: C.lime}}>silêncio</span></Heavy></In></Pos>}
      {ph === 7 && (<>
        <Pos y={150}><In T={T} a={128.41} b={131.4}><Tag size={36}>e colocar essa pessoa diante de Deus</Tag></In></Pos>
        <div style={{position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center'}}><svg width={W} height={220}><DrawWord T={T} a={129.5} text="intercessão" size={180} x={960} y={180} fillAt={0.45} /></svg></div>
      </>)}
    </>);
  }}</Scene>
);

const S11: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={131.55} b={141.85} fi={0.3}>{() => {
    const ids = ['I01', 'I03', 'I02', 'I08', 'I09', 'I04', 'I07', 'I11', 'I01', 'I03', 'I12', 'I02'];
    const P: [number, number][] = Array.from({length: 12}).map((_, i) => [200 + (i % 6) * 304 + (Math.floor(i / 6) ? 150 : 0), 520 + Math.floor(i / 6) * 330]);
    const amar = pa(T, 136.78, 0.6, E.inOut) * (1 - pa(T, 138.6, 0.5)); const carregar = pa(T, 138.71, 0.6);
    const lonely = 11;
    return (<>
      <Svg>
        {P.map(([x, y], i) => { const k = pa(T, 131.8 + i * 0.22, 0.6); const keep = i === 2 || i === 3 || i === 8; const op = k * (1 - amar * (keep ? 0 : 0.85));
          const xx = i === lonely ? lerp(x, 1780, carregar) : x;
          return (<g key={i} opacity={op}>
            <Fig id={ids[i]} x={xx} y={y} h={ids[i] === 'I07' ? 220 : 260} p={k} T={T} color={i % 2 ? '#DCE7FF' : C.white} />
            {i > 0 && i !== lonely && <Link a={[P[i - 1][0], P[i - 1][1] - 160]} b={[x, y - 160]} p={pa(T, 132.4 + i * 0.15, 0.6)} T={T + i} bend={-40} w={2} pulse={false} color="#9DB8FF" />}
          </g>); })}
        {(() => { const k = pa(T, 134.38, 0.7) * (1 - pa(T, 136.6, 0.4)); return [0, 1, 2].map((i) => <circle key={i} cx={[350, 960, 1500][i]} cy={600} r={220 + 20 * Math.sin(T * 2 + i)} fill="none" stroke={C.lime} strokeWidth={3} opacity={k * 0.8} style={{filter: `drop-shadow(0 0 12px ${C.lime})`}} />); })()}
        {amar > 0 && <Stroke d={smoothPath([[P[2][0], P[2][1] - 180], [P[3][0], P[3][1] - 220], [P[8][0], P[8][1] - 180]], false)} p={amar} color={C.lime} w={4} />}
        {carregar > 0 && P.map(([x, y], i) => i === lonely ? null : <Link key={'c' + i} a={[x, y - 160]} b={[1780, P[lonely][1] - 160]} p={pa(T, 139.2 + i * 0.07, 0.8, E.inOut)} T={T + i} bend={-60} w={2} />)}
      </Svg>
      <Pos y={90}>
        <In T={T} a={131.72} b={134.2}><Tag size={36}>uma geração que aprende a orar</Tag></In>
        <In T={T} a={134.38} b={136.6} dir="zoom"><Heavy size={100}>aprende a <span style={{color: C.lime}}>cuidar</span></Heavy></In>
        <In T={T} a={136.78} b={138.6} dir="zoom"><Heavy size={100}>aprende a <span style={{color: C.lime}}>amar</span></Heavy></In>
        <In T={T} a={138.71} b={141.7} dir="zoom"><Heavy size={90}>a carregar <span style={{color: C.lime}}>uns aos outros</span></Heavy></In>
      </Pos>
    </>);
  }}</Scene>
);

const S12: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={141.9} b={155.35} fi={0.6} fo={0.4}>{() => (<>
    <AbsoluteFill style={{transform: `scale(${lerp(1, 1.07, pa(T, 141.9, 13.5, E.inOut))})`}}>
      <Pos y={150}><In T={T} a={142.24} b={155.2} d={1.0}><Tag size={36}>a verdadeira fé não pergunta apenas</Tag></In></Pos>
      <Pos y={420}><In T={T} a={144.42} b={148.1} d={0.9}><Heavy size={100} style={{fontStyle: 'normal', fontWeight: 800}}>"o que podes fazer por mim?"</Heavy></In></Pos>
      <Pos y={300}><In T={T} a={148.2} b={155.2}><Tag size={34} color={C.lime}>ela também pergunta</Tag></In></Pos>
      <Pos y={400}>
        <In T={T} a={149.87} d={1.0}><Heavy size={104}>o que posso fazer</Heavy></In>
        <In T={T} a={151.3} d={1.0}><Heavy size={104}>por <span style={{color: C.lime}}>alguém?</span></Heavy></In>
      </Pos>
      <div style={{position: 'absolute', left: 960 - 380, top: 660, height: 6, width: 760 * pa(T, 152.4, 1.2, E.inOut), background: C.lime, boxShadow: `0 0 20px ${C.lime}`}} />
      <Pos y={700}><In T={T} a={153.67} d={1.0}><Tag size={30}>através da minha <span style={{color: C.lime}}>oração</span></Tag></In></Pos>
    </AbsoluteFill>
  </>)}</Scene>
);

const S13: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={155.4} b={161.9} fi={0.25}>{() => {
    const wm = pa(T, 159.5, 1.0, E.inOut);
    return (<>
      <Svg>
        {[0, 1, 2, 3].map((i) => <Stroke key={i} d={`M${-100 + i * 40},${200 + i * 210} L${W + 100},${120 + i * 230}`} p={pa(T, 155.5 + i * 0.12, 0.6)} color={i % 2 ? C.lime : C.white} w={2} opacity={0.5} />)}
        <Frame x={960} y={540} w={1300} h={700} p={pa(T, 155.6, 1.2, E.inOut)} color={C.lime} cut={60} />
        <Particles T={T} n={50} seed={11} vy={-30} k={0.6} />
      </Svg>
      <div style={{position: 'absolute', left: 120, top: 70, display: 'flex', gap: 16, alignItems: 'center', opacity: pa(T, 155.6, 0.6)}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 90}} />
        <div><Tag size={16}>Ministério Jovem</Tag><Tag size={16}>Ágape Teen</Tag></div>
      </div>
      <Pos y={260}><In T={T} a={155.79} dir="up"><Tag size={46}>Semana de Oração Jovem <span style={{color: C.lime}}>2026</span></Tag></In></Pos>
      <Pos y={380}><Img src={staticFile('images/wordmark.png')} style={{width: 980, opacity: wm, transform: `scale(${lerp(1.15, 1, wm)})`, filter: `blur(${(1 - wm) * 10}px) drop-shadow(0 10px 0 rgba(4,11,46,0.4))`, clipPath: `inset(0 ${(1 - wm) * 100}% 0 0)`}} /></Pos>
      <GlitchOverlay T={T} at={159.58} />
    </>);
  }}</Scene>
);
const GlitchOverlay: React.FC<{T: number; at: number}> = ({T, at}) => { const k = win(T, at, at + 0.5, 0.05, 0.2); return k > 0 ? <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><GlitchBars T={T} x={960} y={540} k={k} wmax={600} /></svg> : null; };

const S14: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={161.95} b={165.6} fi={0.3} fo={0.3}>{() => {
    const light = pa(T, 163.2, 0.9, E.in); const big = pa(T, 164.13, 0.5, E.back);
    return (<>
      <AbsoluteFill style={{background: `rgba(1,3,15,${0.85 * (1 - light * 0.6)})`}} />
      <Svg>
        <circle cx={960} cy={540} r={6 + light * 900} fill="#fff" opacity={light * (1 - big) * 0.9} style={{filter: 'blur(40px)'}} />
        {T > 164.1 && (<g>
          <Waves x={960} y={540} T={T} t0={164.13} n={6} speed={1.1} maxR={1300} k={0.9} />
          <Fig id="I05" x={960} y={1000} h={560} p={pa(T, 164.13, 0.6)} fill={0.4} T={T} opacity={0.5} />
          {[[200, 300], [1720, 300], [200, 800], [1720, 800]].map(([x, y], i) => <Link key={i} a={[x, y]} b={[960, 540]} p={pa(T, 164.2 + i * 0.06, 0.6)} T={T + i} bend={0} w={2} />)}
        </g>)}
      </Svg>
      <Pos y={200}><In T={T} a={162.28} b={164.0}><Tag size={40}>o tema de hoje é...</Tag></In></Pos>
      {T > 164.1 && <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', transform: `scale(${lerp(1.6, 1, big)})`, opacity: clamp(big * 2)}}>
        <Heavy size={205} style={{textShadow: '0 12px 0 rgba(4,11,46,0.5), 0 0 80px rgba(255,255,255,0.45)'}}>intercessão</Heavy></div>}
    </>);
  }}</Scene>
);

const Selo: React.FC<{T: number; at: number}> = ({T, at}) => {
  const t = T - at; if (t < 0) return null;
  const s = t < 0.25 ? lerp(0.9, 1.05, E.out(t / 0.25)) : t < 0.5 ? lerp(1.05, 1.0, E.inOut((t - 0.25) / 0.25)) : 1;
  const shine = clamp((t - 0.45) / 0.8);
  const src = staticFile('images/selo5_alpha.png');
  return (<AbsoluteFill style={{opacity: clamp(t / 0.12)}}>
    <Svg>{[0, 1, 2, 3].map((i) => { const x = -400 + ((t * 3000 + i * 650) % 2800); return <line key={i} x1={x} y1={120 + i * 270} x2={x + 520} y2={120 + i * 270} stroke={i % 2 ? '#fff' : C.lime} strokeWidth={3} opacity={clamp(1 - t / 1.4) * 0.8} style={{filter: `drop-shadow(0 0 10px ${C.lime})`}} />; })}</Svg>
    <div style={{position: 'absolute', left: 960 - 330, top: 70, width: 660, height: 660, transform: `scale(${s})`}}>
      <div style={{position: 'absolute', inset: -60, background: 'radial-gradient(circle, rgba(200,255,46,0.28), transparent 65%)', filter: 'blur(20px)'}} />
      <Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 18px 30px rgba(1,3,15,0.6))'}} />
      {shine > 0 && shine < 1 && <div style={{position: 'absolute', inset: 0, WebkitMaskImage: `url(${src})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        background: `linear-gradient(115deg, transparent ${shine * 140 - 30}%, rgba(255,255,255,0.75) ${shine * 140 - 20}%, transparent ${shine * 140 - 10}%)`}} />}
    </div>
    <Pos y={790}><In T={T} a={at + 0.35}><Heavy size={64}>verdade e <span style={{color: C.lime}}>desafio</span></Heavy></In><In T={T} a={at + 0.5}><Tag size={30}>semana jovem 2026</Tag></In></Pos>
  </AbsoluteFill>);
};

const S15: React.FC<{T: number}> = ({T}) => (
  <Scene T={T} a={165.65} b={400} fi={0.3} fo={0}>{() => {
    const selo = 172.35; const before = T < selo;
    return (<>
      {before && (<>
        <Svg><Particles T={T} n={50} seed={21} vy={-14} k={0.5} /><Waves x={960} y={540} T={T} t0={165.8} n={3} speed={0.4} maxR={900} k={0.35} w={2} /></Svg>
        <Pos y={330}><In T={T} a={165.8} b={169.1}><Tag size={40}>existe alguém que precisa</Tag></In><In T={T} a={166.74} b={169.1} dir="zoom"><Heavy size={110}>da sua <span style={{color: C.lime}}>oração.</span></Heavy></In></Pos>
        <Pos y={300}><In T={T} a={169.32} b={selo}><Tag size={40}>a pergunta é...</Tag></In></Pos>
        <Pos y={400}><In T={T} a={171.15} b={selo + 0.1} dir="slam" d={0.4}><Heavy size={140}>você vai</Heavy></In><In T={T} a={171.84} b={selo + 0.1} dir="slam" d={0.35}><Plate size={130}>interceder?</Plate></In></Pos>
      </>)}
      <Selo T={T} at={selo} />
    </>);
  }}</Scene>
);

const Grain: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px', backgroundPosition: `${rand(f) * 400}px ${rand(f + 3) * 400}px`}} />;

export const Main: React.FC<{audio: boolean; tail: number}> = ({audio, tail}) => {
  loadFonts();
  const f = useCurrentFrame(); const T = f / FPS;
  const endFade = tail > 0 ? pa(T, AUDIO_SEC + tail - 1.2, 1.2, E.inOut) : 0;
  return (
    <AbsoluteFill style={{background: C.night, overflow: 'hidden'}}>
      <Background T={T} />
      <S1 T={T} /><S2 T={T} /><S3 T={T} /><S4 T={T} /><S5 T={T} /><S6 T={T} /><S7 T={T} /><S8 T={T} />
      <S9 T={T} /><S10 T={T} /><S11 T={T} /><S12 T={T} /><S13 T={T} /><S14 T={T} /><S15 T={T} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(1,3,15,0.7) 100%)', pointerEvents: 'none'}} />
      <Grain f={f} />
      <AbsoluteFill style={{background: '#000', opacity: 1 - clamp(T / 0.6)}} />
      {endFade > 0 && <AbsoluteFill style={{background: C.deep, opacity: endFade}} />}
      {audio && <Audio src={staticFile(tail > 0 ? 'audio/mix_cauda.wav' : 'audio/mix_final.wav')} />}
    </AbsoluteFill>
  );
};
