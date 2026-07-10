import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button, Card, Icon, Screen, Sheet, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import type { EmergencyCard } from '@/data/types';
import { connectHealth, isHealthAvailable, readHealthSnapshot, type HealthSnapshot } from '@/services/health';
import { useApp } from '@/state/store';
import { color, font, radius, space, tint } from '@/theme/tokens';

// ─── Daily goals config ──────────────────────────────────────────────────────

type GoalKey = 'calories' | 'water' | 'sleep';

const GOALS: Record<
  GoalKey,
  { emoji: string; label: string; unit: string; step: number; min: number; max: number }
> = {
  calories: { emoji: '🔥', label: 'السعرات', unit: 'kcal', step: 50, min: 800, max: 6000 },
  water: { emoji: '💧', label: 'المياه', unit: 'ml', step: 100, min: 500, max: 6000 },
  sleep: { emoji: '😴', label: 'النوم', unit: 'ساعات', step: 0.5, min: 3, max: 14 },
};

/** Format a goal value: drop the trailing .0 but keep the .5 for sleep. */
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(n));

export default function Settings() {
  const { profile, updateProfile, emergencyCard, saveEmergencyCard, settings, updateSettings } = useApp();

  // Emergency card sheet
  const [emVisible, setEmVisible] = useState(false);
  const [emForm, setEmForm] = useState({
    fullName: '',
    bloodType: '',
    contactName: '',
    contactPhone: '',
    allergies: '',
    currentMeds: '',
  });

  const openEmergencySheet = () => {
    setEmForm({
      fullName: emergencyCard.fullName,
      bloodType: emergencyCard.bloodType,
      contactName: emergencyCard.emergencyContactName,
      contactPhone: emergencyCard.emergencyContactPhone,
      allergies: emergencyCard.allergies.join('، '),
      currentMeds: emergencyCard.currentMeds.join('، '),
    });
    setEmVisible(true);
  };

  const saveEmergency = () => {
    const splitList = (s: string) =>
      s
        .split(/[،,]/)
        .map((x) => x.trim())
        .filter(Boolean);
    const card: EmergencyCard = {
      fullName: emForm.fullName.trim() || emergencyCard.fullName,
      bloodType: emForm.bloodType.trim() || emergencyCard.bloodType,
      emergencyContactName: emForm.contactName.trim() || emergencyCard.emergencyContactName,
      emergencyContactPhone: emForm.contactPhone.trim() || emergencyCard.emergencyContactPhone,
      allergies: splitList(emForm.allergies),
      currentMeds: splitList(emForm.currentMeds),
    };
    saveEmergencyCard(card);
    setEmVisible(false);
  };

  // Goal editor sheet
  const [goalKey, setGoalKey] = useState<GoalKey | null>(null);
  const [goalValue, setGoalValue] = useState('');

  const goalCurrent: Record<GoalKey, number> = {
    calories: profile.calorieTarget,
    water: profile.waterTargetMl,
    sleep: profile.sleepTargetHours,
  };

  const openGoal = (key: GoalKey) => {
    setGoalValue(fmt(goalCurrent[key]));
    setGoalKey(key);
  };

  const stepGoal = (dir: 1 | -1) => {
    if (!goalKey) return;
    const cfg = GOALS[goalKey];
    const cur = parseFloat(goalValue) || goalCurrent[goalKey];
    const next = Math.min(cfg.max, Math.max(cfg.min, cur + dir * cfg.step));
    setGoalValue(fmt(Math.round(next * 10) / 10));
  };

  const saveGoal = () => {
    if (!goalKey) return;
    const cfg = GOALS[goalKey];
    const parsed = parseFloat(goalValue);
    if (!Number.isNaN(parsed)) {
      const v = Math.min(cfg.max, Math.max(cfg.min, parsed));
      if (goalKey === 'calories') updateProfile({ calorieTarget: Math.round(v) });
      if (goalKey === 'water') updateProfile({ waterTargetMl: Math.round(v) });
      if (goalKey === 'sleep') updateProfile({ sleepTargetHours: Math.round(v * 2) / 2 });
    }
    setGoalKey(null);
  };

  // Health Connect
  const [healthAvailable, setHealthAvailable] = useState<boolean | null>(null);
  const [healthSnap, setHealthSnap] = useState<HealthSnapshot | null>(null);
  const [connectNote, setConnectNote] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isHealthAvailable().then((ok) => {
      if (!cancelled) setHealthAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settings.healthConnected) {
      setHealthSnap(null);
      return;
    }
    let cancelled = false;
    readHealthSnapshot().then((snap) => {
      if (!cancelled) setHealthSnap(snap);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.healthConnected]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const granted = await connectHealth();
      if (granted) {
        updateSettings({ healthConnected: true });
        setConnectNote(false);
      } else {
        // Stub seam: the native module lands in the "ربط Google Health" phase.
        setConnectNote(true);
      }
    } finally {
      setConnecting(false);
    }
  };

  const callEmergency = () => {
    const phone = emergencyCard.emergencyContactPhone.replace(/\s/g, '');
    if (phone) Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <Screen scroll bottomInset={48}>
      <TopBar title="الإعدادات" />

      <View style={styles.body}>
        {/* ── بطاقة الطوارئ ─────────────────────────────────────────────── */}
        <SectionTitle emoji="🆘" title="بطاقة الطوارئ" />
        <Card style={styles.emergencyCard}>
          <View style={styles.emHeader}>
            <View style={{ flex: 1 }}>
              <Txt size={11} c={color.dangerSoft}>
                الاسم الكامل
              </Txt>
              <Txt weight="700" size={17}>
                {emergencyCard.fullName}
              </Txt>
            </View>
            <View style={styles.bloodChip}>
              <Txt mono weight="700" size={22} c={color.danger}>
                {emergencyCard.bloodType}
              </Txt>
              <Txt size={9} c={color.dangerSoft}>
                فصيلة الدم
              </Txt>
            </View>
          </View>

          <Pressable onPress={callEmergency} style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}>
            <Txt size={18}>📞</Txt>
            <View style={{ flex: 1 }}>
              <Txt size={11} c={color.textMuted}>
                اتصال طوارئ · {emergencyCard.emergencyContactName}
              </Txt>
              <Txt mono weight="600" size={15} c={color.textHigh}>
                {emergencyCard.emergencyContactPhone}
              </Txt>
            </View>
            <Icon name="arrowLeft" size={16} color={color.textMuted} />
          </Pressable>

          <Txt size={11} c={color.textMuted} style={styles.emLabel}>
            حساسية
          </Txt>
          <View style={styles.chipRow}>
            {emergencyCard.allergies.length ? (
              emergencyCard.allergies.map((a) => (
                <View key={a} style={[styles.chip, { backgroundColor: tint.danger15 }]}>
                  <Txt size={12} weight="600" c={color.dangerSoft}>
                    {a}
                  </Txt>
                </View>
              ))
            ) : (
              <Txt size={12} c={color.textMuted}>
                مفيش حساسية مسجّلة
              </Txt>
            )}
          </View>

          <Txt size={11} c={color.textMuted} style={styles.emLabel}>
            أدوية حالية
          </Txt>
          <View style={styles.chipRow}>
            {emergencyCard.currentMeds.length ? (
              emergencyCard.currentMeds.map((m) => (
                <View key={m} style={[styles.chip, { backgroundColor: tint.ai15 }]}>
                  <Txt size={12} weight="600" c={color.aiSoft}>
                    {m}
                  </Txt>
                </View>
              ))
            ) : (
              <Txt size={12} c={color.textMuted}>
                مفيش أدوية مسجّلة
              </Txt>
            )}
          </View>

          <Button label="تعديل" variant="secondary" icon="edit" onPress={openEmergencySheet} style={{ marginTop: space.lg }} />
        </Card>

        {/* ── أهدافي اليومية ────────────────────────────────────────────── */}
        <SectionTitle emoji="🎯" title="أهدافي اليومية" />
        <Card pad={space.sm}>
          {(Object.keys(GOALS) as GoalKey[]).map((key, i) => (
            <View key={key}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable onPress={() => openGoal(key)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                <Txt size={18}>{GOALS[key].emoji}</Txt>
                <Txt weight="600" size={14} style={{ flex: 1 }}>
                  {GOALS[key].label}
                </Txt>
                <Txt mono weight="600" size={15} c={color.primary}>
                  {fmt(goalCurrent[key])}
                </Txt>
                <Txt mono size={11} c={color.textMuted}>
                  {GOALS[key].unit}
                </Txt>
                <Icon name="edit" size={14} color={color.textMuted} />
              </Pressable>
            </View>
          ))}
        </Card>

        {/* ── الإشعارات ─────────────────────────────────────────────────── */}
        <SectionTitle emoji="🔔" title="الإشعارات" />
        <Card pad={space.sm}>
          <ToggleRow
            label="الإشعارات"
            sub="تنبيهات عامة من التطبيق"
            value={settings.notificationsEnabled}
            onChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="تذكير الأدوية"
            sub="تنبيه في معاد كل جرعة"
            value={settings.medRemindersEnabled}
            onChange={(v) => updateSettings({ medRemindersEnabled: v })}
          />
        </Card>

        {/* ── اتصال الساعة و Google Health ─────────────────────────────── */}
        <SectionTitle emoji="⌚" title="اتصال الساعة و Google Health" />
        <Card>
          {settings.healthConnected ? (
            <>
              <View style={styles.healthTop}>
                <Txt weight="700" size={15} style={{ flex: 1 }}>
                  Google Health
                </Txt>
                <View style={styles.connectedChip}>
                  <Icon name="check" size={12} color={color.onPrimary} />
                  <Txt weight="700" size={11} c={color.onPrimary}>
                    متصل
                  </Txt>
                </View>
              </View>
              {healthSnap && (
                <View style={styles.stepsRow}>
                  <Icon name="steps" size={18} color={color.primary} />
                  <Txt mono weight="600" size={18}>
                    {healthSnap.stepsToday.toLocaleString('en-US')}
                  </Txt>
                  <Txt mono size={12} c={color.textMuted}>
                    / {healthSnap.stepsTarget.toLocaleString('en-US')} خطوة النهاردة
                  </Txt>
                </View>
              )}
            </>
          ) : (
            <>
              <Txt weight="700" size={15}>
                Google Health
              </Txt>
              <Txt size={13} c={color.textTertiary} lh={22} style={{ marginTop: 4 }}>
                اربط Google Health عشان الخطوات والنوم يتسجلوا لوحدهم
              </Txt>
              <Txt size={11} c={color.textMuted} style={{ marginTop: 4 }}>
                {healthAvailable
                  ? 'Health Connect متوفر على موبايلك — الربط خطوة واحدة'
                  : 'الربط محتاج Health Connect (أندرويد 14 أو أحدث)'}
              </Txt>
              <Button
                label={connecting ? 'جاري الربط…' : 'ربط Google Health'}
                variant="ai"
                icon="flash"
                onPress={handleConnect}
                disabled={connecting}
                style={{ marginTop: space.lg }}
              />
              {connectNote && (
                <View style={styles.noteBox}>
                  <Txt size={12} c={color.aiSoft} lh={20}>
                    هيتفعّل في تحديث جاي — التطبيق جاهز للربط
                  </Txt>
                </View>
              )}
            </>
          )}
        </Card>

        {/* ── الخصوصية والبيانات ───────────────────────────────────────── */}
        <SectionTitle emoji="🔒" title="الخصوصية والبيانات" />
        <Card pad={space.sm}>
          <StaticRow text="بياناتك كلها متخزنة على موبايلك بس" />
          <View style={styles.divider} />
          <StaticRow text="الصور الطبية مش بتتحفظ على أي سيرفر" />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Txt size={14} c={color.textSecondary} style={{ flex: 1 }}>
              نسخة التطبيق
            </Txt>
            <Txt mono size={13} c={color.textMuted}>
              1.0.0
            </Txt>
          </View>
        </Card>
      </View>

      {/* ── Sheet: تعديل بطاقة الطوارئ ─────────────────────────────────── */}
      <Sheet visible={emVisible} onClose={() => setEmVisible(false)}>
        <Txt center weight="900" size={18}>
          تعديل بطاقة الطوارئ
        </Txt>
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <Field label="الاسم الكامل">
            <TextInput
              value={emForm.fullName}
              onChangeText={(t) => setEmForm((f) => ({ ...f, fullName: t }))}
              style={[styles.input, styles.inputText]}
              placeholder="الاسم زي البطاقة"
              placeholderTextColor={color.textMuted}
            />
          </Field>
          <View style={styles.rowGap}>
            <Field label="فصيلة الدم" style={{ flex: 1 }}>
              <TextInput
                value={emForm.bloodType}
                onChangeText={(t) => setEmForm((f) => ({ ...f, bloodType: t }))}
                style={[styles.input, styles.inputMono]}
                placeholder="O+"
                placeholderTextColor={color.textMuted}
                autoCapitalize="characters"
              />
            </Field>
            <Field label="اسم جهة الطوارئ" style={{ flex: 2 }}>
              <TextInput
                value={emForm.contactName}
                onChangeText={(t) => setEmForm((f) => ({ ...f, contactName: t }))}
                style={[styles.input, styles.inputText]}
                placeholder="والدي"
                placeholderTextColor={color.textMuted}
              />
            </Field>
          </View>
          <Field label="رقم الطوارئ">
            <TextInput
              value={emForm.contactPhone}
              onChangeText={(t) => setEmForm((f) => ({ ...f, contactPhone: t }))}
              style={[styles.input, styles.inputMono]}
              keyboardType="phone-pad"
              placeholder="01000000000"
              placeholderTextColor={color.textMuted}
            />
          </Field>
          <Field label="حساسية (افصل بفاصلة)">
            <TextInput
              value={emForm.allergies}
              onChangeText={(t) => setEmForm((f) => ({ ...f, allergies: t }))}
              style={[styles.input, styles.inputText]}
              placeholder="مكسرات، بنسلين"
              placeholderTextColor={color.textMuted}
            />
          </Field>
          <Field label="أدوية حالية (افصل بفاصلة)">
            <TextInput
              value={emForm.currentMeds}
              onChangeText={(t) => setEmForm((f) => ({ ...f, currentMeds: t }))}
              style={[styles.input, styles.inputText]}
              placeholder="فيتامين D، أوميجا 3"
              placeholderTextColor={color.textMuted}
            />
          </Field>
        </View>
        <View style={{ gap: space.sm, marginTop: space.xl }}>
          <Button label="حفظ" icon="check" onPress={saveEmergency} />
          <Button label="إلغاء" variant="secondary" glow={false} onPress={() => setEmVisible(false)} />
        </View>
      </Sheet>

      {/* ── Sheet: تعديل هدف يومي ──────────────────────────────────────── */}
      <Sheet visible={goalKey !== null} onClose={() => setGoalKey(null)}>
        {goalKey && (
          <>
            <Txt center weight="900" size={18}>
              {GOALS[goalKey].emoji} هدف {GOALS[goalKey].label}
            </Txt>
            <View style={styles.stepperRow}>
              <StepBtn label="−" onPress={() => stepGoal(-1)} />
              <View style={styles.stepperValue}>
                <TextInput
                  value={goalValue}
                  onChangeText={setGoalValue}
                  keyboardType="decimal-pad"
                  style={styles.stepperInput}
                  selectTextOnFocus
                />
                <Txt mono size={12} c={color.textMuted}>
                  {GOALS[goalKey].unit}
                </Txt>
              </View>
              <StepBtn label="+" onPress={() => stepGoal(1)} />
            </View>
            <View style={{ gap: space.sm, marginTop: space.xl }}>
              <Button label="حفظ الهدف" icon="check" onPress={saveGoal} />
              <Button label="إلغاء" variant="secondary" glow={false} onPress={() => setGoalKey(null)} />
            </View>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

// ─── Screen-local pieces ─────────────────────────────────────────────────────

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Txt size={13}>{emoji}</Txt>
      <Txt weight="700" size={13} c={color.textTertiary}>
        {title}
      </Txt>
    </View>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Txt weight="600" size={14}>
          {label}
        </Txt>
        {sub && (
          <Txt size={11} c={color.textMuted}>
            {sub}
          </Txt>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: color.elevated, true: tint.primaryGlow }}
        thumbColor={value ? color.primary : color.textMuted}
        ios_backgroundColor={color.elevated}
      />
    </View>
  );
}

function StaticRow({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Icon name="check" size={16} color={color.primary} />
      <Txt size={13} c={color.textSecondary} style={{ flex: 1 }} lh={20}>
        {text}
      </Txt>
    </View>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={style}>
      <Txt size={11} c={color.textMuted} style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

function StepBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
      <Txt mono weight="600" size={24} c={color.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xl,
    marginBottom: space.md,
  },

  // Emergency card
  emergencyCard: {
    borderWidth: 1,
    borderColor: tint.danger15,
    backgroundColor: color.surfaceAlt,
  },
  emHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bloodChip: {
    backgroundColor: tint.danger08,
    borderWidth: 1,
    borderColor: tint.danger15,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.lg,
  },
  emLabel: { marginTop: space.lg, marginBottom: space.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },

  // Generic rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  divider: { height: 1, backgroundColor: color.border, marginHorizontal: space.sm },

  // Health
  healthTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  connectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    marginTop: space.lg,
    backgroundColor: tint.primary08,
    borderRadius: radius.md,
    padding: space.md,
  },
  noteBox: {
    marginTop: space.md,
    backgroundColor: tint.ai10,
    borderRadius: radius.md,
    padding: space.md,
  },

  // Sheet form inputs
  rowGap: { flexDirection: 'row', gap: space.md },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: color.border,
  },
  inputText: { fontFamily: font.semibold, fontSize: 15 },
  inputMono: { fontFamily: font.monoSemibold, fontSize: 16 },

  // Goal stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    marginTop: space.xl,
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { alignItems: 'center', minWidth: 110 },
  stepperInput: {
    fontFamily: font.monoSemibold,
    fontSize: 36,
    color: color.primary,
    textAlign: 'center',
    minWidth: 110,
    paddingVertical: 0,
  },
});
