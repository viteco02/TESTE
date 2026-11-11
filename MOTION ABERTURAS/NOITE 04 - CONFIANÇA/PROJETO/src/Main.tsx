import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, TOTAL_FRAMES, fr, AUDIO_SEC} from './theme';
import {Big, Plate, Tag, Reveal, Pos, pa, E, clamp, lerp} from './common';
import {Motes, Grain, Vignette, Fog, Beam} from './Atmos';
import {Logo} from './components/Brand';
import {loadFonts} from './styles/fonts';

/* ── Decupagem: cada plano entra na palavra certa da narração oficial ── */
type Shot = {c: number; a: number; b: number; inp: number; rate?: number; s0?: number; s1?: number; dx?: number; fade?: number; ox?: string};
const SHOTS: Shot[] = [
  {c: 1, a: 0.0, b: 4.62, inp: 0.6, s0: 1.0, s1: 1.07},
  {c: 2, a: 4.62, b: 7.35, inp: 0.6, s0: 1.04, s1: 1.1},
  {c: 1, a: 7.35, b: 10.8, inp: 10.6, s0: 1.08, s1: 1.14, dx: -30},
  {c: 3, a: 10.8, b: 14.55, inp: 0.6, s0: 1.0, s1: 1.06},
  {c: 4, a: 14.55, b: 18.35, inp: 1.2, s0: 1.02, s1: 1.08},
  {c: 5, a: 18.35, b: 22.35, inp: 0.4, s0: 1.0, s1: 1.08, fade: 0.5},
  {c: 6, a: 22.35, b: 27.95, inp: 0.2, s0: 1.0, s1: 1.06, fade: 1.0},
  {c: 7, a: 27.95, b: 32.7, inp: 0.6, s0: 1.02, s1: 1.07},
  {c: 8, a: 32.7, b: 36.45, inp: 0.5, s0: 1.0, s1: 1.06},
  {c: 9, a: 36.45, b: 40.4, inp: 3.0, s0: 1.0, s1: 1.05},
  {c: 10, a: 40.4, b: 44.65, inp: 0.6, s0: 1.0, s1: 1.06},
  {c: 11, a: 44.65, b: 46.45, inp: 2.6, s0: 1.03, s1: 1.07},
  {c: 12, a: 46.45, b: 50.3, inp: 0.8, s0: 1.0, s1: 1.08},
  {c: 13, a: 50.3, b: 53.95, inp: 0.4, s0: 1.02, s1: 1.07},
  {c: 14, a: 53.95, b: 57.5, inp: 0.4, s0: 1.0, s1: 1.05},
  {c: 15, a: 57.5, b: 61.85, inp: 0.4, s0: 1.0, s1: 1.06},
  {c: 16, a: 61.85, b: 66.85, inp: 0.8, s0: 1.0, s1: 1.07, fade: 0.6},
  {c: 17, a: 66.85, b: 69.3, inp: 2.6, s0: 1.03, s1: 1.08, fade: 0.5},
  {c: 18, a: 69.3, b: 72.85, inp: 0.5, s0: 1.0, s1: 1.06, fade: 0.4},
  {c: 19, a: 72.85, b: 79.35, inp: 0.4, s0: 1.0, s1: 1.1, fade: 0.9},
  {c: 20, a: 79.35, b: 82.75, inp: 2.0, s0: 1.0, s1: 1.05, fade: 0.5},
  {c: 21, a: 82.75, b: AUDIO_SEC + 0.1, inp: 0.0, rate: 0.9, s0: 1.0, s1: 1.12},
];

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame(); const fd = s.fade ?? 0; const t = f / FPS - fd; // t = tempo desde o corte
  const len = s.b - s.a; const p = clamp((t + fd) / (len + fd));
  const sc = lerp(s.s0 ?? 1, s.s1 ?? 1.06, E.inOut(p)); const tx = (s.dx ?? 0) * E.inOut(p);
  const op = fd > 0 ? E.inOut(clamp((t + fd) / fd)) : 1;
  const rate = s.rate ?? 1;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <AbsoluteFill style={{transform: `translateX(${tx}px) scale(${sc})`, transformOrigin: s.ox ?? '50% 50%'}}>
        <OffthreadVideo src={staticFile(`clips/C${s.c}.mp4`)} muted playbackRate={rate} trimBefore={Math.max(0, fr(s.inp - fd * rate))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* escurecimento atrás do texto, para leitura sobre qualquer plano */
const Scrim: React.FC<{T: number; a: number; b: number; k?: number; at?: string}> = ({T, a, b, k = 0.55, at = '50% 50%'}) => {
  const v = Math.min(pa(T, a - 0.2, 0.6, E.out), 1 - pa(T, b - 0.3, 0.6, E.in));
  return <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at ${at}, rgba(3,14,58,${k * v}), rgba(3,14,58,${k * v * 0.35}) 60%, transparent 90%)`, pointerEvents: 'none'}} />;
};

const Flash: React.FC<{T: number; at: number; color?: string; k?: number; d?: number}> = ({T, at, color = '255,255,255', k = 0.9, d = 0.55}) => {
  const x = T >= at - 0.06 && T < at + d ? (T < at ? (T - at + 0.06) / 0.06 : 1 - (T - at) / d) : 0;
  return x > 0 ? <AbsoluteFill style={{background: `rgba(${color},${k * E.out(clamp(x))})`, pointerEvents: 'none'}} /> : null;
};

/* capítulo bíblico: nome + referência, entra da esquerda */
const Chapter: React.FC<{T: number; at: number; out: number; name: string; refx: string}> = ({T, at, out, name, refx}) => {
  const w = pa(T, at, 0.7, E.out) * (1 - pa(T, out, 0.4, E.in));
  return (
    <Pos y={760} align="left" x={120}>
      <Reveal T={T} at={at} out={out} dir="left"><Tag size={24} color={C.lime} track={10}>{refx}</Tag></Reveal>
      <Reveal T={T} at={at + 0.1} out={out} dir="left"><Big size={150}>{name}</Big></Reveal>
      <div style={{width: 320 * w, height: 6, background: C.lime, transform: 'skewX(-9deg)'}} />
    </Pos>
  );
};

const Overlays: React.FC = () => {
  const T = useCurrentFrame() / FPS;
  return (<>
    {/* ABERTURA — o que a gente planeja */}
    <Scrim T={T} a={2.6} b={7.3} k={0.5} at="25% 80%" />
    <Pos y={800} align="left" x={120} style={{gap: 6}}>
      <Reveal T={T} at={2.66} out={7.2} dir="left"><Tag size={38} track={8}>O curso</Tag></Reveal>
      <Reveal T={T} at={3.5} out={7.25} dir="left"><Tag size={38} track={8}>O emprego</Tag></Reveal>
      <Reveal T={T} at={4.74} out={7.3} dir="left"><Tag size={38} track={8}>A pessoa certa</Tag></Reveal>
      <Reveal T={T} at={5.9} out={7.35} dir="left"><Tag size={38} track={8} color={C.lime}>O próximo ano</Tag></Reveal>
    </Pos>
    <Scrim T={T} a={8.6} b={10.8} k={0.55} at="40% 85%" />
    <Pos y={840}><Reveal T={T} at={8.75} out={10.6} dir="zoom"><Big size={110}>O fim da história</Big></Reveal></Pos>

    {/* E SE O AMANHÃ... */}
    <Scrim T={T} a={18.5} b={22.3} k={0.7} />
    <Pos y={330}>
      <Reveal T={T} at={18.9} out={22.2}><Tag size={40} track={14}>E se o</Tag></Reveal>
      <Reveal T={T} at={19.45} out={22.2} dir="zoom"><Big size={200}>amanhã</Big></Reveal>
      <Reveal T={T} at={20.3} out={22.2}><Tag size={40} track={10}>não for como você planejou?</Tag></Reveal>
    </Pos>

    {/* Ele ilumina o próximo passo */}
    <Scrim T={T} a={30.0} b={32.7} k={0.5} at="50% 30%" />
    <Pos y={190}>
      <Reveal T={T} at={30.05} out={32.6}><Tag size={40} track={14}>Ele ilumina</Tag></Reveal>
      <Reveal T={T} at={30.9} out={32.6} dir="zoom"><Plate size={130}>o próximo passo</Plate></Reveal>
    </Pos>

    {/* ABRAÃO */}
    <Chapter T={T} at={32.9} out={36.2} name="Abraão" refx="Hebreus 11:8" />
    <Scrim T={T} a={38.4} b={40.4} k={0.45} />
    <Pos y={420}>
      <Reveal T={T} at={36.63} out={38.3}><Tag size={42} track={12}>Ele não tinha um mapa.</Tag></Reveal>
      <Reveal T={T} at={38.47} out={40.3} dir="zoom"><Big size={150}>Tinha uma promessa.</Big></Reveal>
    </Pos>

    {/* MOISÉS */}
    <Chapter T={T} at={40.6} out={44.5} name="Moisés" refx="Êxodo 14" />
    <Scrim T={T} a={44.8} b={46.4} k={0.4} at="50% 80%" />
    <Pos y={870}><Reveal T={T} at={44.8} out={46.35}><Tag size={46} track={16}>Não havia saída.</Tag></Reveal></Pos>
    <Flash T={T} at={46.45} k={0.8} d={0.45} />
    <Scrim T={T} a={47.2} b={50.2} k={0.55} at="50% 75%" />
    <Pos y={720}>
      <Reveal T={T} at={47.3} out={50.1}><Tag size={40} track={12}>Deus abriu um caminho</Tag></Reveal>
      <Reveal T={T} at={48.3} out={50.1} dir="zoom"><Big size={120}>onde ninguém via caminho</Big></Reveal>
    </Pos>

    {/* PEDRO */}
    <Chapter T={T} at={50.45} out={53.8} name="Pedro" refx="Mateus 14:29" />
    <Scrim T={T} a={57.6} b={61.8} k={0.55} at="50% 75%" />
    <Pos y={700}>
      <Reveal T={T} at={57.7} out={61.7}><Tag size={40} track={12}>A confiança só é real</Tag></Reveal>
      <Reveal T={T} at={59.3} out={61.7} dir="zoom"><Plate size={120}>quando vira atitude</Plate></Reveal>
    </Pos>

    {/* O SIGNIFICADO */}
    <Scrim T={T} a={62.0} b={66.8} k={0.5} at="50% 25%" />
    <Pos y={140}>
      <Reveal T={T} at={62.0} out={66.6}><Tag size={38} track={12}>Confiar não é ter todas as respostas.</Tag></Reveal>
      <Reveal T={T} at={65.0} out={66.6} dir="zoom"><Big size={150}>É soltar o controle.</Big></Reveal>
    </Pos>
    <Scrim T={T} a={69.4} b={72.8} k={0.5} at="50% 20%" />
    <Pos y={150}><Reveal T={T} at={69.6} out={72.6}><Tag size={40} track={12}>Siga a direção de quem conhece o caminho</Tag></Reveal></Pos>

    {/* A PERGUNTA — monumental, respira */}
    <Scrim T={T} a={73.0} b={79.3} k={0.35} at="50% 30%" />
    <Pos y={120}>
      <Reveal T={T} at={73.07} out={79.1} dur={0.9}><Tag size={44} track={16}>Se você não consegue</Tag></Reveal>
      <Reveal T={T} at={73.9} out={79.1} dur={1.1} dir="zoom"><Big size={168} track={4}>enxergar o caminho,</Big></Reveal>
      <div style={{height: 26}} />
      <Reveal T={T} at={75.96} out={79.1} dur={0.9}><Tag size={44} track={16}>consegue confiar em quem</Tag></Reveal>
      <Reveal T={T} at={77.0} out={79.1} dur={1.1} dir="zoom"><Plate size={120}>está à sua frente?</Plate></Reveal>
    </Pos>

    {/* ENCERRAMENTO */}
    <Scrim T={T} a={79.5} b={82.7} k={0.55} at="70% 50%" />
    <Pos y={330} align="left" x={980}>
      <Reveal T={T} at={79.55} out={82.6} dir="left"><Tag size={40} track={12}>Você não precisa saber</Tag></Reveal>
      <Reveal T={T} at={80.4} out={82.6} dir="left"><Big size={120}>tudo sobre</Big></Reveal>
      <Reveal T={T} at={81.3} out={82.6} dir="left"><Big size={170} color={C.lime}>o amanhã.</Big></Reveal>
    </Pos>
    <Scrim T={T} a={82.8} b={86.1} k={0.55} at="50% 40%" />
    <Pos y={250}>
      <Reveal T={T} at={82.8} out={86.0}><Tag size={48} track={14}>Precisa saber em quem está</Tag></Reveal>
    </Pos>
    <Flash T={T} at={84.25} k={0.45} d={0.5} />
    <Pos y={360}>
      <Reveal T={T} at={84.25} out={86.0} dur={0.7} dir="zoom"><Plate size={230} px={60}>confiando!</Plate></Reveal>
    </Pos>
  </>);
};

/* IDENTIDADE FINAL */
const Identity: React.FC = () => {
  const T = 86.0 + useCurrentFrame() / FPS;
  const bg = pa(T, 86.0, 0.9, E.inOut); const wm = pa(T, 86.25, 1.0, E.out); const cf = pa(T, 91.55, 0.9, E.back ?? E.out);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: bg * 0.88, background: 'radial-gradient(ellipse 80% 90% at 50% 42%, #2F78FF 0%, #2368F2 40%, #1245C9 75%, #0A2A93 100%)'}} />
      <Beam x={960} y={-200} angle={0} length={1500} width={900} opacity={0.18 * bg} />
      <Motes T={T} n={70} color="#FFFFFF" size={4} vy={-18} vx={5} opacity={0.5 * bg} />
      <div style={{position: 'absolute', left: 110, top: 70, display: 'flex', gap: 18, alignItems: 'center', opacity: pa(T, 86.4, 0.8)}}>
        <Logo w={100} />
        <div><Tag size={17} track={6}>Ministério Jovem</Tag><Tag size={17} track={6}>Ágape Teen</Tag><div style={{width: 70, height: 6, background: C.lime, marginTop: 8}} /></div>
      </div>
      <Pos y={130}>
        <Img src={staticFile('images/wordmark.png')} style={{width: 640, opacity: wm, transform: `scale(${lerp(0.92, 1, wm)})`, filter: 'drop-shadow(0 10px 0 rgba(6,26,102,0.4))'}} />
        <Reveal T={T} at={86.3}><Tag size={34} track={10} style={{marginTop: 6}}>Semana de Oração Jovem <span style={{color: C.lime}}>2026</span></Tag></Reveal>
      </Pos>
      <Pos y={570}>
        <Reveal T={T} at={89.8}><div style={{display: 'flex', alignItems: 'center', gap: 20}}><div style={{width: 100, height: 7, background: C.lime}} /><Tag size={34} track={16}>noite 04</Tag><div style={{width: 100, height: 7, background: C.lime}} /></div></Reveal>
        {T > 91.55 && <div style={{marginTop: 18, transform: `scale(${lerp(1.3, 1, cf)})`, opacity: clamp(cf * 2)}}><Big size={200} style={{textShadow: '0 0 60px rgba(255,255,255,0.5), 0 8px 0 rgba(6,26,102,0.45)'}}>Confiança</Big></div>}
      </Pos>
    </AbsoluteFill>
  );
};

const Atmosphere: React.FC = () => {
  const T = useCurrentFrame() / FPS;
  const fogK = (a: number, b: number) => Math.min(pa(T, a, 1.2), 1 - pa(T, b - 1, 1));
  return (<>
    {/* neblina em camadas nos planos de estrada/escolha */}
    <AbsoluteFill style={{opacity: Math.max(fogK(14.55, 32.7), fogK(69.3, 79.35))}}><Fog T={T} y={0.7} opacity={0.35} speed={18} /></AbsoluteFill>
    {/* poeira na luz: quarto, mão, bússola, pergunta */}
    <AbsoluteFill style={{opacity: Math.max(fogK(0, 10.8), fogK(61.85, 69.3))}}><Motes T={T} n={40} size={3} vy={-6} vx={3} opacity={0.35} /></AbsoluteFill>
    <AbsoluteFill style={{opacity: fogK(22.35, 32.7)}}><Motes T={T} n={50} size={3} vy={8} vx={2} area={[660, 0, 600, 1080]} opacity={0.5} glow /></AbsoluteFill>
    <AbsoluteFill style={{opacity: fogK(72.85, 79.35)}}><Motes T={T} n={60} size={3} vy={6} vx={2} area={[700, 0, 520, 1080]} opacity={0.55} glow /></AbsoluteFill>
    <AbsoluteFill style={{opacity: fogK(82.75, 93.3)}}><Motes T={T} n={50} size={4} vy={-10} vx={4} opacity={0.4} /></AbsoluteFill>
  </>);
};

const Fades: React.FC = () => {
  const f = useCurrentFrame();
  const a = 1 - clamp(f / 30); const b = clamp((f - (TOTAL_FRAMES - 12)) / 12);
  // mergulho no escuro antes da pergunta
  const T = f / FPS; const q = Math.max(0, Math.min(pa(T, 72.35, 0.5, E.in), 1 - pa(T, 72.85, 0.9, E.out)));
  return <AbsoluteFill style={{background: '#01051A', opacity: Math.max(a, b, q * 0.85), pointerEvents: 'none'}} />;
};

export const Main: React.FC<{audio: boolean}> = ({audio}) => {
  loadFonts();
  return (
    <AbsoluteFill style={{background: '#01051A'}}>
      {SHOTS.map((s, i) => {
        const fd = s.fade ?? 0; const from = fr(s.a - fd);
        return <Sequence key={i} from={from} durationInFrames={fr(s.b + 0.02) - from}><ShotView s={s} /></Sequence>;
      })}
      <Atmosphere />
      <Vignette k={0.55} />
      <Overlays />
      <Sequence from={fr(86.0)}><Identity /></Sequence>
      <Grain opacity={0.12} />
      <Fades />
      {audio && <Audio src={staticFile('audio/mix_final.wav')} />}
    </AbsoluteFill>
  );
};
