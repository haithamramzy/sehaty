import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, MockPlate, Txt } from '@/components';
import { captureImage } from '@/services/camera';
import { color, radius, space } from '@/theme/tokens';

const MODES = ['وجبة', 'جهاز جيم', 'روشتة'];

/** Full-screen mock camera. Real capture plugs into services/camera. */
export default function MealCamera() {
  const router = useRouter();

  const shoot = async () => {
    await captureImage('camera');
    router.replace('/meal/analyzing?source=photo');
  };

  return (
    <View style={styles.root}>
      <MockPlate radius={0} style={StyleSheet.absoluteFill as object} />

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.top}>
          <GlassBtn onPress={() => router.back()}>
            <Icon name="x" size={18} color="#fff" />
          </GlassBtn>
          <View style={styles.pill}>
            <Txt size={12} c="#fff">
              📸 تصوير وجبة
            </Txt>
          </View>
          <GlassBtn>
            <Icon name="flash" size={18} color="#fff" />
          </GlassBtn>
        </View>

        {/* Framing guide */}
        <View style={styles.guideWrap}>
          <View style={styles.guide}>
            <Corner style={{ top: -1, right: -1 }} tr />
            <Corner style={{ top: -1, left: -1 }} tl />
            <Corner style={{ bottom: -1, right: -1 }} br />
            <Corner style={{ bottom: -1, left: -1 }} bl />
          </View>
          <Txt center size={12} c="rgba(255,255,255,0.6)" style={{ marginTop: space.lg }}>
            خلي السفرة كلها في الكادر
          </Txt>
        </View>

        {/* Bottom controls */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.bottom}>
          <View style={styles.modes}>
            {MODES.map((m, i) => (
              <View key={m} style={[styles.mode, i === 0 && styles.modeActive]}>
                <Txt size={12} weight={i === 0 ? '700' : '400'} c={i === 0 ? color.onPrimary : '#fff'}>
                  {m}
                </Txt>
              </View>
            ))}
          </View>
          <View style={styles.shutterRow}>
            <GlassBtn big>
              <Icon name="image" size={20} color="#fff" />
            </GlassBtn>
            <Pressable onPress={shoot} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </Pressable>
            <GlassBtn big>
              <Icon name="edit" size={20} color="#fff" />
            </GlassBtn>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

function GlassBtn({ children, onPress, big }: { children: React.ReactNode; onPress?: () => void; big?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.glass, { width: big ? 44 : 36, height: big ? 44 : 36 }]}
    >
      {children}
    </Pressable>
  );
}

function Corner({ style, tl, tr, bl, br }: { style: object; tl?: boolean; tr?: boolean; bl?: boolean; br?: boolean }) {
  return (
    <View
      style={[
        styles.corner,
        style,
        tl && { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
        tr && { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
        bl && { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
        br && { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.xl },
  glass: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.lg },
  guideWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xxl },
  guide: {
    aspectRatio: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(206,253,130,0.4)',
    borderRadius: radius.xl,
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: color.primary },
  bottom: { paddingHorizontal: space.xxl, paddingTop: space.xxxl, paddingBottom: space.lg },
  modes: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginBottom: space.xl },
  mode: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.5)' },
  modeActive: { backgroundColor: color.primary },
  shutterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.md },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    padding: 4,
  },
  shutterInner: { flex: 1, borderRadius: 40, backgroundColor: '#fff' },
});
