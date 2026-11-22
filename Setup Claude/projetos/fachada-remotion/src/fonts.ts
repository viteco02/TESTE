import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, string][] = [
  ['Anton', 'fonts/anton-latin-400-normal.woff2', '400'],
  ['Barlow Condensed', 'fonts/barlow-condensed-latin-600-normal.woff2', '600'],
  ['Barlow Condensed', 'fonts/barlow-condensed-latin-700-normal.woff2', '700'],
  ['Inter', 'fonts/inter-latin-500-normal.woff2', '500'],
  ['Inter', 'fonts/inter-latin-700-normal.woff2', '700'],
  ['Montserrat', 'fonts/montserrat-latin-600-normal.woff2', '600'],
  ['Montserrat', 'fonts/montserrat-latin-700-normal.woff2', '700'],
];
const italics: [string, string, string][] = [
  ['Montserrat', 'fonts/montserrat-latin-800-italic.woff2', '800'],
  ['Montserrat', 'fonts/montserrat-latin-900-italic.woff2', '900'],
];
let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const h = delayRender('fonts');
  Promise.all(
    [...faces.map((f) => [...f, 'normal'] as [string, string, string, string]), ...italics.map((f) => [...f, 'italic'] as [string, string, string, string])].map(async ([family, file, weight, style]) => {
      const ff = new FontFace(family, `url(${staticFile(file)})`, {weight, style});
      await ff.load();
      document.fonts.add(ff);
    })
  ).then(() => continueRender(h)).catch((e) => { console.error(e); continueRender(h); });
};
