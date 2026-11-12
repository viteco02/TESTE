import React from 'react';
import {Composition} from 'remotion';
import {Main, AUDIO_SEC} from './Main';
const FPS = 30;
export const Root: React.FC = () => (<>
  <Composition id="Noite05" component={Main} durationInFrames={Math.round(AUDIO_SEC * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{audio: true, tail: 0}} />
  <Composition id="Noite05Cauda" component={Main} durationInFrames={Math.round((AUDIO_SEC + 3) * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{audio: true, tail: 3}} />
  <Composition id="Noite05Mudo" component={Main} durationInFrames={Math.round((AUDIO_SEC + 3) * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{audio: false, tail: 3}} />
</>);
