import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";
import { EventProvider } from "./contexts/EventContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import '../tasks/locationTask';

const RootLayout = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <OrganizationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="eventModal" options={{
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
              headerShown: false
            }} />
          </Stack>
        </OrganizationProvider>
      </EventProvider>
    </AuthProvider>
  );
}

export default RootLayout;