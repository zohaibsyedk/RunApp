import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="eventModal" options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          headerShown: false
        }} />
      </Stack>
    </AuthProvider>
  );
}

export default RootLayout;