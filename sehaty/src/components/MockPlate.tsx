import React, { useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Warm "food photo" placeholder used wherever the design shows a captured meal
 * before real camera images exist (meal thumbnail, analyzing, chat bubble).
 */
export function MockPlate({ radius = 16, style }: { radius?: number; style?: ViewStyle }) {
  const a = useId();
  const b = useId();
  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={a} cx="35%" cy="40%" r="70%">
            <Stop offset="0" stopColor="#3a2a1c" />
            <Stop offset="0.6" stopColor="#1a1410" />
            <Stop offset="1" stopColor="#0d0a08" />
          </RadialGradient>
          <RadialGradient id={b} cx="62%" cy="62%" r="45%">
            <Stop offset="0" stopColor="rgba(160,90,40,0.45)" />
            <Stop offset="1" stopColor="rgba(160,90,40,0)" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${a})`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${b})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#1a1410' },
});
