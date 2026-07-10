import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Txt } from '@/components';
import { IconButton, TopBar } from '@/components/TopBar';
import { waterPresets } from '@/data/mock';
import { useApp } from '@/state/store';
import { color, radius, space } from '@/theme/tokens';

export default function Water() {
  const { profile, water, waterConsumedMl, addWater } = useApp();
  const targetMl = profile.waterTargetMl;
  const pct = Math.min(100, Math.round((waterConsumedMl / targetMl) * 100));
  const liters = (waterConsumedMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);

  const cup = waterPresets[0];
  const big = waterPresets[1];
  const bottle = waterPresets[2];

  return (
    <Screen scroll bottomInset={40}>
      <TopBar title="المياه اليوم" right={<IconButton name="list" />} />

      <View style={styles.body}>
        {/* Big number */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Txt mono weight="600" size={56} lh={56}>
              {liters}
            </Txt>
            <Txt mono size={20} c={color.textMuted}>
              {' '}
              / {targetL} L
            </Txt>
          </View>
          <Txt size={12} c={color.primary} style={{ marginTop: 6 }}>
            {pct}% من هدفك اليومي
          </Txt>
        </View>

        {/* Bottle visual */}
        <View style={styles.bottleWrap}>
          <View style={styles.bottle}>
            <View style={styles.cap} />
            <LinearGradient
              colors={['rgba(206,253,130,0.4)', color.primary]}
              style={[styles.fill, { height: `${Math.max(6, pct)}%` }]}
            >
              <View style={styles.shine} />
            </LinearGradient>
            <View style={styles.bottlePct}>
              <Txt mono weight="600" size={14} c="#fff">
                {pct}%
              </Txt>
            </View>
          </View>
        </View>

        {/* Quick add */}
        <Txt size={12} c={color.textMuted} style={{ marginBottom: space.md }}>
          تسجيل سريع
        </Txt>
        <View style={styles.quickRow}>
          <QuickBtn emoji={cup.emoji} label={cup.label} ml={cup.ml} onPress={() => addWater(cup.ml, cup.emoji)} />
          <QuickBtn emoji={big.emoji} label={big.label} ml={big.ml} onPress={() => addWater(big.ml, big.emoji)} />
        </View>
        <Pressable onPress={() => addWater(bottle.ml, bottle.emoji)}>
          <LinearGradient colors={[color.primary, color.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.bottleBtn}>
            <Txt size={22}>💧</Txt>
            <Txt weight="700" size={15} c={color.onPrimary}>
              زجاجة كاملة
            </Txt>
            <Txt mono size={11} c={color.onPrimary}>
              · {bottle.ml} ml
            </Txt>
          </LinearGradient>
        </Pressable>

        {/* Today log */}
        <Txt size={11} c={color.textMuted} style={{ marginTop: space.xl, marginBottom: space.md }}>
          اليوم
        </Txt>
        <View style={{ gap: space.sm }}>
          {water.map((w) => (
            <View key={w.id} style={styles.logRow}>
              <Txt size={16}>{w.emoji}</Txt>
              <Txt mono size={13} style={{ flex: 1 }}>
                {w.ml} ml
              </Txt>
              <Txt mono size={11} c={color.textMuted}>
                {w.loggedAt}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function QuickBtn({ emoji, label, ml, onPress }: { emoji: string; label: string; ml: number; onPress: () => void }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <Txt size={22}>{emoji}</Txt>
      <Txt weight="700" size={13}>
        {label}
      </Txt>
      <Txt mono size={10} c={color.textMuted}>
        {ml} ml
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl },
  hero: { alignItems: 'center', marginTop: space.lg, marginBottom: space.sm },
  bottleWrap: { alignItems: 'center', marginVertical: space.xl },
  bottle: {
    width: 120,
    height: 220,
    borderWidth: 3,
    borderColor: color.elevated,
    borderRadius: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cap: { position: 'absolute', top: -16, alignSelf: 'center', width: 40, height: 20, backgroundColor: color.elevated, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  fill: { borderRadius: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  bottlePct: { position: 'absolute', top: '46%', alignSelf: 'center' },
  quickRow: { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  quickBtn: { flex: 1, backgroundColor: color.surface, borderRadius: radius.md, paddingVertical: space.lg, alignItems: 'center', gap: 4 },
  bottleBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.sm, borderRadius: radius.md, paddingVertical: space.lg },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: space.md },
});
