import { Tabs } from 'expo-router/tabs';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
    </Tabs>
  );
}