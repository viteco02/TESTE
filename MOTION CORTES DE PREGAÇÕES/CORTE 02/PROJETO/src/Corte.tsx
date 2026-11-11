import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import plan from './plan.json';

export const FPS = 30, W = 1080, H = 1920;
const LIME = '#C8FF2E', BLUE = '#2368F2';
const SANS = "'Inter Tight', 'Inter', Arial, sans-serif", SERIF = "'Instrument Serif', Georgia, serif";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eo = Easing.bezier(0.16, 1, 0.3, 1), eio = Easing.bezier(0.65, 0, 0.35, 1), ei = Easing.bezier(0.5, 0, 0.75, 0);
const pa = (T: number, s: number, d: number, e = eo) => e(clamp((T - s) / d));
const rand = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

type Word = {w: string; t: number};
type Card = {site: string; domain: string; date: string; title: string; lead: string; t0: number; t1: number; x: number; y: number; rot: number; w?: number};
type BgWord = {text: string; t0: number; t1: number; y: number; size: number; serif?: boolean; color?: string};
type Plan = {dur: number; words: Word[]; keys: string[]; cards: Card[]; bgwords: BgWord[]; dim: [number, number][]; shots: {t: number; z: number}[]; face: {t: number[]; x: number[]; y: number[]};
  hook: {t1: number}; endcard: number; whoosh?: number[]};
const P = plan as unknown as Plan;
export const TOTAL = P.dur + P.endcard;

/* ───────── CAMADA DE FUNDO (renderizada sozinha; a pessoa entra por cima com máscara) ───────── */
const NewsCard: React.FC<{c: Card; T: number; i: number}> = ({c, T, i}) => {
  const pin = pa(T, c.t0, 0.75); const pout = pa(T, c.t1 - 0.35, 0.35, ei);
  if (T < c.t0 || pout >= 1) return null;
  const drift = (T - c.t0) * 6;
  const w = c.w ?? 760;
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y - drift, width: w, transform: `translateY(${(1 - pin) * 140}px) rotate(${c.rot + (1 - pin) * 4}deg) scale(${lerp(0.9, 1, pin) - pout * 0.05})`, opacity: pin * (1 - pout), filter: `blur(${(1 - pin) * 10 + pout * 8}px)`,
      background: '#FFFFFF', borderRadius: 22, boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden', fontFamily: SANS}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 26px', background: '#F1F2F4', borderBottom: '1px solid #E2E4E8'}}>
        {[0, 1, 2].map((k) => <div key={k} style={{width: 13, height: 13, borderRadius: 7, background: '#C9CDD3'}} />)}
        <div style={{marginLeft: 14, flex: 1, height: 34, borderRadius: 17, background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 20, color: '#6B7280', fontWeight: 700, letterSpacing: 0.2}}>{c.domain}</div>
      </div>
      <div style={{padding: '26px 34px 34px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.5}}>
          <span>{c.site}</span><span style={{color: '#6B7280', fontWeight: 700, letterSpacing: 0.5}}>{c.date}</span>
        </div>
        <div style={{height: 3, width: 70, background: BLUE, margin: '14px 0 18px'}} />
        <div style={{fontSize: 44, lineHeight: 1.1, fontWeight: 800, color: '#0B0F19', letterSpacing: -0.6}}>{c.title}</div>
        <div style={{fontSize: 27, lineHeight: 1.35, fontWeight: 700, color: '#4B5563', marginTop: 16}}>{c.lead}</div>
      </div>
    </div>
  );
};

const BigWord: React.FC<{b: BgWord; T: number}> = ({b, T}) => {
  const pin = pa(T, b.t0, 0.9); const pout = pa(T, b.t1 - 0.4, 0.4, ei);
  if (T < b.t0 || pout >= 1) return null;
  const s = lerp(1.18, 1, pin) + (T - b.t0) * 0.012;
  return (
    <div style={{position: 'absolute', left: -200, right: -200, top: b.y, textAlign: 'center', transform: `scale(${s})`, opacity: pin * (1 - pout), filter: `blur(${(1 - pin) * 16}px)`,
      fontFamily: b.serif ? SERIF : SANS, fontStyle: b.serif ? 'italic' : 'normal', fontWeight: b.serif ? 400 : 900, fontSize: b.size, lineHeight: 0.9, letterSpacing: b.serif ? -2 : -6,
      color: b.color ?? '#FFFFFF', textTransform: b.serif ? 'none' : 'uppercase', whiteSpace: 'nowrap', textShadow: '0 10px 60px rgba(0,0,0,0.45)'}}>{b.text}</div>
  );
};

export const Fundo: React.FC = () => {
  loadFonts();
  const T = useCurrentFrame() / FPS;
  const d = P.dim.reduce((m, [a, b]) => Math.max(m, Math.min(pa(T, a - 0.3, 0.6, eio), 1 - pa(T, b - 0.3, 0.6, eio))), 0);
  return (
    <AbsoluteFill style={{background: '#05070C'}}>
      <AbsoluteFill style={{filter: `brightness(${lerp(0.62, 0.28, d)}) blur(${lerp(1.5, 14, d)}px) saturate(${lerp(0.85, 0.6, d)})`, transform: `scale(${1 + 0.05 * d})`}}>
        <OffthreadVideo src={staticFile('video/graded.mp4')} muted style={{width: W, height: H}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 30%, rgba(35,104,242,${0.22 * d}), transparent 70%)`}} />
      {P.bgwords.map((b, i) => <BigWord key={i} b={b} T={T} />)}
      {P.cards.map((c, i) => <NewsCard key={i} c={c} T={T} i={i} />)}
    </AbsoluteFill>
  );
};

/* ───────── CAMADA DA FRENTE: enquadramento, legendas, marca ───────── */
const interp = (ts: number[], vs: number[], t: number) => {
  if (t <= ts[0]) return vs[0]; if (t >= ts[ts.length - 1]) return vs[vs.length - 1];
  let lo = 0, hi = ts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  return vs[lo] + (vs[hi] - vs[lo]) * (t - ts[lo]) / (ts[hi] - ts[lo]);
};
const smooth = (ts: number[], vs: number[], t: number, win: number) => { let s = 0; for (let k = -8; k <= 8; k++) s += interp(ts, vs, t + (k / 8) * win); return s / 17; };

const groups = (words: Word[]) => {
  const g: Word[][] = []; let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= 3 || (prev && w.t - prev.t > 0.5) || /[.,?!…]$/.test(prev?.w ?? ''))) { g.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) g.push(cur); return g;
};

const Captions: React.FC<{T: number}> = ({T}) => {
  const G = React.useMemo(() => groups(P.words.filter((w) => w.t >= P.hook.t1 - 0.05)), []);
  const keys = React.useMemo(() => new Set(P.keys.map(norm)), []);
  const gi = G.findIndex((g, i) => T >= g[0].t - 0.05 && (i === G.length - 1 || T < G[i + 1][0].t - 0.05));
  if (gi < 0 || T > P.dur) return null;
  const g = G[gi]; const last = g[g.length - 1]; if (T > last.t + 1.6) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 22, rowGap: 0}}>
      {g.map((w, k) => {
        const p = pa(T, w.t - 0.04, 0.22); if (T < w.t - 0.04) return <span key={k} style={{opacity: 0}} />;
        const key = keys.has(norm(w.w)); const txt = w.w.replace(/[.,…]+$/, '').replace(/^"|"$/g, '');
        return (
          <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 26}px) scale(${lerp(0.9, 1, p)})`, opacity: p, filter: `blur(${(1 - p) * 6}px)`,
            fontFamily: key ? SERIF : SANS, fontStyle: key ? 'italic' : 'normal', fontWeight: key ? 400 : 800, fontSize: key ? 112 : 70, lineHeight: 1.05, letterSpacing: key ? -1 : -1.8,
            color: key ? LIME : '#FFFFFF', textShadow: '0 4px 24px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.4)'}}>{txt.toLowerCase()}</span>
        );
      })}
    </div>
  );
};

const Hook: React.FC<{T: number}> = ({T}) => {
  if (T > P.hook.t1 + 0.4) return null;
  const out = pa(T, P.hook.t1 - 0.1, 0.4, ei);
  const l1 = pa(T, 0.05, 0.5), l2 = pa(T, 0.85, 0.6);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - out}}>
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 84, color: '#fff', letterSpacing: -2, opacity: l1, transform: `translateY(${(1 - l1) * 30}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>"isso é um sinal da</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, color: LIME, lineHeight: 1, opacity: l2, transform: `scale(${lerp(1.2, 1, l2)})`, filter: `blur(${(1 - l2) * 10}px)`, textShadow: '0 6px 40px rgba(0,0,0,0.6)'}}>volta de Jesus?"</div>
      </div>
    </AbsoluteFill>
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
    <AbsoluteFill style={{background: `rgba(5,7,12,${0.88 * bg})`, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', marginTop: -120}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: -2, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>precisamos ter</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 190, color: LIME, lineHeight: 1, opacity: b, transform: `scale(${lerp(1.15, 1, b)})`, filter: `blur(${(1 - b) * 10}px)`}}>consciência</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: -2, opacity: c, transform: `translateY(${(1 - c) * 30}px)`}}>do nosso chamado.</div>
      </div>
      <div style={{position: 'absolute', bottom: 230, display: 'flex', alignItems: 'center', gap: 22, opacity: c}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 92}} />
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff', letterSpacing: 6, textTransform: 'uppercase', lineHeight: 1.4}}>Semana de Oração Jovem<br /><span style={{color: LIME}}>2026</span></div>
      </div>
    </AbsoluteFill>
  );
};

export const Frente: React.FC<{audio: boolean}> = ({audio}) => {
  loadFonts();
  const f = useCurrentFrame(); const T = f / FPS; const vt = Math.min(T, P.dur - 0.05);
  // enquadramento: segue o rosto (suavizado) com tamanhos de plano alternados
  const fx = smooth(P.face.t, P.face.x, vt, 0.6), fy = smooth(P.face.t, P.face.y, vt, 0.6);
  const si = P.shots.filter((s) => s.t <= vt).length - 1; const sh = P.shots[Math.max(0, si)];
  const z = sh.z * (1 + 0.02 * clamp((vt - sh.t) / 4));
  let left = W / 2 - fx * W * z, top = H * 0.3 - fy * H * z;
  left = clamp(left, W - W * z, 0); top = clamp(top, H - H * z, 0);
  const fadeIn = 1 - clamp(T / 0.25);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left, top, width: W * z, height: H * z}}>
        <OffthreadVideo src={staticFile('video/composite.mp4')} muted style={{width: '100%', height: '100%'}} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 58%, rgba(0,0,0,0.7) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
      <Hook T={T} />
      <Captions T={T} />
      {/* marca discreta, como na referência */}
      <div style={{position: 'absolute', left: 64, bottom: 92, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.92}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 64}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 19, color: '#fff', lineHeight: 1.35, letterSpacing: 0.5}}>Ministério Jovem Ágape Teen<br /><span style={{opacity: 0.7}}>verdade e desafio ///2026///</span></div>
      </div>
      <Asterisk T={T} style={{position: 'absolute', right: 70, bottom: 98}} />
      <EndCard T={T} />
      <AbsoluteFill style={{opacity: 0.1, mixBlendMode: 'overlay', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px', backgroundPosition: `${rand(Math.floor(f / 2)) * 400}px ${rand(Math.floor(f / 2) + 9) * 400}px`}} />
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
