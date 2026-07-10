import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, MockPlate, Txt } from '@/components';
import { upsertMedicalRecord } from '@/db';
import { analyzeMedicalImage } from '@/services/ai';
import { captureImage } from '@/services/camera';
import { color, radius, space } from '@/theme/tokens';

type CameraMode = 'meal' | 'gym' | 'medical';

const MODES: { key: CameraMode; label: string }[] = [
  { key: 'meal', label: 'وجبة' },
  { key: 'gym', label: 'جهاز جيم' },
  { key: 'medical', label: 'روشتة' },
];

const HINTS: Record<CameraMode, string> = {
  meal: 'خلي السفرة كلها في الكادر',
  gym: 'صوّر الجهاز بالكامل',
  medical: 'خلي الروشتة واضحة في الكادر',
};

const TITLES: Record<CameraMode, string> = {
  meal: '📸 تصوير وجبة',
  gym: '🏋️ تصوير جهاز',
  medical: '📋 تصوير روشتة',
};

/** Full-screen mock camera with meal / gym / prescription modes. */
export default function MealCamera() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<CameraMode>(
    params.mode === 'gym' || params.mode === 'medical' ? params.mode : 'meal',
  );
  const [busy, setBusy] = useState(false);

  const shoot = async () => {
    if (busy) return;
    const shot = await captureImage('camera');
    if (!shot) return;

    if (mode === 'meal') {
      router.replace('/meal/analyzing?source=photo');
      return;
    }
    if (mode === 'gym') {
      router.replace(`/gym/analyzing?uri=${encodeURIComponent(shot.uri)}`);
      return;
    }
    // روشتة → analyze inline, save the record, land on the medical log.
    setBusy(true);
    try {
      const analysis = await analyzeMedicalImage(shot.uri);
      upsertMedicalRecord({ ...analysis, id: `rec-${Date.now()}` });
      router.replace('/medical');
    } finally {
      setBusy(false);
    }
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
              {TITLES[mode]}
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
            {HINTS[mode]}
          </Txt>
        </View>

        {/* Bottom controls */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.bottom}>
          <View style={styles.modes}>
            {MODES.map((m) => {
              const active = m.key === mode;
              return (
                <Pressable key={m.key} onPress={() => setMode(m.key)} style={[styles.mode, active && styles.modeActive]}>
                  <Txt size={12} weight={active ? '700' : '400'} c={active ? color.onPrimary : '#fff'}>
                    {m.label}
                  </Txt>
                </Pressable>
              );
            })}
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

      {/* روشتة analyzing overlay */}
      {busy && (
        <View style={styles.busyOverlay}>
          <View style={styles.busyCore}>
            <Icon name="spark" size={36} color={color.primary} />
          </View>
          <Txt weight="700" size={16} c="#fff" style={{ marginTop: space.xl }}>
            جاري قراءة الروشتة...
          </Txt>
          <Txt size={12} c="rgba(255,255,255,0.6)" style={{ marginTop: 6 }}>
            التعرّف على المحتوى…
          </Txt>
        </View>
      )}
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
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,12,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(206,253,130,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
