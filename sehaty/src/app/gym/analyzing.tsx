import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon, Screen, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import { analyzeGymImage } from '@/services/ai';
import { setGymDraft } from '@/state/gymDraft';
import { color, radius, space, tint } from '@/theme/tokens';

const STEPS = ['التعرّف على الجهاز', 'تحديد العضلات'];

/** Gym-machine photo analysis — same pattern as meal/analyzing. */
export default function GymAnalyzing() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
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
    analyzeGymImage(params.uri ?? 'placeholder').then((analysis) => {
      if (cancelled) return;
      setGymDraft(analysis);
      router.replace('/gym/result');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring = (inset: number) => (
    <Animated.View
      style={[
        styles.ring,
        {
          top: inset,
          bottom: inset,
          left: inset,
          right: inset,
          borderColor: tint.primaryGlow,
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
        <View style={styles.frame}>
          <View style={styles.center}>
            <View style={styles.core}>
              {ring(-8)}
              {ring(-20)}
              <Icon name="spark" size={40} color={color.primary} />
            </View>
            <Txt weight="700" size={16} style={{ marginTop: space.xl }}>
              جاري تحليل الجهاز...
            </Txt>
            <Txt size={12} c={color.textTertiary} style={{ marginTop: 6 }}>
              Claude بيتعرّف على الجهاز والعضلات
            </Txt>
          </View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const done = i < 1;
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
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  core: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(206,253,130,0.3)', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  steps: { marginTop: space.xl, gap: space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderRadius: radius.md },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: color.primary },
  stepPending: { backgroundColor: tint.primary15, borderWidth: 1.5, borderColor: color.primary },
});
