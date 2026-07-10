import React from 'react';
import { I18nManager, ScrollView, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';

import { AppProvider } from '@/state/store';
import { color } from '@/theme/tokens';

// App is RTL-first (Arabic). Force it before the first render.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

/**
 * Release builds kill the app on any unhandled startup error, which reads as
 * "opens then closes" with no trace. This boundary keeps the app alive and
 * puts the real error text on screen so it can be reported.
 */
class StartupErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch() {
    SplashScreen.hideAsync().catch(() => {});
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0F0F11' }} contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#FF5C5C', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            حصل خطأ عند تشغيل التطبيق — صوّر الشاشة دي وابعتها
          </Text>
          <Text style={{ color: '#D4D4D8', fontSize: 13, fontFamily: 'monospace' }}>
            {String(this.state.error?.message ?? this.state.error)}
            {'\n\n'}
            {String(this.state.error?.stack ?? '').slice(0, 2000)}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  // Splash is hidden by AppProvider once the SQLite snapshot has hydrated,
  // so the first visible frame already reflects persisted state.
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      <StartupErrorBoundary>
        <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="meal" />
            <Stack.Screen name="gym" />
            <Stack.Screen name="water" />
            <Stack.Screen name="sleep" />
            <Stack.Screen name="meds" />
            <Stack.Screen name="medical" />
            <Stack.Screen name="export-report" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="compare" />
            <Stack.Screen name="mood" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="quick-log" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </Stack>
        </AppProvider>
        </SafeAreaProvider>
      </StartupErrorBoundary>
    </GestureHandlerRootView>
  );
}
