import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardScaffold } from '@/components/OnboardScaffold';
import { Txt } from '@/components';
import { useApp } from '@/state/store';
import { color, font, radius, space } from '@/theme/tokens';

export default function BasicInfo() {
  const router = useRouter();
  const { profile } = useApp();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [sex, setSex] = useState<'ذكر' | 'أنثى'>(profile.sex);
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));

  return (
    <OnboardScaffold
      step={2}
      title="عرّفنا بنفسك"
      subtitle="علشان نحسب احتياجك اليومي بدقة"
      ctaLabel="التالي"
      onNext={() => router.push('/onboarding/activity')}
    >
      <View style={{ gap: space.lg }}>
        <Field label="الاسم">
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, styles.text]}
            placeholderTextColor={color.textMuted}
          />
        </Field>

        <View style={styles.rowGap}>
          <Field label="العمر" style={{ flex: 1 }}>
            <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={[styles.input, styles.mono]} />
          </Field>
          <Field label="الجنس" style={{ flex: 1 }}>
            <View style={styles.segment}>
              {(['ذكر', 'أنثى'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSex(s)}
                  style={[styles.segBtn, sex === s && styles.segActive]}
                >
                  <Txt weight="600" size={14} c={sex === s ? color.onPrimary : color.textSecondary}>
                    {s}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </Field>
        </View>

        <View style={styles.rowGap}>
          <Field label="الطول (سم)" style={{ flex: 1 }}>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
              style={[styles.input, styles.mono, styles.highlight]}
            />
          </Field>
          <Field label="الوزن (كجم)" style={{ flex: 1 }}>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="number-pad" style={[styles.input, styles.mono]} />
          </Field>
        </View>
      </View>
    </OnboardScaffold>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={style}>
      <Txt size={12} c={color.textMuted} style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rowGap: { flexDirection: 'row', gap: space.md },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space.lg,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: { fontFamily: font.semibold, fontSize: 16 },
  mono: { fontFamily: font.monoSemibold, fontSize: 18 },
  highlight: { borderColor: color.primary, color: color.primary },
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
