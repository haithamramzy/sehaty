import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { color as tokens } from '@/theme/tokens';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  dot?: boolean;
  pad?: number;
}

/**
 * Smooth (Catmull-Rom → bézier) area line chart. Used for sleep, weight,
 * calorie and mood trends — one unified style across screens.
 */
export function LineChart({
  data,
  width = 320,
  height = 130,
  color = tokens.primary,
  strokeWidth = 2.5,
  fill = true,
  dot = true,
  pad = 8,
}: Props) {
  const gid = useId();
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / span) * innerH;
    return { x, y };
  });

  // Catmull-Rom to cubic bézier for a natural smooth line.
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  const area = `${d} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {fill && <Path d={area} fill={`url(#${gid})`} />}
      <Path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {dot && (
        <>
          <Circle cx={last.x} cy={last.y} r={8} fill={color} fillOpacity={0.25} />
          <Circle cx={last.x} cy={last.y} r={4} fill={color} />
        </>
      )}
    </Svg>
  );
}
