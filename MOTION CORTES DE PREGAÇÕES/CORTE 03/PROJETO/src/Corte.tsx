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
type Big = {text: string; t0: number; t1: number; size: number; serif?: boolean};
type Plan = {dur: number; hook: number; words: Word[]; keys: string[]; face: {t: number[]; x: number[]; y: number[]}; endcard: number; big: Big[];
  verse: {t0: number; t1: number; ref: string; sub: string; text: string}; books: {t0: number; t1: number; items: [string, number][]};
  list: {t0: number; t1: number; items: [string, number][]}; shots: {t: number; z: number}[]};
const P = plan as unknown as Plan;
export const TOTAL = P.dur + P.endcard;

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
    if (cur.length && (cur.length >= 3 || (prev && w.t - prev.t > 0.5) || /[.,?!:…]$/.test(prev?.w ?? ''))) { g.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) g.push(cur); return g;
};

/* legendas palavra a palavra; palavra-chave em serifada itálica verde */
const Captions: React.FC<{T: number}> = ({T}) => {
  const G = React.useMemo(() => groups(P.words.filter((w) => w.t >= P.hook - 0.05)), []);
  const keys = React.useMemo(() => new Set(P.keys.map(norm)), []);
  const gi = G.findIndex((g, i) => T >= g[0].t - 0.05 && (i === G.length - 1 || T < G[i + 1][0].t - 0.05));
  if (gi < 0 || T > P.dur) return null;
  const g = G[gi]; const last = g[g.length - 1]; if (T > last.t + 1.6) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 22}}>
      {g.map((w, k) => {
        const p = pa(T, w.t - 0.04, 0.22); if (T < w.t - 0.04) return <span key={k} style={{opacity: 0}} />;
        const key = keys.has(norm(w.w)); const txt = w.w.replace(/[.,:…]+$/, '');
        return (
          <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 26}px) scale(${lerp(0.9, 1, p)})`, opacity: p, filter: `blur(${(1 - p) * 6}px)`,
            fontFamily: key ? SERIF : SANS, fontStyle: key ? 'italic' : 'normal', fontWeight: key ? 400 : 800, fontSize: key ? 112 : 70, lineHeight: 1.05, letterSpacing: key ? -1 : -1.8,
            color: key ? LIME : '#FFFFFF', textShadow: '0 4px 24px rgba(0,0,0,0.75)'}}>{txt.toLowerCase()}</span>
        );
      })}
    </div>
  );
};

/* GANCHO: preto e branco, rádio, tipografia grande */
const Hook: React.FC<{T: number}> = ({T}) => {
  if (T > P.hook + 0.3) return null;
  const out = pa(T, P.hook - 0.12, 0.3, ei);
  const a = pa(T, 0.0, 0.5), b = pa(T, 0.73, 0.6), c = pa(T, 2.34, 0.5), d = pa(T, 3.16, 0.5), e = pa(T, 4.7, 0.5), f = pa(T, 6.78, 0.5);
  const st = (p: number, x = 0) => ({opacity: p, transform: `translate(${(1 - p) * x}px, ${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 8}px)`});
  const line1 = T < 2.25;
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>
        {line1 ? (<>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 104, color: '#fff', letterSpacing: -3, ...st(a)}}>voz que clama</div>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 190, color: '#fff', lineHeight: 0.95, ...st(b)}}>no deserto</div>
        </>) : (<>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', letterSpacing: -2, ...st(c)}}>preparai o</div>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, color: '#fff', lineHeight: 0.95, ...st(d)}}>caminho</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', letterSpacing: -2, ...st(d)}}>do Senhor</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: 'rgba(255,255,255,0.85)', letterSpacing: 8, marginTop: 16, textTransform: 'uppercase', ...st(e)}}>endireitai as suas veredas</div>
        </>)}
      </div>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 10, color: 'rgba(255,255,255,0.8)', opacity: a * (1 - f * 0)}}>ISAÍAS 40:3</div>
    </AbsoluteFill>
  );
};

/* filme P&B do gancho: listras, flicker e poeira */
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

const BigWord: React.FC<{b: Big; T: number}> = ({b, T}) => {
  const pin = pa(T, b.t0, 0.5); const pout = pa(T, b.t1 - 0.3, 0.3, ei);
  if (T < b.t0 || pout >= 1) return null;
  return (
    <div style={{position: 'absolute', left: -200, right: -200, top: 150, textAlign: 'center', transform: `scale(${lerp(1.25, 1, pin) + (T - b.t0) * 0.02})`, opacity: pin * (1 - pout), filter: `blur(${(1 - pin) * 14}px)`,
      fontFamily: b.serif ? SERIF : SANS, fontStyle: b.serif ? 'italic' : 'normal', fontWeight: b.serif ? 400 : 900, fontSize: b.size, lineHeight: 0.9, letterSpacing: b.serif ? -2 : -6,
      color: b.serif ? LIME : '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 10px 50px rgba(0,0,0,0.55)'}}>{b.text}</div>
  );
};

const VerseCard: React.FC<{T: number}> = ({T}) => {
  const v = P.verse; const pin = pa(T, v.t0, 0.6); const pout = pa(T, v.t1 - 0.35, 0.35, ei);
  if (T < v.t0 || pout >= 1) return null;
  const typed = Math.floor(clamp((T - v.t0 - 0.4) / 2.6) * v.text.length);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 820, padding: '34px 40px', borderRadius: 26, background: 'rgba(8,10,16,0.72)', border: '1.5px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(14px)',
      opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 60}px) scale(${lerp(0.94, 1, pin)})`, boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: LIME, letterSpacing: 4}}>{v.ref}</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: 'rgba(255,255,255,0.75)'}}>{v.sub}</div>
      </div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, lineHeight: 1.18, color: '#fff', marginTop: 16, minHeight: 180}}>{v.text.slice(0, typed)}<span style={{opacity: Math.floor(T * 3) % 2 ? 1 : 0}}>|</span></div>
    </div>
  );
};

const Books: React.FC<{T: number}> = ({T}) => {
  const b = P.books; const pout = pa(T, b.t1 - 0.3, 0.3, ei); if (T < b.t0 - 0.1 || pout >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 880, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - pout}}>
      {b.items.map(([name, t], i) => { const p = pa(T, t, 0.45); return (
        <div key={i} style={{background: i === 0 ? LIME : '#fff', color: '#0B0F19', fontFamily: SANS, fontWeight: 900, fontSize: 110, letterSpacing: -3, padding: '6px 34px 2px', borderRadius: 14, transform: `skewX(-8deg) translateX(${(1 - p) * (i ? 300 : -300)}px)`, opacity: p, boxShadow: '0 16px 40px rgba(0,0,0,0.45)'}}>{name}</div>
      ); })}
    </div>
  );
};

const Challenges: React.FC<{T: number}> = ({T}) => {
  const l = P.list; const pin = pa(T, l.t0, 0.5); const pout = pa(T, l.t1 - 0.35, 0.35, ei); if (T < l.t0 || pout >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 90, top: 760, opacity: pin * (1 - pout)}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: 'rgba(255,255,255,0.8)', marginBottom: 18}}>OS DESAFIOS</div>
      {l.items.map(([name, t], i) => { const p = pa(T, t - 0.05, 0.4); const strike = i === 2 ? pa(T, t + 0.5, 0.5) : 0; return (
        <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 22, opacity: p, transform: `translateX(${(1 - p) * -80}px)`, marginBottom: 6}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 42, color: LIME}}>0{i + 1}</span>
          <span style={{position: 'relative', fontFamily: i === 2 ? SERIF : SANS, fontStyle: i === 2 ? 'italic' : 'normal', fontWeight: i === 2 ? 400 : 900, fontSize: i === 2 ? 118 : 96, letterSpacing: i === 2 ? -1 : -3, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.6)'}}>
            {name}<span style={{position: 'absolute', left: 0, top: '55%', height: 8, width: `${strike * 100}%`, background: LIME}} />
          </span>
        </div>
      ); })}
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
    <AbsoluteFill style={{background: `rgba(5,7,12,${0.88 * bg})`, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', marginTop: -120}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: -2, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>a consciência do</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 200, color: LIME, lineHeight: 1, opacity: b, transform: `scale(${lerp(1.15, 1, b)})`, filter: `blur(${(1 - b) * 10}px)`}}>chamado</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: -2, opacity: c, transform: `translateY(${(1 - c) * 30}px)`}}>é bíblica.</div>
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
  const punch = 1 + 0.035 * (1 - pa(vt, sh.t, 0.35));             // pequeno soco de zoom em cada corte
  const z = sh.z * (1 + 0.02 * clamp((vt - sh.t) / 4)) * punch;
  let left = W / 2 - fx * W * z, top = H * 0.3 - fy * H * z;
  left = clamp(left, W - W * z, 0); top = clamp(top, H - H * z, 0);
  const bw = T < P.hook ? 1 : 1 - pa(T, P.hook, 0.25);
  const shake = T < P.hook ? (rand(f) - 0.5) * 6 : 0;
  const flash = T >= P.hook - 0.02 && T < P.hook + 0.3 ? 1 - (T - P.hook) / 0.3 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: left + shake, top, width: W * z, height: H * z, filter: `grayscale(${bw}) contrast(${1 + 0.35 * bw}) brightness(${1 - 0.12 * bw})`}}>
        <OffthreadVideo src={staticFile('video/graded.mp4')} muted style={{width: '100%', height: '100%'}} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 26%, transparent 40%, transparent 58%, rgba(0,0,0,0.72) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
      <FilmFx T={T} f={f} />
      {P.big.map((b, i) => <BigWord key={i} b={b} T={T} />)}
      <VerseCard T={T} />
      <Books T={T} />
      <Challenges T={T} />
      <Hook T={T} />
      <Captions T={T} />
      <div style={{position: 'absolute', left: 64, bottom: 92, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.92}}>
        <Img src={staticFile('images/logo_agape.png')} style={{width: 64}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 19, color: '#fff', lineHeight: 1.35, letterSpacing: 0.5}}>Ministério Jovem Ágape Teen<br /><span style={{opacity: 0.7}}>verdade e desafio ///2026///</span></div>
      </div>
      <Asterisk T={T} style={{position: 'absolute', right: 70, bottom: 98}} />
      <EndCard T={T} />
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${0.85 * flash})`}} />}
      <AbsoluteFill style={{opacity: 0.1, mixBlendMode: 'overlay', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px', backgroundPosition: `${rand(Math.floor(f / 2)) * 400}px ${rand(Math.floor(f / 2) + 9) * 400}px`}} />
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
