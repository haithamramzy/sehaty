import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Button, Screen, Txt } from '@/components';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/state/store';
import type { MoodLevel } from '@/data/types';
import { color, radius, space } from '@/theme/tokens';

const MOODS: { level: MoodLevel; label: string; tint: string }[] = [
  { level: 1, label: 'سيئ جدًا', tint: color.danger },
  { level: 2, label: 'سيئ', tint: color.warning },
  { level: 3, label: 'عادي', tint: color.textTertiary },
  { level: 4, label: 'كويس', tint: color.primary },
  { level: 5, label: 'ممتاز', tint: color.primary },
];

const WEEK = [
  { d: 'س', h: 36, c: color.warning },
  { d: 'ح', h: 24, c: color.danger },
  { d: 'ن', h: 44, c: color.primary },
  { d: 'ث', h: 52, c: color.primary },
  { d: 'ر', h: 36, c: color.warning },
  { d: 'خ', h: 44, c: color.primary },
  { d: 'ج', h: 48, c: color.primary },
];

export default function Mood() {
  const router = useRouter();
  const { setMood } = useApp();
  const [selected, setSelected] = useState<MoodLevel>(4);

  const save = () => {
    setMood(selected);
    router.back();
  };

  return (
    <Screen scroll bottomInset={40}>
      <TopBar title="مزاجك دلوقتي" leading="close" />

      <View style={styles.body}>
        <View style={{ alignItems: 'center', marginVertical: space.xl }}>
          <Txt weight="900" size={26}>
            كيف حالك؟
          </Txt>
          <Txt size={13} c={color.textTertiary} style={{ marginTop: 8 }}>
            اختار الأقرب لإحساسك
          </Txt>
        </View>

        {/* Faces */}
        <View style={styles.faces}>
          {MOODS.map((m) => {
            const active = selected === m.level;
            return (
              <Pressable key={m.level} style={styles.faceCol} onPress={() => setSelected(m.level)}>
                {active ? (
                  <LinearGradient colors={[color.primary, color.primaryDeep]} style={[styles.faceBox, styles.faceActive]}>
                    <MoodFace level={m.level} stroke={color.onPrimary} size={34} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.faceBox, { opacity: 0.5 }]}>
                    <MoodFace level={m.level} stroke={m.tint} size={30} />
                  </View>
                )}
                <Txt size={active ? 11 : 9} weight={active ? '700' : '400'} c={active ? color.primary : color.textMuted}>
                  {m.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        {/* Optional note */}
        <View style={styles.note}>
          <Txt size={11} c={color.textMuted} style={{ marginBottom: 8 }}>
            أي ملاحظة؟ (اختياري)
          </Txt>
          <Txt size={14} c={color.textMuted}>
            مثال: النهارده اشتغلت كتير بس مرتاح...
          </Txt>
        </View>

        {/* 7-day chart */}
        <Txt size={11} c={color.textMuted} style={{ marginBottom: space.md }}>
          آخر 7 أيام
        </Txt>
        <View style={styles.chart}>
          {WEEK.map((b, i) => (
            <View key={i} style={styles.bar}>
              <LinearGradient colors={[b.c, color.elevated]} style={[styles.barFill, { height: b.h }]} />
              <Txt mono size={9} c={i === WEEK.length - 1 ? color.primary : color.textMuted} weight={i === WEEK.length - 1 ? '700' : '400'}>
                {b.d}
              </Txt>
            </View>
          ))}
        </View>

        <Button label="حفظ" onPress={save} />
      </View>
    </Screen>
  );
}

/** Minimal SVG mood faces (1=very bad → 5=great). */
function MoodFace({ level, stroke, size }: { level: MoodLevel; stroke: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={17} fill="none" stroke={stroke} strokeWidth={2} />
      {level === 5 ? (
        <>
          <Path d="M11 15 Q14 12 17 15" fill="none" stroke={stroke} strokeWidth={2} />
          <Path d="M23 15 Q26 12 29 15" fill="none" stroke={stroke} strokeWidth={2} />
          <Path d="M11 24 Q20 34 29 24" fill={stroke} />
        </>
      ) : (
        <>
          <Circle cx={14} cy={17} r={1.6} fill={stroke} />
          <Circle cx={26} cy={17} r={1.6} fill={stroke} />
          {level === 1 && <Path d="M13 28 Q20 22 27 28" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
          {level === 2 && <Path d="M13 27 Q20 24 27 27" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
          {level === 3 && <Line x1={14} y1={27} x2={26} y2={27} stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
          {level === 4 && <Path d="M13 26 Q20 32 27 26" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  faces: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xxl },
  faceCol: { alignItems: 'center', gap: 8 },
  faceBox: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  faceActive: {
    width: 64,
    height: 64,
    borderRadius: 22,
    shadowColor: color.primary,
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  note: { backgroundColor: color.surface, borderRadius: radius.md, padding: space.lg, marginBottom: space.xl },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: color.surface, borderRadius: radius.md, padding: space.lg, marginBottom: space.xl, height: 92 },
  bar: { alignItems: 'center', gap: 6 },
  barFill: { width: 8, borderRadius: 4 },
});
