import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, Alert, Linking, Platform } from 'react-native';
import { Event } from '../app/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../app/contexts/AuthContext';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import TaskManager from 'expo-task-manager';
import { LOCATION_TASK_NAME } from '@/tasks/locationTask';
import * as SecureStore from 'expo-secure-store';

interface EventModalProps {
    visible: boolean;
    onClose: () => void;
    event: Event | null;
}

const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        return true;
      }
    }
    return false;
  };

const formatTimeUntil = (startDate: Date): string => {
    const now = new Date();
    const differenceInMs = startDate.getTime() - now.getTime();

    if (differenceInMs <= 0) {
        return "Event has started";
    }

    const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((differenceInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((differenceInMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((differenceInMs % (1000 * 60)) / 1000);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds >= 0) result += `${seconds}s`;

    return result.trim();
};

const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

const EventModalFull: React.FC<EventModalProps> = ({ visible, onClose, event }) => {
    const [countdown, setCountdown] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        if (!visible || !event) {
            return;
        }

        const eventDate = event.startDate?._seconds
        ? new Date(event.startDate._seconds * 1000)
        : null;

        if (!eventDate) return;

        const timerId = setInterval(() => {
            const newCountdown = formatTimeUntil(eventDate);
            setCountdown(newCountdown);
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, [visible, event]);

    if (!event) {
        return null;
    }

    const formattedStartDate = event.startDate?._seconds
        ? new Date(event.startDate._seconds * 1000).toLocaleString()
        : 'Date not available';

    const handleStartEvent = async () => {
        const { status: existingStatus } = await Location.getBackgroundPermissionsAsync();
    
        if (existingStatus === 'granted') {
            Alert.alert(
                'Confirmation',
                'Are you sure you want to start this event? Please notify other runners.',
                [
                    {
                        text: 'No',
                        onPress: () => console.log('Not starting session'),
                        style: 'destructive'
                    },
                    {
                        text: 'Yes',
                        onPress: startSession,
                        style: 'default'
                    }
                ]
            );
        } 

        else {
            Alert.alert(
                'Enable Location Tracking',
                "This app needs your location to map your run. Please select 'Always Allow' on the next screen so we can track you even when the app is in the background.",
                [
                    { text: 'Not Now', style: 'cancel' },
                    {
                        text: 'Enable',
                        onPress: async () => {
                            const granted = await requestPermissions();
                            if (granted) {
                                Alert.alert('Success!', 'Location permissions have been enabled. You can now start your event.');
                            } else {
                                Alert.alert(
                                    'Permission Denied',
                                    'Location is required to track a run. You can enable it in your phone settings.',
                                    [
                                        { text: 'OK' },
                                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                                    ]
                                );
                            }
                        }
                    }
                ]
            );
        }
    };
    
    const startSession = async () => {
        if (!user) {
            return;
        }
        try {
            const token = await getAuth().currentUser?.getIdToken();
            const startTime = new Date();

            const response = await fetch(`${API_URL}/api/events/${event.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    startTime: startTime.toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start session');
            }

            const { session } = await response.json();
            const sessionId = session.id;

            await SecureStore.setItemAsync('activeSessionId', sessionId);
            await SecureStore.setItemAsync('activeSessionStartTime', startTime.getTime().toString());

            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                showsBackgroundLocationIndicator: true,
                deferredUpdatesInterval: 5000,
                deferredUpdatesDistance: 50
            });

            console.log(`Session started: ${sessionId}`);
            onClose();
            //navigate to the session page
        } catch (error) {
            console.error('Error starting session:', error);
            return;
        }
    };

    return (
        <Modal
            animationType='slide'
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="#555" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: event.organizationPhotoURL || 'https://placehold.co/100x100/EEE/31343C?text=Org' }}
                        style={styles.orgImage}
                    />
                    <Text style={styles.modalTitle}>{event.name}</Text>
                    <Text style={styles.modalText}>Hosted by: {event.organizationName}</Text>
                    <Text style={styles.modalText}>Starts: {formattedStartDate}</Text>
                    <Text style={styles.description}>{event.description}</Text>
                    <Text style={styles.modalText}>Time until Start: {countdown}</Text>

                    {user?.uid == event.createdBy && (
                        <View style={styles.startButtonContainer}>
                            <Text style={styles.startButtonText}>Manually Start Race</Text>
                            <TouchableOpacity style={styles.startButton} onPress={() => handleStartEvent()} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    orgImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#DDDDDD',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#F2F0EF',
    },
    modalText: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        color: '#F2F0EF',
    },
    description: {
        fontSize: 14,
        color: '#DDDDDD',
        textAlign: 'center',
        marginTop: 10,
    },
    startButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 10,
        backgroundColor: '#7bcf56ff',
        borderWidth: 3,
        borderColor: '#DDDDDD',
    },
    startButtonText: {
        marginTop: 20,
        marginBottom: 20,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#F2F0EF',
    },
});

export default EventModalFull;