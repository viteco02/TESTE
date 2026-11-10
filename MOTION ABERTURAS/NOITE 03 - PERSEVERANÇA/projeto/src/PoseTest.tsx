import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Figure, P, walkPose, Pose} from './Figure';
import {Sky} from './Atmos';
export const PoseTest: React.FC = () => {
  const f = useCurrentFrame(); const list: [string, Pose][] = [['walk', walkPose(f * 0.15, 0.5)], ['stand', P.stand], ['weary', P.weary], ['trip', P.trip], ['fallen', P.fallen], ['kneelUp', P.kneelUp], ['kneelPray', P.kneelPray], ['kneelArms', P.kneelArms], ['kneelHead', P.kneelHead], ['sit', P.sit], ['oneKnee', P.oneKnee], ['carry', walkPose(f * 0.1, 0.6, P.carry)]];
  return (
    <AbsoluteFill><Sky glow={0.8} glowY={0.5} glowX={0.5} />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {list.map(([n, p], i) => <g key={n}><Figure pose={p} x={160 + (i % 6) * 300} y={i < 6 ? 480 : 1000} h={340} robe={n === 'carry'} hood={n !== 'carry'} cross={n === 'carry' ? 1 : 0} pack={n === 'walk' || n === 'weary'} /><text x={110 + (i % 6) * 300} y={i < 6 ? 520 : 1040} fill="#fff" fontSize="26">{n}</text></g>)}
      </svg>
    </AbsoluteFill>
  );
};
