import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color } from '@/theme/tokens';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  /** Extra bottom padding to clear the tab bar / floating CTA. */
  bottomInset?: number;
  bg?: string;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/** Dark full-bleed screen wrapper with safe-area handling. */
export function Screen({
  children,
  scroll = false,
  bottomInset = 0,
  bg = color.bg,
  contentStyle,
  edges = ['top'],
}: Props) {
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: bg }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[{ paddingBottom: bottomInset }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
