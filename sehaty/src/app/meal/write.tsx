import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Icon, Screen, Txt } from '@/components';
import { IconButton, TopBar } from '@/components/TopBar';
import { mealSuggestions } from '@/data/mock';
import type { MealType } from '@/data/types';
import { color, font, radius, space, tint } from '@/theme/tokens';

const TYPES: MealType[] = ['فطار', 'غدا', 'عشا', 'سناك'];

export default function MealWrite() {
  const router = useRouter();
  const [text, setText] = useState('نص فرخة مشوية مع طبق رز أبيض وسلطة خضرا وكوباية عصير مانجو');
  const [mealType, setMealType] = useState<MealType>('غدا');

  const analyze = () =>
    router.push(`/meal/analyzing?source=text&mealType=${mealType}&text=${encodeURIComponent(text)}`);

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar title="اكتب وجبتك" right={<IconButton name="camera" />} />

        <View style={styles.body}>
          <Txt weight="900" size={22}>
            اكتب اللي اكلته{'\n'}بشكل طبيعي
          </Txt>
          <Txt size={13} c={color.textTertiary} style={{ marginTop: 6, marginBottom: space.lg }}>
            Claude هيقسّم الكلام لأصناف تلقائيًا
          </Txt>

          {/* Meal type picker */}
          <View style={styles.types}>
            {TYPES.map((t) => {
              const active = t === mealType;
              return (
                <Pressable key={t} onPress={() => setMealType(t)} style={[styles.type, active && styles.typeActive]}>
                  <Txt size={11} weight={active ? '700' : '400'} c={active ? color.primary : color.textTertiary}>
                    {active ? '✓ ' : ''}
                    {t}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          {/* Textarea */}
          <View style={styles.textarea}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              style={styles.input}
              placeholder="اكتب وجبتك هنا..."
              placeholderTextColor={color.textMuted}
              textAlign="right"
            />
            <Txt mono size={10} c={color.textMuted} style={styles.count}>
              {text.length} حرف
            </Txt>
          </View>

          {/* Suggestions */}
          <Txt size={11} c={color.textMuted} style={{ marginTop: space.xl, marginBottom: space.md }}>
            ✨ اقتراحات من وجباتك السابقة
          </Txt>
          <View style={styles.chips}>
            {mealSuggestions.map((s) => (
              <Pressable key={s.label} style={styles.chip} onPress={() => setText((t) => `${t}${t ? '، ' : ''}${s.label}`)}>
                <Txt size={12} c={color.textSecondary}>
                  {s.emoji} {s.label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.footer}>
          <View style={styles.readyRow}>
            <View style={styles.dot} />
            <Txt size={11} c={color.aiSoft}>
              Claude جاهز يحلل
            </Txt>
          </View>
          <Button label="تحليل الوجبة" icon="spark" onPress={analyze} disabled={!text.trim()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: space.lg },
  types: { flexDirection: 'row', gap: 6, marginBottom: space.md },
  type: { paddingHorizontal: space.md, paddingVertical: 7, borderRadius: radius.lg, backgroundColor: color.surface },
  typeActive: { borderWidth: 1.5, borderColor: color.primary, backgroundColor: color.surface },
  textarea: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 18,
    padding: space.lg,
    minHeight: 180,
  },
  input: { color: color.textPrimary, fontFamily: font.regular, fontSize: 15, lineHeight: 27, textAlignVertical: 'top', flex: 1 },
  count: { position: 'absolute', bottom: 12, left: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.xxl, paddingTop: space.md },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md, paddingHorizontal: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.aiSoft },
});
