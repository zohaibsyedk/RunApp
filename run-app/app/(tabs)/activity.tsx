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

  const onCardClicked = (ev: Event) => {
    setCurrentEvent(ev);
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
      />
      <View style={styles.filterContainer}>
        <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]} 
            onPress={() => setFilter('all')}
        >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
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
      
      {!loading && (<View style={styles.content}>
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
      </View>)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
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
      backgroundColor: '#3498db',
  },
  filterText: {
      color: '#333',
      fontWeight: '600',
  },
  activeFilterText: {
      color: '#fff',
  },
});

export default Activity;
