import { Redirect } from 'expo-router';

import { useApp } from '@/state/store';

/** First run → onboarding; afterwards → the tabs shell. */
export default function Index() {
  const { onboarded } = useApp();
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
