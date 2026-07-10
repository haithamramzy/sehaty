import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { color } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="reports" />
    </Tabs>
  );
}
