import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../app/types';

type EventCardProps = {
    event: Event
    onPress: (event: Event) => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const handleCardClick = () => {
        onPress(event);
    };

    const formatDate = (timestamp: { _seconds: number } | undefined): string => {
        if (!timestamp?._seconds) return 'Date TBD';
        const date = new Date(timestamp._seconds * 1000);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        
        if (diffMs <= 0) {
            return 'Started';
        }
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days === 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diffMs / (1000 * 60));
                return `In ${minutes}m`;
            }
            return `In ${hours}h`;
        }
        if (days === 1) {
            return 'Tomorrow';
        }
        if (days < 7) {
            return `In ${days}d`;
        }
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatDistance = (distanceKm?: number): string => {
        if (!distanceKm) return '';
        const miles = distanceKm / 1.60934;
        if (miles < 1) {
            return `${Math.round(distanceKm * 1000)}m`;
        }
        return `${miles.toFixed(1)} mi`;
    };

    const eventDate = event.startDate?._seconds 
        ? new Date(event.startDate._seconds * 1000)
        : null;
    const formattedDate = formatDate(event.startDate);
    const distance = formatDistance(event.distance);

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={handleCardClick} activeOpacity={0.7}>
            <View style={styles.leftSection}>
                <Image 
                    style={styles.orgImage} 
                    source={{ uri: event.organizationPhotoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}} 
                />
            </View>
            
            <View style={styles.contentSection}>
                <Text style={styles.title} numberOfLines={1}>{event.name}</Text>
                <Text style={styles.orgName} numberOfLines={1}>{event.organizationName}</Text>
                
                <View style={styles.infoRow}>
                    {eventDate && (
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={14} color="#AAAAAA" />
                            <Text style={styles.infoText}>{formattedDate}</Text>
                        </View>
                    )}
                    {distance && (
                        <View style={styles.infoItem}>
                            <Ionicons name="resize-outline" size={14} color="#AAAAAA" />
                            <Text style={styles.infoText}>{distance}</Text>
                        </View>
                    )}
                    {event.location?.address && (
                        <View style={styles.infoItem}>
                            <Ionicons name="map-outline" size={14} color="#AAAAAA" />
                            <Text style={styles.infoText} numberOfLines={1}>{event.location.address}</Text>
                        </View>
                    )}
                </View>
                
                {event.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                        {event.description}
                    </Text>
                )}
            </View>
            
            <View style={styles.rightSection}>
                <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        width: '100%',
        minHeight: 120,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        borderColor: 'rgb(163, 163, 163)',
        borderWidth: 1,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
    },
    leftSection: {
        marginRight: 12,
    },
    orgImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    contentSection: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F2F0EF',
        marginBottom: 4,
    },
    orgName: {
        fontSize: 13,
        color: '#AAAAAA',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 12,
        color: '#AAAAAA',
        maxWidth: 120,
        marginLeft: 4,
    },
    descriptionText: {
        fontSize: 13,
        color: '#DDDDDD',
        lineHeight: 18,
        marginTop: 4,
    },
    rightSection: {
        marginLeft: 8,
        justifyContent: 'center',
    },
});

export default EventCard;