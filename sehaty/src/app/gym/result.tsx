import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Button, Icon, Txt } from '@/components';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { getGymDraft, setGymDraft } from '@/state/gymDraft';
import { useApp } from '@/state/store';
import { color, radius, shadow, space, tint } from '@/theme/tokens';

/** 0 = الأحد … 6 = السبت (JS getDay()). */
const DAY_NAMES = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
/** Egyptian week order: السبت أولًا. */
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

/** "جهاز جديد" — AI gym-machine breakdown + add to weekly plan. */
export default function GymResult() {
  const router = useRouter();
  const { addEquipment, upsertWorkoutDay, workoutPlan } = useApp();
  const [draft] = useState(getGymDraft);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!draft) return <Redirect href="/(tabs)" />;

  const addToDay = (dayOfWeek: number) => {
    const eq = addEquipment(draft);
    const existing = workoutPlan.find((d) => d.dayOfWeek === dayOfWeek)?.exercises ?? [];
    upsertWorkoutDay({
      dayOfWeek,
      exercises: [...existing, { name: eq.name, sets: 3, reps: '12', equipmentId: eq.id }],
    });
    setGymDraft(null);
    router.replace('/gym/plan');
  };

  return (
    <Screen>
      <TopBar title="جهاز جديد" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.body}>
          {/* Photo placeholder header */}
          <View style={styles.photo}>
            <Icon name="image" size={36} color={color.textMuted} strokeWidth={1.5} />
            <Txt size={11} c={color.textMuted} style={{ marginTop: space.sm }}>
              صورة الجهاز
            </Txt>
            <View style={styles.aiTag}>
              <Icon name="spark" size={10} color="#fff" />
              <Txt size={10} weight="600" c="#fff">
                تحليل AI
              </Txt>
            </View>
          </View>

          <Txt weight="900" size={20} style={{ marginBottom: space.lg }}>
            {draft.name}
          </Txt>

          {/* Target muscles */}
          <Txt weight="700" size={14} c={color.textSecondary} style={{ marginBottom: space.sm }}>
            العضلات المستهدفة
          </Txt>
          <View style={styles.chips}>
            {draft.targetMuscles.map((m) => (
              <View key={m} style={styles.chip}>
                <Txt size={12} weight="600" c={color.primary}>
                  {m}
                </Txt>
              </View>
            ))}
          </View>

          {/* Usage steps */}
          <Txt weight="700" size={14} c={color.textSecondary} style={{ marginBottom: space.sm }}>
            خطوات الاستخدام
          </Txt>
          <View style={{ gap: space.sm }}>
            {draft.usageSteps.map((s, i) => (
              <View key={s} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Txt mono weight="600" size={12} c={color.primary}>
                    {i + 1}
                  </Txt>
                </View>
                <Txt size={13} c={color.textSecondary} lh={20} style={{ flex: 1 }}>
                  {s}
                </Txt>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button label="إضافة لخطة تمريني" icon="plus" onPress={() => setPickerOpen(true)} />
      </View>

      {/* Day picker sheet */}
      {pickerOpen && (
        <View style={StyleSheet.absoluteFill as object}>
          <Pressable style={styles.scrim} onPress={() => setPickerOpen(false)} />
          <View style={styles.panelWrap} pointerEvents="box-none">
            <View style={styles.panel}>
              <View style={styles.grabber} />
              <Txt center weight="900" size={18}>
                هتتمرّن عليه إمتى؟
              </Txt>
              <Txt center size={12} c={color.textTertiary} style={{ marginTop: 6, marginBottom: space.xl }}>
                اختار اليوم اللي هنضيف له التمرين
              </Txt>
              <View style={styles.days}>
                {WEEK_ORDER.map((d) => (
                  <Pressable key={d} style={styles.dayChip} onPress={() => addToDay(d)}>
                    <Txt size={13} weight="600">
                      {DAY_NAMES[d]}
                    </Txt>
                  </Pressable>
                ))}
              </View>
              <Button
                label="إلغاء"
                variant="secondary"
                onPress={() => setPickerOpen(false)}
                style={{ marginTop: space.lg }}
              />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.sm },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  aiTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(109,74,255,0.9)',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xl },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: tint.primary12,
    borderWidth: 1,
    borderColor: tint.primaryGlow,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tint.primary15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    paddingTop: space.lg,
    backgroundColor: color.bg,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tint.scrim },
  panelWrap: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: color.bgRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    ...shadow.sheet,
  },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: color.borderMuted, alignSelf: 'center', marginBottom: space.lg },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  dayChip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderMuted,
  },
});
