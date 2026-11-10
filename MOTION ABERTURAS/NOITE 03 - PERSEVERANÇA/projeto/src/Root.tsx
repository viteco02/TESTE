import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {PoseTest} from './PoseTest';
import {FPS, H, TOTAL_FRAMES, W} from './theme';
export const Root: React.FC = () => (<>
  <Composition id="Noite03" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: true}} />
  <Composition id="Noite03Mudo" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: false}} />
  <Composition id="PoseTest" component={PoseTest} durationInFrames={60} fps={60} width={1920} height={1080} />
</>);
