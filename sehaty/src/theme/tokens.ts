/**
 * صحّتي — Design Tokens
 * Ported 1:1 from the Claude Design export (صحتي.dc.html · section "01 · TOKENS").
 * Dark Mode only, RTL. Distribution rule: ~72% background, ~16% text, ~8% primary, ~4% AI.
 */

export const color = {
  // Backgrounds (deep → shallow)
  bgDeepest: '#08080A',
  bgDark: '#0A0A0C',
  bg: '#0F0F11',
  bgRaised: '#141418',

  // Card surfaces
  surface: '#1C1C20',
  surfaceAlt: '#16161A',
  elevated: '#22222A',

  // Primary — "بياناتك" (your data)
  primary: '#CEFD82',
  primaryDeep: '#8FE04C',
  onPrimary: '#0A0A0C',

  // Secondary — "الذكاء" (AI)
  ai: '#6D4AFF',
  aiSoft: '#B8A6FF',

  // Semantic
  warning: '#FFB547',
  danger: '#FF5C5C',
  dangerSoft: '#FF9999',
  water: '#7DD3FC',

  // Text
  textPrimary: '#FFFFFF',
  textHigh: '#E4E4E7',
  textSecondary: '#D4D4D8',
  textTertiary: '#A1A1AA',
  textMuted: '#71717A',

  // Borders / hairlines
  border: '#22222A',
  borderStrong: '#27272A',
  borderMuted: '#3F3F46',
} as const;

/** Translucent fills reused across cards (rgba so they layer over surfaces). */
export const tint = {
  primary08: 'rgba(206,253,130,0.08)',
  primary12: 'rgba(206,253,130,0.12)',
  primary15: 'rgba(206,253,130,0.15)',
  primaryGlow: 'rgba(206,253,130,0.25)',
  ai08: 'rgba(109,74,255,0.08)',
  ai10: 'rgba(109,74,255,0.10)',
  ai15: 'rgba(109,74,255,0.15)',
  ai30: 'rgba(109,74,255,0.30)',
  warning08: 'rgba(255,181,71,0.08)',
  warning12: 'rgba(255,181,71,0.12)',
  warning15: 'rgba(255,181,71,0.15)',
  warning30: 'rgba(255,181,71,0.30)',
  danger08: 'rgba(255,92,92,0.08)',
  danger15: 'rgba(255,92,92,0.15)',
  water12: 'rgba(125,211,252,0.12)',
  water15: 'rgba(125,211,252,0.15)',
  scrim: 'rgba(0,0,0,0.55)',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  phone: 44,
  pill: 999,
} as const;

/** 4 · 8 · 12 · 16 · 24 · 32 · 48 scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Font family names as registered by @expo-google-fonts. */
export const font = {
  regular: 'Cairo_400Regular',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
  black: 'Cairo_900Black',
  // Latin
  enRegular: 'Inter_400Regular',
  enMedium: 'Inter_500Medium',
  enSemibold: 'Inter_600SemiBold',
  // Numeric / technical
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemibold: 'JetBrainsMono_600SemiBold',
} as const;

/** Map font weights used in the design onto Cairo family names. */
export const cairoForWeight: Record<string, string> = {
  '400': font.regular,
  '600': font.semibold,
  '700': font.bold,
  '900': font.black,
};

export const shadow = {
  /** Green glow used on primary CTAs / FAB. */
  primaryGlow: {
    shadowColor: color.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  phone: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 40 },
    elevation: 20,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },
} as const;
