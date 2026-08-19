import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}
