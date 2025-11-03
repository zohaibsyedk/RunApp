import React from "react";
import { View } from 'react-native';
import { router, Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const TabLayout: React.FC = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#7bcf56ff',
            tabBarInactiveTintColor: '#DDDDDD',
            tabBarStyle: {
                backgroundColor: '#282828',
            },
            tabBarShowLabel: false,
            tabBarItemStyle: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: '150%'
            },
            tabBarIconStyle: {
                height: '100%',
                width: '100%',
            }
            
        }} >
            <Tabs.Screen name="feed" options={{
                headerShown: false, 
                tabBarIcon: ({ color }) => <Ionicons name='home' size={40} color={color} /> 
            }} />
            <Tabs.Screen name="activity" options={{
                headerShown: false, 
                tabBarIcon: ({ color }) => <Ionicons name='pulse' size={40} color={color} /> 
            }} />
            
            <Tabs.Screen name="events" options={{ 
                headerShown: false, 
                tabBarIcon: ({ color }) => <Ionicons name='add-circle' size={40} color={color} /> 
            }}
            listeners={{
                tabPress: (e) => {
                    e.preventDefault();
                    router.push('../eventModal');
                }
            }}
             />

            <Tabs.Screen name="friends" options={{ 
                headerShown: false, 
                tabBarIcon: ({ color }) => <Ionicons name='people' size={40} color={color} /> 
            }} />
            <Tabs.Screen name="profile" options={{ 
                headerShown: false, 
                tabBarIcon: ({ color }) => <Ionicons name='person-circle' size={40} color={color} /> 
            }} />
        </Tabs>
      );
}

export default TabLayout;