import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, K, W, H} from '../theme';
import {Figure, P, walkPose, mix} from '../Figure';
import {Sky, Fog, Rain, Splashes, Ground, Grain, Vignette, Motes, SoftFlash, Beam} from '../Atmos';
import {useT, pa, E, clamp, lerp, rand, Big, Plate, Tag, Reveal, Center, SceneFade} from '../scenes_common';

const Rocks: React.FC<{y: number; xs: number[]; s?: number}> = ({y, xs, s = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    {xs.map((x, i) => { const w = (90 + rand(i * 3) * 120) * s, h = (50 + rand(i * 5) * 70) * s; return <g key={i}>
      <polygon points={`${x - w / 2},${y} ${x - w * 0.35},${y - h * 0.7} ${x - w * 0.05},${y - h} ${x + w * 0.3},${y - h * 0.8} ${x + w / 2},${y}`} fill="#01061F" />
      <polyline points={`${x - w * 0.05},${y - h} ${x + w * 0.3},${y - h * 0.8} ${x + w / 2},${y}`} fill="none" stroke="rgba(160,200,255,0.35)" strokeWidth={3} /></g>; })}
  </svg>
);
export {Rocks};

/* 01 · A CAMINHADA PESA */
export const S01: React.FC = () => {
  const T = useT(1); const gy = 860; const cam = lerp(1, 1.08, pa(T, 0, 7.5, E.inOut));
  const x = lerp(260, 980, T / 7.5); const ph = T * 4.2;
  const pesa = pa(T, K.pesa - 0.05, 0.5, E.in);
  const resp = T > 5.75 ? pa(T, 6.3, 0.7, E.in) : 0;
  return (
    <SceneFade i={1}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '60% 70%'}}>
        <Sky top="#01051A" bottom="#0A2A93" glowX={0.82} glowY={0.62} glow={0.35} />
        <SoftFlash T={T} at={[0.4]} />
        <Img src={staticFile('images/montanhas.png')} style={{position: 'absolute', left: -100, top: 560, width: W + 200, opacity: 0.35, filter: 'brightness(0.25) blur(2px)'}} />
        <Fog T={T} y={0.72} opacity={0.6} />
        <Ground y={gy} T={T} wet={0.9} />
        <Rocks y={gy + 6} xs={[1380, 1560, 1720]} s={1.1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={walkPose(ph, 0.7, P.weary)} x={x} y={gy + 4} h={430} pack rimSide={1} rim="rgba(160,200,255,0.75)" /></svg>
        <Splashes T={T} y={gy} />
        <Rain T={T} density={1} angle={14} />
      </AbsoluteFill>
      <Vignette k={0.75} /><Grain opacity={0.24} />
      <div style={{position: 'absolute', left: 120, top: 150}}>
        <Reveal T={T} at={1.6}><Tag size={34} color="#CFE0FF">tem dias em que</Tag></Reveal>
        <Reveal T={T} at={2.0} style={{marginTop: 14}}><Big size={130}>A CAMINHADA</Big></Reveal>
        {T > K.pesa - 0.05 && <div style={{transform: `translateY(${(1 - pesa) * -120}px) scaleY(${1 + Math.sin(clamp((T - K.pesa - 0.4) * 9) * Math.PI) * -0.12 * (1 - pa(T, K.pesa + 0.5, 0.3))})`, transformOrigin: 'bottom', opacity: clamp(pesa * 2), marginTop: 8}}><Big size={210} color={C.lime}>PESA.</Big></div>}
      </div>
      <div style={{position: 'absolute', right: 140, top: 180, textAlign: 'right'}}>
        <Reveal T={T} at={4.8} out={7.2}><Tag size={30} color="#CFE0FF">você ora... e a</Tag></Reveal>
        {T > 5.75 && <div style={{opacity: 1 - resp, filter: `blur(${resp * 14}px)`, letterSpacing: resp * 40, marginTop: 10}}><Big size={120} color="transparent" style={{WebkitTextStroke: '3px #FFFFFF', textShadow: 'none'}}>RESPOSTA</Big></div>}
        <Reveal T={T} at={6.2} out={7.2} style={{marginTop: 6}}><Tag size={30} color={C.lime}>não vem</Tag></Reveal>
      </div>
    </SceneFade>
  );
};

/* 02 · PRESSÃO (cortes rápidos) */
export const S02: React.FC = () => {
  const T = useT(2); const cut = T < 9.05 ? 0 : T < 11.2 ? 1 : T < 13.55 ? 2 : 3;
  const slabs = [K.dificuldades, 12.0, K.acumulam];
  return (
    <SceneFade i={2} d={0.25}>
      {cut === 0 && <AbsoluteFill>
        <Sky top="#01051A" bottom="#071E6E" glow={0.2} />
        <Ground y={760} T={T} wet={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={walkPose(T * 3.8, 0.8, P.weary)} x={lerp(700, 1150, (T - 7.5) / 1.6)} y={1060} h={1700} rim="rgba(160,200,255,0.6)" /></svg>
        <Splashes T={T} y={740} n={70} /><Rain T={T} density={0.9} angle={8} speed={1.2} seed={3} />
        <div style={{position: 'absolute', left: 120, top: 170}}><Reveal T={T} at={7.6}><Tag size={32} color="#CFE0FF">você se esforça...</Tag></Reveal></div>
      </AbsoluteFill>}
      {cut === 1 && <AbsoluteFill style={{background: '#020A2E'}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 9}).map((_, i) => <line key={i} x1={200} y1={260 + i * 70} x2={1720} y2={260 + i * 70} stroke="rgba(160,200,255,0.12)" strokeWidth={2} />)}
          {(() => { const p = pa(T, 9.05, 1.6, E.out); const pts = Array.from({length: 40}).map((_, i) => { const u = i / 39; const y = 640 - Math.sin(u * 5) * 26 * (1 - u) + u * 140 + (rand(i) - 0.5) * 18; return `${200 + u * 1520 * p},${y}`; }); return <polyline points={pts.join(' ')} fill="none" stroke={C.white} strokeWidth={6} style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.6))'}} />; })()}
        </svg>
        <Center><Reveal T={T} at={K.resultados - 0.1} dir="zoom"><Big size={190}>RESULTADOS</Big></Reveal><Reveal T={T} at={K.aparecem - 0.1}><Tag size={42} color={C.lime} style={{marginTop: 16, textAlign: 'center'}}>não aparecem</Tag></Reveal></Center>
      </AbsoluteFill>}
      {cut === 2 && <AbsoluteFill>
        <Sky top="#01051A" bottom="#0A2A93" glowX={0.5} glowY={0.3} glow={0.3} />
        <Ground y={900} T={T} />
        {slabs.map((t, i) => { const p = pa(T, t - 0.25, 0.3, E.in); const shake = T > t && T < t + 0.25 ? (rand(Math.floor(T * 60)) - 0.5) * 14 : 0;
          return T > t - 0.25 && <div key={i} style={{position: 'absolute', left: 760 - i * 30 + shake, top: lerp(-300, 330 - i * 130, p), width: 420 + i * 40, height: 120, background: 'linear-gradient(180deg, #0A2A93, #01061F)', border: '3px solid rgba(160,200,255,0.4)', transform: `rotate(${(i - 1) * 4}deg)`, boxShadow: '0 30px 60px rgba(0,0,0,0.6)'}} />; })}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={mix(P.weary, P.kneelHead, pa(T, 12.5, 0.8, E.inOut) * 0.45)} x={960} y={904} h={460} pack rim="rgba(160,200,255,0.7)" /></svg>
        <Rain T={T} density={0.6} />
        <div style={{position: 'absolute', left: 120, top: 150}}><Reveal T={T} at={K.dificuldades - 0.1}><Big size={140}>AS DIFICULDADES</Big></Reveal><Reveal T={T} at={K.acumulam - 0.1}><Plate size={110} px={34} style={{marginTop: 12}}>SE ACUMULAM</Plate></Reveal></div>
      </AbsoluteFill>}
      {cut === 3 && <AbsoluteFill>
        <Sky top="#01051A" bottom="#0A2A93" glowX={0.3} glowY={0.4} glow={0.4} />
        {(() => { const br = Math.sin((T - 13.55) * 4.2); const blur = 2 + Math.max(0, Math.sin((T - 13.55) * 1.6)) * 7; return (
          <AbsoluteFill style={{filter: `blur(${blur}px)`}}><svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={{...P.weary, torso: 0.35 + br * 0.05, head: 0.5 + br * 0.06}} x={1180} y={2050} h={1900} pack rim="rgba(160,200,255,0.7)" /></svg></AbsoluteFill>); })()}
        <Rain T={T} density={0.7} speed={0.8} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(1,5,26,${0.6 + 0.25 * Math.abs(Math.sin((T - 13.55) * 2))}) 100%)`}} />
        <div style={{position: 'absolute', left: 120, top: 330}}>
          <Reveal T={T} at={K.cansaco - 0.1}><Tag size={34} color="#CFE0FF">o cansaço</Tag></Reveal>
          {T > 14.3 && <Big size={lerp(120, 200, pa(T, 14.3, 1.6, E.out))} style={{marginTop: 10, letterSpacing: lerp(0, 12, pa(T, 14.3, 1.6)), transform: `skewX(-9deg) scaleX(${1 + Math.sin(T * 30) * 0.008})`}}>FALA MAIS ALTO</Big>}
        </div>
      </AbsoluteFill>}
      <Vignette k={0.7} /><Grain opacity={0.24} />
    </SceneFade>
  );
};

/* 03 · O SILÊNCIO — "E se eu parar aqui?" */
export const S03: React.FC = () => {
  const T = useT(3); const gy = 860; const slow = 1 - pa(T, 16.3, 3.0, E.out) * 0.85;
  const stop = pa(T, 16.5, 1.4, E.out); const ph = 16.5 * 4 + (T - 16.5) * 4 * (1 - stop);
  const pose = mix(walkPose(ph, 0.8, P.weary), {...P.weary, head: 0.75, torso: 0.38}, stop);
  return (
    <SceneFade i={3} d={0.8}>
      <AbsoluteFill style={{transform: `scale(${lerp(1, 1.12, pa(T, 16.3, 6.4, E.inOut))})`, transformOrigin: '50% 70%'}}>
        <Sky top="#01051A" bottom="#071E6E" glowX={0.5} glowY={0.75} glow={0.25} />
        <Fog T={T * 0.3} y={0.74} opacity={0.7} />
        <Ground y={gy} T={T * 0.3} wet={0.8} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={pose} x={900} y={gy + 4} h={380} pack rim="rgba(160,200,255,0.55)" /></svg>
        <Rain T={16.3 + (T - 16.3) * slow} density={lerp(1, 0.35, 1 - slow)} speed={slow * 0.9 + 0.1} />
      </AbsoluteFill>
      <Vignette k={0.82} /><Grain opacity={0.26} />
      <Center top={210}><Reveal T={T} at={16.6} out={19.4}><Tag size={30} color="#CFE0FF">e, no silêncio, surge a pergunta</Tag></Reveal></Center>
      <Center top={300}><Reveal T={T} at={19.75} dur={1.2}><Big size={110} skew={0} style={{letterSpacing: lerp(2, 10, pa(T, 19.8, 3, E.out))}}>E SE EU PARAR AQUI?</Big></Reveal></Center>
    </SceneFade>
  );
};

/* 04 · NUNCA FOI FÁCIL — a trilha dos que vieram antes */
export const S04: React.FC = () => {
  const T = useT(4); const gy = 820; const pan = pa(T, 22.7, 4.8, E.inOut);
  return (
    <SceneFade i={4} d={0.8}>
      <AbsoluteFill style={{transform: `translateX(${-pan * 160}px) scale(1.1)`}}>
        <Sky top="#030E3A" bottom="#1245C9" glowX={0.75} glowY={0.55} glow={0.55} />
        <Beam x={1500} y={-60} angle={18} length={1300} width={420} opacity={0.35} />
        <Img src={staticFile('images/montanhas.png')} style={{position: 'absolute', left: -100, top: 520, width: W + 300, opacity: 0.5, filter: 'brightness(0.35)'}} />
        <Fog T={T} y={0.7} opacity={0.5} />
        <Ground y={gy} T={T} wet={0.3} color="#020C38" />
        <svg width={W + 300} height={H} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 7}).map((_, i) => { const d = i / 6; const hh = lerp(320, 110, d); const xx = 300 + i * 260 + (T - 22.7) * 18; return <Figure key={i} pose={walkPose(T * 2.6 + i * 1.3, 0.3)} x={xx} y={gy + 4 - d * 70} h={hh} hood={i % 2 === 0} robe={i % 2 === 1} opacity={0.25 + (1 - d) * 0.55} rim="rgba(200,220,255,0.5)" blur={d * 2} />; })}
          {Array.from({length: 26}).map((_, i) => <ellipse key={`p${i}`} cx={120 + i * 72} cy={gy + 30 - (i / 26) * 60} rx={10} ry={4} fill="rgba(200,255,46,0.35)" />)}
        </svg>
      </AbsoluteFill>
      <Vignette k={0.65} /><Grain />
      <div style={{position: 'absolute', left: 120, top: 150}}>
        <Reveal T={T} at={23.1}><Tag size={30} color="#CFE0FF">a história de quem caminha com Deus</Tag></Reveal>
        <Reveal T={T} at={25.4} style={{marginTop: 16}}><Big size={130}>NUNCA FOI</Big></Reveal>
        <Reveal T={T} at={K.facil - 0.1} dir="zoom"><Plate size={130} px={40} style={{marginTop: 10}}>FÁCIL.</Plate></Reveal>
      </div>
    </SceneFade>
  );
};
