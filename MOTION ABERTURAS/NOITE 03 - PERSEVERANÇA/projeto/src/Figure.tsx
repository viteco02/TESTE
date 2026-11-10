import React from 'react';
import {C} from './theme';
import {lerp} from './utils/anim';

/** Silhueta humana articulada (vista lateral, olhando para a direita). Ângulos em radianos.
 *  pernas/braços: 0 = para baixo, + = para frente. tronco: 0 = em pé, + = inclinado para frente. */
export type Pose = {torso: number; head: number; th1: number; kn1: number; th2: number; kn2: number; ua1: number; el1: number; ua2: number; el2: number};
export const P = {
  stand: {torso: 0.04, head: 0.05, th1: 0.02, kn1: 0.02, th2: -0.02, kn2: 0.02, ua1: 0.05, el1: 0.1, ua2: -0.05, el2: 0.1} as Pose,
  weary: {torso: 0.3, head: 0.35, th1: 0.05, kn1: 0.1, th2: -0.05, kn2: 0.1, ua1: 0.1, el1: 0.2, ua2: -0.05, el2: 0.15} as Pose,
  trip: {torso: 0.95, head: 0.4, th1: 0.5, kn1: 0.3, th2: -0.7, kn2: 0.9, ua1: 1.6, el1: 0.3, ua2: 1.2, el2: 0.4} as Pose,
  fallen: {torso: 1.25, head: 0.85, th1: 1.45, kn1: 2.9, th2: 1.35, kn2: 2.95, ua1: 0.35, el1: 0.15, ua2: 0.5, el2: 0.1} as Pose,
  kneelUp: {torso: 0.06, head: 0.0, th1: 0.05, kn1: 1.62, th2: 0.0, kn2: 1.6, ua1: 0.2, el1: 0.4, ua2: 0.1, el2: 0.4} as Pose,
  kneelPray: {torso: 0.18, head: 0.35, th1: 0.15, kn1: 1.66, th2: 0.08, kn2: 1.62, ua1: 0.55, el1: 1.9, ua2: 0.5, el2: 1.95} as Pose,
  kneelArms: {torso: -0.05, head: -0.35, th1: 0.05, kn1: 1.62, th2: 0.0, kn2: 1.6, ua1: 2.7, el1: 0.15, ua2: 2.5, el2: 0.2} as Pose,
  kneelHead: {torso: 0.75, head: 0.95, th1: 0.75, kn1: 2.3, th2: 0.7, kn2: 2.3, ua1: 0.65, el1: 0.5, ua2: 0.75, el2: 0.4} as Pose,
  sit: {torso: 0.3, head: 0.55, th1: 1.5, kn1: 1.45, th2: 1.4, kn2: 1.35, ua1: 0.9, el1: 0.6, ua2: 0.8, el2: 0.7} as Pose,
  oneKnee: {torso: 0.45, head: 0.3, th1: 1.45, kn1: 1.5, th2: -0.2, kn2: 1.55, ua1: 0.9, el1: 0.5, ua2: 0.3, el2: 0.3} as Pose,
  carry: {torso: 0.42, head: 0.42, th1: 0.05, kn1: 0.15, th2: -0.05, kn2: 0.15, ua1: 2.2, el1: 1.4, ua2: 2.0, el2: 1.5} as Pose,
};
export const walkPose = (ph: number, heavy = 0, base: Pose = P.stand): Pose => {
  const s = Math.sin(ph), c = Math.cos(ph); const amp = lerp(0.42, 0.3, heavy);
  return {...base, torso: base.torso + heavy * 0.28 + Math.abs(s) * 0.03, head: base.head + heavy * 0.3,
    th1: amp * s, kn1: 0.08 + Math.max(0, -c) * 0.75, th2: -amp * s, kn2: 0.08 + Math.max(0, c) * 0.75,
    ua1: base === P.carry ? base.ua1 : -amp * 0.8 * s, el1: base === P.carry ? base.el1 : 0.25 + Math.max(0, -s) * 0.3,
    ua2: base === P.carry ? base.ua2 : amp * 0.8 * s, el2: base === P.carry ? base.el2 : 0.25 + Math.max(0, s) * 0.3};
};
export const mix = (a: Pose, b: Pose, t: number): Pose => Object.fromEntries(Object.keys(a).map((k) => [k, lerp((a as any)[k], (b as any)[k], t)])) as Pose;

type V2 = [number, number];
const add = (a: V2, ang: number, L: number, up = false): V2 => up ? [a[0] + Math.sin(ang) * L, a[1] - Math.cos(ang) * L] : [a[0] + Math.sin(ang) * L, a[1] + Math.cos(ang) * L];
export const solve = (p: Pose, h: number) => {
  const Lt = 0.25 * h, Ls = 0.245 * h, Lb = 0.31 * h, Lu = 0.165 * h, Lf = 0.16 * h, R = 0.068 * h;
  const hip: V2 = [0, 0];
  const sh = add(hip, p.torso, Lb, true); const neck = add(sh, p.torso + p.head * 0.5, 0.03 * h, true); const head = add(neck, p.torso + p.head, R * 1.05, true);
  const k1 = add(hip, p.th1, Lt), f1 = add(k1, p.th1 - p.kn1, Ls), k2 = add(hip, p.th2, Lt), f2 = add(k2, p.th2 - p.kn2, Ls);
  const e1 = add(sh, p.ua1, Lu), h1 = add(e1, p.ua1 + p.el1, Lf), e2 = add(sh, p.ua2, Lu), h2 = add(e2, p.ua2 + p.el2, Lf);
  const low = Math.max(f1[1], f2[1], k1[1], k2[1], h1[1] * 0.98, h2[1] * 0.98, hip[1] + 0.02 * h);
  return {hip, sh, neck, head, k1, f1, k2, f2, e1, h1, e2, h2, R, low};
};

/** Cápsula afunilada (membro) de a até b, com larguras wa e wb. */
let _k = 0;
const cap = (a: V2, b: V2, wa: number, wb: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ra = wa / 2, rb = wb / 2;
  return <g key={_k++}><polygon points={`${a[0] + nx * ra},${a[1] + ny * ra} ${b[0] + nx * rb},${b[1] + ny * rb} ${b[0] - nx * rb},${b[1] - ny * rb} ${a[0] - nx * ra},${a[1] - ny * ra}`} /><circle cx={a[0]} cy={a[1]} r={ra} /><circle cx={b[0]} cy={b[1]} r={rb} /></g>;
};
const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Desenha a silhueta. x,y = ponto no chão. rim = cor da luz de recorte (contraluz). */
export const Figure: React.FC<{pose: Pose; x: number; y: number; h: number; color?: string; rim?: string; rimSide?: number; robe?: boolean; hood?: boolean; flip?: boolean; cross?: number; opacity?: number; blur?: number; pack?: boolean}> =
({pose, x, y, h, color = '#020818', rim = 'rgba(200,255,46,0.9)', rimSide = 1, robe = false, hood = true, flip = false, cross = 0, opacity = 1, blur = 0, pack = false}) => {
  const j0 = solve(pose, h); const oy = -j0.low;
  const sh = (v: V2): V2 => [v[0], v[1] + oy];
  const j = Object.fromEntries(Object.entries(j0).map(([k, v]) => [k, Array.isArray(v) ? sh(v as V2) : v])) as any;
  const leg = (hip: V2, k: V2, f: V2, back: boolean) => {
    const calf = lerp2(k, f, 0.32); const dir = Math.atan2(f[1] - k[1], f[0] - k[0]);
    const toe: V2 = [f[0] + 0.085 * h, f[1] + 0.005 * h]; const heel: V2 = [f[0] - 0.025 * h, f[1]];
    return <g key={back ? 'lb' : 'lf'}>
      {cap(hip, k, 0.105 * h, 0.07 * h)}{cap(k, calf, 0.07 * h, 0.072 * h)}{cap(calf, f, 0.072 * h, 0.048 * h)}
      <path d={`M${heel[0]},${heel[1] - 0.035 * h} Q${f[0] + 0.03 * h},${f[1] - 0.05 * h} ${toe[0]},${toe[1] - 0.012 * h} Q${toe[0] + 0.012 * h},${toe[1] + 0.012 * h} ${toe[0] - 0.01 * h},${toe[1] + 0.014 * h} L${heel[0]},${heel[1] + 0.014 * h} Z`} />
    </g>;
  };
  const arm = (s0: V2, e: V2, hd: V2, k: string) => <g key={k}>{cap(s0, e, 0.072 * h, 0.056 * h)}{cap(e, hd, 0.056 * h, 0.04 * h)}<ellipse cx={hd[0] + (hd[0] - e[0]) * 0.18} cy={hd[1] + (hd[1] - e[1]) * 0.18} rx={0.03 * h} ry={0.036 * h} /></g>;
  const torso = () => {
    const ang = pose.torso; const ux = Math.sin(ang), uy = -Math.cos(ang), px = Math.cos(ang), py = Math.sin(ang);
    const at = (t: number, off: number): string => { const b = lerp2(j.hip, j.sh, t); return `${b[0] + px * off},${b[1] + py * off}`; };
    const hw = 0.075 * h, sw = 0.105 * h;
    return <path d={`M${at(-0.06, -hw)} L${at(-0.06, hw * 1.05)} C${at(0.45, hw * 1.25)} ${at(0.8, sw * 1.05)} ${at(1.0, sw * 0.7)} Q${at(1.12, 0)} ${at(1.0, -sw * 0.85)} C${at(0.75, -sw * 1.1)} ${at(0.4, -hw * 1.2)} ${at(-0.06, -hw)} Z`} />;
  };
  const headG = () => {
    const c = j.head as V2, R = j0.R; const a = pose.torso + pose.head;
    return <g>
      <ellipse cx={c[0]} cy={c[1]} rx={R * 1.02} ry={R * 1.15} transform={`rotate(${(a * 180) / Math.PI} ${c[0]} ${c[1]})`} />
      {cap(j.neck, j.sh, 0.06 * h, 0.08 * h)}
      {hood && <path d={`M${c[0] - R * 1.35},${c[1] + R * 0.5} C${c[0] - R * 1.5},${c[1] - R * 1.2} ${c[0] + R * 0.2},${c[1] - R * 1.9} ${c[0] + R * 0.95},${c[1] - R * 0.7} L${c[0] + R * 0.35},${c[1] - R * 0.2} L${j.sh[0] - R * 0.2},${j.sh[1] + R * 0.4} Z`} transform={`rotate(${(a * 180) / Math.PI * 0.8} ${c[0]} ${c[1]})`} />}
    </g>;
  };
  const robeG = () => {
    const kx = [j.k1[0], j.k2[0], j.f1[0], j.f2[0]]; const bottom = Math.max(j.f1[1], j.f2[1]) - 0.05 * h;
    return <path d={`M${j.sh[0] - 0.1 * h},${j.sh[1]} L${j.sh[0] + 0.09 * h},${j.sh[1]} L${Math.max(...kx) + 0.06 * h},${bottom} Q${(Math.max(...kx) + Math.min(...kx)) / 2},${bottom + 0.03 * h} ${Math.min(...kx) - 0.08 * h},${bottom} Z`} />;
  };
  const crossG = () => {
    if (!cross) return null; const s0: V2 = [j.sh[0] + 0.02 * h, j.sh[1] - 0.03 * h]; const ang = -0.5; const L = 1.25 * h;
    const end: V2 = [s0[0] - Math.cos(ang) * L * 0.78, Math.min(s0[1] - Math.sin(ang) * L * 0.78, -0.012 * h)]; const top: V2 = [s0[0] + Math.cos(ang) * L * 0.2, s0[1] + Math.sin(ang) * L * 0.2];
    const mid: V2 = [s0[0] + Math.cos(ang) * L * 0.04, s0[1] + Math.sin(ang) * L * 0.04]; const bx = Math.sin(ang) * 0.32 * h, by = -Math.cos(ang) * 0.32 * h;
    return <g>{cap(top, end, 0.075 * h, 0.07 * h)}{cap([mid[0] - bx, mid[1] - by], [mid[0] + bx, mid[1] + by], 0.068 * h, 0.068 * h)}</g>;
  };
  const packG = () => pack ? <g transform={`translate(${-Math.cos(pose.torso) * 0.09 * h} ${-Math.sin(pose.torso) * 0.09 * h})`}>{cap(lerp2(j.hip, j.sh, 0.45) as V2, lerp2(j.hip, j.sh, 0.95) as V2, 0.2 * h, 0.17 * h)}</g> : null;
  const all = () => <>
    {arm(j.sh, j.e2, j.h2, 'a2')}{leg(j.hip, j.k2, j.f2, true)}
    {packG()}{crossG()}{robe && robeG()}{torso()}{headG()}
    {leg(j.hip, j.k1, j.f1, false)}{arm(j.sh, j.e1, j.h1, 'a1')}
  </>;
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`} opacity={opacity} style={{filter: blur ? `blur(${blur}px)` : undefined}}>
      <g fill={rim} stroke={rim} strokeWidth={0.014 * h} strokeLinejoin="round" transform={`translate(${rimSide * 0.01 * h} ${-0.008 * h})`} style={{filter: `blur(${0.007 * h}px)`}}>{all()}</g>
      <g fill={color} stroke={color} strokeWidth={0.004 * h} strokeLinejoin="round">{all()}</g>
    </g>
  );
};
