import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { color, radius, space, tint } from '@/theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Tone = 'ai' | 'success';

interface Props {
  text?: string;
  children?: React.ReactNode;
  tone?: Tone;
  /** Small label above the body, e.g. "ملخص Claude". */
  label?: string;
  compact?: boolean;
}

/**
 * The reused AI-note card: purple gradient tint, spark icon, short coaching line.
 * `tone="success"` renders the green-bordered "recommendation" variant.
 */
export function AiInsight({ text, children, tone = 'ai', label, compact = false }: Props) {
  const isAi = tone === 'ai';
  const gradient = isAi
    ? (['rgba(109,74,255,0.15)', 'rgba(109,74,255,0.04)'] as const)
    : (['rgba(206,253,130,0.08)', 'rgba(206,253,130,0.02)'] as const);
  const border = isAi ? tint.ai30 : color.primary;

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        { borderColor: border, borderWidth: isAi ? 1 : 1.5, padding: compact ? space.md : space.lg },
        !isAi && styles.glow,
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.badge,
            { backgroundColor: isAi ? tint.ai30 : tint.primary15 },
          ]}
        >
          <Icon name="spark" size={16} color={isAi ? color.aiSoft : color.primary} />
        </View>
        <View style={styles.body}>
          {label && (
            <Txt weight="700" size={11} c={isAi ? color.aiSoft : color.primary} style={{ marginBottom: 6, letterSpacing: 0.5 }}>
              {label}
            </Txt>
          )}
          {text ? (
            <Txt size={13} c={color.textHigh} lh={20}>
              {text}
            </Txt>
          ) : (
            children
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md },
  glow: {
    shadowColor: color.primary,
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
});
