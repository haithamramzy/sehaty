import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Icon, Screen, Txt } from '@/components';
import { color, radius, space } from '@/theme/tokens';

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      </View>

      <View style={styles.body}>
        <LinearGradient colors={[color.primary, color.primaryDeep]} style={styles.logo}>
          <Icon name="heart" size={48} color={color.onPrimary} />
        </LinearGradient>

        <Txt weight="900" size={36}>
          أهلاً بيك{'\n'}في صحّتي
        </Txt>
        <Txt size={16} c={color.textTertiary} lh={27} style={{ marginTop: space.lg }}>
          مستشارك الصحي الشخصي. صور أكلك، سجّل نومك، وخد توصيات مبنية على بياناتك أنت — مش نصايح عامة.
        </Txt>

        <View style={{ flex: 1 }} />

        <Button label="نبدأ" onPress={() => router.push('/onboarding/basic-info')} />
        <Txt center size={12} c={color.textMuted} style={{ marginTop: space.md }}>
          هياخد أقل من دقيقتين
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressWrap: { paddingHorizontal: space.xxl, paddingTop: space.lg },
  track: { height: 4, borderRadius: 2, backgroundColor: color.elevated, overflow: 'hidden' },
  fill: { width: '20%', height: '100%', backgroundColor: color.primary },
  body: { flex: 1, paddingHorizontal: space.xxl, paddingTop: 72, paddingBottom: space.xxl },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xxxl,
    shadowColor: color.primary,
    shadowOpacity: 0.35,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
