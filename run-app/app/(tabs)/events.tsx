import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreateEvent from "../components/CreateEvent";
import * as Clipboard from 'expo-clipboard';

const EventsScreen = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

  const loadEvents = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_URL}/api/events`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to load events');
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const copyLink = async (url: string) => {
    await Clipboard.setStringAsync(url);
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Your running history</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add event"
          onPress={() => setIsCreateOpen(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDescription}>Create your first event.</Text>
          </View>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{e.eventName}</Text>
                <Text style={styles.cardMeta}>{new Date(e.scheduledDateTime).toLocaleString()}</Text>
                {e.plannedRoute ? <Text style={styles.cardMeta}>{e.plannedRoute}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => copyLink(e.shareableLinkId)} style={styles.copySmall}>
                <Ionicons name="copy" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
      <CreateEvent visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    position: "absolute",
    right: 16,
    top: 32,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  cardMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  copySmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EventsScreen;
