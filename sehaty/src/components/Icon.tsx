import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color as tokens } from '@/theme/tokens';

export type IconName =
  | 'spark'
  | 'heart'
  | 'camera'
  | 'plus'
  | 'check'
  | 'drop'
  | 'moon'
  | 'clock'
  | 'steps'
  | 'send'
  | 'image'
  | 'arrowLeft'
  | 'arrowRight'
  | 'x'
  | 'edit'
  | 'home'
  | 'list'
  | 'chat'
  | 'chart'
  | 'user'
  | 'flash';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Icons whose main color is a fill (solid glyphs) rather than a stroke. */
const FILLED: Partial<Record<IconName, true>> = {
  spark: true,
  heart: true,
  drop: true,
  moon: true,
  steps: true,
};

export function Icon({ name, size = 24, color = tokens.textPrimary, strokeWidth = 2 }: Props) {
  const filled = FILLED[name];
  const stroke = filled ? 'none' : color;
  const fill = filled ? color : 'none';
  const common = { stroke, strokeWidth, fill, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'spark' && (
        <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill={color} />
      )}
      {name === 'heart' && (
        <Path d="M12 21s-7-4.5-7-11a5 5 0 019-3 5 5 0 019 3c0 6.5-7 11-7 11z" fill={color} />
      )}
      {name === 'drop' && <Path d="M12 2s-6 8-6 13a6 6 0 0012 0c0-5-6-13-6-13z" fill={color} />}
      {name === 'moon' && <Path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" fill={color} />}
      {name === 'steps' && <Path d="M13 3l4 4-7 7-4-4z M6 10l-4 4 4 4 4-4z" fill={color} />}

      {name === 'camera' && (
        <>
          <Path d="M4 8h3l2-2h6l2 2h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" {...common} />
          <Circle cx={12} cy={13} r={4} {...common} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'check' && <Path d="M4 12l6 6L20 6" {...common} />}
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      )}
      {name === 'send' && <Path d="M4 12l16-8-8 16-2-6z" {...common} />}
      {name === 'image' && (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={2} {...common} />
          <Path d="M21 15l-5-5L5 21" {...common} />
          <Circle cx={9} cy={9} r={1.5} fill={color} stroke="none" />
        </>
      )}
      {name === 'arrowLeft' && <Path d="M19 12H5M12 19l-7-7 7-7" {...common} />}
      {name === 'arrowRight' && <Path d="M5 12h14M12 5l7 7-7 7" {...common} />}
      {name === 'x' && <Path d="M6 6l12 12M6 18L18 6" {...common} />}
      {name === 'edit' && <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" {...common} />}
      {name === 'flash' && <Path d="M13 2L3 14h7l-1 8 10-12h-7z" {...common} />}

      {name === 'home' && <Path d="M3 10.5L12 3l9 7.5M5 9.5V20h14V9.5" {...common} />}
      {name === 'list' && <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...common} />}
      {name === 'chat' && <Path d="M21 11.5a8.5 8.5 0 01-12 7.7L3 21l1.8-6A8.5 8.5 0 1121 11.5z" {...common} />}
      {name === 'chart' && <Path d="M3 3v18h18M8 14v4M13 9v9M18 5v13" {...common} />}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} {...common} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...common} />
        </>
      )}
    </Svg>
  );
}
