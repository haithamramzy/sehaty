import React from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';

import type { DaySummary, DayStatus } from '@/data/types';
import { color, radius, space, tint } from '@/theme/tokens';
import { WEEKDAY_LETTERS, daysInMonth, toDateStr } from '@/utils/calendar';
import { Txt } from './Txt';

interface Props {
  year: number;
  /** 0-based month (JS Date convention). */
  month0: number;
  /** Keyed by 'YYYY-MM-DD' (db.getMonthSummaries shape). */
  summaries: Record<string, DaySummary>;
  /** Dates highlighted with a selection ring (compare mode). */
  selected?: string[];
  onDayPress?: (date: string) => void;
}

const CELL_BG: Record<DayStatus, string> = {
  good: tint.primary12,
  mid: tint.warning12,
  empty: color.surface,
};

const CELL_TEXT: Record<DayStatus, string> = {
  good: color.primary,
  mid: color.warning,
  empty: color.textMuted,
};

/**
 * RTL month grid, weeks starting السبت. Day cells are tinted by DayStatus
 * (good → primary, mid → warning, empty → surface) with a legend row below.
 */
export function CalendarGrid({ year, month0, summaries, selected = [], onDayPress }: Props) {
  // Native forces RTL so 'row' already flows right→left; on web (LTR preview)
  // reverse explicitly so السبت still sits on the right.
  const dir = I18nManager.isRTL ? 'row' : ('row-reverse' as const);

  const total = daysInMonth(year, month0);
  // Saturday-first offset: getDay() 6 (السبت) → column 0.
  const firstDow = new Date(year, month0, 1).getDay();
  const offset = (firstDow + 1) % 7;

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      {/* Weekday letters */}
      <View style={[styles.week, { flexDirection: dir }]}>
        {WEEKDAY_LETTERS.map((letter) => (
          <View key={letter} style={styles.cellSlot}>
            <Txt size={11} weight="600" c={color.textMuted} center>
              {letter}
            </Txt>
          </View>
        ))}
      </View>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.week, { flexDirection: dir }]}>
          {week.map((day, di) => {
            if (day === null) return <View key={`blank-${di}`} style={styles.cellSlot} />;
            const date = toDateStr(year, month0, day);
            const status: DayStatus = summaries[date]?.status ?? 'empty';
            const isSelected = selected.includes(date);
            return (
              <View key={date} style={styles.cellSlot}>
                <Pressable
                  onPress={() => onDayPress?.(date)}
                  style={({ pressed }) => [
                    styles.cell,
                    { backgroundColor: CELL_BG[status] },
                    isSelected && styles.cellSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Txt mono size={13} weight={status === 'empty' ? '400' : '600'} c={isSelected ? color.primary : CELL_TEXT[status]}>
                    {day}
                  </Txt>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={[styles.legend, { flexDirection: dir }]}>
        <LegendItem swatch={tint.primary12} dot={color.primary} label="يوم كويس" />
        <LegendItem swatch={tint.warning12} dot={color.warning} label="متوسط" />
        <LegendItem swatch={color.surface} dot={color.textMuted} label="فاضي" />
      </View>
    </View>
  );
}

function LegendItem({ swatch, dot, label }: { swatch: string; dot: string; label: string }) {
  const dir = I18nManager.isRTL ? 'row' : ('row-reverse' as const);
  return (
    <View style={[styles.legendItem, { flexDirection: dir }]}>
      <View style={[styles.legendSwatch, { backgroundColor: swatch }]}>
        <View style={[styles.legendDot, { backgroundColor: dot }]} />
      </View>
      <Txt size={11} c={color.textTertiary}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { marginBottom: 6, gap: 6 },
  cellSlot: { flex: 1 },
  cell: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: color.primary,
    backgroundColor: tint.primary15,
  },
  legend: {
    justifyContent: 'center',
    gap: space.lg,
    marginTop: space.md,
  },
  legendItem: { alignItems: 'center', gap: 6 },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
});
