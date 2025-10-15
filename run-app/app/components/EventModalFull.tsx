import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Event } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface EventModalProps {
    visible: boolean;
    onClose: () => void;
    event: Event | null;
}

const EventModalFull: React.FC<EventModalProps> = ({ visible, onClose, event }) => {
    if (!event) {
        return null;
    }

    const eventDate = event.startDate?.seconds
        ? new Date(event.startDate.seconds * 1000).toLocaleString()
        : 'Date not available';
    
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
                    <Text style={styles.description}>{event.description}</Text>
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
        backgroundColor: 'white',
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
        borderColor: '#eee',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default EventModalFull;