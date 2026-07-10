import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Screen, Sheet, Txt } from '@/components';
import { CalendarGrid } from '@/components/CalendarGrid';
import * as db from '@/db';
import type { DaySummary } from '@/data/types';
import { useApp } from '@/state/store';
import { color, radius, space, tint } from '@/theme/tokens';
import { dayTitle, emptySummary, generateSampleSummaries, monthTitle, moodEmoji, pad2 } from '@/utils/calendar';

export default function Log() {
  const router = useRouter();
  const { profile } = useApp();

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month0: now.getMonth() });
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  // Load the visible month; fall back to believable sample data when the DB
  // has nothing for it (web preview / fresh install).
  useEffect(() => {
    let cancelled = false;
    const prefix = `${cursor.year}-${pad2(cursor.month0 + 1)}`;
    db.getMonthSummaries(prefix, profile.calorieTarget)
      .then((res) => {
        if (cancelled) return;
        setSummaries(Object.keys(res).length ? res : generateSampleSummaries(prefix, profile.calorieTarget));
      })
      .catch(() => {
        if (!cancelled) setSummaries(generateSampleSummaries(prefix, profile.calorieTarget));
      });
    return () => {
      cancelled = true;
    };
  }, [cursor.year, cursor.month0, profile.calorieTarget]);

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month0 + delta, 1);
      return { year: d.getFullYear(), month0: d.getMonth() };
    });
  };

  const onDayPress = (date: string) => {
    if (!compareMode) {
      setSheetDate(date);
      return;
    }
    setPicked((prev) => {
      if (prev.includes(date)) return prev.filter((d) => d !== date);
      if (prev.length < 2) return [...prev, date];
      return [prev[1], date];
    });
  };

  const toggleCompare = () => {
    setCompareMode((v) => !v);
    setPicked([]);
  };

  const goCompare = () => {
    const [a, b] = [...picked].sort();
    router.push(`/compare?d1=${a}&d2=${b}` as never);
  };

  const sheetSummary = sheetDate ? (summaries[sheetDate] ?? emptySummary(sheetDate, profile.calorieTarget)) : null;

  return (
    <Screen scroll bottomInset={120}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Txt size={12} c={color.textMuted}>
            الكاليندر
          </Txt>
          <Txt weight="900" size={22}>
            {monthTitle(cursor.year, cursor.month0)}
          </Txt>
        </View>
        <View style={styles.nav}>
          <NavBtn glyph="‹" onPress={() => shiftMonth(-1)} />
          <NavBtn glyph="›" onPress={() => shiftMonth(1)} />
        </View>
      </View>

      <View style={styles.body}>
        <Card pad={space.md}>
          <CalendarGrid
            year={cursor.year}
            month0={cursor.month0}
            summaries={summaries}
            selected={compareMode ? picked : []}
            onDayPress={onDayPress}
          />
        </Card>

        {/* Compare mode */}
        <View style={{ marginTop: space.lg }}>
          <Button
            label={compareMode ? 'إلغاء المقارنة' : 'قارن الأيام'}
            variant="secondary"
            onPress={toggleCompare}
          />
          {compareMode && picked.length < 2 && (
            <Txt size={12} c={color.textMuted} center style={{ marginTop: space.md }}>
              اختار يومين للمقارنة
            </Txt>
          )}
          {compareMode && picked.length === 2 && (
            <Card style={styles.compareBar} pad={space.md}>
              <Txt size={13} weight="600" c={color.primary} style={{ flex: 1 }}>
                اتنين اختيروا — جاهز للمقارنة
              </Txt>
              <Button label="مقارنة" full={false} glow={false} onPress={goCompare} />
            </Card>
          )}
        </View>
      </View>

      {/* Day details sheet */}
      <Sheet visible={!!sheetSummary} onClose={() => setSheetDate(null)}>
        {sheetSummary && <DayDetails summary={sheetSummary} onClose={() => setSheetDate(null)} />}
      </Sheet>
    </Screen>
  );
}

function NavBtn({ glyph, onPress }: { glyph: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}>
      <Txt size={20} weight="700" c={color.textSecondary}>
        {glyph}
      </Txt>
    </Pressable>
  );
}

function DayDetails({ summary, onClose }: { summary: DaySummary; onClose: () => void }) {
  const verdict =
    summary.status === 'good'
      ? 'يوم كويس عمومًا'
      : summary.status === 'mid'
        ? 'يوم متوسط — في حاجات ممكن تتحسن'
        : 'مفيش بيانات متسجلة في اليوم ده';

  const kcalNote =
    summary.kcal === 0
      ? 'مفيش تسجيل'
      : summary.kcal <= summary.kcalTarget * 1.05
        ? 'هدفك اتحقق'
        : 'أعلى من هدفك';
  const kcalNoteColor =
    summary.kcal === 0 ? color.textMuted : summary.kcal <= summary.kcalTarget * 1.05 ? color.primary : color.warning;

  return (
    <View>
      <Txt size={11} c={color.textMuted}>
        تفاصيل يوم
      </Txt>
      <Txt weight="900" size={20} style={{ marginBottom: 2 }}>
        {dayTitle(summary.date)}
      </Txt>
      <Txt size={13} c={summary.status === 'good' ? color.primary : summary.status === 'mid' ? color.warning : color.textMuted} style={{ marginBottom: space.lg }}>
        {verdict}
      </Txt>

      <View style={{ gap: space.sm }}>
        <DetailRow
          label="السعرات"
          value={summary.kcal > 0 ? `${summary.kcal} kcal` : '—'}
          note={kcalNote}
          noteColor={kcalNoteColor}
        />
        <DetailRow
          label="المياه"
          value={summary.waterMl > 0 ? `${(summary.waterMl / 1000).toFixed(1)} لتر` : '—'}
        />
        <DetailRow
          label="المزاج"
          value={summary.mood != null ? `${moodEmoji(summary.mood)} ${summary.mood}/5` : '—'}
        />
        <DetailRow
          label="النوم"
          value={summary.sleepHours != null ? `${summary.sleepHours} ساعات` : '—'}
        />
      </View>

      {/* Meds taken */}
      <Txt size={11} c={color.textMuted} style={{ marginTop: space.lg, marginBottom: space.sm }}>
        أدوية أُخذت اليوم
      </Txt>
      {summary.medsTaken.length === 0 ? (
        <Txt size={13} c={color.textMuted}>
          مفيش أدوية متسجلة
        </Txt>
      ) : (
        <View style={{ gap: space.sm }}>
          {summary.medsTaken.map((m) => (
            <View key={m.id} style={styles.medRow}>
              <Txt size={13} weight="600" style={{ flex: 1 }}>
                💊 {m.medName}
              </Txt>
              <Txt mono size={11} c={color.textMuted}>
                {m.at}
              </Txt>
            </View>
          ))}
        </View>
      )}

      <Button label="تمام" variant="secondary" style={{ marginTop: space.xl }} onPress={onClose} />
    </View>
  );
}

function DetailRow({ label, value, note, noteColor }: { label: string; value: string; note?: string; noteColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Txt size={13} c={color.textSecondary} style={{ flex: 1 }}>
        {label}
      </Txt>
      {note && (
        <Txt size={11} c={noteColor ?? color.textMuted} style={{ marginHorizontal: space.sm }}>
          {note}
        </Txt>
      )}
      <Txt mono size={13} weight="600">
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  nav: { flexDirection: 'row', gap: space.sm },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: space.xl },
  compareBar: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: tint.primary08,
    borderWidth: 1,
    borderColor: tint.primary15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
});
