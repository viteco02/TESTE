import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, H, TOTAL_FRAMES, W} from './theme';
export const Root: React.FC = () => (<>
  <Composition id="Noite04" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: true}} />
  <Composition id="Noite04Mudo" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: false}} />
</>);
