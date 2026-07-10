import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Screen, Sheet, Txt } from '@/components';
import { Chip } from '@/components/Chip';
import { TopBar } from '@/components/TopBar';
import { seedMedicalRecords } from '@/data/mock';
import type { LabResult, MedicalRecord, MedicalRecordType } from '@/data/types';
import * as db from '@/db';
import { color, radius, space, tint } from '@/theme/tokens';

const TYPE_EMOJI: Record<MedicalRecordType, string> = {
  'تحليل دم': '🩸',
  'أشعة': '🩻',
  'روشتة': '📋',
  'زيارة دكتور': '🩺',
  'فحص دوري': '🩺',
};

type PeriodKey = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'week', label: 'آخر أسبوع' },
  { key: 'month', label: 'آخر شهر' },
  { key: 'quarter', label: 'آخر 3 شهور' },
  { key: 'year', label: 'السنة دي' },
];

const TYPES: { label: string; value?: MedicalRecordType }[] = [
  { label: 'كل الأنواع' },
  { label: 'تحليل دم', value: 'تحليل دم' },
  { label: 'أشعة', value: 'أشعة' },
  { label: 'روشتة', value: 'روشتة' },
  { label: 'زيارة دكتور', value: 'زيارة دكتور' },
];

const STATUSES: { label: string; value?: boolean }[] = [
  { label: 'الكل' },
  { label: 'تحتاج انتباه', value: true },
  { label: 'طبيعي', value: false },
];

function localDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Turn the chosen period into a YYYY-MM-DD lower bound. */
function sinceDateFor(period: PeriodKey): string {
  const now = new Date();
  if (period === 'year') return `${now.getFullYear()}-01-01`;
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return localDateStr(d);
}

function filterLocal(
  recs: MedicalRecord[],
  f: { sinceDate?: string; type?: MedicalRecordType; needsAttention?: boolean },
): MedicalRecord[] {
  return recs
    .filter(
      (r) =>
        (!f.sinceDate || r.date >= f.sinceDate) &&
        (!f.type || r.type === f.type) &&
        (f.needsAttention === undefined || (r.status === 'تحتاج انتباه') === f.needsAttention),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

function flagColor(flag?: LabResult['flag']): string {
  if (flag === 'مرتفع طفيف') return color.warning;
  if (flag === 'مرتفع' || flag === 'منخفض') return color.danger;
  return color.textPrimary;
}

export default function Medical() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>('year');
  const [typeIdx, setTypeIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selected, setSelected] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    const filter = {
      sinceDate: sinceDateFor(period),
      type: TYPES[typeIdx].value,
      needsAttention: STATUSES[statusIdx].value,
    };
    (async () => {
      let recs = await db.listMedicalRecords(filter);
      // Web fallback: the DB layer no-ops on web, so preview from the seed data.
      if (!recs.length && Platform.OS === 'web') recs = filterLocal(seedMedicalRecords, filter);
      if (!cancelled) setRecords(recs);
    })().catch(() => {
      if (!cancelled) setRecords([]);
    });
    return () => {
      cancelled = true;
    };
  }, [period, typeIdx, statusIdx]);

  const reset = () => {
    setPeriod('year');
    setTypeIdx(0);
    setStatusIdx(0);
  };

  return (
    <Screen scroll bottomInset={40}>
      <TopBar
        title="السجل الطبي"
        right={
          <Pressable
            onPress={() => router.push('/export-report' as never)}
            style={({ pressed }) => [styles.exportBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Txt weight="700" size={11} c={color.primary}>
              تصدير للدكتور
            </Txt>
          </Pressable>
        }
      />

      <View style={styles.body}>
        {/* Filter bar */}
        <View style={styles.filterHead}>
          <Txt size={11} c={color.textMuted}>
            فلترة النتائج
          </Txt>
          <Pressable onPress={reset}>
            <Txt weight="600" size={11} c={color.textTertiary}>
              إعادة تعيين
            </Txt>
          </Pressable>
        </View>

        <FilterRow>
          {PERIODS.map((p) => (
            <Chip key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </FilterRow>
        <FilterRow>
          {TYPES.map((t, i) => (
            <Chip key={t.label} label={t.label} active={typeIdx === i} onPress={() => setTypeIdx(i)} />
          ))}
        </FilterRow>
        <FilterRow>
          {STATUSES.map((s, i) => (
            <Chip key={s.label} label={s.label} active={statusIdx === i} onPress={() => setStatusIdx(i)} />
          ))}
        </FilterRow>

        {/* Records */}
        <View style={{ gap: space.md, marginTop: space.lg }}>
          {records.map((rec) => (
            <RecordCard key={rec.id} rec={rec} onPress={() => setSelected(rec)} />
          ))}
          {!records.length && (
            <Card>
              <Txt size={13} c={color.textTertiary} center>
                مفيش سجلات مطابقة للفلاتر دي
              </Txt>
            </Card>
          )}
        </View>
      </View>

      {/* Record detail */}
      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && <RecordDetail rec={selected} />}
      </Sheet>
    </Screen>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>{children}</View>
    </ScrollView>
  );
}

function StatusChip({ status }: { status: MedicalRecord['status'] }) {
  const attention = status === 'تحتاج انتباه';
  return (
    <View style={[styles.statusChip, { backgroundColor: attention ? tint.warning12 : tint.primary12 }]}>
      <Txt weight="600" size={10} c={attention ? color.warning : color.primary}>
        {status}
      </Txt>
    </View>
  );
}

function RecordCard({ rec, onPress }: { rec: MedicalRecord; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={styles.recordCard}>
        <View style={styles.emojiBox}>
          <Txt size={20}>{TYPE_EMOJI[rec.type]}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="700" size={14}>
            {rec.title}
          </Txt>
          <Txt size={11} c={color.textMuted}>
            {[rec.center, rec.date].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        <StatusChip status={rec.status} />
      </Card>
    </Pressable>
  );
}

function RecordDetail({ rec }: { rec: MedicalRecord }) {
  return (
    <View>
      <View style={styles.detailHead}>
        <Txt size={22}>{TYPE_EMOJI[rec.type]}</Txt>
        <Txt weight="700" size={16} style={{ flex: 1 }}>
          {rec.title}
        </Txt>
        <StatusChip status={rec.status} />
      </View>
      <Txt size={12} c={color.textMuted} style={{ marginBottom: space.lg }}>
        {[rec.center, rec.date].filter(Boolean).join(' · ')}
      </Txt>

      {!!rec.results?.length && (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Txt size={10} c={color.textMuted} style={{ flex: 1.2 }}>
              التحليل
            </Txt>
            <Txt size={10} c={color.textMuted} style={{ flex: 1 }}>
              القيمة
            </Txt>
            <Txt size={10} c={color.textMuted} style={{ flex: 1 }}>
              المعدل الطبيعي
            </Txt>
          </View>
          {rec.results.map((r) => (
            <View key={r.name} style={styles.tableRow}>
              <Txt weight="600" size={12} style={{ flex: 1.2 }}>
                {r.name}
              </Txt>
              <View style={{ flex: 1 }}>
                <Txt mono weight="600" size={12} c={flagColor(r.flag)}>
                  {r.value}
                </Txt>
                {!!r.flag && (
                  <Txt size={9} c={flagColor(r.flag)}>
                    {r.flag}
                  </Txt>
                )}
              </View>
              <Txt mono size={11} c={color.textTertiary} style={{ flex: 1 }}>
                {r.normalRange}
              </Txt>
            </View>
          ))}
        </View>
      )}

      {!!rec.notes && (
        <Txt size={12} c={color.textSecondary} lh={20} style={{ marginTop: space.lg }}>
          📝 {rec.notes}
        </Txt>
      )}

      {!!rec.photoUri && (
        <View style={styles.photoBox}>
          <Txt size={22}>📷</Txt>
          <Txt size={11} c={color.textMuted}>
            صورة السجل مرفقة
          </Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  exportBtn: {
    backgroundColor: tint.primary12,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 7,
  },
  filterHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.md,
    marginBottom: space.md,
  },
  recordCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xs },
  table: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.borderStrong,
  },
  tableHeader: { borderBottomColor: color.borderMuted },
  photoBox: {
    marginTop: space.lg,
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
