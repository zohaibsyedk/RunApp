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
import StatusBar from "../../components/StatusBar";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import '../../assets/images/bronze1.png';
import '../../assets/images/bronze2.png';
import '../../assets/images/bronze3.png';
import '../../assets/images/silver1.png';
import '../../assets/images/silver2.png';
import '../../assets/images/silver3.png';
import '../../assets/images/gold1.png';
import '../../assets/images/gold2.png';
import '../../assets/images/gold3.png';
import '../../assets/images/platinum1.png';
import '../../assets/images/platinum2.png';
import '../../assets/images/platinum3.png';
import '../../assets/images/diamond.png';
import '../../assets/images/unranked.png';


const Feed = () => {
  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

  const { fetchEvents, events, loading, error } = useEvents();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [eventSessionId, setEventSessionId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [statusBarPercentage, setStatusBarPercentage] = useState(0);
  const [rank, setRank] = useState(0);

  const ranks = [
    require('../../assets/images/unranked.png'),
    require('../../assets/images/bronze1.png'), 
    require('../../assets/images/bronze2.png'),
    require('../../assets/images/bronze3.png'),
    require('../../assets/images/silver1.png'),
    require('../../assets/images/silver2.png'),
    require('../../assets/images/silver3.png'),
    require('../../assets/images/gold1.png'),
    require('../../assets/images/gold2.png'),
    require('../../assets/images/gold3.png'),
    require('../../assets/images/platinum1.png'),
    require('../../assets/images/platinum2.png'),
    require('../../assets/images/platinum3.png'),
    require('../../assets/images/diamond.png'),
  ];

  const { user, logout } = useAuth();

  const fetchUserData = async () => {
    if (user) {
      const userDocRef = doc(db, "users", `${user.uid}`);
      
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessagesReceived(data.messagesReceived || 0);
        } else {
          console.log("User document not found in Firestore");
          setMessagesReceived(0);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setMessagesReceived(0);
      }
    }
  };


  useFocusEffect(
    useCallback(() => {
      console.log("Feed screen focused. Fetching joined events...");
      fetchEvents("joined");
      fetchUserData();

      return () => {
        console.log("Feed screen unfocused");
      };
    }, [])
  );

  useEffect(() => {
    calculatePercentage(messagesReceived);
  }, [messagesReceived]);

  const onCardClicked = async (ev: Event) => {
    fetchEvents("joined");
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
    console.log('Event ID:',ev.id);
  }
  const onCardClosed = () => {
    setIsModalVisible(false);
  }

  const calculatePercentage = (messagesReceived: number) => {
                        //bronze 3 tier,  silver 3 tier,    gold 3 tier,   platinum 3 tier,  diamond
    const milestones = [0, 10, 50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000];
    
    // Handle unranked case (0 messages)
    
    for (let i = 1; i < milestones.length; i++) {
      if (messagesReceived < milestones[i]) {
        setStatusBarPercentage((messagesReceived / milestones[i]) * 100);
        setRank(i-1);
        return;
      }
    }
    // Handle case where user has reached max milestone
    setStatusBarPercentage(100);
    setRank(milestones.length - 1);
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
      {rank < ranks.length-1 ? (
        <StatusBar percentage={statusBarPercentage} rankUrl={ranks[rank]} nextRankUrl={ranks[rank+1]} messagesReceived={messagesReceived} rankIdx={rank} nextRankIdx={rank+1} />
      ) : (
        <StatusBar percentage={statusBarPercentage} rankUrl={ranks[rank]} nextRankUrl={ranks[rank]} messagesReceived={messagesReceived} rankIdx={rank} nextRankIdx={rank} />
      )}
      
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
    paddingBottom: 10,
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
    marginBottom: 10,
    color: "#DDDDDD",
  },
  heading: {
    fontSize: 20,
    textAlign: "center",
    color: "#DDDDDD",
    marginTop: -30,
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
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 5,
    marginTop: 10,
    marginBottom: -10,
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
