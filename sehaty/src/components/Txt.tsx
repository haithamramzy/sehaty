import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

import { cairoForWeight, color, font } from '@/theme/tokens';

type Weight = '400' | '600' | '700' | '900';

interface Props extends TextProps {
  size?: number;
  weight?: Weight;
  /** Any token color or raw hex. Defaults to primary text (white). */
  c?: string;
  /** Monospace (JetBrains Mono) — for numbers/measurements. */
  mono?: boolean;
  center?: boolean;
  lh?: number;
}

/**
 * Themed text. Cairo by default (RTL Arabic), JetBrains Mono when `mono`.
 * Maps design weights (400/600/700/900) onto the correct Cairo family file.
 */
export function Txt({
  size = 14,
  weight = '400',
  c = color.textPrimary,
  mono = false,
  center = false,
  lh,
  style,
  ...rest
}: Props) {
  const family = mono
    ? weight === '600' || weight === '700' || weight === '900'
      ? font.monoSemibold
      : font.mono
    : cairoForWeight[weight];

  const base: TextStyle = {
    fontFamily: family,
    fontSize: size,
    color: c,
    ...(lh ? { lineHeight: lh } : null),
    ...(center ? { textAlign: 'center' } : null),
    ...(mono ? { fontVariant: ['tabular-nums'] } : null),
  };

  return <Text {...rest} style={[base, style]} />;
}
