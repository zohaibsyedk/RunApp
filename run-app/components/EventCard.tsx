import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Event } from '../app/types';

type EventCardProps = {
    event: Event
    onPress: (event: Event) => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const handleCardClick = () => {
        onPress(event);
    };

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={() => {handleCardClick()}}>
            <Text style={styles.title}>{event.name}</Text>
            <Image style={styles.orgImage} alt='Organization Image' source={{ uri: event.organizationPhotoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}} />
            <Text style={styles.descriptionText}>{event.description}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
        width: '100%',
        height: 90,
        backgroundColor: '#282828',
        borderRadius: 15,
        borderColor: 'rgba(170,170,170)',
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
    },
    title: {
        position: 'absolute',
        left: 10,
        top: 10,
        fontSize: 18,
        color: '#F2F0EF',
    },
    descriptionText: {
        fontSize: 14,
        color: '#DDDDDD',
    },
    orgImage: {
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(170,170,170)',
        top: 15,
    }
});

export default EventCard;