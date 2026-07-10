import { Stack } from 'expo-router';

import { color } from '@/theme/tokens';

export default function MealLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Screen name="method" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="camera" options={{ animation: 'fade' }} />
      <Stack.Screen name="write" />
      <Stack.Screen name="analyzing" options={{ animation: 'fade' }} />
      <Stack.Screen name="result" />
    </Stack>
  );
}
