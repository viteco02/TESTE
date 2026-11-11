import {useCurrentFrame} from 'remotion';
import {FPS} from '../theme';
import {E, clamp, lerp} from './anim';

/** Tempo absoluto (s) dentro do filme, dado o início da cena. */
export const useAbs = (t0: number) => t0 + useCurrentFrame() / FPS;
/** Progresso 0→1 em segundos absolutos, com curva. */
export const pa = (T: number, start: number, dur: number, ease: (t: number) => number = E.out) => {
  const x = clamp((T - start) / dur); return ease(x);
};
export {E, clamp, lerp};
