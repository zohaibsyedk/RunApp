import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import EventCard from "../components/EventCard";
import { getAuth } from 'firebase/auth';
import { Event } from '../types';
import { useEvents } from '../contexts/EventContext';

const Activity: React.FC = () => {

  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

 const { fetchEvents, events, loading, error } = useEvents();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.description}>Loading Events...</Text>
      </View>
    );
  }

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Screen</Text>
      <Text style={styles.subtitle}>Activities displayed</Text>
      
      <View style={styles.content}>
        <ScrollView style={styles.cardContainer}>
          {events.length > 0 ? (events.map(event => (
            <EventCard 
              key={event.id}
              eventTitle={event.name}
              description={event.description || ''}
              orgUrl="https://placehold.co/600x400/EEE/31343C?text=Event"
              date={new Date(event.startDate._seconds * 1000).toLocaleDateString()}
            />
          ))
          ) : (
            <Text style={styles.description}>No events found. Try creating one!</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
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
  }
});

export default Activity;
