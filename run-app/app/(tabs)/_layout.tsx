import React from "react";
import { router, Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const TabLayout: React.FC = () => {
    return (
        <Tabs>
            <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
            <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
            
            <Tabs.Screen name="events" options={{ title: 'Events' }}
            listeners={{
                tabPress: (e) => {
                    e.preventDefault();
                    router.push('../eventModal');
                }
            }}
             />

             <Tabs.Screen name="friends" options={{ title: "Friends"}} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      );
}

export default TabLayout;