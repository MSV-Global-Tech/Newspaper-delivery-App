import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="newspapers" />
      <Stack.Screen name="newspaper/[id]" />
      <Stack.Screen name="subscribe/[id]" />
    </Stack>
  );
}
