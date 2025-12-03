import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { getAuth } from 'firebase/auth';
import { Event, Session, Organization } from '../types';
import { useEvents } from '../contexts/EventContext';
import StopRunButton from '../../components/StopRunButton';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from "@react-navigation/native";

const REFRESH_INTERVAL_MS = 1000;
const Activity: React.FC = () => {

  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (activeSession !== null) {
      console.log("activeSession state updated:", activeSession);
    } else {
      console.log("activeSession is null (either initial state or no session found)");
    }
  }, [activeSession]);
    
  useEffect(() => {
    if (activeEvent !== null) {
    console.log("activeEvent state updated:", activeEvent);
    } else {
      console.log("activeEvent is null (either initial state or no session found)");
    }
  }, [activeEvent]);

  useEffect(() => {
    if (activeOrganization !== null) {
      console.log("activeOrganization state updated:", activeOrganization);
    } else {
      console.log("activeOrganization is null (either initial state or no session found)");
    }
  }, [activeOrganization]);

  useFocusEffect(
    useCallback(() => {
      setSessionLoading(true);
      const fetchActiveSessionData = async () => {

        try {
          const sessionId = await SecureStore.getItemAsync('activeSessionId');
          if (!sessionId) {
            console.log("No active session ID found.");
            setActiveSession(null);
            setActiveEvent(null);
            setActiveOrganization(null);
            return;
          }
          console.log('sessionId: '+sessionId);
          const token = await getAuth().currentUser?.getIdToken();
          if (!token) throw new Error("User not authenticated");
          const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (response.ok) {
            const data = await response.json();
            setActiveSession(data.session);
            setActiveEvent(data.event);
            setActiveOrganization(data.organization);
          }
        } catch (error) {
          console.error("Error fetching active session or event data:", error);
          setActiveSession(null);
          setActiveEvent(null);
          setActiveOrganization(null);
        } finally {
          setSessionLoading(false);
        }
      };
  
      fetchActiveSessionData();

      const intervalId = setInterval(fetchActiveSessionData, REFRESH_INTERVAL_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, [])
  );

  console.log()

  if (sessionLoading) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Activity</Text>
            <Text style={styles.description}>Loading current run status...</Text>
        </View>
    );
  } 

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.subtitle}>Current Race Displayed</Text>
      {activeEvent && activeSession && activeOrganization ? (
        <View style={styles.raceInfoContainer}>
        <View style={styles.raceInfo}>
          <Text style={styles.raceTitle}>{activeEvent.name}</Text>
          <Text style={styles.raceStat}>Distance: {(activeSession.elapsedDistanceMeters / 1000).toFixed(2)} km</Text>
          <Text style={styles.raceStat}>Time: {Math.floor(activeSession.elapsedTimeSeconds / 60)}m {activeSession.elapsedTimeSeconds % 60}s</Text>
        </View>
        <View style={styles.orgInfo}>
        <Image style={styles.orgImage} alt='Organization Image' source={{ uri: activeOrganization.organizationPhotoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}} />
        </View>
      </View>
    ) : (
      <Text style={styles.description}>Start a Race</Text>
    )}
      
      <StopRunButton />
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
  raceInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  raceInfo: {
      flex: 1
  },
  raceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F2F0EF',
    marginBottom: 5,
  },
  raceStat: {
    fontSize: 16,
    color: '#DDDDDD',
    marginBottom: 2,
  },
  orgInfo: {
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
  },
  orgImage: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(170,170,170)',
    top: 15,
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
