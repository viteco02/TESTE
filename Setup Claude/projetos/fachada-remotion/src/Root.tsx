import React from 'react';
import {Composition} from 'remotion';
import {Fachada, FPS, W, H, DUR} from './Fachada';
import {FachadaAzul} from './FachadaAzul';
import {Doacao, DoacaoV, DFPS, DW, DH, DDUR, SLOW} from './Doacao';
export const Root: React.FC = () => (<>
  <Composition id="Fachada" component={Fachada} durationInFrames={DUR * FPS} fps={FPS} width={W} height={H} />
  <Composition id="FachadaAzul" component={FachadaAzul} durationInFrames={DUR * FPS} fps={FPS} width={W} height={H} />
  <Composition id="Doacao" component={Doacao} durationInFrames={Math.round(DDUR * SLOW * DFPS)} fps={DFPS} width={DW} height={DH} />
  <Composition id="DoacaoV" component={DoacaoV} durationInFrames={Math.round(DDUR * SLOW * DFPS)} fps={DFPS} width={1080} height={1920} />
</>);
