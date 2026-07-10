import { useEffect, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Card, Screen, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import * as db from '@/db';
import type { DaySummary } from '@/data/types';
import { useApp } from '@/state/store';
import { color, radius, space, tint } from '@/theme/tokens';
import {
  AR_MONTHS, emptySummary, generateSampleSummaries, moodEmoji, parseDate, sampleDaySummary, toDateStr, weekdayName,
} from '@/utils/calendar';

/** Winner of a metric: 0 → first day, 1 → second day, null → tie / no data. */
type Winner = 0 | 1 | null;

function pickWinner(a: number, b: number, higherIsBetter = true): Winner {
  if (a === b) return null;
  if (a === 0 && b === 0) return null;
  return (higherIsBetter ? a > b : a < b) ? 0 : 1;
}

/** Calories: closest to target wins; no data or blowing past the target is penalized. */
function kcalScore(d: DaySummary): number {
  if (d.kcal === 0) return Number.MAX_SAFE_INTEGER;
  const over = d.kcal > d.kcalTarget * 1.05 ? 500 : 0;
  return Math.abs(d.kcal - d.kcalTarget) + over;
}

export default function Compare() {
  const params = useLocalSearchParams<{ d1?: string; d2?: string }>();
  const { profile } = useApp();
  const [days, setDays] = useState<[DaySummary, DaySummary] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    // Fallback pair (deep-link without params): today vs 3 days ago.
    const fallback2 = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    const back = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
    const fallback1 = toDateStr(back.getFullYear(), back.getMonth(), back.getDate());
    const d1 = typeof params.d1 === 'string' && params.d1 ? params.d1 : fallback1;
    const d2 = typeof params.d2 === 'string' && params.d2 ? params.d2 : fallback2;

    const load = async (date: string): Promise<DaySummary> => {
      const prefix = date.slice(0, 7);
      let month: Record<string, DaySummary> = {};
      try {
        month = await db.getMonthSummaries(prefix, profile.calorieTarget);
      } catch {
        month = {};
      }
      // Same fallback rule as السجل: synthesize the month when the DB is empty.
      if (!Object.keys(month).length) month = generateSampleSummaries(prefix, profile.calorieTarget);
      return month[date] ?? emptySummary(date, profile.calorieTarget);
    };

    Promise.all([load(d1), load(d2)]).then(([a, b]) => {
      if (cancelled) return;
      // If both compared days came back totally empty (blank deep link on a
      // fresh device), show believable sample days instead of a blank screen.
      if (a.status === 'empty' && b.status === 'empty') {
        a = sampleDaySummary(a.date, profile.calorieTarget);
        b = sampleDaySummary(b.date, profile.calorieTarget);
      }
      setDays([a, b]);
    });

    return () => {
      cancelled = true;
    };
  }, [params.d1, params.d2, profile.calorieTarget]);

  const dir = I18nManager.isRTL ? 'row' : ('row-reverse' as const);

  if (!days) {
    return (
      <Screen>
        <TopBar title="مقارنة" />
        <View style={styles.loading}>
          <Txt size={13} c={color.textMuted}>
            بنجهز المقارنة…
          </Txt>
        </View>
      </Screen>
    );
  }

  const [first, second] = days;

  const kcalWinner: Winner =
    kcalScore(first) === kcalScore(second) ? null : kcalScore(first) < kcalScore(second) ? 0 : 1;

  return (
    <Screen scroll bottomInset={48}>
      <TopBar title="مقارنة" />

      <View style={styles.body}>
        {/* Column headers */}
        <View style={[styles.columns, { flexDirection: dir }]}>
          <DayHeader label="اليوم الأول" summary={first} />
          <DayHeader label="اليوم التاني" summary={second} />
        </View>

        {/* Metric rows */}
        <View style={{ gap: space.sm, marginTop: space.md }}>
          <MetricRow
            label="السعرات"
            v1={first.kcal > 0 ? `${first.kcal} kcal` : '—'}
            v2={second.kcal > 0 ? `${second.kcal} kcal` : '—'}
            winner={kcalWinner}
            dir={dir}
          />
          <MetricRow
            label="المياه"
            v1={first.waterMl > 0 ? `${(first.waterMl / 1000).toFixed(1)} لتر` : '—'}
            v2={second.waterMl > 0 ? `${(second.waterMl / 1000).toFixed(1)} لتر` : '—'}
            winner={pickWinner(first.waterMl, second.waterMl)}
            dir={dir}
          />
          <MetricRow
            label="المزاج"
            v1={first.mood != null ? `${moodEmoji(first.mood)} ${first.mood}/5` : '—'}
            v2={second.mood != null ? `${moodEmoji(second.mood)} ${second.mood}/5` : '—'}
            winner={pickWinner(first.mood ?? 0, second.mood ?? 0)}
            dir={dir}
          />
          <MetricRow
            label="النوم"
            v1={first.sleepHours != null ? `${first.sleepHours} ساعات` : '—'}
            v2={second.sleepHours != null ? `${second.sleepHours} ساعات` : '—'}
            winner={pickWinner(first.sleepHours ?? 0, second.sleepHours ?? 0)}
            dir={dir}
          />
          <MetricRow
            label="أدوية"
            v1={first.medsTaken.length > 0 ? `${first.medsTaken.length} جرعات` : 'مفيش'}
            v2={second.medsTaken.length > 0 ? `${second.medsTaken.length} جرعات` : 'مفيش'}
            winner={pickWinner(first.medsTaken.length, second.medsTaken.length)}
            dir={dir}
          />
        </View>

        <Txt size={11} c={color.textMuted} center style={{ marginTop: space.lg }}>
          القيمة الأحسن متعلّمة بالأخضر
        </Txt>
      </View>
    </Screen>
  );
}

/** "7 يوليو" — the weekday already headlines the column. */
function shortDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

function DayHeader({ label, summary }: { label: string; summary: DaySummary }) {
  return (
    <Card style={styles.dayHeader} pad={space.md} r={radius.md}>
      <Txt size={11} c={color.textMuted}>
        {label}
      </Txt>
      <Txt weight="900" size={18}>
        {weekdayName(summary.date)}
      </Txt>
      <Txt size={11} c={color.textTertiary}>
        {shortDate(summary.date)}
      </Txt>
    </Card>
  );
}

function MetricRow({
  label,
  v1,
  v2,
  winner,
  dir,
}: {
  label: string;
  v1: string;
  v2: string;
  winner: Winner;
  dir: 'row' | 'row-reverse';
}) {
  return (
    <Card pad={space.md} r={radius.md}>
      <Txt size={11} c={color.textMuted} center style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      <View style={{ flexDirection: dir, alignItems: 'center' }}>
        <MetricValue value={v1} best={winner === 0} />
        <View style={styles.divider} />
        <MetricValue value={v2} best={winner === 1} />
      </View>
    </Card>
  );
}

function MetricValue({ value, best }: { value: string; best: boolean }) {
  return (
    <View style={[styles.metricValue, best && styles.metricBest]}>
      <Txt mono size={14} weight={best ? '700' : '400'} c={best ? color.primary : color.textHigh} center>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  columns: { gap: space.md },
  dayHeader: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 28, backgroundColor: color.border, marginHorizontal: space.sm },
  metricValue: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  metricBest: { backgroundColor: tint.primary08 },
});
