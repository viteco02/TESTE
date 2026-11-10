import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, K, W, H, TOTAL_SEC} from '../theme';
import {Figure, P, walkPose, mix, Pose} from '../Figure';
import {Sky, Fog, Rain, Splashes, Ground, Grain, Vignette, Motes, SoftFlash, Beam} from '../Atmos';
import {Logo} from '../components/Brand';
import {Rocks} from './A';
import {useT, pa, E, clamp, lerp, rand, Big, Plate, Tag, Reveal, Center, SceneFade} from '../scenes_common';

const HANDX = 820, HANDY = 812;
const Hand: React.FC<{g: number; x: number; y: number; s: number}> = ({g, x, y, s}) => (
  <svg width={600 * s} height={500 * s} viewBox="0 0 600 500" style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
    <path d="M0 420 L600 360 L600 500 L0 500 Z" fill="#01030D" stroke="rgba(160,200,255,0.4)" strokeWidth={4} />
    <g fill="#010412" stroke="rgba(200,255,46,0.8)" strokeWidth={5} strokeLinejoin="round">
      <path d="M40 120 C120 80 240 90 300 150 L330 260 C300 300 220 320 150 300 C90 280 40 220 40 120 Z" />
      {[0, 1, 2, 3].map((i) => { const bx = 300, by = 160 + i * 34; const c = g; return <path key={i} d={`M${bx - 10} ${by} C${bx + 60} ${by - 10 + c * 10} ${bx + 110 - c * 30} ${by + 20 + c * 90} ${bx + 90 - c * 60} ${by + 40 + c * 150} L${bx + 60 - c * 50} ${by + 50 + c * 140} C${bx + 70 - c * 20} ${by + 30 + c * 60} ${bx + 40} ${by + 20} ${bx - 10} ${by + 28} Z`} />; })}
      <path d="M200 120 C260 90 300 60 320 90 C330 110 300 140 260 160 Z" />
    </g>
  </svg>
);

/* 09 · A DECISÃO DE CONTINUAR — cai, fica no chão, agarra, levanta, retoma */
export const S09: React.FC = () => {
  const T = useT(9); const gy = 860;
  const shot = T < 57.05 ? 'fall' : T < 57.95 ? 'hand' : T < 60.1 ? 'rise' : T < 62.75 ? 'pray' : T < 66.55 ? 'feet' : 'wind';
  let pose: Pose = walkPose(T * 3.6, 0.8, P.weary), fx = 0;
  if (shot === 'fall') { const tr = pa(T, 55.55, 0.35, E.in), fl = pa(T, 55.9, 0.4, E.in); pose = T < 55.55 ? walkPose(T * 3.6, 0.8, P.weary) : T < 55.9 ? mix(walkPose(55.55 * 3.6, 0.8, P.weary), P.trip, tr) : mix(P.trip, P.fallen, fl); fx = lerp(560, 900, clamp((T - 54.5) / 1.8)); }
  if (shot === 'rise') { const a = pa(T, 57.95, 0.6, E.inOut), b = pa(T, 58.7, 0.9, E.inOut); pose = b > 0 ? mix(P.oneKnee, P.weary, b) : mix(mix(P.kneelHead, P.oneKnee, 0.5), P.oneKnee, a); }
  const words = ['DESISTA', 'PARE', 'VOLTE', 'NÃO DÁ', 'CHEGA', 'DESISTA'];
  return (
    <SceneFade i={9} d={0.4}>
      {(shot === 'fall' || shot === 'rise') && <AbsoluteFill style={{transform: `scale(${shot === 'rise' ? lerp(1.15, 1.0, pa(T, 57.95, 2, E.out)) : 1.0})`, transformOrigin: '50% 75%'}}>
        <Sky top="#01051A" bottom="#0A2A93" glowX={0.75} glowY={0.6} glow={shot === 'rise' ? 0.45 : 0.25} />
        <Fog T={T} y={0.75} opacity={0.6} />
        <Ground y={gy} T={T} wet={1} />
        <Rocks y={gy + 6} xs={[980, 1300, 1500]} s={0.9} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={pose} x={shot === 'fall' ? fx : 900} y={gy + 6} h={420} pack rim={shot === 'rise' ? 'rgba(200,255,46,0.85)' : 'rgba(160,200,255,0.7)'} /></svg>
        <Splashes T={T} y={gy} n={60} /><Rain T={T} density={1} angle={16} />
      </AbsoluteFill>}
      {shot === 'hand' && <AbsoluteFill style={{transform: `scale(${lerp(1.08, 1.0, pa(T, 57.05, 0.9, E.out))})`}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 60% at 70% 30%, #123FC0, #01051A 70%)'}} />
        <Ground y={800} T={T} wet={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'blur(0.6px)'}}><Figure pose={mix(P.kneelHead, P.oneKnee, pa(T, 57.3, 0.7, E.inOut) * 0.5)} x={HANDX} y={HANDY} h={760} pack rim="rgba(200,255,46,0.9)" /></svg>
        <Splashes T={T} y={800} n={90} /><Rain T={T} density={1} speed={1.4} angle={8} />
      </AbsoluteFill>}
      {shot === 'pray' && <AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 60% at 50% 20%, #123FC0, #01051A 75%)'}} />
        <Beam x={960} y={-60} angle={0} length={1100} width={420} opacity={0.32} />
        <Ground y={gy} T={T} wet={0.5} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={P.kneelPray} x={930} y={gy + 6} h={400} pack rim="rgba(200,255,46,0.8)" /></svg>
        <Rain T={T} density={0.5} />
      </AbsoluteFill>}
      {shot === 'feet' && <AbsoluteFill>
        <Sky top="#01051A" bottom="#071E6E" glow={0.25} glowX={0.9} />
        <Ground y={760} T={T} wet={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={walkPose(T * 3.4, 0.4, P.stand)} x={lerp(500, 1300, (T - 62.75) / 3.8)} y={1060} h={1700} rim="rgba(200,255,46,0.6)" /></svg>
        <Splashes T={T} y={740} n={70} /><Rain T={T} density={0.8} angle={10} />
      </AbsoluteFill>}
      {shot === 'wind' && <AbsoluteFill>
        <Sky top="#01040F" bottom="#0A2A93" glowX={0.95} glowY={0.55} glow={0.4} />
        <SoftFlash T={T} at={[66.8]} />
        <Fog T={T * 3} y={0.7} opacity={0.6} speed={-80} />
        <Ground y={gy} T={T} wet={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={walkPose(T * 2.8, 1, {...P.weary, torso: 0.55})} x={lerp(640, 900, (T - 66.55) / 3.8)} y={gy + 6} h={420} pack rim="rgba(200,255,46,0.85)" /></svg>
        {words.map((w, i) => { const p = ((T - 66.6) * 0.55 + i / words.length) % 1; return T > 66.6 + i * 0.25 && <div key={i} style={{position: 'absolute', left: lerp(W + 100, -500, p), top: 180 + rand(i * 7) * 560, opacity: 0.25 * Math.sin(Math.PI * p), filter: 'blur(2px)'}}><Big size={60 + rand(i) * 60} skew={-14}>{w}</Big></div>; })}
        <Rain T={T} density={1.2} angle={30} speed={1.3} />
      </AbsoluteFill>}
      <Vignette k={0.72} /><Grain opacity={0.24} />
      <div style={{position: 'absolute', left: 120, top: 150}}>
        <Reveal T={T} at={54.8} out={57.0}><Tag size={32} color="#CFE0FF">perseverar não é</Tag><Big size={140} style={{marginTop: 10}}>NUNCA CAIR</Big></Reveal>
      </div>
      <div style={{position: 'absolute', left: 120, top: 150}}>
        <Reveal T={T} at={K.levantar - 0.15} out={60.05}><Tag size={32} color="#CFE0FF">perseverar é</Tag><Big size={160} color={C.lime} style={{marginTop: 10}}>LEVANTAR</Big><Reveal T={T} at={K.maisuma - 0.1}><Tag size={40} style={{marginTop: 8}}>mais uma vez</Tag></Reveal></Reveal>
        <Reveal T={T} at={60.2} out={62.7}><Big size={110}>CONTINUAR ORANDO</Big><Tag size={34} color={C.lime} style={{marginTop: 10}}>quando ninguém vê</Tag></Reveal>
        <Reveal T={T} at={63.4} out={66.5}><Tag size={32} color="#CFE0FF">dar</Tag><Big size={150} style={{marginTop: 6}}>MAIS UM PASSO</Big><Reveal T={T} at={K.forcas - 0.1}><Tag size={30} color="#CFE0FF" style={{marginTop: 8}}>quando as forças parecem acabar</Tag></Reveal></Reveal>
        <Reveal T={T} at={66.7}><Tag size={32} color="#CFE0FF">é</Tag><Plate size={130} px={38} style={{marginTop: 8}}>ESCOLHER FICAR</Plate><Reveal T={T} at={K.desistir1 - 0.4}><Tag size={30} style={{marginTop: 12}}>quando tudo diz para desistir</Tag></Reveal></Reveal>
      </div>
    </SceneFade>
  );
};

/* 10 · IMPACTO — "Deus não abandona quem decide permanecer com Ele!" */
export const S10: React.FC = () => {
  const T = useT(10); const open = pa(T, 70.3, 1.4, E.out);
  const line = (t: string, at: number, size: number, color: string = C.white, plate = false) => {
    if (T < at - 0.05) return null; const p = pa(T, at - 0.05, 0.45, E.back);
    const el = plate ? <Plate size={size} px={50}>{t}</Plate> : <Big size={size} color={color}>{t}</Big>;
    return <div style={{transform: `scale(${lerp(1.6, 1, p)}) translateY(${(1 - p) * 30}px)`, opacity: clamp(p * 2), filter: `blur(${(1 - clamp(p)) * 12}px)`}}>{el}</div>;
  };
  return (
    <SceneFade i={10} d={0.3}>
      <Sky top="#061A66" bottom="#2368F2" glowX={0.5} glowY={0.45} glow={0.5 + open * 0.5} glowColor="255,255,255" />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => <Beam key={i} x={960} y={-200} angle={i * 14 + Math.sin(T * 0.4 + i) * 2} length={1600} width={240} opacity={0.18 * open} />)}
      <Motes T={T} n={80} color="#FFFFFF" size={5} vy={-30} vx={8} opacity={0.6} glow />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${0.35 * (1 - open)}), transparent 60%)`}} />
      <Vignette k={0.45} /><Grain opacity={0.16} />
      <Center style={{gap: 6, transform: `scale(${1 + (T - 70.3) * 0.012})`}}>
        {line('DEUS NÃO ABANDONA', K.deus2, 200)}
        {line('QUEM DECIDE', K.decide - 0.1, 130)}
        {line('PERMANECER COM ELE!', K.permanecer1 + 0.15, 175, C.ink, true)}
      </Center>
    </SceneFade>
  );
};

/* 11 · A PERGUNTA — pausa diante do caminho difícil */
export const S11: React.FC = () => {
  const T = useT(11); const step = pa(T, 84.4, 1.0, E.inOut); const gy = 900;
  return (
    <SceneFade i={11} d={1.0}>
      <AbsoluteFill style={{transform: `scale(${lerp(1.0, 1.06, pa(T, 74.9, 10, E.inOut))})`, transformOrigin: '50% 70%'}}>
        <Sky top="#01051A" bottom="#123FC0" glowX={0.9} glowY={0.12} glow={0.6} glowColor="230,240,255" />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M0 ${gy} L1180 ${gy} C1360 800 1460 600 1590 420 C1650 330 1700 250 1760 215 C1800 240 1860 300 1920 330 L1920 ${H} L0 ${H} Z`} fill="#01051A" />
          <path d={`M1220 ${gy} C1380 800 1480 610 1600 440 C1660 350 1710 270 1755 225`} fill="none" stroke="rgba(160,200,255,0.25)" strokeWidth={10} strokeDasharray="18 22" />
        </svg>
        <Rocks y={gy - 20} xs={[1420, 1560]} s={0.6} />
        <Fog T={T * 0.5} y={0.62} opacity={0.6} speed={8} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Figure pose={step > 0 ? walkPose(84.4 * 3 + (T - 84.4) * 3 * step, 0.4) : {...P.stand, head: lerp(0.05, -0.15, pa(T, 76, 3)), torso: 0.04 + Math.sin(T * 1.6) * 0.008}} x={1080 + step * 70} y={gy + 4} h={330} pack rim="rgba(200,255,46,0.8)" /></svg>
        <Rain T={T} density={0.4} speed={0.6} />
      </AbsoluteFill>
      <Vignette k={0.7} /><Grain />
      <div style={{position: 'absolute', left: 120, top: 140}}>
        <Reveal T={T} at={75.3} out={77.8}><Tag size={34} color="#CFE0FF">então, hoje, eu te pergunto:</Tag></Reveal>
        <Reveal T={T} at={K.desistir2 - 0.35} dur={0.8}><Big size={110}>VOCÊ VAI DESISTIR</Big></Reveal>
        <Reveal T={T} at={K.meio - 0.1} dur={0.8}><Tag size={40} color="#CFE0FF" style={{marginTop: 10}}>no meio do caminho...</Tag></Reveal>
      </div>
      <div style={{position: 'absolute', left: 120, top: 430}}>
        <Reveal T={T} at={81.0} dur={0.8}><Big size={96}>OU VAI PERMANECER</Big></Reveal>
        <Reveal T={T} at={K.firme - 0.15} dur={0.9} dir="zoom"><Plate size={120} px={36} style={{marginTop: 12}}>FIRME ATÉ O FIM?</Plate></Reveal>
      </div>
    </SceneFade>
  );
};

/* 12 · CONTINUE FIRME — retoma a caminhada rumo à luz, ainda com desafios */
export const S12: React.FC = () => {
  const T = useT(12); const u = clamp((T - 85.2) / 12.3); const gy = 880; const light = pa(T, 85.2, 12, E.inOut);
  const big = (t: string, at: number, size: number, plate = false, color: string = C.white) => {
    if (T < at - 0.05) return null; const p = pa(T, at - 0.05, 0.4, E.back);
    return <div style={{transform: `scale(${lerp(1.5, 1, p)})`, opacity: clamp(p * 2)}}>{plate ? <Plate size={size} px={46}>{t}</Plate> : <Big size={size} color={color}>{t}</Big>}</div>;
  };
  return (
    <SceneFade i={12} d={0.6}>
      <AbsoluteFill style={{transform: `translateX(${-u * 120}px) scale(1.06)`}}>
        <Sky top={'#030E3A'} bottom="#2368F2" glowX={0.88} glowY={0.45} glow={0.35 + light * 0.55} glowColor="255,255,255" />
        {[-1, 0, 1].map((i) => <Beam key={i} x={1820} y={-260} angle={215 + i * 14} length={1700} width={340} opacity={0.08 + light * 0.18} />)}
        <Fog T={T} y={0.74} opacity={0.5} />
        <Ground y={gy} T={T} wet={0.6} />
        <Rocks y={gy + 6} xs={[700, 1180, 1620, 1900]} s={0.9} />
        <svg width={W + 200} height={H} style={{position: 'absolute', inset: 0}}>
          <Figure pose={walkPose(T * 3.4, lerp(0.6, 0.15, light))} x={lerp(380, 1500, u)} y={gy + 6} h={400} pack rim="rgba(200,255,46,0.85)" />
          {T > 88.0 && <ellipse cx={lerp(380, 1500, u) + 120} cy={gy - 200} rx={60} ry={200} fill="rgba(255,255,255,0.12)" style={{filter: 'blur(40px)'}} opacity={pa(T, 88.0, 1.5)} />}
        </svg>
        <Rain T={T} density={lerp(0.7, 0.15, light)} speed={0.9} />
      </AbsoluteFill>
      <Vignette k={0.55} /><Grain opacity={0.18} />
      <div style={{position: 'absolute', left: 120, top: 150}}>
        <Reveal T={T} at={85.5} out={90.9}><Tag size={32} color="#CFE0FF">o caminho ainda tem desafios</Tag></Reveal>
        <Reveal T={T} at={88.1} out={90.9} style={{marginTop: 12}}><Big size={96}>MAS VOCÊ NÃO</Big><Big size={96} color={C.lime}>CAMINHA SOZINHO</Big></Reveal>
      </div>
      {T > 90.95 && <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at 50% 50%, rgba(3,14,58,${0.55 * pa(T, 90.95, 0.5)}), transparent 75%)`}} />}
      {T > 90.95 && <Center style={{gap: 8}}>
        {big('NÃO DESISTA.', K.naodesista, 150)}
        {big('CONTINUE FIRME.', K.continue, 140, true)}
        {big('DEUS ESTÁ COM VOCÊ!', K.deus3, 150)}
      </Center>}
    </SceneFade>
  );
};

/* 13 · IDENTIDADE — Semana de Oração Jovem 2026 · PERSEVERANÇA */
export const S13: React.FC = () => {
  const T = useT(13); const wm = pa(T, 97.7, 1.0, E.out); const pv = pa(T, K.perseveranca - 0.1, 0.8, E.back);
  return (
    <SceneFade i={13} d={0.8}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 90% at 50% 42%, #2F78FF 0%, #2368F2 40%, #1245C9 75%, #0A2A93 100%)'}} />
      <Motes T={T} n={60} color="#FFFFFF" size={4} vy={-20} vx={6} opacity={0.5} />
      <Img src={staticFile('images/montanhas.png')} style={{position: 'absolute', left: -60, bottom: -40, width: W + 120, opacity: 0.6}} />
      <div style={{position: 'absolute', left: 110, top: 70, display: 'flex', gap: 18, alignItems: 'center', opacity: pa(T, 97.8, 0.8)}}>
        <Logo w={100} />
        <div><Tag size={17} track={6}>Ministério Jovem</Tag><Tag size={17} track={6}>Ágape Teen</Tag><div style={{width: 70, height: 6, background: C.lime, marginTop: 8}} /></div>
      </div>
      <Center top={130}>
        <Img src={staticFile('images/wordmark.png')} style={{width: 640, opacity: wm, transform: `scale(${lerp(0.92, 1, wm)})`, filter: 'drop-shadow(0 10px 0 rgba(6,26,102,0.4))'}} />
        <Reveal T={T} at={K.semana - 0.1}><Tag size={34} track={10} style={{marginTop: 20}}>Semana de Oração Jovem <span style={{color: C.lime}}>2026</span></Tag></Reveal>
      </Center>
      <Center top={560}>
        <Reveal T={T} at={100.4}><div style={{display: 'flex', alignItems: 'center', gap: 20}}><div style={{width: 100, height: 7, background: C.lime}} /><Tag size={34} track={16}>noite 03</Tag><div style={{width: 100, height: 7, background: C.lime}} /></div></Reveal>
        {T > K.perseveranca - 0.1 && <div style={{marginTop: 18, transform: `scale(${lerp(1.3, 1, pv)})`, opacity: clamp(pv * 2)}}><Big size={190} style={{textShadow: '0 0 60px rgba(255,255,255,0.5), 0 8px 0 rgba(6,26,102,0.45)'}}>PERSEVERANÇA</Big></div>}
      </Center>
      <Grain opacity={0.14} />
    </SceneFade>
  );
};
