import { Stack } from 'expo-router';

import { color } from '@/theme/tokens';

export default function GymLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Screen name="analyzing" options={{ animation: 'fade' }} />
      <Stack.Screen name="result" />
      <Stack.Screen name="plan" />
    </Stack>
  );
}
