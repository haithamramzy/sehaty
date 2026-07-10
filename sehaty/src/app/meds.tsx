import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Screen, Sheet, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import type { Medication, MedicationKind } from '@/data/types';
import { useApp } from '@/state/store';
import { color, font, radius, space, tint } from '@/theme/tokens';

function todayLocalDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Meds() {
  const { meds, todayIntakes, confirmDose, addMedication } = useApp();
  const [addOpen, setAddOpen] = useState(false);

  const activeMeds = useMemo(() => meds.filter((m) => m.active), [meds]);
  const pastMeds = useMemo(() => meds.filter((m) => !m.active), [meds]);
  const today = todayLocalDate();

  const takenAt = (medId: string) =>
    todayIntakes.find((i) => i.medId === medId && i.date === today)?.at;

  return (
    <Screen scroll bottomInset={40}>
      <TopBar title="الأدوية والمكملات" />

      <View style={styles.body}>
        {/* Active meds */}
        <Txt size={11} c={color.textMuted} style={styles.sectionLabel}>
          النشطة دلوقتي
        </Txt>
        <View style={{ gap: space.md }}>
          {activeMeds.map((m) => (
            <ActiveMedCard key={m.id} med={m} takenAt={takenAt(m.id)} onConfirm={() => confirmDose(m)} />
          ))}
          {!activeMeds.length && (
            <Card>
              <Txt size={13} c={color.textTertiary} center>
                مفيش أدوية نشطة دلوقتي — ضيف أول دوا من تحت
              </Txt>
            </Card>
          )}
        </View>

        {/* Absorption hint */}
        <View style={styles.hintCard}>
          <Txt size={18}>💡</Txt>
          <View style={{ flex: 1 }}>
            <Txt weight="700" size={12} c={color.warning}>
              تنبيه امتصاص
            </Txt>
            <Txt size={12} c={color.textSecondary} lh={20}>
              فيتامين D بيتمص أحسن مع وجبة فيها دهون.
            </Txt>
          </View>
        </View>

        {/* Past meds */}
        <Txt size={11} c={color.textMuted} style={styles.sectionLabel}>
          السجل الدوائي السابق
        </Txt>
        <View style={{ gap: space.sm }}>
          {pastMeds.map((m) => (
            <PastMedRow key={m.id} med={m} />
          ))}
          {!pastMeds.length && (
            <Txt size={12} c={color.textMuted}>
              مفيش أدوية قديمة متسجلة.
            </Txt>
          )}
        </View>

        <Button
          label="＋ أضف دوا"
          variant="secondary"
          glow={false}
          style={{ marginTop: space.xl }}
          onPress={() => setAddOpen(true)}
        />
      </View>

      <AddMedSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(med) => {
          addMedication(med);
          setAddOpen(false);
        }}
      />
    </Screen>
  );
}

function ActiveMedCard({ med, takenAt, onConfirm }: { med: Medication; takenAt?: string; onConfirm: () => void }) {
  return (
    <Card>
      <View style={styles.medHead}>
        <Txt weight="700" size={15} style={{ flex: 1 }}>
          {med.name}
        </Txt>
        <View style={[styles.kindBadge, med.kind === 'دواء' ? styles.kindDrug : styles.kindSupp]}>
          <Txt weight="600" size={10} c={med.kind === 'دواء' ? color.water : color.aiSoft}>
            {med.kind}
          </Txt>
        </View>
      </View>

      <View style={styles.medMeta}>
        {!!med.dosage && (
          <Txt size={12} c={color.textTertiary}>
            {med.dosage}
          </Txt>
        )}
        <View style={styles.timingChip}>
          <Txt size={11} c={color.textSecondary}>
            ⏰ {med.timing ?? 'حسب الحاجة'}
          </Txt>
        </View>
      </View>

      {takenAt ? (
        <View style={styles.takenBox}>
          <Txt weight="700" size={13} c={color.primary}>
            اتاخد اليوم ✓{' '}
          </Txt>
          <Txt mono weight="600" size={13} c={color.primary}>
            {takenAt}
          </Txt>
        </View>
      ) : (
        <Pressable onPress={onConfirm} style={({ pressed }) => [styles.confirmBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <Txt weight="700" size={13} c={color.onPrimary}>
            أكدت الجرعة
          </Txt>
        </Pressable>
      )}
    </Card>
  );
}

function PastMedRow({ med }: { med: Medication }) {
  const range =
    med.startDate && med.endDate
      ? `${med.startDate} → ${med.endDate}`
      : med.startDate
        ? `من ${med.startDate}`
        : '';
  return (
    <View style={styles.pastRow}>
      <View style={{ flex: 1 }}>
        <Txt weight="600" size={13} c={color.textHigh}>
          {med.name}
        </Txt>
        <Txt size={11} c={color.textMuted}>
          {[med.dosage, med.kind, med.timing ?? 'حسب الحاجة'].filter(Boolean).join(' · ')}
        </Txt>
      </View>
      {!!range && (
        <Txt mono size={10} c={color.textMuted}>
          {range}
        </Txt>
      )}
    </View>
  );
}

function AddMedSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (med: Omit<Medication, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [kind, setKind] = useState<MedicationKind>('دواء');
  const [timing, setTiming] = useState('');

  const reset = () => {
    setName('');
    setDosage('');
    setKind('دواء');
    setTiming('');
  };

  const save = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      kind,
      timing: timing.trim() || undefined,
      startDate: todayLocalDate(),
      active: true,
    });
    reset();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt weight="700" size={16} center style={{ marginBottom: space.lg }}>
        إضافة دوا جديد
      </Txt>

      <View style={{ gap: space.lg }}>
        <FormField label="الاسم">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="مثلاً: فيتامين C"
            placeholderTextColor={color.textMuted}
            style={styles.input}
          />
        </FormField>

        <FormField label="الجرعة">
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="مثلاً: قرص واحد"
            placeholderTextColor={color.textMuted}
            style={styles.input}
          />
        </FormField>

        <FormField label="النوع">
          <View style={styles.segment}>
            {(['دواء', 'مكمل'] as const).map((k) => (
              <Pressable key={k} onPress={() => setKind(k)} style={[styles.segBtn, kind === k && styles.segActive]}>
                <Txt weight="600" size={14} c={kind === k ? color.onPrimary : color.textSecondary}>
                  {k}
                </Txt>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="التوقيت">
          <TextInput
            value={timing}
            onChangeText={setTiming}
            placeholder="مثلاً: مع الغدا · 14:00"
            placeholderTextColor={color.textMuted}
            style={styles.input}
          />
        </FormField>

        <Button label="تأكيد وحفظ" onPress={save} />
      </View>
    </Sheet>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Txt size={12} c={color.textMuted} style={{ marginBottom: space.sm }}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  sectionLabel: { marginTop: space.xl, marginBottom: space.md },
  medHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kindBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  kindDrug: { backgroundColor: tint.water12 },
  kindSupp: { backgroundColor: tint.ai15 },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs, flexWrap: 'wrap' },
  timingChip: {
    backgroundColor: color.elevated,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 3,
  },
  confirmBtn: {
    marginTop: space.md,
    backgroundColor: color.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  takenBox: {
    marginTop: space.md,
    backgroundColor: tint.primary12,
    borderRadius: radius.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: tint.warning08,
    borderWidth: 1,
    borderColor: tint.warning30,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space.lg,
    color: color.textPrimary,
    fontFamily: font.semibold,
    fontSize: 15,
    textAlign: 'right',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm },
  segActive: { backgroundColor: color.primary },
});
