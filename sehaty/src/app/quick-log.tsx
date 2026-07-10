import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Txt } from '@/components';
import { color, radius, shadow, space, tint } from '@/theme/tokens';

interface Action {
  emoji: string;
  label: string;
  hint: string;
  bg: string;
  onPress?: (go: (href: string) => void) => void;
}

const ACTIONS: Action[] = [
  { emoji: '🍽', label: 'وجبة', hint: 'صور أو اكتب', bg: tint.warning15, onPress: (go) => go('/meal/method') },
  { emoji: '💧', label: 'مياه', hint: 'كوب أو زجاجة', bg: tint.water15, onPress: (go) => go('/water') },
  { emoji: '💊', label: 'دوا', hint: 'أكدت الجرعة', bg: tint.ai15 },
  { emoji: '😊', label: 'مزاج', hint: '3 ثواني', bg: tint.primary15, onPress: (go) => go('/mood') },
  { emoji: '😴', label: 'نوم', hint: 'صحيت النهاردة', bg: 'rgba(184,166,255,0.15)' },
  { emoji: '🚬', label: 'تدخين / قهوة', hint: 'تتبّع العادات', bg: tint.danger15 },
];

/** FAB quick-log bottom sheet (transparentModal route). */
export default function QuickLog() {
  const router = useRouter();
  const close = () => router.back();
  const go = (href: string) => {
    router.back();
    // Navigate after dismiss so the sheet animates out cleanly.
    setTimeout(() => router.push(href as never), 10);
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={close} />
      <View style={styles.panel}>
        <View style={styles.grabber} />
        <Txt center weight="900" size={20}>
          تسجيل سريع
        </Txt>
        <Txt center size={12} c={color.textTertiary} style={{ marginTop: 6, marginBottom: space.xl }}>
          اختار اللي تحب تسجّله
        </Txt>

        <View style={styles.grid}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={styles.cell}
              onPress={() => (a.onPress ? a.onPress(go) : close())}
            >
              <LinearGradient
                colors={[color.surface, color.bgRaised]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.card}
              >
                <View style={[styles.emoji, { backgroundColor: a.bg }]}>
                  <Txt size={24}>{a.emoji}</Txt>
                </View>
                <Txt weight="700" size={13}>
                  {a.label}
                </Txt>
                <Txt size={10} c={color.textMuted}>
                  {a.hint}
                </Txt>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <Button label="إلغاء" variant="secondary" onPress={close} style={{ marginTop: space.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tint.scrim },
  panel: {
    backgroundColor: color.bgRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    ...shadow.sheet,
  },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: color.borderMuted, alignSelf: 'center', marginBottom: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47.5%', flexGrow: 1 },
  card: {
    borderRadius: radius.lg,
    paddingVertical: space.xl,
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: color.border,
  },
  emoji: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
