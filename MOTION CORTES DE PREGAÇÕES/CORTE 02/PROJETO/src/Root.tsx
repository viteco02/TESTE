import React from 'react';
import {Composition} from 'remotion';
import {Fundo, Frente, FPS, W, H, TOTAL} from './Corte';
import plan from './plan.json';
export const Root: React.FC = () => (<>
  <Composition id="Fundo" component={Fundo} durationInFrames={Math.floor((plan as any).dur * FPS)} fps={FPS} width={W} height={H} />
  <Composition id="Corte02" component={Frente} durationInFrames={Math.floor(TOTAL * FPS)} fps={FPS} width={W} height={H} defaultProps={{audio: true}} />
  <Composition id="Corte02Mudo" component={Frente} durationInFrames={Math.floor(TOTAL * FPS)} fps={FPS} width={W} height={H} defaultProps={{audio: false}} />
</>);
