import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import EventCard from "../../components/EventCard";
import { getAuth } from 'firebase/auth';
import { Event } from '../types';
import { useEvents } from '../contexts/EventContext';
import EventModalFull from "../../components/EventModalFull";

const Activity: React.FC = () => {

  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
  const [filter, setFilter] = useState('all');
  const { fetchEvents, events, loading, error } = useEvents();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [eventSessionId, setEventSessionId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchEvents(filter);
}, [filter]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.description}>{error}</Text>
      </View>
    );
  }
  console.log(events);
  events.map((event) => {
    console.log(event.name);
  })

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
      <Text style={styles.title}>Activity Screen</Text>
      <Text style={styles.subtitle}>Activities displayed</Text>
      <EventModalFull 
        visible={isModalVisible}
        onClose={() => onCardClosed()}
        event={currentEvent}
        eventSessionId={eventSessionId}
        onEventJoined={(newSession) => {
          setEventSessionId(newSession.id);
        }}
      />
      <View style={styles.filterContainer}>
        <TouchableOpacity 
            style={[styles.filterButton, filter === 'mine' && styles.activeFilter]} 
            onPress={() => setFilter('mine')}
        >
            <Text style={[styles.filterText, filter === 'mine' && styles.activeFilterText]}>My Events</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.filterButton, filter === 'public' && styles.activeFilter]} 
            onPress={() => setFilter('public')}
        >
            <Text style={[styles.filterText, filter === 'public' && styles.activeFilterText]}>Public</Text>
        </TouchableOpacity>
      </View>
      
      {!loading ? (<View style={styles.content}>
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
      </View>) : (
        <View>
          <Text style={styles.description}>Loading Events...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#333335",
    paddingTop: 40,
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'column',
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  filterButton: {
      flex: 1,
      paddingVertical: 10,
      marginHorizontal: 5,
      backgroundColor: '#e0e0e0',
      borderRadius: 20,
      alignItems: 'center',
  },
  activeFilter: {
      backgroundColor: '#7bcf56ff',
  },
  filterText: {
      color: '#282828',
      fontWeight: '600',
  },
  activeFilterText: {
      color: '#F2F0EF',
  },
});

export default Activity;
