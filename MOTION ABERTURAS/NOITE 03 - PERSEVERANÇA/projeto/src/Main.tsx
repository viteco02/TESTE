import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {C, TOTAL_FRAMES, fr} from './theme';
import {loadFonts} from './styles/fonts';
import {sceneStart, sceneEnd} from './scenes_common';
import {S01, S02, S03, S04} from './scenes/A';
import {S05, S06, S07, S08} from './scenes/B';
import {S09, S10, S11, S12, S13} from './scenes/C';
loadFonts();
const scenes = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13];
export const Main: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill style={{background: C.night}}>
    {scenes.map((S, i) => { const a = sceneStart(i + 1), b = sceneEnd(i + 1), last = i === scenes.length - 1;
      return <Sequence key={i} from={fr(a)} durationInFrames={last ? TOTAL_FRAMES - fr(a) : fr(b - a + 1.0)} layout="none"><S /></Sequence>; })}
    {audio && <Audio src={staticFile('audio/mix_final.wav')} />}
  </AbsoluteFill>
);
