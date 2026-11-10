import timing from './timing.json';
export const C = {blue: '#2368F2', blueHi: '#4A8BFF', blueDeep: '#123FC0', navy: '#0A2A93', ink: '#061A66', night: '#030E3A', white: '#FFFFFF', lime: '#C8FF2E', limeDark: '#8FBF10'};
export const FPS = 60, W = 1920, H = 1080;
export const FONT = {title: "'Montserrat', 'Arial Black', sans-serif", body: "'Montserrat', Arial, sans-serif", display: "'Anton', Impact, sans-serif", cond: "'Barlow Condensed', 'Arial Narrow', sans-serif"};
export const TOTAL_SEC = timing.total;
export const TOTAL_FRAMES = Math.round(TOTAL_SEC * FPS);
export const fr = (s: number) => Math.round(s * FPS);
export const K = timing.k as Record<string, number>;
export const PH = timing.phrases as unknown as Record<string, {start: number; end: number; text: string}>;
/** Cenas: caminhada · pressão · silêncio · história · José · Jó · Daniel · Jesus · decisão · impacto · pergunta · continue · identidade */
export const SCENE_START = [0, 7.5, 16.3, 22.7, 27.5, 32.85, 39.0, 44.25, 54.5, 70.3, 74.9, 85.2, 97.5];
