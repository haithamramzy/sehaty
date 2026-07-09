import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color } from '@/theme/tokens';
import { Txt } from './Txt';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  track?: string;
  fill?: string;
  centerTop?: string;
  centerBottom?: string;
}

/** Reusable circular progress ring (calories / water / any goal). */
export function ProgressRing({
  progress,
  size = 96,
  stroke = 8,
  track = color.elevated,
  fill = color.primary,
  centerTop,
  centerBottom,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={fill}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {(centerTop || centerBottom) && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {centerTop && (
            <Txt mono weight="600" size={size * 0.22} c={color.textPrimary}>
              {centerTop}
            </Txt>
          )}
          {centerBottom && (
            <Txt size={size * 0.09} c={color.textMuted}>
              {centerBottom}
            </Txt>
          )}
        </View>
      )}
    </View>
  );
}
