import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { color, radius, space } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

interface Props {
  title?: string;
  /** 'back' arrow or 'close' X. */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  right?: React.ReactNode;
}

/** Standard screen header: leading control (start), centered title, optional right slot. */
export function TopBar({ title, leading = 'back', onLeadingPress, right }: Props) {
  const router = useRouter();
  const handleLeading = onLeadingPress ?? (() => router.back());

  return (
    <View style={styles.bar}>
      {leading === 'none' ? (
        <View style={styles.iconBtn} />
      ) : (
        <IconButton name={leading === 'back' ? 'arrowLeft' : 'x'} onPress={handleLeading} />
      )}
      {title ? (
        <Txt weight="700" size={16}>
          {title}
        </Txt>
      ) : (
        <View />
      )}
      {right ?? <View style={styles.iconBtn} />}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  bg = color.surface,
  tint = color.textSecondary,
  active = false,
}: {
  name: IconName;
  onPress?: () => void;
  bg?: string;
  tint?: string;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: active ? color.primary : bg, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={name} size={18} color={active ? color.onPrimary : tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
