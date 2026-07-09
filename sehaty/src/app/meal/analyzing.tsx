import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon, MockPlate, Screen, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import { analyzeMealImage, analyzeMealText } from '@/services/ai';
import { useApp } from '@/state/store';
import type { MealType } from '@/data/types';
import { color, radius, space, tint } from '@/theme/tokens';

const STEPS = ['التعرّف على الأصناف', 'تقدير الكميات', 'حساب السعرات والماكروز...'];

export default function MealAnalyzing() {
  const router = useRouter();
  const { setDraftMeal } = useApp();
  const params = useLocalSearchParams<{ source?: string; text?: string; mealType?: string }>();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;
    const mealType = (params.mealType as MealType) || 'غدا';
    const run = params.source === 'photo'
      ? analyzeMealImage('placeholder', mealType)
      : analyzeMealText(params.text ?? '', mealType);
    run.then((analysis) => {
      if (cancelled) return;
      setDraftMeal(analysis);
      router.replace('/meal/result');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring = (inset: number, opacity: number) => (
    <Animated.View
      style={[
        styles.ring,
        {
          top: inset,
          bottom: inset,
          left: inset,
          right: inset,
          borderColor: `rgba(206,253,130,${opacity})`,
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
          opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.4, 0] }),
        },
      ]}
    />
  );

  return (
    <Screen>
      <TopBar leading="none" />
      <View style={styles.body}>
        <View style={styles.plate}>
          <MockPlate radius={radius.xl} style={StyleSheet.absoluteFill as object} />
          <View style={styles.dim} />
          <View style={styles.center}>
            <View style={styles.core}>
              {ring(-8, 0.15)}
              {ring(-20, 0.08)}
              <Icon name="spark" size={40} color={color.primary} />
            </View>
            <Txt weight="700" size={16} style={{ marginTop: space.xl }}>
              جاري تحليل الوجبة...
            </Txt>
            <Txt size={12} c={color.textTertiary} style={{ marginTop: 6 }}>
              Claude بيتفحّص الصنف والكمية
            </Txt>
          </View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const done = i < 2;
            return (
              <View key={s} style={styles.step}>
                <View style={[styles.stepDot, done ? styles.stepDone : styles.stepPending]}>
                  {done && <Icon name="check" size={10} color={color.onPrimary} strokeWidth={4} />}
                </View>
                <Txt size={13} c={color.textSecondary}>
                  {s}
                </Txt>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xxl, paddingTop: space.sm },
  plate: { width: '100%', aspectRatio: 1, borderRadius: radius.xl, overflow: 'hidden' },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,15,17,0.5)' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  core: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(206,253,130,0.3)', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  steps: { marginTop: space.xl, gap: space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderRadius: radius.md },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: color.primary },
  stepPending: { backgroundColor: tint.primary15, borderWidth: 1.5, borderColor: color.primary },
});
