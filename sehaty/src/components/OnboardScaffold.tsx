import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { color, radius, space } from '@/theme/tokens';
import { Button } from './Button';
import { Icon } from './Icon';
import { Screen } from './Screen';
import { Txt } from './Txt';

interface Props {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onNext: () => void;
  ctaGlow?: boolean;
  children: React.ReactNode;
}

/** Shared chrome for onboarding steps 2–5: back + progress bar + counter, CTA pinned bottom. */
export function OnboardScaffold({ step, total = 5, title, subtitle, ctaLabel, onNext, ctaGlow = false, children }: Props) {
  const router = useRouter();
  return (
    <Screen bottomInset={0}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="arrowLeft" size={20} color={color.textMuted} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
        </View>
        <Txt mono size={11} c={color.textMuted}>
          {step}/{total}
        </Txt>
      </View>

      <View style={styles.body}>
        <Txt weight="900" size={26} lh={34}>
          {title}
        </Txt>
        {subtitle && (
          <Txt size={14} c={color.textTertiary} style={{ marginTop: 8, marginBottom: space.xl }}>
            {subtitle}
          </Txt>
        )}
        <View style={{ flex: 1 }}>{children}</View>
      </View>

      <View style={styles.footer}>
        <Button label={ctaLabel} onPress={onNext} glow={ctaGlow} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xxl,
    paddingTop: space.lg,
    marginBottom: space.xl,
  },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: color.elevated, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: color.primary, borderRadius: 2 },
  body: { flex: 1, paddingHorizontal: space.xxl },
  footer: { paddingHorizontal: space.xxl, paddingBottom: space.xxl, paddingTop: space.md },
});
