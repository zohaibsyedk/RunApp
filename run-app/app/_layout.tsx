import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";
import { EventProvider } from "./contexts/EventContext";

const RootLayout = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="eventModal" options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            headerShown: false
          }} />
        </Stack>
      </EventProvider>
    </AuthProvider>
  );
}

export default RootLayout;