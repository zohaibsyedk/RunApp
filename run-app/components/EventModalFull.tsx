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
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface EventModalProps {
    visible: boolean;
    onClose: () => void;
    event: Event | null;
    eventSessionId: string | null;
    onEventJoined: (newSession: any) => void;
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

const EventModalFull: React.FC<EventModalProps> = ({ visible, onClose, event, eventSessionId, onEventJoined }) => {
    const [countdown, setCountdown] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { user } = useAuth();
    const [overriden, setOverriden] = useState(false);

    useEffect(() => {
        if (!visible || !event) {
            return;
        }
        setOverriden(false);
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
                'Are you sure you want to start this run?',
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

            const response = await fetch(`${API_URL}/api/sessions/${eventSessionId}/start`, {
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

            if (!eventSessionId) {
                throw new Error('No sessionId');
            }

            await SecureStore.setItemAsync('activeSessionId', eventSessionId);
            await SecureStore.setItemAsync('activeSessionStartTime', startTime.getTime().toString());

            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                showsBackgroundLocationIndicator: true,
                deferredUpdatesInterval: 5000,
                deferredUpdatesDistance: 50
            });

            console.log(`Session started: ${eventSessionId}`);
            router.push('/(tabs)/activity');
            onClose();
        } catch (error) {
            console.error('Error starting session:', error);
            return;
        }
    };

    const copyLinkToClipboard = async () => {
        if (!eventSessionId) {
            Alert.alert(
                "Can't Share Yet",
                "You must join this event first to get your unique share link."
            );
            return;
        }
        
        const link = `https://runapp-472401.web.app/share/${eventSessionId}`;
        await Clipboard.setStringAsync(link);
        Alert.alert('Link Copied!', 'Your unique cheer link has been copied to the clipboard.');
    }

    const handleJoinEvent = async () => {
        console.log(`joining event: ${event.id}`);
        setIsJoining(true);
        try {
            const token = await getAuth().currentUser?.getIdToken();
            const sessionRef = await fetch(`${API_URL}/api/events/${event.id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!sessionRef.ok) {
                throw new Error("Failed to create session");
            }

            const sessionResponse = await sessionRef.json();

            onEventJoined(sessionResponse.session);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not join event.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleOverrideStartTime = async () => {
        console.log("Attempting to override start time...");

        if (!event || !eventSessionId) {
            Alert.alert("Error", "Event or Session ID is missing.");
            return;
        }

        if (user?.uid !== event.createdBy) {
            Alert.alert("Forbidden", "You do not have permission to override the start time for this event.");
            return;
        }

        const newStartTime = new Date();
        const eventDocRef = doc(db, 'events', event.id);

        Alert.alert(
            "Override Start Time",
            `Are you sure you want to set the official event start time to now (${newStartTime.toLocaleString()})? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Override Now",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // 1. Update the Event document in Firestore
                            await updateDoc(eventDocRef, {
                                startDate: newStartTime, // Firestore converts JS Date object to Timestamp
                                updatedAt: new Date(),
                            });

                            // 2. Clear all existing active sessions' start times (Optional but Recommended for a clean restart)
                            // NOTE: For a global change to the event start time, we only need to update the `event` document.
                            // The session's status will be checked against the *event's* start time.

                            Alert.alert(
                                "Success", 
                                "Event start time has been successfully overridden to the current time.",
                                [{ text: "OK", onPress: () => setOverriden(true) }]
                            );
                            
                            // Because the event object passed to this component is a prop, we need 
                            // to force a re-fetch or state update in the parent to see the countdown change immediately.
                            // For simplicity, we just rely on the component re-rendering/re-mounting when reopened.

                        } catch (error) {
                            console.error("Error overriding event start time:", error);
                            Alert.alert("Error", "Failed to update the event start time.");
                        }
                    }
                }
            ]
        );
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
                        <Text style={styles.closeButtonText}>x</Text>
                    </TouchableOpacity>
                    {(eventSessionId) ? ( 
                        <TouchableOpacity style={styles.shareButton} onPress={() => {copyLinkToClipboard()}}>
                            <Ionicons name="link-outline" size={25} color="#F2F0EF" style={styles.shareButtonIcon}/>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.joinButton} onPress={() => {handleJoinEvent()}}>
                            <Ionicons name="add" size={25} color="#F2F0EF"/>
                        </TouchableOpacity>
                    )}
                    <Image
                        source={{ uri: event.organizationPhotoURL || 'https://placehold.co/100x100/EEE/31343C?text=Org' }}
                        style={styles.orgImage}
                    />
                    <Text style={styles.modalTitle}>{event.name}</Text>
                    <Text style={styles.modalText}>Hosted by: {event.organizationName}</Text>
                    <Text style={styles.modalText}>Starts: {formattedStartDate}</Text>
                    <Text style={styles.description}>{event.description}</Text>
                    {overriden ? (
                        <Text style={styles.modalText}>Time until Start: Event has started</Text>
                    ) : (
                        <Text style={styles.modalText}>Time until Start: {countdown}</Text>
                    )}
                    {user?.uid == event.createdBy && ((event.startDate._seconds*1000) > Date.now() && !overriden) && (
                        <View style={styles.overrideStartTimeContainer}>
                            <TouchableOpacity style={styles.overrideStartTimeButton} onPress={() => handleOverrideStartTime()}>
                                <Text style={styles.overrideStartTimeText}>OVERRIDE START TIME</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {eventSessionId && (
                        <View style={styles.startButtonContainer}>
                            <Text style={styles.startButtonText}>Start Race</Text>
                            {(event.startDate._seconds*1000) < Date.now() || overriden ? (
                                <TouchableOpacity style={styles.startButton} onPress={() => handleStartEvent()} />
                            ) : (
                                <TouchableOpacity style={styles.startButtonLocked}>
                                    <Ionicons name="lock-closed-outline" color="#1A1A1A" size={40}/>
                                </TouchableOpacity>
                            )}
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
        top: '5%',
        right: '5%',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333335',
        borderWidth: 3,
        borderColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
        lineHeight: 20,
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
    startButtonLocked: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 10,
        backgroundColor: 'rgba(76, 128, 54, 0.5)',
        borderWidth: 3,
        borderColor: '#DDDDDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButtonText: {
        marginTop: 20,
        marginBottom: 20,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#F2F0EF',
    },
    shareButton: {
        position: 'absolute',
        top: '5%',
        left: '5%',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#01BAEF',
        borderWidth: 3,
        borderColor: '#DDDDDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButtonIcon: {
        transform: [{ rotate: '135deg'}],
        transformOrigin: 'center',
    },
    joinButton: {
        position: 'absolute',
        top: '5%',
        left: '5%',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#7bcf56',
        borderWidth: 3,
        borderColor: '#DDDDDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overrideStartTimeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    overrideStartTimeText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#F2F0EF',
    },
    overrideStartTimeButton: {
        backgroundColor: '#D52941',
        width: 250,
        height: 50,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#DDDDDD',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default EventModalFull;