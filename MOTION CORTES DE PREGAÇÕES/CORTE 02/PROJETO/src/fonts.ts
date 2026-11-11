import {continueRender, delayRender, staticFile} from 'remotion';
const faces: [string, string, string, string][] = [
  ['Inter Tight', 'fonts/inter-tight-latin-700-normal.woff2', '700', 'normal'],
  ['Inter Tight', 'fonts/inter-tight-latin-800-normal.woff2', '800', 'normal'],
  ['Inter Tight', 'fonts/inter-tight-latin-900-normal.woff2', '900', 'normal'],
  ['Instrument Serif', 'fonts/instrument-serif-latin-400-italic.woff2', '400', 'italic'],
];
let started = false;
export const loadFonts = () => {
  if (started) return; started = true;
  const h = delayRender('fonts');
  Promise.all(faces.map(([fam, url, w, st]) => { const f = new FontFace(fam, `url(${staticFile(url)})`, {weight: w, style: st}); return f.load().then((ff) => (document as any).fonts.add(ff)); }))
    .then(() => continueRender(h)).catch(() => continueRender(h));
};
