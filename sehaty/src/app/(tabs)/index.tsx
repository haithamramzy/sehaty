import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { AiInsight, Card, Icon, ProgressRing, Screen, Txt } from '@/components';
import { IconButton } from '@/components/TopBar';
import { useApp } from '@/state/store';
import { color, radius, space, tint } from '@/theme/tokens';

const WEEKDAYS = ['الأحد', 'الاتنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function Home() {
  const router = useRouter();
  const { profile, caloriesConsumed, waterConsumedMl, meals, lastSleep, meds } = useApp();

  const calTarget = profile.calorieTarget;
  const calProgress = caloriesConsumed / calTarget;
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const carb = meals.reduce((s, m) => s + m.carb, 0);
  const fat = meals.reduce((s, m) => s + m.fat, 0);

  const waterL = waterConsumedMl / 1000;
  const waterSegs = 8;
  const filled = Math.round((waterConsumedMl / profile.waterTargetMl) * waterSegs);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'صباح الخير' : now.getHours() < 18 ? 'مساء الخير' : 'مساء الخير';
  const dateLine = `${WEEKDAYS[now.getDay()]}، ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const sleepHours = lastSleep?.hours ?? null;
  const sleepBelowTarget = sleepHours !== null && sleepHours < profile.sleepTargetHours;
  const nextMed = meds.find((m) => m.active && m.timing && m.timing !== 'حسب الحاجة');

  const insight = sleepBelowTarget
    ? `نومك امبارح كان ${sleepHours!.toFixed(1)} ساعة — أقل من المعتاد. جرّب تنام بدري النهاردة.`
    : 'يومك ماشي كويس — كمّل تسجيل وجباتك ومياهك عشان التقرير الأسبوعي يبقى أدق.';

  return (
    <Screen scroll bottomInset={120}>
      {/* Greeting */}
      <View style={styles.greet}>
        <View>
          <Txt size={13} c={color.textMuted} style={{ marginBottom: 4 }}>
            {greeting}، {profile.name} 👋
          </Txt>
          <Txt weight="900" size={22}>
            {dateLine}
          </Txt>
        </View>
        <IconButton name="user" bg={color.surface} tint={color.textSecondary} onPress={() => router.push('/settings')} />
      </View>

      {/* AI insight */}
      <View style={styles.pad}>
        <AiInsight text={insight} />
      </View>

      {/* Bento grid */}
      <View style={[styles.pad, styles.grid]}>
        {/* Calories (full width) */}
        <Card style={styles.calCard} r={radius.lg}>
          <ProgressRing progress={calProgress} size={96} stroke={8} />
          <View style={{ flex: 1 }}>
            <Txt size={12} c={color.textMuted}>
              السعرات اليوم
            </Txt>
            <View style={styles.calNum}>
              <Txt mono weight="600" size={28}>
                {caloriesConsumed.toLocaleString('en-US')}
              </Txt>
              <Txt mono size={13} c={color.textMuted}>
                {' '}
                / {calTarget.toLocaleString('en-US')}
              </Txt>
            </View>
            <View style={styles.macros}>
              <Macro emoji="🥩" value={`${protein}g`} />
              <Macro emoji="🍚" value={`${carb}g`} />
              <Macro emoji="🥑" value={`${fat}g`} />
            </View>
          </View>
        </Card>

        {/* Water */}
        <Pressable style={styles.tileWrap} onPress={() => router.push('/water')}>
          <Card style={styles.tileInner}>
            <TileHead label="مياه" icon="drop" iconColor={color.water} />
            <View style={styles.tileNum}>
              <Txt mono weight="600" size={22}>
                {waterL.toFixed(1)}
              </Txt>
              <Txt mono size={11} c={color.textMuted}>
                {' '}
                L
              </Txt>
            </View>
            <View style={styles.segs}>
              {Array.from({ length: waterSegs }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.seg,
                    { backgroundColor: i < filled ? color.primary : color.elevated, opacity: i === filled - 1 && filled < waterSegs ? 0.6 : 1 },
                  ]}
                />
              ))}
            </View>
          </Card>
        </Pressable>

        {/* Sleep */}
        <Pressable style={styles.tileWrap} onPress={() => router.push('/sleep' as never)}>
          <Card style={styles.tileInner}>
            <TileHead label="النوم" icon="moon" iconColor={color.aiSoft} />
            <View style={styles.tileNum}>
              <Txt mono weight="600" size={22}>
                {sleepHours !== null ? formatHours(sleepHours) : '—'}
              </Txt>
              {sleepBelowTarget && (
                <Txt mono size={11} c={color.warning}>
                  {' '}
                  ↓
                </Txt>
              )}
            </View>
            <Txt size={10} c={sleepBelowTarget ? color.warning : color.textMuted} style={{ marginTop: 4 }}>
              {sleepHours === null ? 'سجّل نومك' : sleepBelowTarget ? 'أقل من هدفك' : 'وصلت هدفك'}
            </Txt>
          </Card>
        </Pressable>

        {/* Steps (sample until Google Health links up — see services/health.ts) */}
        <Pressable style={styles.tileWrap} onPress={() => router.push('/settings' as never)}>
          <Card style={styles.tileInner}>
            <TileHead label="خطوات" icon="steps" iconColor={color.primary} />
            <Txt mono weight="600" size={22} style={{ marginTop: space.sm }}>
              4,120
            </Txt>
            <Txt size={10} c={color.textMuted} style={{ marginTop: 4 }}>
              من 8,000
            </Txt>
          </Card>
        </Pressable>

        {/* Med alert */}
        <Pressable style={styles.tileWrap} onPress={() => router.push('/meds' as never)}>
          <LinearGradient
            colors={[tint.warning12, 'rgba(255,181,71,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tileInner, styles.medTile]}
          >
            <View style={styles.tileHead}>
              <Txt size={12} c={color.warning}>
                دوا قادم
              </Txt>
              <Icon name="clock" size={16} color={color.warning} />
            </View>
            <Txt weight="700" size={15} style={{ marginTop: 6 }}>
              {nextMed?.name ?? 'مفيش أدوية نشطة'}
            </Txt>
            <Txt mono size={11} c={color.warning} style={{ marginTop: 2 }}>
              {nextMed?.timing ?? 'أضف دوا من هنا'}
            </Txt>
          </LinearGradient>
        </Pressable>
      </View>
    </Screen>
  );
}

function TileHead({ label, icon, iconColor }: { label: string; icon: 'drop' | 'moon' | 'steps'; iconColor: string }) {
  return (
    <View style={styles.tileHead}>
      <Txt size={12} c={color.textMuted}>
        {label}
      </Txt>
      <Icon name={icon} size={16} color={iconColor} />
    </View>
  );
}

function Macro({ emoji, value }: { emoji: string; value: string }) {
  return (
    <View style={styles.macro}>
      <Txt size={10} c={color.textTertiary}>
        {emoji}{' '}
      </Txt>
      <Txt mono size={10}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: space.lg },
  greet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.lg },
  calCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: 18 },
  calNum: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  macros: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  macro: { flexDirection: 'row', alignItems: 'center' },
  tileWrap: { width: '47%', flexGrow: 1 },
  tileInner: { padding: space.lg, minHeight: 96, justifyContent: 'flex-start' },
  medTile: { borderWidth: 1, borderColor: tint.warning30, borderRadius: radius.lg, overflow: 'hidden' },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileNum: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.sm },
  segs: { flexDirection: 'row', gap: 3, marginTop: space.sm },
  seg: { flex: 1, height: 6, borderRadius: 3 },
});
