import React from 'react';
import {Composition} from 'remotion';
import {Corte, FPS, W, H, TOTAL} from './Corte';
export const Root: React.FC = () => (<>
  <Composition id="Corte04" component={Corte} durationInFrames={Math.floor(TOTAL * FPS)} fps={FPS} width={W} height={H} defaultProps={{audio: true}} />
  <Composition id="Corte04Mudo" component={Corte} durationInFrames={Math.floor(TOTAL * FPS)} fps={FPS} width={W} height={H} defaultProps={{audio: false}} />
</>);
