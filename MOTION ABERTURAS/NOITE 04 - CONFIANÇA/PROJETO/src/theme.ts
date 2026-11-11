export const C = {blue: '#2368F2', blueHi: '#4A8BFF', blueDeep: '#123FC0', navy: '#0A2A93', ink: '#061A66', night: '#030E3A', white: '#FFFFFF', lime: '#C8FF2E', limeDark: '#8FBF10'};
export const FPS = 60, W = 1920, H = 1080;
export const FONT = {title: "'Montserrat', 'Arial Black', sans-serif", body: "'Montserrat', Arial, sans-serif", display: "'Anton', Impact, sans-serif", cond: "'Barlow Condensed', 'Arial Narrow', sans-serif"};
export const AUDIO_SEC = 93.231;
export const TOTAL_FRAMES = Math.floor(AUDIO_SEC * FPS);
export const fr = (s: number) => Math.round(s * FPS);
