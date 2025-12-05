import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '@/tasks/locationTask';
import { getAuth } from 'firebase/auth';

const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

const StopRunButton = () => {
   const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
   const [startTime, setStartTime] = useState<string | null>(null);

   useEffect(() => {
    const checkActiveSession = async () => {
        const sessionId = await SecureStore.getItemAsync('activeSessionId');
        const sessionStartTime = await SecureStore.getItemAsync('activeSessionStartTime');
        setActiveSessionId(sessionId);
        setStartTime(sessionStartTime);
    };

    const interval = setInterval(checkActiveSession, 2000);
    return () => clearInterval(interval);
    }, []);

    const handleStopRun = async () => {
        if (!activeSessionId || !startTime) return;

        try {
            const token = await getAuth().currentUser?.getIdToken();
            const elapsedTimeSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);

            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

            const response = await fetch(`${API_URL}/api/sessions/${activeSessionId}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    elapsedTimeSeconds: elapsedTimeSeconds,
                    locations: []
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to stop session');
            }

            Alert.alert('Run Finished!', 'Your run has been stopped and saved');
        } catch (error) {
            console.error('Error stopping run:', error);
            Alert.alert('Error', 'Failed to stop run. Please try again.');
        } finally {
            await SecureStore.deleteItemAsync('activeSessionId');
            await SecureStore.deleteItemAsync('activeSessionStartTime');
            setActiveSessionId(null);
            setStartTime(null);
            console.log("Session stopped");
        }
    };

    if (!activeSessionId) return null;

    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={styles.stopButton} 
                onPress={handleStopRun}
                activeOpacity={0.8}
            >
                <Ionicons name="stop-circle" size={24} color="#F2F0EF" style={{ marginRight: 8 }} />
                <Text style={styles.stopButtonText}>STOP RUN</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        minWidth: 200,
    },
    stopButtonText: {
        color: '#F2F0EF',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    }
});

export default StopRunButton;