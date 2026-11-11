import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {rand} from '../utils/anim';

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.28}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <div style={{
        position: 'absolute', left: -200, top: -200, width: 1480, height: 2320,
        backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '512px 512px',
        transform: `translate(${rand(k) * 160}px, ${rand(k + 9) * 160}px)`,
      }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.7}) => (
  <AbsoluteFill style={{
    pointerEvents: 'none',
    background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,${strength}) 100%)`,
  }} />
);

export const Backdrop: React.FC<{
  from?: string; to?: string; angle?: number; vignette?: number; grain?: number; children?: React.ReactNode;
}> = ({from = C.blueDeep, to = C.navy, angle = 180, vignette = 0.6, grain = 0.28, children}) => (
  <AbsoluteFill style={{background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`, overflow: 'hidden'}}>
    {children}
    <Vignette strength={vignette} />
    <Grain opacity={grain} />
  </AbsoluteFill>
);
