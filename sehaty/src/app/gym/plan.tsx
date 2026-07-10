import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Txt } from '@/components';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/state/store';
import type { WorkoutExercise } from '@/data/types';
import { color, radius, space } from '@/theme/tokens';

/** 0 = الأحد … 6 = السبت (JS getDay()). */
const DAY_NAMES = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
/** Egyptian week order: السبت أولًا. */
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

/** "خطة الأسبوع · تمريني" — weekly workout plan grouped by weekday. */
export default function GymPlan() {
  const router = useRouter();
  const { workoutPlan, equipment } = useApp();
  const today = new Date().getDay();

  const equipmentName = (ex: WorkoutExercise) =>
    ex.equipmentId ? equipment.find((e) => e.id === ex.equipmentId)?.name : undefined;

  return (
    <Screen>
      <TopBar
        title="خطة الأسبوع · تمريني"
        onLeadingPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {WEEK_ORDER.map((d) => {
          const day = workoutPlan.find((w) => w.dayOfWeek === d);
          const exercises = day?.exercises ?? [];
          const isToday = d === today;
          return (
            <Card key={d} style={[styles.dayCard, isToday && styles.todayCard]}>
              <View style={styles.dayHeader}>
                <Txt weight="700" size={15}>
                  {DAY_NAMES[d]}
                </Txt>
                {isToday && (
                  <View style={styles.todayTag}>
                    <Txt size={10} weight="700" c={color.onPrimary}>
                      النهارده
                    </Txt>
                  </View>
                )}
              </View>

              {exercises.length === 0 ? (
                <View style={styles.restRow}>
                  <Txt size={12} c={color.textMuted}>
                    يوم راحة
                  </Txt>
                </View>
              ) : (
                <View style={{ gap: space.sm }}>
                  {exercises.map((ex, i) => {
                    const eqName = equipmentName(ex);
                    return (
                      <View key={`${ex.name}-${i}`} style={styles.exRow}>
                        <View style={{ flex: 1 }}>
                          <Txt weight="600" size={13}>
                            {ex.name}
                          </Txt>
                          {eqName && (
                            <Txt size={10} c={color.textMuted}>
                              الجهاز: {eqName}
                            </Txt>
                          )}
                        </View>
                        {(ex.sets != null || ex.reps != null) && (
                          <Txt mono size={12} c={color.primary}>
                            {ex.sets ?? '-'}×{ex.reps ?? '-'}
                          </Txt>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          );
        })}

        <Button
          label="＋ صوّر جهاز جديد"
          variant="secondary"
          onPress={() => router.push('/meal/camera?mode=gym')}
          style={{ marginTop: space.sm }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxxl, gap: space.md },
  dayCard: { gap: space.md },
  todayCard: { borderWidth: 1.5, borderColor: color.primary },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayTag: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.primary,
  },
  restRow: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: color.bgRaised,
    alignItems: 'center',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.bgRaised,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
