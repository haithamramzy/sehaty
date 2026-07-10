import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { color, radius, space } from '@/theme/tokens';

interface Props extends ViewProps {
  /** surface (#1C1C20, default) or raised (#141418). */
  variant?: 'surface' | 'raised';
  pad?: number;
  r?: number;
}

export function Card({ variant = 'surface', pad = space.lg, r = radius.lg, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { backgroundColor: variant === 'raised' ? color.bgRaised : color.surface, padding: pad, borderRadius: r },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
