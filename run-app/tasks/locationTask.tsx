import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';

export const LOCATION_TASK_NAME = 'background-location-task';
const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background task error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        try {
            const sessionId = await SecureStore.getItemAsync('activeSessionId');
            const startTimeString = await SecureStore.getItemAsync('activeSessionStartTime');
            const token = await getAuth().currentUser?.getIdToken();

            if (!sessionId || !startTimeString || !token) {
                console.error(`Background task missing session data or token. Stopping.`);
                Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                return;
            }

            const startTime = parseInt(startTimeString, 10);
            const elapsedTimeSeconds = Math.floor((Date.now() - startTime) / 1000);

            const locationsData = locations.map(loc => ({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                timestamp: loc.timestamp
            }));

            const response = await fetch(`${API_URL}/api/sessions/${sessionId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                     locations: locationsData,
                     elapsedTimeSeconds: elapsedTimeSeconds
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update session');
            }

            console.log('Session updated successfully');
        } catch (error) {
            console.error('Error processing locations:', error);
            return;
        }
    }
});