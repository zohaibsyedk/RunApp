import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
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
        <TouchableOpacity style={styles.stopButton} onPress={handleStopRun}>
            <Text style={styles.stopButtonText}>STOP RUN</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    stopButton: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'red',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30
    },
    stopButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    }
});

export default StopRunButton;