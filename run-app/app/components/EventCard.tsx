import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

type EventCardProps = {
    eventTitle: string;
    orgUrl: string;
    description: string;
    date: string;
};

const handleCardClick = () => {
    console.log("Card Clicked")
};

const EventCard: React.FC<EventCardProps> = ({ eventTitle, orgUrl, description, date }) => {
    return (
        <TouchableOpacity style={styles.cardContainer} onPress={() => {handleCardClick()}}>
            <Text style={styles.title}>{eventTitle}</Text>
            <Image style={styles.orgImage} alt='Organization Image' source={{ uri: orgUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}} />
            <Text>{description}</Text>
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
        backgroundColor: 'rgba(200,200,200)',
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
        fontFamily: 'Lexend-Regular',
        fontSize: 18,
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