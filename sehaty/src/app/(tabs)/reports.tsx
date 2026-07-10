import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AiInsight, Card, Screen, Txt } from '@/components';
import { weeklyReport } from '@/data/mock';
import { color, radius, space, tint } from '@/theme/tokens';

export default function Reports() {
  const r = weeklyReport;
  return (
    <Screen scroll bottomInset={120}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Txt size={12} c={color.textMuted}>
            تقرير الأسبوع
          </Txt>
          <Txt weight="900" size={22}>
            {r.range}
          </Txt>
        </View>
        <View style={styles.toggle}>
          <View style={[styles.toggleBtn, styles.toggleActive]}>
            <Txt size={11} weight="600">
              أسبوع
            </Txt>
          </View>
          <View style={styles.toggleBtn}>
            <Txt size={11} c={color.textMuted}>
              شهر
            </Txt>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* AI summary */}
        <AiInsight label="ملخص Claude">
          <Txt size={13} c={color.textHigh} lh={22}>
            أسبوع كويس بشكل عام. السعرات في الهدف{' '}
            <Txt size={13} weight="700" c={color.primary}>
              {r.summaryHighlights.onTargetDays} أيام من 7
            </Txt>
            . النوم لسه أقل من الهدف بمعدل{' '}
            <Txt mono size={13} c={color.warning}>
              {r.summaryHighlights.sleepDeficitMin} دقيقة
            </Txt>{' '}
            يوميًا — ده اللي بيأثر على مزاجك يوم السبت.
          </Txt>
        </AiInsight>

        {/* KPI grid */}
        <View style={styles.grid}>
          {r.kpis.map((k) => (
            <Card key={k.key} style={styles.kpi} r={radius.md}>
              <Txt size={10} c={color.textMuted} style={{ marginBottom: 6 }}>
                {k.label}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                {k.emoji && <Txt size={20}>{k.emoji} </Txt>}
                <Txt mono weight="600" size={k.emoji ? 14 : 20} c={k.emoji ? color.primary : color.textPrimary}>
                  {k.value}
                </Txt>
                {k.unit && (
                  <Txt mono size={12} c={color.textMuted}>
                    {k.unit}
                  </Txt>
                )}
                {k.trend && (
                  <Txt mono size={12} c={color.warning}>
                    {' '}
                    {k.trend}
                  </Txt>
                )}
              </View>
              <Sparkline path={k.path} stroke={k.color} />
            </Card>
          ))}
        </View>

        {/* Weight */}
        <Card style={{ marginTop: space.md }}>
          <View style={styles.weightHead}>
            <View>
              <Txt size={11} c={color.textMuted}>
                الوزن
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Txt mono weight="600" size={24}>
                  {r.weight.current}
                </Txt>
                <Txt mono size={12} c={color.primary}>
                  {' '}
                  {r.weight.delta}
                </Txt>
              </View>
            </View>
            <Txt mono size={10} c={color.textMuted}>
              هدف: {r.weight.target}
            </Txt>
          </View>
          <Svg viewBox="0 0 320 60" width="100%" height={56}>
            <Path d={r.weight.path} fill="none" stroke={color.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Card>

        {/* Next-week recommendation */}
        <View style={styles.reco}>
          <View style={styles.recoHead}>
            <Txt size={14}>🎯</Txt>
            <Txt size={11} weight="700" c={color.primary} style={{ letterSpacing: 0.5 }}>
              توصية الأسبوع الجاي
            </Txt>
          </View>
          <Txt weight="700" size={14} style={{ marginBottom: 4 }}>
            {r.recommendation.title}
          </Txt>
          <Txt size={12} c={color.textTertiary}>
            {r.recommendation.body}
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

function Sparkline({ path, stroke }: { path: string; stroke: string }) {
  return (
    <Svg viewBox="0 0 100 30" width="100%" height={24} style={{ marginTop: 6 }}>
      <Path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg },
  toggle: { flexDirection: 'row', gap: 6, backgroundColor: color.surface, padding: 4, borderRadius: radius.md },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  toggleActive: { backgroundColor: color.elevated },
  body: { paddingHorizontal: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
  kpi: { width: '47%', flexGrow: 1 },
  weightHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md },
  reco: {
    marginTop: space.md,
    borderWidth: 1.5,
    borderColor: color.primary,
    borderRadius: radius.lg,
    padding: 18,
    backgroundColor: tint.primary08,
  },
  recoHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
});
