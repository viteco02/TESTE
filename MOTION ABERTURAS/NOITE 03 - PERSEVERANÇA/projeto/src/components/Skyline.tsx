import React, {useMemo} from 'react';
import {rand} from '../utils/anim';

type Props = {
  seed: number; width: number; height: number; minH: number; maxH: number;
  color: string; lit?: string; litProb?: number; light?: number; style?: React.CSSProperties;
};

/** Camada de prédios procedural (silhueta + janelas acesas). `light` 0..1 controla a luz da cidade. */
export const Skyline: React.FC<Props> = ({seed, width, height, minH, maxH, color, lit = '#F7D774', litProb = 0.22, light = 1, style}) => {
  const {rects, windows} = useMemo(() => {
    const rects: {x: number; y: number; w: number; h: number}[] = [];
    let wins = '';
    let x = -20, i = 0;
    while (x < width + 20) {
      const w = 60 + rand(seed + i * 3.1) * 120;
      const h = minH + rand(seed + i * 5.7) * (maxH - minH);
      rects.push({x, y: height - h, w, h});
      const cols = Math.max(1, Math.floor((w - 16) / 20));
      const rows = Math.floor((h - 20) / 30);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (rand(seed * 7 + i * 101 + r * 17 + c * 3) < litProb) {
          const wx = x + 10 + c * 20, wy = height - h + 14 + r * 30;
          wins += `M${wx.toFixed(0)} ${wy.toFixed(0)}h9v13h-9z`;
        }
      }
      x += w + rand(seed + i * 9.3) * 6;
      i++;
    }
    return {rects, windows: wins};
  }, [seed, width, height, minH, maxH, litProb]);
  return (
    <svg width={width} height={height} style={{display: 'block', ...style}}>
      {rects.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height={r.h} fill={color} />)}
      <path d={windows} fill={lit} opacity={light} />
    </svg>
  );
};
