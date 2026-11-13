import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import plan from './plan.json';

export const FPS = 30, W = 1080, H = 1920;
const LIME = '#C8FF2E', BLUE = '#2368F2', DEEP = '#0B2A8C';
const SANS = "'Inter Tight', 'Inter', Arial, sans-serif", SERIF = "'Instrument Serif', Georgia, serif";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eo = Easing.bezier(0.16, 1, 0.3, 1), eio = Easing.bezier(0.65, 0, 0.35, 1), ei = Easing.bezier(0.5, 0, 0.75, 0);
const pa = (T: number, s: number, d: number, e = eo) => e(clamp((T - s) / d));
const rand = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type Word = {w: string; t: number};
type Box = {t0: number; t1: number; ref: string; sub: string; text: string};
type Card = {t: number; n: string; lbl: string; word: string};
type Big = {text: string; t0: number; t1: number; size: number; serif?: boolean};
type Ilu = {src: string; t0: number; t1: number; z0: number; z1: number; x0: number; x1: number};
type Plan = {dur: number; hook: number; words: Word[]; keys: Record<string, string>; under: string[]; face: {t: number[]; x: number[]; y: number[]}; endcard: number;
  boxes: Box[]; cards: Card[]; big: Big[]; ilus: Ilu[]; flashes: number[]; shots: {t: number; z: number}[]};
const P = plan as unknown as Plan;
export const TOTAL = P.dur + P.endcard;

const interp = (ts: number[], vs: number[], t: number) => {
  if (t <= ts[0]) return vs[0]; if (t >= ts[ts.length - 1]) return vs[vs.length - 1];
  let lo = 0, hi = ts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  return vs[lo] + (vs[hi] - vs[lo]) * (t - ts[lo]) / (ts[hi] - ts[lo]);
};
const smooth = (ts: number[], vs: number[], t: number, win: number) => { let s = 0; for (let k = -8; k <= 8; k++) s += interp(ts, vs, t + (k / 8) * win); return s / 17; };

/* frases: quebra na pontuação, pausa ou 6 palavras */
const groups = (words: Word[]) => {
  const g: Word[][] = []; let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= 6 || (prev && w.t - prev.t > 0.55) || /[.,?!:…]$/.test(prev?.w ?? ''))) { g.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) g.push(cur); return g;
};

/* LEGENDA EDITORIAL: palavras-chave em serifada itálica grande em linha própria; destaque sublinhado */
const Captions: React.FC<{T: number; hidden: boolean}> = ({T, hidden}) => {
  const G = React.useMemo(() => groups(P.words.filter((w) => w.t >= P.hook - 0.05)), []);
  const gi = G.findIndex((g, i) => T >= g[0].t - 0.05 && (i === G.length - 1 || T < G[i + 1][0].t - 0.05));
  if (hidden || gi < 0 || T > P.dur) return null;
  const g = G[gi]; const last = g[g.length - 1]; if (T > last.t + 0.8) return null;
  if (P.cards.some((c) => T >= c.t - 0.05 && T < c.t + 1.6)) return null;
  const many = g.length >= 3;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1240, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 18, rowGap: 0}}>
      {g.map((w, k) => {
        const p = pa(T, w.t - 0.05, 0.28); const st = P.keys[w.w]; const key = !!st;
        const txt = w.w.replace(/[,:…]+$/, ''); const under = P.under.includes(w.w);
        const u = under ? pa(T, w.t + 0.25, 0.4, eio) : 0;
        const big = key && many;
        const sz = key ? (big ? 128 : 104) : 60;
        return (
          <span key={k} style={{display: 'inline-block', flexBasis: big ? '100%' : 'auto', textAlign: 'center', position: 'relative', opacity: T < w.t - 0.05 ? 0 : p,
            transform: `translateY(${(1 - p) * 22}px) scale(${lerp(key ? 1.25 : 0.92, 1, p)})`, filter: `blur(${(1 - p) * 8}px)`,
            fontFamily: key ? SERIF : SANS, fontStyle: key ? 'italic' : 'normal', fontWeight: key ? 400 : 800, fontSize: sz, lineHeight: key ? 0.98 : 1.08, letterSpacing: key ? -1 : -1.6,
            color: st === 'lime' ? LIME : '#FFFFFF', textShadow: '0 4px 26px rgba(0,0,0,0.8)'}}>
            {txt.toLowerCase()}
            {under && <span style={{position: 'absolute', left: big ? '50%' : 0, bottom: -4, height: 5, width: big ? `${u * 60}%` : `${u * 100}%`, transform: big ? 'translateX(-50%)' : 'none', background: LIME, borderRadius: 3, boxShadow: `0 0 12px ${LIME}`}} />}
          </span>
        );
      })}
    </div>
  );
};

/* GANCHO: P&B + rádio */
const Hook: React.FC<{T: number}> = ({T}) => {
  if (T > P.hook + 0.3) return null;
  const out = pa(T, P.hook - 0.12, 0.3, ei);
  const a = pa(T, 0.05, 0.45), b = pa(T, 1.2, 0.5), c = pa(T, 3.6, 0.4);
  const st = (p: number) => ({opacity: p, transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 8}px)`});
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', top: 1140, left: 0, right: 0, textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', letterSpacing: -2, ...st(a)}}>ah, mas aquela pessoa</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, color: '#fff', lineHeight: 0.95, ...st(b)}}>já saiu da igreja?</div>
        <div style={{position: 'relative', display: 'inline-block', fontFamily: SANS, fontWeight: 900, fontSize: 140, color: '#fff', letterSpacing: -5, textTransform: 'uppercase', ...st(c)}}>intercede!
          <span style={{position: 'absolute', left: 0, bottom: 6, height: 8, width: `${pa(T, 4.2, 0.35) * 100}%`, background: '#fff'}} /></div>
      </div>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 10, color: 'rgba(255,255,255,0.8)', opacity: a}}>● REC</div>
    </AbsoluteFill>
  );
};
const FilmFx: React.FC<{T: number; f: number}> = ({T, f}) => {
  if (T > P.hook + 0.3) return null;
  const out = pa(T, P.hook - 0.12, 0.3, ei); const fl = 0.06 + 0.06 * rand(f);
  return (
    <AbsoluteFill style={{opacity: 1 - out, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `rgba(255,255,255,${fl * 0.5})`, mixBlendMode: 'overlay'}} />
      {[0, 1, 2].map((k) => { const x = rand(Math.floor(f / 3) + k * 17) * W; return rand(Math.floor(f / 3) * 3 + k) > 0.55 ? <div key={k} style={{position: 'absolute', left: x, top: 0, width: 2, height: H, background: 'rgba(255,255,255,0.18)'}} /> : null; })}
      {Array.from({length: 14}).map((_, k) => { const s = rand(f * 13 + k); return s > 0.6 ? <div key={k} style={{position: 'absolute', left: rand(f + k * 7) * W, top: rand(f * 3 + k) * H, width: 3 + s * 5, height: 3 + s * 5, borderRadius: 4, background: 'rgba(255,255,255,0.55)'}} /> : null; })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

/* CAIXA que abre e digita (versículo ou frase do pregador) */
const TypeBox: React.FC<{b: Box; T: number; i: number}> = ({b, T, i}) => {
  const pin = pa(T, b.t0, 0.55); const pout = pa(T, b.t1 - 0.35, 0.35, ei);
  if (T < b.t0 || pout >= 1) return null;
  const dur = Math.min(3.2, (b.t1 - b.t0) * 0.62); const typed = Math.floor(clamp((T - b.t0 - 0.4) / dur) * b.text.length);
  const open = pa(T, b.t0, 0.45, eio); const person = b.ref === 'MÁRCIO LIMA';
  return (
    <div style={{position: 'absolute', left: 64, right: 64, top: 780, opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 50}px)`}}>
      <div style={{padding: '30px 38px 34px', borderRadius: 24, background: 'rgba(6,10,24,0.78)', border: `1.5px solid ${person ? 'rgba(200,255,46,0.55)' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(14px)',
        clipPath: `inset(0 ${(1 - open) * 50}% 0 ${(1 - open) * 50}% round 24px)`, boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {person ? <div style={{width: 18, height: 18, borderRadius: 9, background: LIME, boxShadow: `0 0 14px ${LIME}`}} /> : <div style={{width: 26, height: 30, border: `3px solid ${LIME}`, borderRadius: 4}} />}
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 38, color: LIME, letterSpacing: 4}}>{b.ref}</div>
          {b.sub && <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: 'rgba(255,255,255,0.7)'}}>{b.sub}</div>}
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: person ? 66 : 48, lineHeight: 1.16, color: '#fff', marginTop: 14, minHeight: person ? 160 : 170}}>
          {b.text.slice(0, typed)}<span style={{opacity: Math.floor(T * 3) % 2 ? 1 : 0, color: LIME}}>|</span></div>
      </div>
    </div>
  );
};

/* CARTÃO de capítulo (como na referência 05), na paleta */
const ChapterCard: React.FC<{c: Card; T: number}> = ({c, T}) => {
  const d = 1.6; if (T < c.t - 0.02 || T > c.t + d) return null;
  const p = pa(T, c.t, 0.3); const o = pa(T, c.t + d - 0.2, 0.2, ei);
  return (
    <AbsoluteFill style={{background: '#F4F6FF', opacity: 1 - o, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', transform: `scale(${lerp(1.08, 1, p)})`}}>
        <div style={{margin: '0 auto', width: 170, height: 260, borderRadius: '50%', border: `4px solid ${BLUE}`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 210, color: BLUE, lineHeight: 1, opacity: p}}>{c.n}</div></div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: DEEP, marginTop: 18, letterSpacing: 1}}>{c.lbl}</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: DEEP, marginTop: 30, letterSpacing: -1.5, opacity: pa(T, c.t + 0.05, 0.25)}}>{c.word}</div>
      </div>
    </AbsoluteFill>
  );
};

const BigWord: React.FC<{b: Big; T: number}> = ({b, T}) => {
  const pin = pa(T, b.t0, 0.5); const pout = pa(T, b.t1 - 0.3, 0.3, ei);
  if (T < b.t0 || pout >= 1) return null;
  return (
    <div style={{position: 'absolute', left: -200, right: -200, top: 170, textAlign: 'center', transform: `scale(${lerp(1.25, 1, pin) + (T - b.t0) * 0.02})`, opacity: pin * (1 - pout), filter: `blur(${(1 - pin) * 14}px)`,
      fontFamily: b.serif ? SERIF : SANS, fontStyle: b.serif ? 'italic' : 'normal', fontWeight: b.serif ? 400 : 900, fontSize: b.size, lineHeight: 0.9, letterSpacing: b.serif ? -2 : -5,
      color: b.serif ? LIME : '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 10px 50px rgba(0,0,0,0.6)'}}>{b.text}</div>
  );
};


/* ILUSTRAÇÃO da história: desenho em tela cheia, câmera lenta, papel, e o pregador numa janelinha */
const Illustration: React.FC<{u: Ilu; T: number; f: number}> = ({u, T, f}) => {
  if (T < u.t0 - 0.35 || T > u.t1 + 0.35) return null;
  const k = Math.min(pa(T, u.t0 - 0.35, 0.45, eio), 1 - pa(T, u.t1 - 0.1, 0.4, eio));
  const p = clamp((T - u.t0) / (u.t1 - u.t0));
  const z = lerp(u.z0, u.z1, eio(p)), x = lerp(u.x0, u.x1, eio(p));
  const wob = Math.sin(T * 0.9) * 0.25;
  return (
    <AbsoluteFill style={{opacity: k}}>
      <AbsoluteFill style={{background: '#0B1A4A'}} />
      <AbsoluteFill style={{transform: `translateX(${x}px) scale(${z}) rotate(${wob}deg)`, clipPath: `inset(${(1 - k) * 8}% 0 ${(1 - k) * 8}% 0)`}}>
        <Img src={staticFile(`ilus/${u.src}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: 0.22, mixBlendMode: 'multiply', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '700px', backgroundPosition: `${(f % 6) * 37}px ${(f % 4) * 53}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(5,10,30,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};
const PiP: React.FC<{T: number; fx: number; fy: number}> = ({T, fx, fy}) => {
  const on = P.ilus.reduce((m, u) => Math.max(m, Math.min(pa(T, u.t0 + 0.3, 0.4), 1 - pa(T, u.t1 - 0.3, 0.3, ei))), 0);
  if (on <= 0) return null; const sw = 300, shh = 420;
  return (
    <div style={{position: 'absolute', right: 56, top: 140, width: sw, height: shh, borderRadius: 26, overflow: 'hidden', border: `3px solid ${LIME}`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)', opacity: on, transform: `scale(${lerp(0.85, 1, on)})`, transformOrigin: 'top right'}}>
      <div style={{position: 'absolute', left: Math.min(0, Math.max(sw - W * 0.75, sw / 2 - fx * W * 0.75)), top: Math.min(0, shh * 0.32 - fy * H * 0.75), width: W * 0.75, height: H * 0.75}}>
        <OffthreadVideo src={staticFile('video/graded.mp4')} muted style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  );
};

const Asterisk: React.FC<{T: number; size?: number; style?: React.CSSProperties}> = ({T, size = 54, style}) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{transform: `rotate(${T * 30}deg)`, ...style}}>
    {[0, 60, 120].map((a) => <rect key={a} x={-1.1} y={-9} width={2.2} height={18} rx={1.1} fill="#fff" transform={`rotate(${a})`} />)}
  </svg>
);

const EndCard: React.FC<{T: number}> = ({T}) => {
  const t0 = P.dur; if (T < t0 - 0.2) return null;
  const bg = pa(T, t0 - 0.2, 0.6, eio); const a = pa(T, t0 + 0.2, 0.7), b = pa(T, t0 + 0.6, 0.8), c = pa(T, t0 + 1.1, 0.7);
  return (
    <AbsoluteFill style={{background: `rgba(5,7,12,${0.9 * bg})`, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', marginTop: -120}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: -2, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>o convite é um só:</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 190, color: LIME, lineHeight: 1, opacity: b, transform: `scale(${lerp(1.15, 1, b)})`, filter: `blur(${(1 - b) * 10}px)`}}>interceda.</div>
      </div>
      <div style={{position: 'absolute', bottom: 230, display: 'flex', alignItems: 'center', gap: 22, opacity: c}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 92}} />
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff', letterSpacing: 6, textTransform: 'uppercase', lineHeight: 1.4}}>Semana de Oração Jovem<br /><span style={{color: LIME}}>2026</span></div>
      </div>
    </AbsoluteFill>
  );
};

export const Corte: React.FC<{audio: boolean}> = ({audio}) => {
  loadFonts();
  const f = useCurrentFrame(); const T = f / FPS; const vt = Math.min(T, P.dur - 0.05);
  const fx = smooth(P.face.t, P.face.x, vt, 0.6), fy = smooth(P.face.t, P.face.y, vt, 0.6);
  const si = P.shots.filter((s) => s.t <= vt).length - 1; const sh = P.shots[Math.max(0, si)];
  const punch = 1 + 0.04 * (1 - pa(vt, sh.t, 0.35));
  const z = sh.z * (1 + 0.02 * clamp((vt - sh.t) / 4)) * punch;
  let left = W / 2 - fx * W * z, top = H * 0.3 - fy * H * z;
  left = clamp(left, W - W * z, 0); top = clamp(top, H - H * z, 0);
  const bw = T < P.hook ? 1 : 1 - pa(T, P.hook, 0.25);
  const shake = T < P.hook ? (rand(f) - 0.5) * 6 : 0;
  const fl = P.flashes.reduce((m, t) => Math.max(m, T >= t - 0.04 && T < t + 0.32 ? (T < t ? (T - t + 0.04) / 0.04 : 1 - (T - t) / 0.32) : 0), 0);
  const boxOn = P.boxes.some((b) => T >= b.t0 && T < b.t1);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: left + shake, top, width: W * z, height: H * z, filter: `grayscale(${bw}) contrast(${1 + 0.35 * bw}) brightness(${1 - 0.12 * bw})`}}>
        <OffthreadVideo src={staticFile('video/graded.mp4')} muted style={{width: '100%', height: '100%'}} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 24%, transparent 40%, transparent 56%, rgba(0,0,0,0.75) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
      <FilmFx T={T} f={f} />
      {P.ilus.map((u, i) => <Illustration key={i} u={u} T={T} f={f} />)}
      <PiP T={T} fx={fx} fy={fy} />
      {P.big.map((b, i) => <BigWord key={i} b={b} T={T} />)}
      {P.boxes.map((b, i) => <TypeBox key={i} b={b} T={T} i={i} />)}
      <Hook T={T} />
      <Captions T={T} hidden={false} />
      <div style={{position: 'absolute', left: 64, bottom: 92, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.92}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 64}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 19, color: '#fff', lineHeight: 1.35, letterSpacing: 0.5}}>Ministério Jovem Ágape Teen<br /><span style={{opacity: 0.7}}>verdade e desafio ///2026///</span></div>
      </div>
      <Asterisk T={T} style={{position: 'absolute', right: 70, bottom: 98}} />
      {P.cards.map((c, i) => <ChapterCard key={i} c={c} T={T} />)}
      <EndCard T={T} />
      {fl > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${0.9 * fl})`}} />}
      <AbsoluteFill style={{opacity: 0.12, mixBlendMode: 'overlay', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px', backgroundPosition: `${rand(Math.floor(f / 2)) * 400}px ${rand(Math.floor(f / 2) + 9) * 400}px`}} />
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
