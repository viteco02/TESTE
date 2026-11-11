import {Easing, interpolate} from 'remotion';

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),        // chega rápido, assenta devagar
  outSoft: Easing.bezier(0.22, 0.8, 0.28, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),         // antecipação / saída acelerada
  back: Easing.bezier(0.34, 1.56, 0.64, 1),   // overshoot com retorno
  whip: Easing.bezier(0.9, 0, 0.1, 1),
};

export const prog = (f: number, start: number, dur: number, ease: (t: number) => number = E.out) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Aleatório determinístico (mesmo valor em todo render). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const pick = <T,>(arr: T[], seed: number) => arr[Math.floor(rand(seed) * arr.length) % arr.length];

/** Movimento residual sutil (respiração) para manter vida em cenas calmas. */
export const drift = (f: number, amp = 6, speed = 0.015, seed = 0) => ({
  x: Math.sin(f * speed + seed) * amp,
  y: Math.cos(f * speed * 0.8 + seed * 1.7) * amp * 0.7,
});
