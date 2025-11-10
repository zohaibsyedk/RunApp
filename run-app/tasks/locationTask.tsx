import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { createAudioPlayer } from 'expo-audio';

export const LOCATION_TASK_NAME = 'background-location-task';
const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
const BUCKET_NAME = 'runapp-uploads';

const player = createAudioPlayer();
let audioQueue: any[] = [];
let isPlayingAudio = false;

player.addListener('playbackStatusUpdate', (status: any) => {
    console.log('Audio Player Status:', JSON.stringify(status, null, 2));

    if (status.didJustFinish) {
        console.log('Playback finished');
        isPlayingAudio = false;
        playNextMessageInQueue();
    }
    else if (status.error) {
        console.error(`Playback Error: ${status.error}`);
        isPlayingAudio = false;
        playNextMessageInQueue();
    }
})

const getPublicUrl = (gcsPath: string) => {
    const encodedPath = gcsPath.split('/').map(encodeURIComponent).join('/');
    return `https://storage.googleapis.com/${BUCKET_NAME}/${encodedPath}`;
};


const playNextMessageInQueue = async () => {
    console.log('playing messages maybe, also state of isPlayingAudio is ', isPlayingAudio);
    if (isPlayingAudio || audioQueue.length === 0) {
        return;
    }

    isPlayingAudio = true;
    const message = audioQueue.shift();
    console.log(`Playing message: ${message.messageId}`);

    const audioUrl = getPublicUrl(message.audioFileUrl);
    console.log('Attempting to play URL:', audioUrl);

    try {
        const audioUrl = getPublicUrl(message.audioFileUrl);

        player.replace(audioUrl);

        player.play();

    } catch (error) {
        console.error(`Error playing audio (message ${message.messageId}):`, error);
        isPlayingAudio = false; 
        playNextMessageInQueue(); 
    }
};

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
                const errorBody = await response.text(); // Get the server's error message
                console.error(`API Error: Status ${response.status}`);
                console.error('Server Response:', errorBody);
                throw new Error(`Failed to update session (Status: ${response.status})`);
            }

            const result = await response.json();

            if (result.messagesToPlay && result.messagesToPlay.length > 0) {
                console.log(`Received ${result.messagesToPlay.length} new messages.`);

                audioQueue.push(...result.messagesToPlay);
                playNextMessageInQueue();
            } else {
                console.log('Session updated. No new messages');
            }
        } catch (error) {
            console.error('Error processing locations:', error);
            return;
        }
    }
});