import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import StopRunButton from '../../components/StopRunButton';
import { Event } from '../types';
import { useEvents } from '../contexts/EventContext';
import EventModalFull from "../../components/EventModalFull";
import EventCard from "../../components/EventCard";
import { getAuth } from 'firebase/auth';

const Feed = () => {
  const { logout } = useAuth();
  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

  const { fetchEvents, events, loading, error } = useEvents();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [eventSessionId, setEventSessionId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log("Feed screen focused. Fetching joined events...");
      fetchEvents("joined");

      return () => {
        console.log("Feed screen unfocused");
      };
    }, [])
  );

  const onCardClicked = async (ev: Event) => {
    setCurrentEvent(ev);
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_URL}/api/events/${ev.id}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setEventSessionId(data.session.id);
    }
    else if (response.status === 404) {
      console.log('User has not joined the event yet');
      setEventSessionId(null);
    } else {
      throw new Error('Failed to fetch session');
    }
    setIsModalVisible(true);
    console.log('Event ID:',ev.id)
  }
  const onCardClosed = () => {
    setIsModalVisible(false);
  }
    
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Finishline!</Text>
      <Text style={styles.subtitle}>Stay motivated with your friends in your ear.</Text>

      <EventModalFull 
        visible={isModalVisible}
        onClose={() => onCardClosed()}
        event={currentEvent}
        eventSessionId={eventSessionId}
        onEventJoined={(newSession) => {
          setEventSessionId(newSession.id);
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.listContainer}>
          <Text style={styles.heading}>Your Upcoming Races</Text>
            <ScrollView style={styles.cardContainer}>
            {events.length > 0 ? (events.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                onPress={() => onCardClicked(event)}
              />
            ))
            ) : (
              <Text style={styles.description}>No events found. Try creating one!</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#333335",
    paddingTop: 40,
    paddingBottom: 0
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#F2F0EF",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#DDDDDD",
  },
  heading: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 15,
    color: "#DDDDDD",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: { 
    flex: 1,
    width: '100%',
    position: 'relative', 
    marginBottom: 15,
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'column',
    padding: 5,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Height of the fade effect
    zIndex: 1, // Ensure the gradient is on top of the cards
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
  },
});

export default Feed;
