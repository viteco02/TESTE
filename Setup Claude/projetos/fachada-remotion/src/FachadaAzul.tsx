import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import S from './semana.json';
const ATUAL = S.atual, ANT = S.anterior, META = S.meta, ENTROU = ATUAL - ANT, FALTA = Math.max(0, META - ATUAL), FRAC = ATUAL / META;
const pctTxt = (v: number) => v.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});

const FPS = 30, W = 1920, H = 1080, DUR = 32;
// branco predominante, azul-marinho nos detalhes (dourado só como faísca)
const C = {bg: '#FFFFFF', paper: '#F4F7FD', navy: '#0B2257', navy2: '#163A8C', line: '#C9D5EE', gold: '#F2B51C', mute: '#6B7A99'};
const SANS = "'Montserrat', sans-serif", NUM = "'Anton', sans-serif", UI = "'Inter', sans-serif";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eo = Easing.bezier(0.16, 1, 0.3, 1), eio = Easing.bezier(0.65, 0, 0.35, 1), ei = Easing.bezier(0.5, 0, 0.75, 0), eb = Easing.bezier(0.34, 1.56, 0.64, 1);
const pa = (T: number, s: number, d: number, e = eo) => e(clamp((T - s) / d));
const win = (T: number, a: number, b: number, fi = 0.4, fo = 0.35) => Math.min(pa(T, a, fi), 1 - pa(T, b - fo, fo, ei));
const brl = (v: number, dec = 2) => 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits: dec, maximumFractionDigits: dec});
const rand = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* fundo: branco com malha de gradiente azul animada (moderno) + granulado */
const Bg: React.FC<{T: number}> = ({T}) => {
  const b = (cx: number, cy: number, r: number, c: string, a: number, sp: number, ph: number) => {
    const x = cx + Math.sin(T * sp + ph) * 7, y = cy + Math.cos(T * sp * 0.8 + ph) * 6;
    return `radial-gradient(circle at ${x}% ${y}%, ${c.replace('A', String(a))} 0%, transparent ${r}%)`; };
  return (<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #0E2A66 0%, #071840 55%, #030B22 100%)'}}>
    <AbsoluteFill style={{background: [b(2, 4, 42, 'rgba(37,99,235,A)', 0.75, 0.35, 0), b(100, 2, 30, 'rgba(127,168,255,A)', 0.35, 0.3, 2), b(98, 100, 44, 'rgba(37,99,235,A)', 0.7, 0.28, 4), b(0, 100, 30, 'rgba(22,58,140,A)', 0.8, 0.33, 1)].join(','), filter: 'blur(40px)'}} />
  </AbsoluteFill>);
};
const Grain: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'screen', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '480px', backgroundPosition: `${rand(Math.floor(f / 2)) * 400}px ${rand(Math.floor(f / 2) + 7) * 400}px`}} />;
/* transição: lâminas diagonais azul-marinho que varrem a tela */
const Swipe: React.FC<{T: number; t: number}> = ({T, t}) => {
  const p = clamp((T - (t - 0.35)) / 0.7); if (p <= 0 || p >= 1) return null;
  return (<AbsoluteFill style={{pointerEvents: 'none'}}>{[0, 1, 2].map((i) => { const q = eio(clamp(p * 1.3 - i * 0.12)); const x = lerp(-140, 140, q);
    return <div key={i} style={{position: 'absolute', top: '-20%', bottom: '-20%', left: `${x - 30 + i * 6}%`, width: `${i === 1 ? 70 : 18}%`, transform: 'skewX(-18deg)',
      background: i === 1 ? 'linear-gradient(90deg, #FFFFFF, #DCE7FF)' : i === 0 ? '#7FA8FF' : '#2563EB'}} />; })}</AbsoluteFill>);
};
const Grid: React.FC<{k: number; x?: number; y?: number; w?: number; h?: number; step?: number; id?: string}> = ({k, x = 0, y = 0, w = W, h = H, step = 70, id = 'g'}) => (
  <svg style={{position: 'absolute', left: x, top: y, opacity: k}} width={w} height={h}>
    <defs><radialGradient id={id + 'r'}><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient><mask id={id + 'm'}><rect width={w} height={h} fill={`url(#${id}r)`} /></mask></defs>
    <g mask={`url(#${id}m)`} stroke="rgba(255,255,255,0.10)" strokeWidth={1.2}>
      {Array.from({length: Math.ceil(w / step) + 1}).map((_, i) => <line key={'v' + i} x1={i * step} y1={0} x2={i * step} y2={h} />)}
      {Array.from({length: Math.ceil(h / step) + 1}).map((_, i) => <line key={'h' + i} x1={0} y1={i * step} x2={w} y2={i * step} />)}
    </g></svg>
);
/* legenda pequena centralizada (a "voz" do vídeo) */
const Cap: React.FC<{T: number; a: number; b: number; children: React.ReactNode; y?: number; size?: number; color?: string}> = ({T, a, b, children, y = 170, size = 34, color = C.navy}) => {
  const k = win(T, a, b, 0.45, 0.3); if (k <= 0) return null; const p = pa(T, a, 0.5);
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: k, transform: `translateY(${(1 - p) * 18}px)`, filter: `blur(${(1 - p) * 6}px)`}}>
    <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: size * 0.06, color: size < 40 ? C.navy : '#fff', background: size < 40 ? '#fff' : 'transparent',
      padding: size < 40 ? '8px 20px' : 0, borderRadius: 999, boxShadow: size < 40 ? '0 0 30px rgba(127,168,255,0.55)' : 'none'}}>{children}</span></div>;
};
/* palavra grande que "estala" */
const Pop: React.FC<{T: number; a: number; b: number; children: React.ReactNode; y?: number; size?: number; italic?: boolean; color?: string}> = ({T, a, b, children, y = 220, size = 120, italic, color = C.navy}) => {
  const k = win(T, a, b, 0.2, 0.3); if (k <= 0) return null; const p = pa(T, a, 0.45, eb);
  const chars = String(children).split('');
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: k, paddingBottom: size * 0.12, whiteSpace: 'nowrap'}}>
    {chars.map((c, i) => { const q = pa(T, a + i * 0.035, 0.55, eb); const o = clamp((T - a - i * 0.035) * 6);
      return <span key={i} style={{display: 'inline-block', opacity: o, transform: `translateY(${(1 - q) * -70}px) scale(${lerp(1.6, 1, q)})`, filter: `blur(${(1 - clamp(q * 1.2)) * 10}px)`,
        fontFamily: SANS, fontStyle: italic ? 'italic' : 'normal', fontWeight: 900, fontSize: size, letterSpacing: -3, lineHeight: 1, color: '#fff', textShadow: '0 0 40px rgba(127,168,255,0.75), 0 0 12px rgba(255,255,255,0.35)', whiteSpace: 'pre'}}>{c}</span>; })}</div>;
};

/* o personagem (cabeça redonda + corpo), como na referência: reage à história */
const Buddy: React.FC<{T: number; x: number; y: number; s?: number; mood: number; look: number; k: number}> = ({T, x, y, s = 1, mood, look, k}) => {
  const blink = (T % 3.1) < 0.12 ? 0.15 : 1; const bob = Math.sin(T * 2.2) * 4;
  return (<g transform={`translate(${x},${y + bob}) scale(${s})`} opacity={k}>
    <defs><radialGradient id="hd" cx="40%" cy="35%"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#DCE5F7" /></radialGradient>
      <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#163A8C" /><stop offset="0.7" stopColor="#0B2257" /><stop offset="1" stopColor="#0B2257" stopOpacity="0" /></linearGradient></defs>
    <ellipse cx={0} cy={330} rx={260} ry={40} fill="rgba(37,99,235,0.25)" style={{filter: "blur(20px)"}} /><path d="M-190,330 Q-190,95 0,95 Q190,95 190,330 Z" fill="url(#bd)" />
    <circle cx={0} cy={-20} r={92} fill="url(#hd)" stroke={C.navy} strokeWidth={5} style={{filter: "drop-shadow(0 18px 30px rgba(22,58,140,0.35))"}} />
    <g transform={`translate(${look * 18},0)`}>
      <ellipse cx={-30} cy={-34} rx={11} ry={15 * blink * (mood > 0.5 ? 0.6 : 1)} fill={C.navy} />
      <ellipse cx={30} cy={-34} rx={11} ry={15 * blink * (mood > 0.5 ? 0.6 : 1)} fill={C.navy} />
      {mood > 0.5
        ? <path d={`M-28,8 Q0,${8 + 26 * mood} 28,8`} fill="none" stroke={C.navy} strokeWidth={6} strokeLinecap="round" />
        : <line x1={-14} y1={14} x2={14} y2={14} stroke={C.navy} strokeWidth={6} strokeLinecap="round" />}
    </g>
  </g>);
};

/* cartão de vidro */
const Glass: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 32, background: 'linear-gradient(160deg, rgba(127,168,255,0.22), rgba(255,255,255,0.05))', backdropFilter: 'blur(24px)',
    border: '1.5px solid rgba(255,255,255,0.35)', outline: '1px solid rgba(127,168,255,0.25)', outlineOffset: -1,
    boxShadow: '0 40px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.4)', overflow: 'hidden', ...style}}>{children}</div>
);

export const FachadaAzul: React.FC = () => {
  loadFonts();
  const f = useCurrentFrame(); const T = f / FPS;
  const s1 = win(T, 0.1, 2.7, 0.3, 0.35);
  const bud = win(T, 2.7, 13.6, 0.5, 0.4);
  const budX = T < 6.4 ? 960 : lerp(960, 1450, pa(T, 6.3, 0.8, eio));
  const mood = T < 10.6 ? 0 : pa(T, 10.6, 0.5);
  const look = T < 6.6 ? 0 : T < 13 ? -1 : 0;
  const cardIn = pa(T, 6.6, 0.7, eb); const brk = pa(T, 9.9, 0.55, eio); const reveal = pa(T, 10.2, 0.7, eo);
  const cardOut = 1 - pa(T, 13.3, 0.35, ei);
  const meta = META * pa(T, 14.2, 1.4, eio);
  const grow = pa(T, 17.8, 3.2, eio); const cur = ATUAL * grow; const pct = (cur / META) * 100;
  const ch = win(T, 16.7, 23.8, 0.6, 0.4);
  const crowd = win(T, 23.4, 27.2, 0.5, 0.4);
  const cw = 760, chh = 520, cx0 = 300, cy0 = 300;
  const pw = cw + 80, ph = pw * 1160 / 2290 + 32;
  return (
    <AbsoluteFill style={{background: '#061A3A', overflow: 'hidden'}}>
      <Bg T={T} />
      <Grid k={0.9 * Math.max(win(T, 0, 2.8), win(T, 27.0, DUR + 1, 0.6, 0.6))} id="g0" />

      {/* 1 · atualização do FACHADÔMETRO */}
      {s1 > 0 && <AbsoluteFill style={{opacity: s1}}>
        <Cap T={T} a={0.2} b={2.7} y={390}>ATUALIZAÇÃO DO</Cap>
        <Pop T={T} a={0.65} b={2.7} y={450} size={150} italic>FACHADÔMETRO</Pop>
        <div style={{position: 'absolute', left: 960 - 330, top: 640, width: 660 * pa(T, 1.1, 0.7, eio), height: 8, borderRadius: 4, background: '#fff', boxShadow: '0 0 20px rgba(127,168,255,0.9)'}} />
        <div style={{position: 'absolute', left: 960 - 330 + 660 * pa(T, 1.1, 0.7, eio) - 8, top: 636, width: 16, height: 16, borderRadius: 8, background: C.gold, opacity: pa(T, 1.1, 0.2)}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', opacity: pa(T, 1.5, 0.5), transform: `translateY(${(1 - pa(T, 1.5, 0.5)) * 16}px)`}}><span style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#AFC3EA'}}>{S.data}</span></div>
      </AbsoluteFill>}

      {/* 2 · o lançamento: render em tela cheia */}
      {T > 2.6 && T < 6.6 && (() => { const k = win(T, 2.65, 6.6, 0.05, 0.35); const z = lerp(1.18, 1.05, pa(T, 2.7, 4.0, eio));
        return (<AbsoluteFill style={{opacity: k}}>
          <Img src={staticFile('images/fachada.jpg')} style={{position: 'absolute', width: W, height: H, objectFit: 'cover', transform: `scale(${z}) translateX(${(1 - pa(T, 2.7, 4.0, eio)) * 30}px)`}} />
          <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(6,26,58,0.97) 0%, rgba(6,26,58,0.9) 36%, rgba(6,26,58,0.2) 64%, transparent 78%)'}} />
          <div style={{position: 'absolute', left: 120, top: 330}}>
            <div style={{opacity: pa(T, 2.9, 0.4)}}><span style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: C.navy, background: '#fff', padding: '8px 20px', borderRadius: 999}}>NESTA SEMANA</span></div>
            {['ENTRARAM', '+ ' + brl(ENTROU * pa(T, 3.6, 1.4, eio)), 'PRA NOVA FACHADA'].map((l, i) => { const p = pa(T, 3.3 + i * 0.18, 0.6); const big = i === 1;
              return <div key={i} style={{overflow: 'hidden', marginTop: i ? 0 : 22}}><div style={{transform: `translateY(${(1 - p) * 110}%)`, fontFamily: big ? NUM : SANS, fontWeight: big ? 400 : 900, fontSize: big ? 150 : 84, lineHeight: big ? 1.05 : 1.02, letterSpacing: big ? 0 : -3, fontVariantNumeric: 'tabular-nums',
                color: big ? C.gold : '#fff', textShadow: big ? '0 0 40px rgba(242,181,28,0.45)' : '0 0 30px rgba(127,168,255,0.5)'}}>{l}</div></div>; })}
            <div style={{width: 120 * pa(T, 4.2, 0.6, eio), height: 8, borderRadius: 4, background: C.gold, marginTop: 26}} />
          </div>
        </AbsoluteFill>); })()}

      {/* 3/4 · antes e depois: régua deslizante */}
      {T > 6.4 && T < 13.75 && (() => {
        const k = win(T, 6.45, 13.75, 0.05, 0.4); const bw = 1440, bh = 760, bx = (W - bw) / 2, by = 200;
        const s = T < 9.6 ? 1 : lerp(1, 0, pa(T, 9.6, 1.6, eio));  // posição da régua: 1 = só "hoje"; 0 = só "projeto"
        const peek = T > 8.4 && T < 9.6 ? 0.18 * Math.sin(clamp((T - 8.4) / 1.2) * Math.PI) : 0; const sx = clamp(s - peek);
        const cut = bx + bw * sx; const tilt = Math.sin(T * 0.5) * 1.2;
        return (<AbsoluteFill style={{opacity: k}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', opacity: pa(T, 6.6, 0.4)}}>
            <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: '#fff', textShadow: '0 0 30px rgba(127,168,255,0.6)'}}>{T < 10.2 ? 'Como ela é hoje…' : 'Como ela vai ficar.'}</span></div>
          <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, perspective: 1600}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: 32, overflow: 'hidden', transform: `rotateY(${tilt}deg) rotateX(${(1 - pa(T, 6.5, 0.9, eb)) * 70}deg) scale(${lerp(0.85, 1, pa(T, 6.5, 0.7, eo))})`, transformOrigin: '50% 100%', boxShadow: '0 50px 120px rgba(0,0,0,0.55), 0 0 80px rgba(37,99,235,0.35)', border: '6px solid #fff'}}>
              <Img src={staticFile('images/fachada.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${lerp(1.08, 1, pa(T, 9.6, 3.5, eio))})`}} />
              <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - sx) * 100}% 0 0)`}}>
                <Img src={staticFile('images/hoje.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 38%', filter: 'saturate(0.8) contrast(1.05)'}} />
              </div>
              {sx > 0.02 && <div style={{position: 'absolute', left: 28, top: 28, padding: '10px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.9)', fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: C.navy, opacity: clamp(sx * 4)}}>HOJE</div>}
              {sx < 0.98 && <div style={{position: 'absolute', right: 28, top: 28, padding: '10px 24px', borderRadius: 999, background: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: C.navy, opacity: clamp((1 - sx) * 4)}}>O PROJETO</div>}
            </div>
            {sx > 0.002 && sx < 0.998 && <div style={{position: 'absolute', left: cut - bx - 3, top: -20, bottom: -20, width: 6, background: '#fff', boxShadow: '0 0 30px rgba(11,34,87,0.5)'}}>
              <div style={{position: 'absolute', left: -32, top: bh / 2 - 12, width: 70, height: 70, borderRadius: 35, background: C.navy, border: '5px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 30}}>‹ ›</div>
            </div>}
          </div>
        </AbsoluteFill>); })()}

      {/* 5 · meta */}
      {T > 13.6 && T < 16.9 && <AbsoluteFill style={{opacity: win(T, 13.55, 16.95, 0.05, 0.05)}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <circle cx={960} cy={545} r={330} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
          <circle cx={960} cy={545} r={330} fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" transform="rotate(-90 960 545)"
            strokeDasharray={`${2 * Math.PI * 330 * Math.max(0.004, FRAC * pa(T, 14.9, 1.2, eio))} 9999`} style={{filter: 'drop-shadow(0 0 14px rgba(127,168,255,0.95))'}} />
          {pa(T, 14.9, 1.2) > 0 && (() => { const a = -Math.PI / 2 + 2 * Math.PI * FRAC * pa(T, 14.9, 1.2, eio); return <circle cx={960 + 330 * Math.cos(a)} cy={545 + 330 * Math.sin(a)} r={16} fill={C.gold} stroke="#fff" strokeWidth={5} />; })()}
        </svg>
        <div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', opacity: pa(T, 15.2, 0.5), fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: '#AFC3EA'}}>{pctTxt(FRAC * 100)}% ALCANÇADO</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', opacity: pa(T, 13.8, 0.4)}}><span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.navy, background: '#fff', padding: '8px 22px', borderRadius: 999}}>NOSSA META</span></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: NUM, fontSize: 240, color: '#fff', textShadow: '0 0 60px rgba(127,168,255,0.6)', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', transform: `scale(${lerp(0.85, 1, pa(T, 13.9, 0.5, eb))})`}}>{brl(Math.round(meta))}</div>
      </AbsoluteFill>}

      {/* 6 · o gráfico subindo (cartão de vidro com grade, contador e barra, como na referência) */}
      {ch > 0 && (() => {
        const gx = 560, gy = 230, gw = 800, gh = 470; const lift = crowd * -40;
        const Yf = (t: number) => gy + gh - 70 - (Math.pow(t, 1.6) * 0.75 + 0.05 * Math.sin(t * 9)) * (gh - 170);
        const pts = (g: number) => { let d = ''; for (let i = 0; i <= 50; i++) { const t = (i / 50) * g; d += (i ? 'L' : 'M') + (gx + 40 + t * (gw - 80)).toFixed(1) + ',' + Yf(t).toFixed(1); } return d; };
        const ex = gx + 40 + grow * (gw - 80), ey = Yf(grow);
        const k6 = 1 - crowd;
        return (<AbsoluteFill style={{opacity: ch, transform: `translateY(${lift}px) scale(${lerp(1, 0.8, crowd)})`, transformOrigin: '50% 40%'}}>
          <div style={{opacity: k6}}><Cap T={T} a={16.8} b={23.6} y={110}>DESDE O LANÇAMENTO…</Cap></div>
          <Glass x={gx} y={gy} w={gw} h={gh} style={{transform: `scale(${lerp(0.9, 1, pa(T, 16.8, 0.6, eb))})`}} />
          <Grid k={0.9} x={gx} y={gy} w={gw} h={gh} step={50} id="g6" />
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <defs><linearGradient id="ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7FA8FF" /><stop offset="1" stopColor="#FFFFFF" /></linearGradient><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FA8FF" stopOpacity="0.35" /><stop offset="1" stopColor="#7FA8FF" stopOpacity="0" /></linearGradient></defs>
            {grow > 0 && <path d={pts(grow) + ` L${ex},${gy + gh - 40} L${gx + 40},${gy + gh - 40} Z`} fill="url(#ar)" />}
            {grow > 0 && <path d={pts(grow)} fill="none" stroke="url(#ln)" style={{filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))"}} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
            {grow > ANT / ATUAL && (() => { const t0 = ANT / ATUAL, mx = gx + 40 + t0 * (gw - 80), my = Yf(t0); const q = pa(T, 17.8 + 3.2 * t0, 0.4);
              return <g opacity={q}><circle cx={mx} cy={my} r={9} fill={C.gold} stroke="#fff" strokeWidth={4} />
                <text x={mx} y={my + 48} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={20} fill="#AFC3EA">semana passada</text>
                <text x={mx} y={my + 74} textAnchor="middle" fontFamily="Anton" fontSize={26} fill="#fff">{brl(ANT)}</text></g>; })()}
            {grow > 0 && <circle cx={ex} cy={ey} r={13} fill="#fff" stroke="#7FA8FF" strokeWidth={5} style={{filter: "drop-shadow(0 0 12px #fff)"}} />}
            {grow > 0 && [0, 1].map((i) => { const r = ((T * 0.8 + i / 2) % 1); return <circle key={i} cx={ex} cy={ey} r={13 + r * 50} fill="none" stroke="#fff" strokeWidth={2} opacity={1 - r} />; })}
          </svg>
          <div style={{position: 'absolute', left: gx + 44, top: gy + 34}}>
            <div style={{fontFamily: UI, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: '#AFC3EA'}}>arrecadado</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <svg width={44} height={44} viewBox="0 0 44 44"><circle cx={22} cy={22} r={19} fill="none" stroke="#fff" strokeWidth={3.5} /><text x={22} y={30} textAnchor="middle" fontFamily={NUM} fontSize={24} fill="#fff">$</text></svg>
              <div style={{fontFamily: NUM, fontSize: 84, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 30px rgba(127,168,255,0.7)'}}>{brl(cur)}</div>
            </div>
            <div style={{width: 120, height: 6, borderRadius: 3, background: C.gold, marginTop: 8}} />
          </div>
          <div style={{position: 'absolute', left: gx, top: gy + gh + 40, width: gw, opacity: k6}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 12}}>
              <span>{pctTxt(pct)}% da meta</span><span style={{color: '#AFC3EA'}}>{brl(META, 0)}</span></div>
            <div style={{height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.25)', overflow: 'hidden'}}>
              <div style={{width: `${Math.max(pct, 0.8)}%`, height: '100%', background: 'linear-gradient(90deg, #7FA8FF, #FFFFFF)', borderRadius: 15, boxShadow: '0 0 18px rgba(255,255,255,0.8)'}} />
            </div>
          </div>
        </AbsoluteFill>);
      })()}

      {/* 7 · o quanto já conquistamos, na própria fachada (cor = arrecadado) */}
      {crowd > 0 && (() => { const bw = 1300, bh = bw * 1160 / 2290, bx = (W - bw) / 2, by = 250; const fill = FRAC * pa(T, 24.3, 1.2, eio);
        const ghost = T > 25.6 ? Math.sin(clamp((T - 25.6) / 1.4) * Math.PI) : 0;
        return (<AbsoluteFill style={{opacity: crowd, background: 'rgba(6,26,58,0.94)'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center'}}>
            <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 60, letterSpacing: -2, color: '#fff'}}>Ainda faltam <span style={{fontFamily: NUM, fontWeight: 400, letterSpacing: 0, color: C.gold}}>{brl(Math.round(FALTA * pa(T, 23.8, 1.0, eio)))}</span></span></div>
          <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, borderRadius: 30, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 50px 110px rgba(0,0,0,0.5), 0 0 80px rgba(37,99,235,0.35)'}}>
            <Img src={staticFile('images/fachada.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(0.55) contrast(0.9)', opacity: 1}} />
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - Math.max(fill, ghost)) * 100}% 0 0)`, opacity: Math.max(fill > 0 ? 1 : 0, ghost) * (ghost > fill ? 0.35 + 0.65 * (ghost < 0.05 ? 1 : 0.5) : 1)}}>
              <Img src={staticFile('images/fachada.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} /></div>
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`}}>
              <Img src={staticFile('images/fachada.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} /></div>
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${fill * 100}%`, width: 5, background: C.gold, boxShadow: `0 0 20px ${C.gold}`}} />
          </div>
          <div style={{position: 'absolute', left: bx, top: by + bh + 30, width: bw, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff'}}>{pctTxt(fill * 100)}% já é nosso</span>
            <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#AFC3EA', opacity: pa(T, 25.4, 0.5)}}>{ghost > 0.05 ? 'imagine quando chegar a 100%…' : 'cada oferta pinta mais um pedaço dela'}</span>
          </div>
        </AbsoluteFill>); })()}

      {/* 8 · fechamento */}
      {T > 27 && <AbsoluteFill style={{opacity: pa(T, 27.1, 0.5)}}>
        <Cap T={T} a={27.2} b={DUR + 1} y={330}>TODOS OS SÁBADOS</Cap>
        <Pop T={T} a={27.7} b={DUR + 1} y={390} size={110}>CONTINUE PARTICIPANDO!</Pop>
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: pa(T, 28.6, 0.5), transform: `translateY(${(1 - pa(T, 28.6, 0.5)) * 20}px)`}}>
          <Img src={staticFile('images/logo_branco.png')} style={{height: 120}} />
          <div style={{width: 3, height: 90, background: 'rgba(255,255,255,0.35)'}} />
          <div style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'italic', fontSize: 50, color: '#fff', lineHeight: 1}}>FACHADÔMETRO<div style={{fontStyle: 'normal', fontWeight: 700, fontSize: 24, letterSpacing: 6, color: '#AFC3EA', marginTop: 8}}>IASD PARQUE VITÓRIA</div></div>
        </div>
      </AbsoluteFill>}

      {[2.7, 6.45, 13.6, 16.95, 23.5, 27.0].map((t) => <Swipe key={t} T={T} t={t} />)}
      <Grain f={f} />
      <AbsoluteFill style={{background: '#030B22', opacity: pa(T, DUR - 0.6, 0.6)}} />
    </AbsoluteFill>
  );
};
