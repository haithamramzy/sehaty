/**
 * Calendar helpers for the السجل tab + مقارنة screen.
 *
 * Includes the graceful-fallback generator: on web (or a fresh install with
 * no history) `db.getMonthSummaries` comes back empty, so we synthesize a
 * believable month of DaySummary rows — deterministic per date, mixing
 * good / mid / empty days like the design mock.
 */
import type { DaySummary, MedIntake } from '@/data/types';

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

/** Full weekday names indexed by JS getDay() (0 = الأحد). */
export const AR_WEEKDAYS = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
] as const;

/** Single-letter column headers, weeks starting السبت. */
export const WEEKDAY_LETTERS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'] as const;

export const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export function moodEmoji(score: number | null): string {
  if (score == null) return '—';
  return MOOD_EMOJI[Math.max(1, Math.min(5, Math.round(score)))] ?? '😐';
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateStr(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

/** "يوليو 2026" */
export function monthTitle(year: number, month0: number): string {
  return `${AR_MONTHS[month0]} ${year}`;
}

/** "الثلاثاء 7 يوليو" from "2026-07-07". */
export function dayTitle(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${AR_WEEKDAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

/** "الجمعة" from "2026-07-03". */
export function weekdayName(dateStr: string): string {
  return AR_WEEKDAYS[parseDate(dateStr).getDay()];
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function emptySummary(date: string, kcalTarget: number): DaySummary {
  return { date, status: 'empty', kcal: 0, kcalTarget, waterMl: 0, mood: null, sleepHours: null, medsTaken: [] };
}

// ─── Sample data (web preview / empty DB fallback) ───────────────────────────

const SAMPLE_MEDS: { name: string; at: string }[] = [
  { name: 'فيتامين د', at: '09:10' },
  { name: 'أوميجا 3', at: '14:05' },
  { name: 'مغنيسيوم', at: '22:30' },
];

/** Deterministic tiny hash so the same date always renders the same day. */
function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function sampleMeds(date: string, count: number): MedIntake[] {
  return SAMPLE_MEDS.slice(0, count).map((m, i) => ({
    id: `sample-${date}-${i}`,
    medId: `sample-med-${i}`,
    medName: m.name,
    date,
    at: m.at,
  }));
}

/** A single believable non-empty day (used when a compared date has no row). */
export function sampleDaySummary(date: string, kcalTarget: number): DaySummary {
  const r = hash(date);
  const good = r % 2 === 0;
  if (good) {
    return {
      date,
      status: 'good',
      kcal: Math.round(kcalTarget * (0.82 + (r % 18) / 100)),
      kcalTarget,
      waterMl: 2000 + (r % 9) * 100,
      mood: 4 + (r % 2),
      sleepHours: 7 + ((r >> 3) % 3) * 0.5,
      medsTaken: sampleMeds(date, 1 + (r % 2)),
    };
  }
  const over = (r >> 2) % 2 === 0;
  return {
    date,
    status: 'mid',
    kcal: over ? Math.round(kcalTarget * (1.08 + (r % 15) / 100)) : Math.round(kcalTarget * (0.5 + (r % 20) / 100)),
    kcalTarget,
    waterMl: 900 + (r % 10) * 100,
    mood: 2 + (r % 2),
    sleepHours: 5 + ((r >> 4) % 3) * 0.5,
    medsTaken: sampleMeds(date, r % 2),
  };
}

/**
 * Believable in-memory month of summaries ('YYYY-MM'): ~45% good, ~35% mid,
 * ~20% empty. For the current month, days after today stay empty.
 */
export function generateSampleSummaries(monthPrefix: string, kcalTarget: number): Record<string, DaySummary> {
  const [year, month] = monthPrefix.split('-').map(Number);
  const month0 = (month ?? 1) - 1;
  const total = daysInMonth(year, month0);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month0;
  const lastDay = isCurrentMonth ? today.getDate() : total;
  const isFutureMonth = new Date(year, month0, 1) > today;

  const out: Record<string, DaySummary> = {};
  for (let day = 1; day <= total; day++) {
    const date = toDateStr(year, month0, day);
    if (isFutureMonth || day > lastDay) {
      out[date] = emptySummary(date, kcalTarget);
      continue;
    }
    const roll = hash(date) % 100;
    out[date] = roll < 80 ? sampleDaySummary(date, kcalTarget) : emptySummary(date, kcalTarget);
  }
  return out;
}
