import React from 'react';
import {Easing} from 'remotion';
import I01 from './figs/I01.json'; import I02 from './figs/I02.json'; import I03 from './figs/I03.json'; import I04 from './figs/I04.json';
import I05 from './figs/I05.json'; import I06 from './figs/I06.json'; import I07 from './figs/I07.json'; import I08 from './figs/I08.json';
import I09 from './figs/I09.json'; import I10 from './figs/I10.json'; import I11 from './figs/I11.json'; import I12 from './figs/I12.json';

export const C = {blue: '#2368F2', deep: '#0B2A8C', night: '#040B2E', ink: '#071447', white: '#FFFFFF', lime: '#C8FF2E'};
export const FONT = {heavy: "'Montserrat', 'Arial Black', sans-serif", cond: "'Barlow Condensed', 'Arial Narrow', sans-serif", anton: "'Anton', Impact, sans-serif"};
export const W = 1920, H = 1080, FPS = 30;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), in: Easing.bezier(0.5, 0, 0.75, 0), inOut: Easing.bezier(0.65, 0, 0.35, 1),
  back: (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
export const pa = (T: number, s: number, d: number, e: (t: number) => number = E.out) => e(clamp((T - s) / d));
/** janela: entra em a (dur di), sai em b (dur do) */
export const win = (T: number, a: number, b: number, di = 0.5, dout = 0.4) => Math.min(pa(T, a, di), 1 - pa(T, b - dout, dout, E.in));
export const rand = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── caminho suave (Catmull-Rom) a partir de pontos ── */
export const smoothPath = (pts: number[][], closed: boolean) => {
  const n = pts.length; if (n < 2) return '';
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + (closed ? 'Z' : '');
};

/* ── traço que se desenha (p 0→1) com brilho ── */
export const Stroke: React.FC<{d: string; p: number; color?: string; w?: number; glow?: number; opacity?: number; dash?: string; fill?: string; fillOp?: number}> =
({d, p, color = C.white, w = 3, glow = 0.8, opacity = 1, dash, fill, fillOp = 0}) => {
  if (p <= 0 && !fillOp) return null;
  const da = dash ?? '1 1'; const off = dash ? 0 : 1 - clamp(p);
  return (<g opacity={opacity}>
    {fill && fillOp > 0 && <path d={d} fill={fill} opacity={fillOp} stroke="none" />}
    {glow > 0 && <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w * 4} strokeOpacity={0.18 * glow} strokeDasharray={da} strokeDashoffset={off} strokeLinecap="round" strokeLinejoin="round" style={{filter: 'blur(6px)'}} />}
    <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeDasharray={da} strokeDashoffset={off} strokeLinecap="round" strokeLinejoin="round" />
  </g>);
};

/* ── FIGURA a partir de pose real contornada ── */
type FigData = {aspect: number; outer: number[][][]; inner: number[][][]};
export const FIGS: Record<string, FigData> = {I01, I02, I03, I04, I05, I06, I07, I08, I09, I10, I11, I12} as any;
const pathCache: Record<string, {outer: string[]; inner: string[]; chunks: string[][]}> = {};
const figPaths = (id: string) => {
  if (pathCache[id]) return pathCache[id];
  const f = FIGS[id]; const outer = f.outer.map((o) => smoothPath(o.map(([x, y]) => [x * 1000, y * 1000]), true));
  const inner = f.inner.map((o) => smoothPath(o.map(([x, y]) => [x * 1000, y * 1000]), false));
  // pedaços do contorno para a fragmentação
  const chunks = f.outer.map((o) => { const k = Math.max(6, Math.floor(o.length / 5)); const out: string[] = []; for (let i = 0; i < o.length; i += k) out.push(smoothPath(o.slice(i, i + k + 1).map(([x, y]) => [x * 1000, y * 1000]), false)); return out; });
  return (pathCache[id] = {outer, inner, chunks});
};
export const Fig: React.FC<{id: string; x: number; y: number; h: number; p: number; inner?: number; fill?: number; color?: string; w?: number; glitch?: number; shatter?: number; pulse?: number; flip?: boolean; T?: number; seed?: number; opacity?: number}> =
({id, x, y, h, p, inner = 1, fill = 0, color = C.white, w = 2.6, glitch = 0, shatter = 0, pulse = 0, flip, T = 0, seed = 1, opacity = 1}) => {
  const f = FIGS[id]; const P = figPaths(id); const s = h / 1000;
  const jx = glitch > 0 ? (rand(Math.floor(T * 12) + seed) - 0.5) * 18 * glitch : 0;
  const pin = clamp(p * 1.25); const pi = clamp((p - 0.45) / 0.55) * inner;
  return (
    <g transform={`translate(${x + jx},${y}) scale(${flip ? -s : s},${s})`} opacity={opacity}>
      {shatter < 0.02 ? P.outer.map((d, i) => <Stroke key={i} d={d} p={pin} color={color} w={w / s} fill={C.deep} fillOp={fill * 0.9} />)
        : P.chunks.map((cs, i) => cs.map((d, k) => { const r = rand(seed * 31 + i * 7 + k); const a = (r - 0.5) * 6.28;
          const dist = shatter * shatter * (240 + 400 * rand(k + seed)); return (
            <g key={`${i}-${k}`} transform={`translate(${Math.cos(a) * dist},${Math.sin(a) * dist - shatter * 120}) rotate(${(r - 0.5) * 90 * shatter})`} opacity={1 - shatter}>
              <Stroke d={d} p={1} color={color} w={w / s} />
            </g>); }))}
      {shatter < 0.02 && P.inner.map((d, i) => <Stroke key={'i' + i} d={d} p={pi} color={color} w={(w * 0.55) / s} glow={0.4} opacity={0.75} />)}
      {glitch > 0 && [0, 1, 2].map((k) => { const r = rand(Math.floor(T * 10) * 3 + k + seed * 9); return r > 0.45 ? (
        <rect key={k} x={-500 + rand(k + Math.floor(T * 10)) * 600} y={-1000 * f.aspect * 0 - 900 + r * 850} width={120 + r * 380} height={6 + r * 14} fill={k % 2 ? C.lime : C.white} opacity={0.75 * glitch} />) : null; })}
      {pulse > 0 && <g transform="translate(0,-640)"><circle r={60 + 30 * pulse} fill={C.lime} opacity={0.2 * pulse} style={{filter: 'blur(20px)'}} /><circle r={16} fill={C.white} opacity={pulse} /></g>}
    </g>
  );
};

/* ── ondas concêntricas de oração ── */
export const Waves: React.FC<{x: number; y: number; T: number; t0: number; n?: number; speed?: number; maxR?: number; color?: string; k?: number; w?: number}> =
({x, y, T, t0, n = 5, speed = 0.9, maxR = 1400, color = C.lime, k = 1, w = 3}) => {
  if (T < t0) return null; const el = T - t0;
  return (<g>{Array.from({length: n}).map((_, i) => { const ph = (el * speed - i * 0.22); if (ph < 0) return null; const r = (ph % 1.1) / 1.1; const R = 40 + r * maxR;
    return <circle key={i} cx={x} cy={y} r={R} fill="none" stroke={color} strokeWidth={w * (1 - r) + 0.5} opacity={k * (1 - r) * 0.85} style={{filter: 'drop-shadow(0 0 8px ' + color + ')'}} />; })}</g>);
};

/* ── linha de conexão luminosa (com pulso viajando) ── */
export const Link: React.FC<{a: number[]; b: number[]; p: number; T: number; color?: string; bend?: number; w?: number; pulse?: boolean}> = ({a, b, p, T, color = C.lime, bend = -120, w = 3, pulse = true}) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + bend; const d = `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  const q = (T * 0.8) % 1; const qx = (1 - q) * (1 - q) * a[0] + 2 * (1 - q) * q * mx + q * q * b[0], qy = (1 - q) * (1 - q) * a[1] + 2 * (1 - q) * q * my + q * q * b[1];
  return (<g><Stroke d={d} p={p} color={color} w={w} glow={1} />{pulse && p >= 1 && <circle cx={qx} cy={qy} r={7} fill={C.white} style={{filter: `drop-shadow(0 0 10px ${color})`}} />}</g>);
};

/* ── partículas ── */
export const Particles: React.FC<{T: number; n?: number; seed?: number; color?: string; area?: number[]; vy?: number; size?: number; k?: number}> = ({T, n = 60, seed = 1, color = C.white, area = [0, 0, W, H], vy = -12, size = 2.4, k = 0.6}) => (
  <g>{Array.from({length: n}).map((_, i) => { const r1 = rand(i * 3.1 + seed), r2 = rand(i * 7.7 + seed), r3 = rand(i * 1.3 + seed * 2);
    const x = area[0] + r1 * area[2] + Math.sin(T * 0.6 + i) * 12; const y = area[1] + (((r2 * area[3] + T * vy * (0.5 + r3)) % area[3]) + area[3]) % area[3];
    return <circle key={i} cx={x} cy={y} r={size * (0.4 + r3)} fill={color} opacity={k * (0.3 + 0.7 * Math.abs(Math.sin(T * 1.3 + i)))} />; })}</g>
);

/* ── tipografia da identidade ── */
export const Heavy: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties; track?: number}> = ({children, size, color = C.white, style, track = -1}) => (
  <div style={{fontFamily: FONT.heavy, fontWeight: 900, fontStyle: 'italic', fontSize: size, lineHeight: 0.92, color, letterSpacing: track, textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 8px 0 rgba(4,11,46,0.45), 0 0 50px rgba(4,11,46,0.6)', ...style}}>{children}</div>
);
export const Plate: React.FC<{children: React.ReactNode; size: number; style?: React.CSSProperties}> = ({children, size, style}) => (
  <div style={{display: 'inline-block', background: C.lime, padding: `${size * 0.05}px ${size * 0.28}px ${size * 0.02}px`, borderRadius: size * 0.08, transform: 'skewX(-10deg)', boxShadow: '0 12px 0 rgba(4,11,46,0.4), 0 0 60px rgba(200,255,46,0.35)', ...style}}>
    <div style={{fontFamily: FONT.heavy, fontWeight: 900, fontStyle: 'italic', fontSize: size, lineHeight: 1, color: C.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: 'skewX(10deg)'}}>{children}</div>
  </div>
);
export const Tag: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 30, color = C.white, style}) => (
  <div style={{fontFamily: FONT.cond, fontWeight: 700, fontSize: size, letterSpacing: size * 0.28, color, textTransform: 'uppercase', whiteSpace: 'nowrap', ...style}}>{children}</div>
);
/** entrada com máscara/blur; saída suave */
export const In: React.FC<{T: number; a: number; b?: number; children: React.ReactNode; dir?: 'up' | 'left' | 'right' | 'zoom' | 'slam'; d?: number; style?: React.CSSProperties}> = ({T, a, b, children, dir = 'up', d = 0.55, style}) => {
  const pin = dir === 'slam' ? pa(T, a, d, E.back) : pa(T, a, d); const pout = b === undefined ? 0 : pa(T, b - 0.35, 0.35, E.in);
  if (T < a - 0.02 || pout >= 1) return null; const q = 1 - clamp(pin);
  const tr = {up: `translateY(${q * 50 - pout * 20}px)`, left: `translateX(${-q * 120}px)`, right: `translateX(${q * 120}px)`, zoom: `scale(${lerp(1.3, 1, clamp(pin)) + pout * 0.05})`, slam: `scale(${lerp(1.8, 1, pin)})`}[dir];
  return <div style={{opacity: clamp(pa(T, a, d * 0.6) * 1.2) * (1 - pout), filter: `blur(${(q + pout) * 12}px)`, transform: tr, ...style}}>{children}</div>;
};
/** palavra que se DESENHA (contorno) e depois preenche */
export const DrawWord: React.FC<{T: number; a: number; text: string; size: number; x?: number; y?: number; color?: string; fillAt?: number; anchor?: 'middle' | 'start'; stroke?: string; skew?: number}> =
({T, a, text, size, x = W / 2, y = H / 2, color = C.white, fillAt = 0.7, anchor = 'middle', stroke, skew = -10}) => {
  const p = pa(T, a, 0.9, E.inOut); const f = pa(T, a + fillAt, 0.5);
  if (T < a) return null;
  return (<text x={x} y={y} textAnchor={anchor} fontFamily={FONT.heavy} fontWeight={900} fontStyle="italic" fontSize={size} transform={`skewX(${skew + 10}) `}
    fill={color} fillOpacity={f} stroke={stroke ?? color} strokeWidth={2.2} strokeDasharray="900" strokeDashoffset={900 * (1 - p)} style={{textTransform: 'uppercase', filter: `drop-shadow(0 0 ${12 * (1 - f) + 4}px rgba(200,255,46,${0.5 * (1 - f)}))`}}>{text.toUpperCase()}</text>);
};

/* ── barras de glitch da identidade ── */
export const GlitchBars: React.FC<{T: number; x: number; y: number; k: number; seed?: number; wmax?: number}> = ({T, x, y, k, seed = 1, wmax = 260}) => {
  if (k <= 0) return null; const f = Math.floor(T * 14);
  return (<g opacity={k}>{Array.from({length: 7}).map((_, i) => { const r = rand(f * 7 + i + seed * 13); if (r < 0.35) return null;
    return <rect key={i} x={x + (rand(i + seed) - 0.5) * 300 + (r - 0.5) * 60} y={y + (i - 3) * 14} width={40 + r * wmax} height={5 + rand(i * 3 + f) * 8} fill={i % 3 === 0 ? C.lime : C.white} opacity={0.5 + r * 0.5} />; })}</g>);
};
