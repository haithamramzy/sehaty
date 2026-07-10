import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { color, radius, space } from '@/theme/tokens';
import { Txt } from './Txt';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/** Small selectable pill used for filter bars and option pickers. */
export function Chip({ label, active = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.active, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Txt weight="600" size={12} c={active ? color.onPrimary : color.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  active: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
});
