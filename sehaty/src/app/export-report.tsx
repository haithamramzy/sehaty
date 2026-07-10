import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Screen, Txt } from '@/components';
import { Chip } from '@/components/Chip';
import { TopBar } from '@/components/TopBar';
import { seedMedicalRecords } from '@/data/mock';
import type { LabResult, MedicalRecord } from '@/data/types';
import * as db from '@/db';
import { useApp } from '@/state/store';
import { color, radius, space, tint } from '@/theme/tokens';

/**
 * Paper-report palette — the one allowed light-surface exception:
 * the preview mimics the printed PDF page, so it uses dark ink on paper.
 */
const PAPER = '#FAF9F4';
const PAPER_LINE = '#E2E0D6';
const INK = '#1B1B1F';
const INK_MUTED = '#5C5C64';
const INK_WARN = '#B45309';
const INK_DANGER = '#B91C1C';

type ContentKey = 'basics' | 'meds' | 'labs' | 'rx' | 'lifestyle';

const CONTENT_ITEMS: { key: ContentKey; label: string }[] = [
  { key: 'basics', label: 'البيانات الأساسية (اسم، عمر، طول، وزن)' },
  { key: 'meds', label: 'الأدوية النشطة' },
  { key: 'labs', label: 'نتائج التحاليل' },
  { key: 'rx', label: 'الروشتات' },
  { key: 'lifestyle', label: 'بيانات نمط الحياة' },
];

type PeriodKey = 'month' | 'quarter' | 'year';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'month', label: 'آخر شهر' },
  { key: 'quarter', label: 'آخر 3 شهور' },
  { key: 'year', label: 'السنة دي' },
];

function localDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function sinceDateFor(period: PeriodKey): string {
  const now = new Date();
  if (period === 'year') return `${now.getFullYear()}-01-01`;
  const days = period === 'month' ? 30 : 90;
  return localDateStr(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}

function inkForFlag(flag?: LabResult['flag']): string {
  if (flag === 'مرتفع طفيف') return INK_WARN;
  if (flag === 'مرتفع' || flag === 'منخفض') return INK_DANGER;
  return INK;
}

export default function ExportReport() {
  const { profile, meds } = useApp();
  const [checked, setChecked] = useState<Record<ContentKey, boolean>>({
    basics: true,
    meds: true,
    labs: true,
    rx: true,
    lifestyle: true,
  });
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [labRecord, setLabRecord] = useState<MedicalRecord | null>(null);
  const [exportNote, setExportNote] = useState(false);

  const activeMeds = useMemo(() => meds.filter((m) => m.active), [meds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let recs = await db.listMedicalRecords({ type: 'تحليل دم' });
      // Web fallback: DB no-ops on web — preview from the seed data.
      if (!recs.length && Platform.OS === 'web') {
        recs = seedMedicalRecords.filter((r) => r.type === 'تحليل دم');
      }
      const latest = [...recs].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
      if (!cancelled) setLabRecord(latest);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key: ContentKey) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  const today = localDateStr(new Date());
  const since = sinceDateFor(period);

  return (
    <Screen scroll bottomInset={40}>
      <TopBar title="تصدير للدكتور" />

      <View style={styles.body}>
        {/* Content checklist */}
        <Txt size={11} c={color.textMuted} style={styles.sectionLabel}>
          اختار المحتوى
        </Txt>
        <View style={styles.checklist}>
          {CONTENT_ITEMS.map((item, i) => (
            <Pressable
              key={item.key}
              onPress={() => toggle(item.key)}
              style={[styles.checkRow, i < CONTENT_ITEMS.length - 1 && styles.checkRowBorder]}
            >
              <View style={[styles.checkbox, checked[item.key] && styles.checkboxOn]}>
                {checked[item.key] && <Icon name="check" size={13} color={color.onPrimary} strokeWidth={3} />}
              </View>
              <Txt weight="600" size={13} c={checked[item.key] ? color.textPrimary : color.textTertiary} style={{ flex: 1 }}>
                {item.label}
              </Txt>
            </Pressable>
          ))}
        </View>

        {/* Period */}
        <Txt size={11} c={color.textMuted} style={styles.sectionLabel}>
          الفترة الزمنية
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {PERIODS.map((p) => (
            <Chip key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </View>

        {/* Paper preview */}
        <Txt size={11} c={color.textMuted} style={styles.sectionLabel}>
          معاينة الصفحة الأولى
        </Txt>
        <View style={styles.paper}>
          <Txt weight="900" size={15} c={INK} center>
            تقرير طبي — ملخّص الحالة الصحية
          </Txt>
          {checked.basics && (
            <Txt size={11} c={INK_MUTED} center style={{ marginTop: 4 }}>
              {profile.name} · {profile.age} سنة · {profile.heightCm} سم · {profile.weightKg} كجم
            </Txt>
          )}
          <Txt mono size={9} c={INK_MUTED} center style={{ marginTop: 4 }}>
            للفترة من {since} · تاريخ الإصدار {today}
          </Txt>

          <View style={styles.paperDivider} />

          {checked.meds && (
            <View>
              <Txt weight="700" size={12} c={INK}>
                الأدوية النشطة حاليًا
              </Txt>
              <View style={[styles.paperRow, styles.paperRowLine]}>
                <PaperCell text="الدواء" flex={1.3} muted head />
                <PaperCell text="الجرعة" flex={1} muted head />
                <PaperCell text="التوقيت" flex={1.2} muted head />
                <PaperCell text="تاريخ البدء" flex={1} muted head />
              </View>
              {activeMeds.map((m) => (
                <View key={m.id} style={[styles.paperRow, styles.paperRowLine]}>
                  <PaperCell text={m.name} flex={1.3} bold />
                  <PaperCell text={m.dosage ?? '—'} flex={1} />
                  <PaperCell text={m.timing ?? 'حسب الحاجة'} flex={1.2} />
                  <PaperCell text={m.startDate ?? '—'} flex={1} mono />
                </View>
              ))}
              {!activeMeds.length && <PaperCell text="لا توجد أدوية نشطة." flex={1} muted />}
            </View>
          )}

          {checked.labs && (
            <View style={{ marginTop: space.lg }}>
              <Txt weight="700" size={12} c={INK}>
                آخر نتائج التحاليل{labRecord ? ` — ${labRecord.date}` : ''}
              </Txt>
              <View style={[styles.paperRow, styles.paperRowLine]}>
                <PaperCell text="التحليل" flex={1.3} muted head />
                <PaperCell text="القيمة" flex={1} muted head />
                <PaperCell text="المعدل الطبيعي" flex={1} muted head />
              </View>
              {labRecord?.results?.map((r) => (
                <View key={r.name} style={[styles.paperRow, styles.paperRowLine]}>
                  <PaperCell text={r.name} flex={1.3} bold />
                  <View style={{ flex: 1 }}>
                    <Txt mono weight="600" size={10} c={inkForFlag(r.flag)}>
                      {r.value}
                    </Txt>
                    {!!r.flag && (
                      <Txt size={8} c={inkForFlag(r.flag)}>
                        {r.flag}
                      </Txt>
                    )}
                  </View>
                  <PaperCell text={r.normalRange} flex={1} mono />
                </View>
              ))}
              {!labRecord?.results?.length && <PaperCell text="لا توجد نتائج تحاليل مسجلة." flex={1} muted />}
            </View>
          )}

          {(checked.rx || checked.lifestyle) && (
            <Txt size={9} c={INK_MUTED} center style={{ marginTop: space.lg }}>
              + {[checked.rx && 'الروشتات', checked.lifestyle && 'بيانات نمط الحياة'].filter(Boolean).join(' و')} في
              الصفحات الجاية
            </Txt>
          )}
        </View>

        {/* Export CTA */}
        <Button label="تصدير PDF" style={{ marginTop: space.xl }} onPress={() => setExportNote(true)} />
        {exportNote && (
          <View style={styles.noteCard}>
            <Txt size={12} c={color.warning} center lh={20}>
              هيتصدّر PDF في تحديث جاي — المعاينة دي هي شكل التقرير
            </Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}

function PaperCell({
  text,
  flex,
  muted = false,
  bold = false,
  mono = false,
  head = false,
}: {
  text: string;
  flex: number;
  muted?: boolean;
  bold?: boolean;
  mono?: boolean;
  head?: boolean;
}) {
  return (
    <Txt
      mono={mono}
      weight={bold ? '600' : '400'}
      size={head ? 9 : 10}
      c={muted ? INK_MUTED : INK}
      style={{ flex }}
    >
      {text}
    </Txt>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  sectionLabel: { marginTop: space.xl, marginBottom: space.md },
  checklist: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
  },
  checkRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.borderStrong,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  paper: {
    backgroundColor: PAPER,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: PAPER_LINE,
    padding: space.lg,
  },
  paperDivider: {
    height: 1,
    backgroundColor: PAPER_LINE,
    marginVertical: space.md,
  },
  paperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 6,
  },
  paperRowLine: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PAPER_LINE,
  },
  noteCard: {
    marginTop: space.md,
    backgroundColor: tint.warning08,
    borderWidth: 1,
    borderColor: tint.warning30,
    borderRadius: radius.md,
    padding: space.md,
  },
});
