import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Icon, Txt } from '@/components';
import { color, radius, shadow, space, tint } from '@/theme/tokens';

/** "إزاي عايز تسجّلها؟" — photo vs. write chooser (bottom sheet). */
export default function MealMethod() {
  const router = useRouter();
  const close = () => router.back();
  const go = (href: '/meal/camera' | '/meal/write') => router.replace(href);

  return (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={close} />
      <View style={styles.panel}>
        <View style={styles.grabber} />
        <Txt center weight="900" size={20}>
          تسجيل وجبة
        </Txt>
        <Txt center size={12} c={color.textTertiary} style={{ marginTop: 6, marginBottom: space.xl }}>
          إزاي عايز تسجّلها؟
        </Txt>

        <View style={styles.row}>
          <Pressable style={styles.cell} onPress={() => go('/meal/camera')}>
            <MethodCard emojiBg={tint.primary15} title="تصوير" sub={'صور السفرة والـ AI\nيقرا الأصناف'}>
              <Icon name="camera" size={30} color={color.primary} strokeWidth={1.8} />
            </MethodCard>
          </Pressable>
          <Pressable style={styles.cell} onPress={() => go('/meal/write')}>
            <MethodCard emojiBg="rgba(184,166,255,0.14)" title="اكتب" sub={'اكتب اللي اكلته\nبشكل طبيعي'}>
              <Icon name="edit" size={28} color={color.aiSoft} strokeWidth={1.8} />
            </MethodCard>
          </Pressable>
        </View>

        <Button label="إلغاء" variant="secondary" onPress={close} style={{ marginTop: space.lg }} />
      </View>
    </View>
  );
}

function MethodCard({
  emojiBg,
  title,
  sub,
  children,
}: {
  emojiBg: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={[color.surface, color.bgRaised]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={[styles.emoji, { backgroundColor: emojiBg }]}>{children}</View>
      <Txt weight="700" size={15}>
        {title}
      </Txt>
      <Txt center size={11} c={color.textMuted} lh={17}>
        {sub}
      </Txt>
    </LinearGradient>
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
  row: { flexDirection: 'row', gap: space.md },
  cell: { flex: 1 },
  card: {
    borderRadius: radius.xl,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderColor: color.border,
  },
  emoji: { width: 60, height: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
