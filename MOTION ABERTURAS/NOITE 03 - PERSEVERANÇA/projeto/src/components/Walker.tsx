import React from 'react';

/** Silhueta humana simples (traço) para multidões e figuras distantes. */
export const Walker: React.FC<{x: number; y: number; s?: number; phase: number; color?: string; dir?: 1 | -1; walk?: boolean}> =
({x, y, s = 1, phase, color = '#05090B', dir = 1, walk = true}) => {
  const a = walk ? Math.sin(phase) : 0;
  const b = walk ? Math.sin(phase + Math.PI) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`} stroke={color} fill={color} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={0} cy={-98} r={10} />
      <line x1={0} y1={-84} x2={0} y2={-42} strokeWidth={20} />
      <line x1={0} y1={-40} x2={a * 16} y2={-20} strokeWidth={10} />
      <line x1={a * 16} y1={-20} x2={a * 22} y2={0} strokeWidth={9} />
      <line x1={0} y1={-40} x2={b * 16} y2={-20} strokeWidth={10} />
      <line x1={b * 16} y1={-20} x2={b * 22} y2={0} strokeWidth={9} />
      <line x1={0} y1={-78} x2={b * 14} y2={-52} strokeWidth={7} />
      <line x1={0} y1={-78} x2={a * 14} y2={-52} strokeWidth={7} />
    </g>
  );
};
