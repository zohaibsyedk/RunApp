import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { Event, Session, Organization } from '../types';
import { useEvents } from '../contexts/EventContext';
import StopRunButton from '../../components/StopRunButton';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const REFRESH_INTERVAL_MS = 1000;
const Activity: React.FC = () => {

  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { user, logout } = useAuth();
  const [photo, setPhoto] = useState(user?.photoURL);

  useEffect(() => {
    console.log("activeOrganization: ", activeOrganization);
  }, [activeOrganization]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", `${user.uid}`);
        
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
          } else {
            console.log("User document not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData()
  }, [user])
  
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
            setSessionLoading(false);
            return;
          }
          console.log('sessionId: '+sessionId);
          const token = await getAuth().currentUser?.getIdToken();
          if (!token) throw new Error("User not authenticated");
          console.log("fetching session data");
          const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log("session data fetched");
  
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


    if (sessionLoading) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Activity</Text>
            <Text style={styles.description}>Loading current run status...</Text>
        </View>
    );
  } 


  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): { value: string; unit: string } => {
    const km = meters / 1000;
    if (km >= 1) {
      return { value: km.toFixed(2), unit: 'km' };
    }
    return { value: meters.toFixed(0), unit: 'm' };
  };

  const calculatePace = (distanceMeters: number, timeSeconds: number): string => {
    if (distanceMeters === 0 || timeSeconds === 0) return '--:--';
    const km = distanceMeters / 1000;
    const minutesPerKm = (timeSeconds / 60) / km;
    const mins = Math.floor(minutesPerKm);
    const secs = Math.floor((minutesPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSpeed = (distanceMeters: number, timeSeconds: number): number => {
    if (timeSeconds === 0) return 0;
    const km = distanceMeters / 1000;
    const hours = timeSeconds / 3600;
    return hours > 0 ? km / hours : 0;
  };

  const getProgressPercentage = (): number => {
    if (!activeEvent?.distance || !activeSession) return 0;
    const targetMeters = activeEvent.distance * 1000;
    return Math.min((activeSession.elapsedDistanceMeters / targetMeters) * 100, 100);
  };

  if (activeEvent && activeSession && activeOrganization) {
    const distance = formatDistance(activeSession.elapsedDistanceMeters);
    const pace = calculatePace(activeSession.elapsedDistanceMeters, activeSession.elapsedTimeSeconds);
    const speed = calculateSpeed(activeSession.elapsedDistanceMeters, activeSession.elapsedTimeSeconds);
    const progress = getProgressPercentage();
    const targetDistance = activeEvent.distance ? formatDistance(activeEvent.distance * 1000) : null;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Activity</Text>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eventHeader}>
            <View style={styles.eventHeaderContent}>
              <Text style={styles.eventName} numberOfLines={2}>{activeEvent.name}</Text>
              <View style={styles.orgRow}>
                <Image 
                  style={styles.orgImageSmall} 
                  source={{ uri: activeOrganization?.organizationPhotoURL || photo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}} 
                />
                <Text style={styles.orgName}>{activeOrganization?.name || 'Organization'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mainStatsContainer}>
            <View style={[styles.mainStatCard, { marginRight: 7.5 }]}>
              <Ionicons name="resize-outline" size={32} color="#7bcf56" />
              <Text style={styles.mainStatValue}>{distance.value}</Text>
              <Text style={styles.mainStatUnit}>{distance.unit}</Text>
            </View>
            <View style={[styles.mainStatCard, { marginLeft: 7.5 }]}>
              <Ionicons name="time-outline" size={32} color="#7bcf56" />
              <Text style={styles.mainStatValue}>{formatTime(activeSession.elapsedTimeSeconds)}</Text>
              <Text style={styles.mainStatUnit}>Time</Text>
            </View>
          </View>

          <View style={styles.secondaryStatsContainer}>
            <View style={[styles.statCard, { marginRight: 5 }]}>
              <Ionicons name="speedometer-outline" size={24} color="#AAAAAA" />
              <Text style={styles.statLabel}>Pace</Text>
              <Text style={styles.statValue}>{pace}</Text>
              <Text style={styles.statSubtext}>min/km</Text>
            </View>
            <View style={[styles.statCard, { marginHorizontal: 5 }]}>
              <Ionicons name="flash-outline" size={24} color="#AAAAAA" />
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>{speed.toFixed(1)}</Text>
              <Text style={styles.statSubtext}>km/h</Text>
            </View>
            {targetDistance && (
              <View style={[styles.statCard, { marginLeft: 5 }]}>
                <Ionicons name="flag-outline" size={24} color="#AAAAAA" />
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>{targetDistance.value}</Text>
                <Text style={styles.statSubtext}>{targetDistance.unit}</Text>
              </View>
            )}
          </View>

          {activeEvent.distance && targetDistance && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressDistance}>{distance.value} {distance.unit}</Text>
                <Text style={styles.progressTarget}>{targetDistance.value} {targetDistance.unit}</Text>
              </View>
            </View>
          )}

          {(activeEvent.description || activeEvent.location?.address || activeEvent.startDate?._seconds) && (
            <View style={styles.detailsContainer}>
              {activeEvent.description && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={20} color="#AAAAAA" />
                  <Text style={styles.detailText}>{activeEvent.description}</Text>
                </View>
              )}
              {activeEvent.location?.address && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#AAAAAA" />
                  <Text style={styles.detailText}>{activeEvent.location.address}</Text>
                </View>
              )}
              {activeEvent.startDate?._seconds && (
                <View style={[styles.detailRow, { marginBottom: 0 }]}>
                  <Ionicons name="calendar-outline" size={20} color="#AAAAAA" />
                  <Text style={styles.detailText}>
                    {new Date(activeEvent.startDate._seconds * 1000).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
        
        <StopRunButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness-outline" size={80} color="#555" />
        <Text style={styles.emptyTitle}>No Active Run</Text>
        <Text style={styles.emptyDescription}>
          Start a race from the Feed tab to begin tracking your run
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333335",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
    color: "#F2F0EF",
  },
  scrollView: {
    flex: 1,
    marginBottom: 40,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  eventHeader: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 20,
  },
  eventHeaderContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F2F0EF',
    marginBottom: 12,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
  },
  orgName: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F2F0EF',
    marginTop: 8,
  },
  mainStatUnit: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
  },
  secondaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F2F0EF',
  },
  statSubtext: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2F0EF',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7bcf56',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7bcf56',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDistance: {
    fontSize: 14,
    color: '#7bcf56',
    fontWeight: '600',
  },
  progressTarget: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#DDDDDD',
    marginLeft: 12,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F2F0EF',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
  },
});

export default Activity;
