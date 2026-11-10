import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, K, W, H} from '../theme';
import {Figure, P, walkPose, mix} from '../Figure';
import {Sky, Fog, Rain, Ground, Grain, Vignette, Motes, SoftFlash, Beam} from '../Atmos';
import {useT, pa, E, clamp, lerp, rand, Big, Plate, Tag, Reveal, Center, SceneFade} from '../scenes_common';

const Title: React.FC<{T: number; name: string; at: number; x?: number; y?: number}> = ({T, name, at, x = 120, y = 140}) => (
  <div style={{position: 'absolute', left: x, top: y}}>
    <Reveal T={T} at={at - 0.12} dir="left"><Big size={170} style={{letterSpacing: lerp(30, 2, pa(T, at, 0.9, E.out))}}>{name}</Big></Reveal>
    <div style={{height: 8, width: lerp(0, 260, pa(T, at + 0.2, 0.6, E.out)), background: C.lime, marginTop: 10, boxShadow: `0 0 18px ${C.lime}`}} />
  </div>
);

/* 05 · JOSÉ — esquecido numa prisão, luz atravessando as grades */
export const S05: React.FC = () => {
  const T = useT(5); const lit = pa(T, K.deus1 - 0.3, 1.4, E.inOut); const cam = lerp(1.12, 1.0, pa(T, 27.5, 5.3, E.outSoft));
  return (
    <SceneFade i={5} d={0.6}>
      <AbsoluteFill style={{transform: `scale(${cam})`}}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #020A2E, #01051A)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.55}}>
          {Array.from({length: 14}).map((_, r) => Array.from({length: 9}).map((_, c) => <rect key={`${r}-${c}`} x={c * 230 - (r % 2) * 115} y={r * 82} width={226} height={78} fill="none" stroke="rgba(60,100,200,0.25)" strokeWidth={3} />))}
        </svg>
        <div style={{position: 'absolute', left: 1240, top: 120, width: 220, height: 180, background: `rgba(200,225,255,${0.55 + lit * 0.45})`, boxShadow: `0 0 ${60 + lit * 80}px rgba(200,225,255,0.7)`}}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: 30 + i * 52, top: 0, width: 14, height: 180, background: '#01051A'}} />)}
        </div>
        <Beam x={1350} y={180} angle={38} length={1300} width={lerp(320, 520, lit)} opacity={0.35 + lit * 0.35} />
        <Motes T={T} n={70} area={[600, 250, 800, 700]} vy={-6} vx={5} size={4} opacity={0.6} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={{...P.sit, head: lerp(0.65, 0.15, lit), torso: lerp(0.35, 0.15, lit)}} x={760} y={880} h={430} hood={false} robe rim={`rgba(${lit > 0.5 ? '200,255,46' : '200,225,255'},0.85)`} /></svg>
        <AbsoluteFill style={{filter: 'blur(6px)'}}>{Array.from({length: 7}).map((_, i) => <div key={i} style={{position: 'absolute', left: 80 + i * 280 + (T - 27.5) * -14, top: -20, width: 34, height: H + 40, background: 'linear-gradient(90deg, #01030F, #0A1A55 45%, #01030F)'}} />)}</AbsoluteFill>
      </AbsoluteFill>
      <Vignette k={0.7} /><Grain opacity={0.26} />
      <Title T={T} name="JOSÉ" at={K.jose} />
      <div style={{position: 'absolute', left: 120, top: 380}}>
        <Reveal T={T} at={K.esquecido - 0.1} out={30.1}><Tag size={36} color="#9DB7F0" style={{textDecoration: 'line-through', textDecorationColor: C.lime}}>esquecido numa prisão</Tag></Reveal>
        <Reveal T={T} at={K.deus1 - 0.1} style={{marginTop: -6}}><Big size={92}>MAS DEUS</Big><Plate size={80} px={26} style={{marginTop: 8}}>NÃO SE ESQUECEU</Plate></Reveal>
      </div>
    </SceneFade>
  );
};

/* 06 · JÓ — tempestade e cinzas */
export const S06: React.FC = () => {
  const T = useT(6); const fiel = pa(T, K.fiel - 0.6, 1.0, E.inOut); const gy = 840;
  return (
    <SceneFade i={6} d={0.5}>
      <AbsoluteFill style={{transform: `scale(${lerp(1.05, 1.12, pa(T, 32.85, 6, E.inOut))})`}}>
        <Sky top="#01040F" bottom="#1A2F6A" glowX={0.5} glowY={0.2} glow={0.15 + fiel * 0.3} glowColor="220,230,255" />
        <SoftFlash T={T} at={[33.0, 35.2]} />
        <Fog T={T * 2} y={0.5} opacity={0.45} speed={60} color="120,140,190" />
        <div style={{position: 'absolute', left: 0, right: 0, top: gy, bottom: 0, background: 'linear-gradient(180deg, #1C2440, #070B1E)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M600 ${gy + 10} Q960 ${gy - 60} 1320 ${gy + 10} Z`} fill="#2A3355" />
          <Figure pose={mix(P.kneelHead, P.kneelArms, fiel)} x={930} y={gy - 18} h={400} hood={false} robe={false} rim={fiel > 0.5 ? 'rgba(200,255,46,0.85)' : 'rgba(200,215,255,0.6)'} />
        </svg>
        <Motes T={T} n={160} color="#C9D2E8" size={6} vy={70} vx={-90} opacity={0.55} seed={4} />
        <Motes T={T} n={40} color="#8E99B8" size={14} vy={40} vx={-60} opacity={0.35} seed={9} />
      </AbsoluteFill>
      <Vignette k={0.8} /><Grain opacity={0.3} />
      <Title T={T} name="JÓ" at={K.jo} />
      <div style={{position: 'absolute', left: 120, top: 380}}>
        <Reveal T={T} at={33.86} out={36.0}><Tag size={36} color="#CFE0FF">perdeu quase tudo...</Tag></Reveal>
        <Reveal T={T} at={K.cinzas - 0.3}><Tag size={32} color="#CFE0FF">e, mesmo nas cinzas,</Tag></Reveal>
        <Reveal T={T} at={K.fiel - 0.5} dir="zoom"><Plate size={110} px={34} style={{marginTop: 12}}>PERMANECEU FIEL</Plate></Reveal>
      </div>
    </SceneFade>
  );
};

/* 07 · DANIEL — oração na cova dos leões */
const Lion: React.FC<{x: number; y: number; s: number; flip?: boolean; T: number; seed: number; eyes?: number}> = ({x, y, s, flip, T, seed, eyes = 1}) => {
  const mane = Array.from({length: 30}).map((_, i) => { const a = (i / 30) * Math.PI * 2, r = i % 2 ? 66 : 50 + rand(i + seed) * 10; return `${110 + Math.cos(a) * r},${88 + Math.sin(a) * r * 1.05}`; }).join(' ');
  const blink = (Math.floor(T * 1.3 + seed) % 5 === 0) && ((T * 1.3 + seed) % 1) < 0.12 ? 0.1 : 1; const breathe = Math.sin(T * 2 + seed) * 2;
  return (
    <svg width={420 * s} height={240 * s} viewBox="0 0 420 240" style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined}}>
      <g fill="#06113A" stroke="none" style={{filter: 'blur(5px)'}} opacity={0.85}>
        <path d={`M150 ${80 + breathe} C210 ${60 + breathe} 330 ${62 + breathe} 360 ${92 + breathe} C380 110 372 150 352 168 L350 228 L326 228 L322 176 C290 184 230 184 200 178 L196 228 L172 228 L168 172 C150 160 140 130 150 ${80 + breathe} Z`} />
        <path d="M360 100 C400 110 400 170 412 190" fill="none" strokeWidth={6} /><circle cx={412} cy={194} r={9} />
        <polygon points={mane} />
        <path d="M70 70 C52 78 40 96 44 112 C48 124 66 128 82 124 L110 110 Z" />
      </g>
      <g opacity={eyes * blink}><circle cx={78} cy={80} r={5} fill={C.lime} style={{filter: `drop-shadow(0 0 8px ${C.lime})`}} /><circle cx={96} cy={78} r={5} fill={C.lime} style={{filter: `drop-shadow(0 0 8px ${C.lime})`}} /></g>
    </svg>
  );
};
export const S07: React.FC = () => {
  const T = useT(7); const gy = 860; const orar = pa(T, K.orar - 0.6, 1.0, E.inOut);
  return (
    <SceneFade i={7} d={0.5}>
      <AbsoluteFill style={{transform: `scale(${lerp(1.0, 1.1, pa(T, 39, 5.3, E.inOut))})`}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 70% at 50% 30%, #0A2A93 0%, #020A2E 55%, #01030D 100%)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><path d={`M0 0 H${W} V${H} H0 Z M520 ${gy} C520 300 700 120 960 120 C1220 120 1400 300 1400 ${gy} Z`} fill="#01030D" fillRule="evenodd" /></svg>
        <Beam x={960} y={-80} angle={0} length={1100} width={lerp(380, 520, orar)} opacity={0.3 + orar * 0.3} />
        <Motes T={T} n={50} area={[760, 100, 400, 760]} vy={-5} vx={3} size={4} opacity={0.6} />
        <div style={{position: 'absolute', left: 0, right: 0, top: gy, bottom: 0, background: '#020818'}} />
        <Lion x={170} y={gy - 230} s={1.0} T={T} seed={1} />
        <Lion x={1360} y={gy - 210} s={0.9} T={T} seed={3} flip />
        <Lion x={520} y={gy - 150} s={0.6} T={T} seed={5} eyes={0.6} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={P.kneelPray} x={920} y={gy + 2} h={400} hood={false} rim={`rgba(${orar > 0.4 ? '200,255,46' : '220,230,255'},0.85)`} /></svg>
      </AbsoluteFill>
      <Vignette k={0.7} /><Grain opacity={0.26} />
      <Title T={T} name="DANIEL" at={K.daniel} />
      <div style={{position: 'absolute', left: 120, top: 380}}>
        <Reveal T={T} at={40.3} out={42.0}><Tag size={34} color="#CFE0FF">enfrentou a cova dos leões...</Tag></Reveal>
        <Reveal T={T} at={42.08}><Tag size={32} color="#CFE0FF">e não deixou de</Tag><Plate size={120} px={36} style={{marginTop: 10}}>ORAR</Plate></Reveal>
      </div>
    </SceneFade>
  );
};

/* 08 · JESUS — a caminhada até a cruz (silhueta reverente) */
export const S08: React.FC = () => {
  const T = useT(8); const u = clamp((T - 44.4) / 9.0); const stopT = pa(T, K.fim1 - 0.3, 1.2, E.out);
  const hill = (x: number) => 900 - Math.max(0, (x - 300) / 1500) ** 1.3 * 420;
  const fx = lerp(420, 1180, u * (1 - stopT * 0.0)); const fy = hill(fx);
  const ph = 44.4 * 2 + (T - 44.4) * 2.2 * (1 - stopT);
  return (
    <SceneFade i={8} d={0.9}>
      <AbsoluteFill style={{transform: `scale(${lerp(1.08, 1.0, pa(T, 44.25, 10, E.outSoft))})`, transformOrigin: '70% 60%'}}>
        <Sky top="#030E3A" bottom="#4A8BFF" glowX={0.84} glowY={0.42} glow={0.55 + stopT * 0.3} glowColor="230,240,255" />
        {[-2, -1, 0, 1, 2].map((i) => <Beam key={i} x={1620} y={250} angle={180 + i * 18 + Math.sin(T * 0.3) * 2} length={1500} width={300} opacity={0.12 + stopT * 0.08} />)}
        <Fog T={T} y={0.78} opacity={0.4} speed={10} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M0 ${H} L0 900 ${Array.from({length: 40}).map((_, i) => { const x = i * 52; return `L${x} ${hill(x)}`; }).join(' ')} L${W} ${hill(W)} L${W} ${H} Z`} fill="#01051A" />
          <Figure pose={walkPose(ph, 1, P.carry)} x={fx} y={fy + 6} h={300} hood={false} robe cross={1} rim="rgba(230,240,255,0.85)" />
        </svg>
      </AbsoluteFill>
      <Vignette k={0.6} /><Grain />
      <div style={{position: 'absolute', left: 120, top: 140}}>
        <Reveal T={T} at={44.55}><Tag size={36} color="#CFE0FF">e Jesus...</Tag></Reveal>
        <Reveal T={T} at={46.3} out={48.1} style={{marginTop: 12}}><Big size={92}>CAMINHOU ATÉ A CRUZ</Big></Reveal>
      </div>
      <div style={{position: 'absolute', left: 120, top: 270, display: 'flex', flexDirection: 'column', gap: 4}}>
        <Reveal T={T} at={K.cansado - 0.08}><Big size={110}>CANSADO.</Big></Reveal>
        <Reveal T={T} at={K.ferido - 0.08}><Big size={110}>FERIDO.</Big></Reveal>
        <Reveal T={T} at={K.obediente - 0.3} dir="zoom"><Tag size={34} color="#CFE0FF">mas</Tag><Plate size={110} px={34} style={{marginTop: 8}}>OBEDIENTE ATÉ O FIM.</Plate></Reveal>
      </div>
    </SceneFade>
  );
};
