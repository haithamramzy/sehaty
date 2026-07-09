import React from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { color, radius, shadow, space, tint } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'ai';

interface Props extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  icon?: IconName;
  full?: boolean;
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * Three button styles from the component library:
 * primary (filled green + glow), secondary (outline), ai (purple tint + spark).
 */
export function Button({ label, variant = 'primary', icon, full = true, glow = true, style, ...rest }: Props) {
  const content = (
    <View style={styles.row}>
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={variant === 'primary' ? color.onPrimary : variant === 'ai' ? color.aiSoft : color.textPrimary}
        />
      )}
      <Txt
        weight="700"
        size={15}
        c={variant === 'primary' ? color.onPrimary : variant === 'ai' ? color.aiSoft : color.textPrimary}
      >
        {label}
      </Txt>
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable {...rest} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, full && styles.full, style]}>
        <LinearGradient
          colors={[color.primary, color.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.base, glow && shadow.primaryGlow]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'ai'
      ? { backgroundColor: tint.ai15, borderColor: tint.ai30, borderWidth: 1 }
      : { backgroundColor: 'transparent', borderColor: color.borderMuted, borderWidth: 1 };

  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [styles.base, bg, { opacity: pressed ? 0.85 : 1 }, full && styles.full, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.lg,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
