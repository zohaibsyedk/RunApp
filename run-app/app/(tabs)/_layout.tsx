import React from "react";
import { Tabs } from "expo-router";

const TabLayout: React.FC = () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="events" options={{ title: 'Events' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      );
}

export default TabLayout;