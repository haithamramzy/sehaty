import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Button, Icon, MockPlate, Screen, Txt } from '@/components';
import { IconButton, TopBar } from '@/components/TopBar';
import { useApp } from '@/state/store';
import type { FoodItem } from '@/data/types';
import { color, radius, space, tint } from '@/theme/tokens';

/** AI meal breakdown: editable item cards + summary + confirm/save. */
export default function MealResult() {
  const router = useRouter();
  const { draftMeal, addMeal, setDraftMeal } = useApp();
  const [items, setItems] = useState<FoodItem[]>(draftMeal?.items ?? []);

  if (!draftMeal) return <Redirect href="/(tabs)" />;

  const total = items.reduce((s, i) => s + i.kcal, 0);
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const save = () => {
    addMeal({
      type: draftMeal.mealType,
      source: 'photo',
      loggedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      items,
      kcal: total,
      protein: draftMeal.protein,
      carb: draftMeal.carb,
      fat: draftMeal.fat,
    });
    setDraftMeal(null);
    router.dismissAll();
  };

  const bgFor = (i: number) => [tint.warning15, tint.danger15, tint.primary15][i % 3];

  return (
    <Screen>
      <TopBar title={mealLabel(draftMeal.mealType)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
        <View style={styles.body}>
          {/* Thumbnail */}
          <View style={styles.thumb}>
            <MockPlate radius={radius.md} style={StyleSheet.absoluteFill as object} />
            <View style={styles.aiTag}>
              <Icon name="spark" size={10} color="#fff" />
              <Txt size={10} weight="600" c="#fff">
                تحليل AI
              </Txt>
            </View>
          </View>

          <Txt size={11} c={color.textMuted} style={{ marginBottom: space.md }}>
            اكتشف Claude {items.length} أصناف
          </Txt>

          <View style={{ gap: space.md }}>
            {items.map((item, i) => (
              <View key={item.id} style={styles.item}>
                <View style={[styles.itemEmoji, { backgroundColor: bgFor(i) }]}>
                  <Txt size={22}>{item.emoji}</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="700" size={14}>
                    {item.name}
                  </Txt>
                  {item.grams != null && (
                    <Txt mono size={11} c={color.textMuted}>
                      ≈ {item.grams}g
                    </Txt>
                  )}
                </View>
                <View style={styles.itemRight}>
                  <View style={styles.itemKcal}>
                    <Txt mono weight="600" size={16} c={item.flagged ? color.warning : color.primary}>
                      {item.kcal}
                    </Txt>
                    <Txt mono size={10} c={color.textMuted}>
                      {' '}
                      kcal
                    </Txt>
                  </View>
                  <Pressable onPress={() => remove(item.id)} hitSlop={8} style={styles.del}>
                    <Icon name="x" size={14} color={color.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable style={styles.addManual}>
              <Txt size={12} weight="600" c={color.textTertiary}>
                + إضافة صنف يدوي
              </Txt>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Summary + confirm */}
      <View style={styles.footer}>
        <View style={styles.summary}>
          <View>
            <Txt size={11} c={color.textMuted}>
              إجمالي الوجبة
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Txt mono weight="600" size={22}>
                {total}
              </Txt>
              <Txt mono size={12} c={color.textMuted}>
                {' '}
                kcal
              </Txt>
            </View>
          </View>
          <View style={styles.macroRow}>
            <MacroPill value={`${draftMeal.protein}g`} label="بروتين" c={color.primary} />
            <MacroPill value={`${draftMeal.carb}g`} label="كارب" c={color.warning} />
            <MacroPill value={`${draftMeal.fat}g`} label="دهون" c={color.aiSoft} />
          </View>
        </View>
        <Button label="تأكيد وحفظ" onPress={save} />
      </View>
    </Screen>
  );
}

function MacroPill({ value, label, c }: { value: string; label: string; c: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt mono weight="600" size={13} c={c}>
        {value}
      </Txt>
      <Txt size={9} c={color.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

function mealLabel(type: string) {
  return { فطار: 'الفطار', غدا: 'الغداء', عشا: 'العشاء', سناك: 'سناك' }[type] ?? type;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.sm },
  thumb: { width: '100%', height: 120, borderRadius: radius.md, overflow: 'hidden', marginBottom: space.lg },
  aiTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(109,74,255,0.9)',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, padding: space.md },
  itemEmoji: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  itemKcal: { flexDirection: 'row', alignItems: 'baseline' },
  del: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.elevated, alignItems: 'center', justifyContent: 'center' },
  addManual: {
    paddingVertical: space.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.borderMuted,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    paddingTop: space.lg,
    backgroundColor: color.bg,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.md, padding: space.md, marginBottom: space.md },
  macroRow: { flex: 1, flexDirection: 'row', gap: space.md, justifyContent: 'flex-end' },
});
