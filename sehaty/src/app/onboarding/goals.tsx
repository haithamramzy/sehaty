import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { OnboardScaffold } from '@/components/OnboardScaffold';
import { Txt } from '@/components';
import { onboardingGoals } from '@/data/mock';
import { useApp } from '@/state/store';
import { color, radius, space } from '@/theme/tokens';

export default function Goals() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set(['تنشيف', 'تحسين النوم']));

  const toggle = (label: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const finish = () => {
    completeOnboarding({ goals: [...selected] });
    router.replace('/(tabs)');
  };

  return (
    <OnboardScaffold
      step={5}
      title="أهدافك الصحية"
      subtitle="اختار اللي يهمّك (تقدر أكتر من واحد)"
      ctaLabel="يلا نبدأ ✨"
      ctaGlow
      onNext={finish}
    >
      <View style={styles.grid}>
        {onboardingGoals.map((g) => {
          const active = selected.has(g.label);
          return (
            <Pressable key={g.label} style={styles.cell} onPress={() => toggle(g.label)}>
              {active ? (
                <LinearGradient
                  colors={[color.surface, color.bgRaised]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.card, styles.cardActive]}
                >
                  <Txt size={28} style={{ marginBottom: 8 }}>
                    {g.emoji}
                  </Txt>
                  <Txt weight="700" size={13} c={color.primary}>
                    {g.label}
                  </Txt>
                </LinearGradient>
              ) : (
                <View style={[styles.card, styles.cardIdle]}>
                  <Txt size={28} style={{ marginBottom: 8 }}>
                    {g.emoji}
                  </Txt>
                  <Txt weight="700" size={13}>
                    {g.label}
                  </Txt>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </OnboardScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47.6%', flexGrow: 1 },
  card: { borderRadius: radius.md, padding: 18, alignItems: 'center' },
  cardIdle: { backgroundColor: color.surface },
  cardActive: {
    borderWidth: 1.5,
    borderColor: color.primary,
    shadowColor: color.primary,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
