import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}

export default RootLayout;