import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Screen, Sheet, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/state/store';
import { color, font, radius, space, tint } from '@/theme/tokens';

/** Sleep accent — the purple family per the design. */
const SLEEP_ACCENT = color.aiSoft;

const QUALITY_LEVELS: { level: number; emoji: string; label: string }[] = [
  { level: 1, emoji: '😖', label: 'سيئ جدًا' },
  { level: 2, emoji: '😕', label: 'سيئ' },
  { level: 3, emoji: '😐', label: 'متوسطة' },
  { level: 4, emoji: '🙂', label: 'كويس' },
  { level: 5, emoji: '😴', label: 'ممتاز' },
];

/** JS getDay() → Arabic weekday initial (0 = الأحد). */
const DAY_INITIALS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

/** 5.2 hours → "5:12". */
function fmtHours(h: number): string {
  const hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  let outH = hh;
  if (mm === 60) {
    outH += 1;
    mm = 0;
  }
  return `${outH}:${String(mm).padStart(2, '0')}`;
}

function qualityLabel(q: number | null): string {
  const found = QUALITY_LEVELS.find((x) => x.level === q);
  return found ? found.label : '—';
}

function dayInitial(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return DAY_INITIALS[d.getDay()] ?? '';
}

export default function Sleep() {
  const router = useRouter();
  const { sleepWeek, lastSleep, logSleep, profile } = useApp();
  const target = profile.sleepTargetHours;

  const [editorOpen, setEditorOpen] = useState(false);
  const [hours, setHours] = useState<number>(lastSleep?.hours ?? 7);
  const [quality, setQuality] = useState<number>(lastSleep?.quality ?? 3);
  const [coffee, setCoffee] = useState<string>('');
  const [cigarette, setCigarette] = useState<string>('');

  const reachedTarget = (lastSleep?.hours ?? 0) >= target;

  // Oldest → newest so the latest night sits at the end of the row.
  const week = [...sleepWeek].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const maxHours = Math.max(target, ...week.map((s) => s.hours), 1);

  const openEditor = () => {
    setHours(lastSleep?.hours ?? 7);
    setQuality(lastSleep?.quality ?? 3);
    setCoffee(lastSleep?.lastCoffeeTime ?? '');
    setCigarette(lastSleep?.lastCigaretteTime ?? '');
    setEditorOpen(true);
  };

  const save = () => {
    logSleep({
      hours,
      quality,
      lastCoffeeTime: coffee.trim() || undefined,
      lastCigaretteTime: cigarette.trim() || undefined,
    });
    setEditorOpen(false);
    router.back();
  };

  return (
    <Screen scroll bottomInset={40}>
      <TopBar title="النوم" />

      <View style={styles.body}>
        {/* Hero — last night */}
        <Card style={styles.hero}>
          <Txt size={12} c={color.textMuted}>
            الليلة اللي فاتت 🌙
          </Txt>
          <View style={styles.heroNum}>
            <Txt mono weight="600" size={52} lh={56} c={SLEEP_ACCENT}>
              {lastSleep ? fmtHours(lastSleep.hours) : '—'}
            </Txt>
            <Txt mono size={16} c={color.textMuted}>
              {' '}
              / {fmtHours(target)} س
            </Txt>
          </View>
          <View style={styles.heroMeta}>
            <View
              style={[
                styles.chip,
                { backgroundColor: reachedTarget ? tint.primary12 : tint.warning12 },
              ]}
            >
              <Txt size={11} weight="700" c={reachedTarget ? color.primary : color.warning}>
                {reachedTarget ? 'وصلت هدفك' : 'أقل من هدفك'}
              </Txt>
            </View>
            <Txt size={12} c={color.textTertiary}>
              الجودة: {qualityLabel(lastSleep?.quality ?? null)}
            </Txt>
          </View>
        </Card>

        {/* Last 7 days */}
        <Card style={{ marginTop: space.lg }}>
          <Txt size={12} c={color.textMuted} style={{ marginBottom: space.md }}>
            آخر 7 أيام
          </Txt>
          <View style={styles.chart}>
            {week.map((s) => {
              const hit = s.hours >= target;
              const h = Math.max(10, Math.round((s.hours / maxHours) * 88));
              return (
                <View key={s.id} style={styles.barCol}>
                  <Txt mono size={9} c={hit ? color.primary : SLEEP_ACCENT}>
                    {fmtHours(s.hours)}
                  </Txt>
                  <View
                    style={[
                      styles.barFill,
                      { height: h, backgroundColor: hit ? color.primary : SLEEP_ACCENT },
                    ]}
                  />
                  <Txt mono size={9} c={color.textMuted}>
                    {dayInitial(s.date)}
                  </Txt>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: color.primary }]} />
            <Txt size={10} c={color.textMuted}>
              وصلت الهدف
            </Txt>
            <View style={[styles.dot, { backgroundColor: SLEEP_ACCENT, marginStart: space.md }]} />
            <Txt size={10} c={color.textMuted}>
              أقل من الهدف
            </Txt>
          </View>
        </Card>

        {/* Last night habits */}
        <Card style={{ marginTop: space.lg }}>
          <Txt size={12} c={color.textMuted} style={{ marginBottom: space.md }}>
            عادات الليلة الفاتت
          </Txt>
          <View style={styles.habitRow}>
            <Txt size={18}>☕</Txt>
            <Txt size={13} style={{ flex: 1 }}>
              آخر قهوة
            </Txt>
            <Txt mono size={13} c={lastSleep?.lastCoffeeTime ? color.warning : color.textMuted}>
              {lastSleep?.lastCoffeeTime ?? '—'}
            </Txt>
          </View>
          <View style={[styles.habitRow, { marginBottom: 0 }]}>
            <Txt size={18}>🚬</Txt>
            <Txt size={13} style={{ flex: 1 }}>
              آخر سيجارة
            </Txt>
            <Txt mono size={13} c={lastSleep?.lastCigaretteTime ? color.warning : color.textMuted}>
              {lastSleep?.lastCigaretteTime ?? '—'}
            </Txt>
          </View>
        </Card>

        <View style={{ marginTop: space.xl }}>
          <Button label="سجّل نومك" icon="moon" onPress={openEditor} />
        </View>
      </View>

      {/* Log editor */}
      <Sheet visible={editorOpen} onClose={() => setEditorOpen(false)}>
        <Txt weight="900" size={18} center style={{ marginBottom: space.lg }}>
          نمت كام ساعة؟
        </Txt>

        {/* Hours stepper */}
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setHours((h) => Math.max(0, Math.round((h - 0.5) * 2) / 2))}
          >
            <Txt mono weight="700" size={22} c={color.textSecondary}>
              −
            </Txt>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Txt mono weight="600" size={40} lh={44} c={SLEEP_ACCENT}>
              {fmtHours(hours)}
            </Txt>
            <Txt size={10} c={color.textMuted}>
              ساعة
            </Txt>
          </View>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setHours((h) => Math.min(12, Math.round((h + 0.5) * 2) / 2))}
          >
            <Txt mono weight="700" size={22} c={color.textSecondary}>
              +
            </Txt>
          </Pressable>
        </View>

        {/* Quality picker */}
        <Txt size={11} c={color.textMuted} style={{ marginBottom: space.sm }}>
          كانت الجودة عاملة إيه؟
        </Txt>
        <View style={styles.qualityRow}>
          {QUALITY_LEVELS.map((q) => {
            const active = quality === q.level;
            return (
              <Pressable
                key={q.level}
                style={[styles.qualityBtn, active && styles.qualityActive]}
                onPress={() => setQuality(q.level)}
              >
                <Txt size={22}>{q.emoji}</Txt>
                <Txt size={9} weight={active ? '700' : '400'} c={active ? SLEEP_ACCENT : color.textMuted}>
                  {q.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        {/* Habit times */}
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Txt size={11} c={color.textMuted} style={{ marginBottom: 6 }}>
              آخر قهوة ☕ (اختياري)
            </Txt>
            <TextInput
              value={coffee}
              onChangeText={setCoffee}
              placeholder="20:30"
              placeholderTextColor={color.textMuted}
              style={styles.timeInput}
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={11} c={color.textMuted} style={{ marginBottom: 6 }}>
              آخر سيجارة 🚬 (اختياري)
            </Txt>
            <TextInput
              value={cigarette}
              onChangeText={setCigarette}
              placeholder="22:00"
              placeholderTextColor={color.textMuted}
              style={styles.timeInput}
              maxLength={5}
            />
          </View>
        </View>

        <Button label="تأكيد وحفظ" icon="check" onPress={save} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  hero: { alignItems: 'center', paddingVertical: space.xl },
  heroNum: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.sm },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  chip: { paddingHorizontal: space.md, paddingVertical: 4, borderRadius: radius.pill },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 128,
  },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  barFill: { width: 10, borderRadius: 5 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.xl,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xl,
    gap: space.xs,
  },
  qualityBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    opacity: 0.6,
  },
  qualityActive: {
    opacity: 1,
    backgroundColor: tint.ai15,
    borderWidth: 1,
    borderColor: tint.ai30,
  },
  timeRow: { flexDirection: 'row', gap: space.md, marginBottom: space.xl },
  timeInput: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    color: color.textPrimary,
    fontFamily: font.mono,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
});
