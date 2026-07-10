import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { OnboardScaffold } from '@/components/OnboardScaffold';
import { Icon, Txt } from '@/components';
import { activityLevels } from '@/data/mock';
import { color, radius, space, tint } from '@/theme/tokens';

export default function Activity() {
  const router = useRouter();
  const [selected, setSelected] = useState(1);

  return (
    <OnboardScaffold
      step={3}
      title="شغلك ونشاطك؟"
      subtitle="اختار الأقرب لأسلوب حياتك"
      ctaLabel="التالي"
      onNext={() => router.push('/onboarding/goals')}
    >
      <View style={{ gap: space.md }}>
        {activityLevels.map((lvl, i) => {
          const active = i === selected;
          const inner = (
            <>
              <View style={[styles.emoji, { backgroundColor: active ? tint.primary15 : color.elevated }]}>
                <Txt size={22}>{lvl.emoji}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="700" size={15} c={active ? color.primary : color.textPrimary}>
                  {lvl.title}
                </Txt>
                <Txt size={12} c={active ? color.textTertiary : color.textMuted}>
                  {lvl.sub}
                </Txt>
              </View>
              {active && (
                <View style={styles.check}>
                  <Icon name="check" size={12} color={color.onPrimary} strokeWidth={4} />
                </View>
              )}
            </>
          );
          return (
            <Pressable key={lvl.title} onPress={() => setSelected(i)}>
              {active ? (
                <LinearGradient
                  colors={[color.surface, color.bgRaised]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.card, styles.cardActive]}
                >
                  {inner}
                </LinearGradient>
              ) : (
                <View style={[styles.card, styles.cardIdle]}>{inner}</View>
              )}
            </Pressable>
          );
        })}
      </View>
    </OnboardScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: 18,
    borderRadius: radius.md,
  },
  cardIdle: { backgroundColor: color.surface },
  cardActive: {
    borderWidth: 1.5,
    borderColor: color.primary,
    shadowColor: color.primary,
    shadowOpacity: 0.15,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  emoji: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
});
