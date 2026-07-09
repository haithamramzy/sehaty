import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

import { color, radius, space } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

/** Maps our real tab route names to labels/icons. */
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'الرئيسية', icon: 'home' },
  chat: { label: 'الشات', icon: 'chat' },
  reports: { label: 'التقارير', icon: 'chart' },
};

/**
 * Structural subset of react-navigation's BottomTabBarProps that we consume.
 * (The full type isn't re-exported from expo-router's top-level entry.)
 */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  // react-navigation's helpers have precise generic types; we only touch a subset.
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
}

/**
 * Glassmorphic bottom navigation with a central raised FAB.
 * Slots (start→end in RTL): الرئيسية · السجل · [ + FAB ] · الشات · التقارير.
 * السجل → water log, FAB → quick-log sheet, rest are real tabs.
 */
export function TabBar({ state, navigation }: TabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true as const });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <BlurView intensity={40} tint="dark" style={[styles.bar, { paddingBottom: insets.bottom || space.md }]}>
      <View style={styles.topBorder} />
      <View style={styles.row}>
        <TabItem
          meta={TAB_META.index}
          active={activeName === 'index'}
          onPress={() => go('index')}
        />
        <TabItem
          meta={{ label: 'السجل', icon: 'list' }}
          active={false}
          onPress={() => router.push('/water')}
        />

        {/* Center FAB */}
        <View style={styles.fabSlot}>
          <Pressable
            onPress={() => router.push('/quick-log')}
            style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Icon name="plus" size={26} color={color.onPrimary} strokeWidth={2.5} />
          </Pressable>
        </View>

        <TabItem
          meta={TAB_META.chat}
          active={activeName === 'chat'}
          onPress={() => go('chat')}
          badge
        />
        <TabItem
          meta={TAB_META.reports}
          active={activeName === 'reports'}
          onPress={() => go('reports')}
        />
      </View>
    </BlurView>
  );
}

function TabItem({
  meta,
  active,
  onPress,
  badge = false,
}: {
  meta: { label: string; icon: IconName };
  active: boolean;
  onPress: () => void;
  badge?: boolean;
}) {
  const tint = active ? color.primary : color.textMuted;
  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={8}>
      <View>
        <Icon name={meta.icon} size={22} color={tint} />
        {badge && <View style={styles.badge} />}
      </View>
      <Txt size={9} c={tint} style={{ marginTop: 3 }}>
        {meta.label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(15,15,17,0.85)',
    paddingTop: space.md,
  },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: color.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.sm },
  item: { flex: 1, alignItems: 'center' },
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    marginTop: -24,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: color.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.ai,
  },
});
